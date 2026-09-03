/**
 * SafeSense AI — Client-side Multilingual Utilities
 *
 * Architecture:
 *   1. Detect language using Unicode script ranges (no external API)
 *   2. Translate Kannada/Hindi → English using built-in safety-domain dictionary
 *   3. Send translated English text to existing riskEngine.ts pipeline
 *   4. Preserve original_report_text for display
 *
 * This mirrors the backend multilingual.py logic so the app works fully
 * offline (no backend required). When the backend IS available, the
 * /api/translate endpoint is used for better translation quality.
 *
 * To swap to an online translator: set VITE_USE_BACKEND_TRANSLATION=true
 * in your .env file. The backend must be running on localhost:8000.
 */

import { DetectedLanguage, MultilingualStats, EMPTY_MULTILINGUAL_STATS } from '../types';

// ─── Unicode Script Ranges ────────────────────────────────────────────────────
const RE_KANNADA    = /[\u0C80-\u0CFF]/g;
const RE_DEVANAGARI = /[\u0900-\u097F]/g;

// ─── Language Detection ───────────────────────────────────────────────────────

/**
 * Detect language using Unicode character block analysis.
 * Kannada: U+0C80–U+0CFF
 * Hindi (Devanagari): U+0900–U+097F
 * Everything else with Latin script → English
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || !text.trim()) return 'unknown';

  const total = text.trim().length;
  const knCount = (text.match(RE_KANNADA) || []).length;
  const hiCount = (text.match(RE_DEVANAGARI) || []).length;

  if (knCount / total > 0.10) return 'kn';
  if (hiCount / total > 0.10) return 'hi';

  // Check if text has any ASCII/Latin chars — treat as English
  const latinCount = (text.match(/[a-zA-Z]/) || []).length;
  if (latinCount > 0) return 'en';

  return 'unknown';
}

export function getLanguageDisplayName(lang: DetectedLanguage): string {
  const names: Record<DetectedLanguage, string> = {
    en: 'English',
    kn: 'Kannada',
    hi: 'Hindi',
    unknown: 'Unknown',
  };
  return names[lang] ?? 'Unknown';
}

// ─── Safety-Domain Translation Dictionary ────────────────────────────────────
// Covers the most common industrial safety terms in Kannada and Hindi.
// Longer phrases are matched first to prevent partial substitutions.

const KN_TO_EN: [string, string][] = [
  // Confined space
  ['ಸೀಮಿತ ಸ್ಥಳ', 'confined space'],
  ['ಕನ್ಫೈನ್ಡ್ ಸ್ಪೇಸ್', 'confined space'],
  ['ಗ್ಯಾಸ್ ಪರೀಕ್ಷೆ ಮಾಡದೆ', 'without gas testing'],
  ['ಗ್ಯಾಸ್ ಪರೀಕ್ಷೆ', 'gas testing'],
  ['ವಾತಾವರಣ ಪರೀಕ್ಷೆ', 'atmospheric testing'],
  ['ಪ್ರವೇಶ ಅನುಮತಿ ಪಡೆಯದೆ', 'without entry permit'],
  ['ಅನುಮತಿ ಪಡೆಯದೆ', 'without permit'],
  ['ಅನುಮತಿ ಇಲ್ಲದೆ', 'without permit'],
  ['ಪ್ರವೇಶ ಅನುಮತಿ', 'entry permit'],
  ['ಒಳಗೆ ಪ್ರವೇಶಿಸಿದರು', 'entered inside'],
  ['ಪ್ರವೇಶಿಸಿದರು', 'entered'],
  ['ಕಾರ್ಮಿಕರು', 'workers'],
  ['ಕಾರ್ಮಿಕ', 'worker'],
  ['ಆಪರೇಟರ್', 'operator'],
  ['ತಂತ್ರಜ್ಞ', 'technician'],
  ['ಮೇಲ್ವಿಚಾರಕ', 'supervisor'],
  // Energy isolation
  ['ಶಕ್ತಿ ಪ್ರತ್ಯೇಕತೆ ಮಾಡದೆ', 'without energy isolation'],
  ['ಶಕ್ತಿ ಪ್ರತ್ಯೇಕತೆ', 'energy isolation'],
  ['ಲಾಕ್‌ಔಟ್ ಮಾಡದೆ', 'without lockout'],
  ['ಲಾಕ್ ಔಟ್', 'lockout'],
  ['ಲಾಕ್‌ಔಟ್', 'lockout'],
  ['ಟ್ಯಾಗ್ ಔಟ್', 'tagout'],
  ['ಪ್ರತ್ಯೇಕಿಸದೆ', 'without isolation'],
  ['ಪ್ರತ್ಯೇಕಿಸಲಿಲ್ಲ', 'not isolated'],
  ['ವಿದ್ಯುತ್ ಕೆಲಸ', 'electrical work'],
  ['ವಿದ್ಯುತ್ ಸಂಪರ್ಕ', 'electrical connection'],
  ['ವಿದ್ಯುತ್ ಲೈನ್', 'electrical line'],
  ['ಶಕ್ತಿ ಮೂಲ', 'energy source'],
  // Hot work
  ['ಹಾಟ್ ವರ್ಕ್ ಪರ್ಮಿಟ್ ಇಲ್ಲದೆ', 'without hot work permit'],
  ['ಹಾಟ್ ವರ್ಕ್ ಪರ್ಮಿಟ್', 'hot work permit'],
  ['ಬಿಸಿ ಕೆಲಸ', 'hot work'],
  ['ವೆಲ್ಡಿಂಗ್', 'welding'],
  ['ಕಟ್ಟಿಂಗ್', 'cutting'],
  ['ಗ್ರೈಂಡಿಂಗ್', 'grinding'],
  ['ಬೆಂಕಿ ಕಾವಲು ಇಲ್ಲದೆ', 'without fire watch'],
  ['ಬೆಂಕಿ ಕಾವಲು', 'fire watch'],
  ['ಜ್ವಾಲಾಗ್ರಾಹಿ ಅನಿಲ', 'flammable gas'],
  // Height
  ['ಹಾರ್ನೆಸ್ ಇಲ್ಲದೆ', 'without harness'],
  ['ಎತ್ತರದಲ್ಲಿ ಕೆಲಸ', 'working at height'],
  ['ರಕ್ಷಣಾ ಉಪಕರಣ ಇಲ್ಲದೆ', 'without protective equipment'],
  ['ರಕ್ಷಣಾ ಉಪಕರಣ', 'protective equipment'],
  ['ಸ್ಕ್ಯಾಫೋಲ್ಡ್', 'scaffold'],
  ['ಏಣಿ', 'ladder'],
  ['ಅಂಚಿನ ರಕ್ಷಣೆ', 'edge protection'],
  // PPE
  ['ಪಿಪಿಇ ಧರಿಸದೆ', 'without ppe'],
  ['ಸೂಕ್ತ ಉಪಕರಣ ಇಲ್ಲದೆ', 'without ppe'],
  ['ವೈಯಕ್ತಿಕ ರಕ್ಷಣಾ ಸಾಧನ', 'personal protective equipment'],
  // Line of fire
  ['ಹೊರಗಿನ ವಲಯ ಇಲ್ಲದೆ', 'without exclusion zone'],
  ['ಅಮಾನತು ಭಾರ', 'suspended load'],
  ['ಅಮಾನತು ಲೋಡ್', 'suspended load'],
  ['ಹೊರಗಿನ ವಲಯ', 'exclusion zone'],
  ['ಕ್ರೇನ್', 'crane'],
  // Vehicle
  ['ಪಾದಚಾರಿ ಪ್ರತ್ಯೇಕತೆ', 'pedestrian segregation'],
  ['ಪಾದಚಾರಿ', 'pedestrian'],
  ['ಫೋರ್ಕ್‌ಲಿಫ್ಟ್', 'forklift'],
  ['ವಾಹನ', 'vehicle'],
  // Chemical
  ['ರಾಸಾಯನಿಕ', 'chemical'],
  ['ಆಮ್ಲ', 'acid'],
  ['ವಿಷಕಾರಿ', 'toxic'],
  // General safety
  ['ಅಸುರಕ್ಷಿತ ಕ್ರಿಯೆ', 'unsafe act'],
  ['ಅಸುರಕ್ಷಿತ ಸ್ಥಿತಿ', 'unsafe condition'],
  ['ಸಮೀಪ ತಪ್ಪಿಸಿಕೊಂಡ', 'near miss'],
  ['ಘಟನೆ', 'incident'],
  ['ಅಪಘಾತ', 'incident'],
  ['ತೀವ್ರ ಗಾಯ', 'serious injury'],
  ['ಸಾವು', 'fatality'],
  ['ಸುರಕ್ಷತೆ', 'safety'],
  ['ಅಪಾಯ', 'hazard'],
  ['ಅಡೆತಡೆ ವೈಫಲ್ಯ', 'barrier failure'],
  ['ನಿಯಂತ್ರಣ', 'control'],
  ['ಶಿಫಾರಸು', 'recommendation'],
];

const HI_TO_EN: [string, string][] = [
  // Confined space
  ['सीमित स्थान में प्रवेश किया', 'entered confined space'],
  ['सीमित स्थान', 'confined space'],
  ['कंफाइन्ड स्पेस', 'confined space'],
  ['गैस परीक्षण किए बिना', 'without gas testing'],
  ['गैस परीक्षण के बिना', 'without gas testing'],
  ['गैस परीक्षण', 'gas testing'],
  ['वायुमंडलीय परीक्षण', 'atmospheric testing'],
  ['अनुमति के बिना', 'without permit'],
  ['बिना अनुमति', 'without permit'],
  ['प्रवेश अनुमति', 'entry permit'],
  ['अनुमति पत्र', 'permit'],
  ['प्रवेश किया', 'entered'],
  ['श्रमिकों ने', 'workers'],
  ['श्रमिक ने', 'worker'],
  ['श्रमिक', 'worker'],
  ['मजदूर', 'worker'],
  ['कर्मचारी', 'employee'],
  ['ऑपरेटर', 'operator'],
  ['तकनीशियन', 'technician'],
  ['पर्यवेक्षक', 'supervisor'],
  // Energy isolation
  ['एनर्जी आइसोलेशन किए बिना', 'without energy isolation'],
  ['ऊर्जा अलगाव किए बिना', 'without energy isolation'],
  ['ऊर्जा अलगाव', 'energy isolation'],
  ['एनर्जी आइसोलेशन', 'energy isolation'],
  ['लॉकआउट/टैगआउट', 'lockout/tagout'],
  ['लॉकआउट लगाए बिना', 'without lockout'],
  ['लॉकआउट', 'lockout'],
  ['टैगआउट', 'tagout'],
  ['आइसोलेट किए बिना', 'without isolation'],
  ['बिना आइसोलेट', 'without isolation'],
  ['विद्युत लाइन पर काम किया', 'worked on electrical line'],
  ['विद्युत कार्य', 'electrical work'],
  ['बिजली का काम', 'electrical work'],
  ['विद्युत लाइन', 'electrical line'],
  ['ऊर्जा स्रोत', 'energy source'],
  // Hot work
  ['हॉट वर्क परमिट के बिना', 'without hot work permit'],
  ['हॉट वर्क परमिट', 'hot work permit'],
  ['हॉट वर्क', 'hot work'],
  ['गर्म काम', 'hot work'],
  ['वेल्डिंग', 'welding'],
  ['कटिंग', 'cutting'],
  ['ग्राइंडिंग', 'grinding'],
  ['फायर वॉच के बिना', 'without fire watch'],
  ['अग्नि सुरक्षक', 'fire watch'],
  ['अग्निशामक', 'fire extinguisher'],
  ['ज्वलनशील गैस', 'flammable gas'],
  // Height
  ['हार्नेस के बिना', 'without harness'],
  ['ऊंचाई पर काम', 'working at height'],
  ['सुरक्षा उपकरण के बिना', 'without safety equipment'],
  ['सुरक्षा उपकरण', 'safety equipment'],
  ['स्कैफोल्ड', 'scaffold'],
  ['सीढ़ी', 'ladder'],
  ['किनारे की सुरक्षा', 'edge protection'],
  // PPE
  ['पीपीई के बिना', 'without ppe'],
  ['पीपीई पहने बिना', 'without ppe'],
  ['व्यक्तिगत सुरक्षा उपकरण', 'personal protective equipment'],
  ['सुरक्षात्मक उपकरण', 'protective equipment'],
  // Line of fire
  ['बहिष्करण क्षेत्र के बिना', 'without exclusion zone'],
  ['निलंबित भार', 'suspended load'],
  ['बहिष्करण क्षेत्र', 'exclusion zone'],
  ['क्रेन', 'crane'],
  // Vehicle
  ['पैदल यात्री पृथक्करण', 'pedestrian segregation'],
  ['पैदल यात्री', 'pedestrian'],
  ['फोर्कलिफ्ट', 'forklift'],
  ['वाहन', 'vehicle'],
  // Chemical
  ['रासायनिक पदार्थ', 'chemical substance'],
  ['रासायनिक', 'chemical'],
  ['एसिड', 'acid'],
  ['विषाक्त', 'toxic'],
  // General safety
  ['असुरक्षित कार्य', 'unsafe act'],
  ['असुरक्षित स्थिति', 'unsafe condition'],
  ['निकट चूक', 'near miss'],
  ['घटना', 'incident'],
  ['दुर्घटना', 'incident'],
  ['गंभीर चोट', 'serious injury'],
  ['मृत्यु', 'fatality'],
  ['सुरक्षा', 'safety'],
  ['खतरा', 'hazard'],
  ['बाधा विफलता', 'barrier failure'],
  ['नियंत्रण', 'control'],
  ['सिफारिश', 'recommendation'],
  ['काम किया', 'worked'],
  ['किए बिना', 'without'],
  ['के बिना', 'without'],
  ['बिना', 'without'],
];

/**
 * Apply dictionary translation using longest-match-first strategy.
 */
function applyDictionary(text: string, dict: [string, string][]): string {
  let result = text;
  // Sort descending by source length so longer phrases win
  const sorted = [...dict].sort((a, b) => b[0].length - a[0].length);
  for (const [src, tgt] of sorted) {
    result = result.split(src).join(tgt);
  }
  return result;
}

// ─── Main Translation Function ────────────────────────────────────────────────

export interface TranslationResult {
  original_report_text: string;
  detected_language: DetectedLanguage;
  detected_language_name: string;
  translated_report_text: string;
  translation_method: string;
  translation_error: string | null;
  is_translated: boolean;
}

/**
 * Detect and translate a single safety report text.
 * Uses client-side dictionary. No external API calls.
 */
export function processReport(
  text: string,
  hintLanguage?: string
): TranslationResult {
  const original = text || '';

  const base: TranslationResult = {
    original_report_text: original,
    detected_language: 'unknown',
    detected_language_name: 'Unknown',
    translated_report_text: original,
    translation_method: 'passthrough',
    translation_error: null,
    is_translated: false,
  };

  if (!original.trim()) {
    base.detected_language_name = 'Empty/Invalid';
    base.translation_error = 'Empty report text';
    return base;
  }

  // ── Detect language ────────────────────────────────────────────────────────
  let detected: DetectedLanguage;
  try {
    if (hintLanguage && ['en', 'kn', 'hi'].includes(hintLanguage.toLowerCase())) {
      detected = hintLanguage.toLowerCase() as DetectedLanguage;
    } else {
      detected = detectLanguage(original);
    }
  } catch {
    detected = 'unknown';
  }

  base.detected_language = detected;
  base.detected_language_name = getLanguageDisplayName(detected);

  // ── Translate if not English ───────────────────────────────────────────────
  if (detected === 'en') {
    base.translated_report_text = original;
    base.translation_method = 'passthrough';
    base.is_translated = false;
    return base;
  }

  if (detected === 'unknown') {
    // Try to process the original text regardless
    base.translated_report_text = original;
    base.translation_method = 'passthrough';
    return base;
  }

  try {
    let translated: string;
    if (detected === 'kn') {
      translated = applyDictionary(original, KN_TO_EN);
    } else {
      translated = applyDictionary(original, HI_TO_EN);
    }

    base.translated_report_text = translated;
    base.translation_method = 'offline_dict';
    base.is_translated = true;
  } catch (err) {
    base.translated_report_text = original; // Keep original on failure
    base.translation_method = 'failed';
    base.translation_error = 'Translation unavailable';
    base.is_translated = false;
  }

  return base;
}

// ─── Dataset-level Processing ─────────────────────────────────────────────────

export interface MultilingualProcessResult {
  results: TranslationResult[];
  stats: MultilingualStats;
}

/**
 * Process all rows in a dataset through the multilingual pipeline.
 * Called from datasetUtils.ts during rowsToReports().
 *
 * @param texts         Array of report text strings
 * @param hintLangs     Optional array of language hints (from 'language' column)
 * @param translateEnabled  If false, only detect — do not translate
 */
export function processDataset(
  texts: string[],
  hintLangs?: (string | undefined)[],
  translateEnabled = true
): MultilingualProcessResult {
  const results: TranslationResult[] = [];
  const stats: MultilingualStats = {
    ...EMPTY_MULTILINGUAL_STATS,
    total: texts.length,
    translate_enabled: translateEnabled,
  };

  for (let i = 0; i < texts.length; i++) {
    const hint = hintLangs?.[i];
    const raw = processReport(texts[i], hint);

    // If translation is disabled, revert translated text to original
    if (!translateEnabled) {
      raw.translated_report_text = raw.original_report_text;
      raw.is_translated = false;
      raw.translation_method = 'disabled';
    }

    results.push(raw);

    // Update stats
    switch (raw.detected_language) {
      case 'en':      stats.english++;  break;
      case 'kn':      stats.kannada++;  break;
      case 'hi':      stats.hindi++;    break;
      default:        stats.unknown++;  break;
    }
    if (raw.is_translated)        stats.translated++;
    if (raw.translation_error)    stats.translation_errors++;
  }

  return { results, stats };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the text contains Kannada or Hindi script characters */
export function isNonEnglish(text: string): boolean {
  const lang = detectLanguage(text);
  return lang === 'kn' || lang === 'hi';
}

/** Format stats summary string for display in UI */
export function formatMultilingualSummary(stats: MultilingualStats): string {
  const parts = [
    `${stats.english} English`,
    stats.kannada > 0 ? `${stats.kannada} Kannada` : null,
    stats.hindi   > 0 ? `${stats.hindi} Hindi`    : null,
    stats.unknown > 0 ? `${stats.unknown} Unknown`  : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

// Re-export the constant so importers don't need to import from types
export { EMPTY_MULTILINGUAL_STATS } from '../types';
