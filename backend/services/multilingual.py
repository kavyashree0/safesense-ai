"""
SafeSense AI — Multilingual Processing Module
Handles language detection and translation for EN / Kannada / Hindi safety reports.

Architecture:
  1. Detect language of report_text
  2. If English → pass through unchanged
  3. If Kannada / Hindi → translate to English
  4. Send translated English text to existing NLP + risk engine pipeline
  5. Preserve original_report_text for display

Translation provider is configurable via environment variable TRANSLATION_PROVIDER:
  - "deep_translator"  (default, uses deep-translator library, requires internet)
  - "offline"          (uses built-in dictionary fallback, no internet needed)

This abstraction allows the provider to be swapped to IndicTrans2 or any other
offline model in future without changing the rest of the application.
"""

import os
import re
import logging
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)

# ─── Language Codes ────────────────────────────────────────────────────────────
LANG_ENGLISH  = "en"
LANG_KANNADA  = "kn"
LANG_HINDI    = "hi"
LANG_UNKNOWN  = "unknown"

LANG_DISPLAY = {
    LANG_ENGLISH: "English",
    LANG_KANNADA: "Kannada",
    LANG_HINDI:   "Hindi",
    LANG_UNKNOWN: "Unknown",
}

# ─── Kannada Unicode range: U+0C80–U+0CFF ─────────────────────────────────────
# ─── Hindi (Devanagari) range: U+0900–U+097F ─────────────────────────────────
_RE_KANNADA    = re.compile(r'[\u0C80-\u0CFF]')
_RE_DEVANAGARI = re.compile(r'[\u0900-\u097F]')


# ─── Script-based language detector (no external dependency) ──────────────────
def detect_language_by_script(text: str) -> str:
    """
    Detect language using Unicode script ranges.
    Kannada and Hindi are identified by their character blocks.
    Falls back to langdetect for other cases.
    Returns one of: 'en', 'kn', 'hi', 'unknown'
    """
    if not text or not text.strip():
        return LANG_UNKNOWN

    kn_count = len(_RE_KANNADA.findall(text))
    hi_count = len(_RE_DEVANAGARI.findall(text))
    total = len(text.strip())

    # If more than 10% of characters are Kannada script → Kannada
    if kn_count / max(total, 1) > 0.10:
        return LANG_KANNADA

    # If more than 10% of characters are Devanagari → Hindi
    if hi_count / max(total, 1) > 0.10:
        return LANG_HINDI

    # Try langdetect for ambiguous cases
    try:
        from langdetect import detect, DetectorFactory
        DetectorFactory.seed = 42
        lang = detect(text)
        if lang in (LANG_ENGLISH, LANG_KANNADA, LANG_HINDI):
            return lang
        # Map related codes
        if lang in ("mr", "ne", "sa", "bho"):   # Other Devanagari scripts
            return LANG_HINDI
        return LANG_ENGLISH  # Default to English for Latin-script text
    except Exception as e:
        logger.debug(f"langdetect failed: {e}. Falling back to English.")
        return LANG_ENGLISH


# ─── Offline Dictionary-Based Translation Fallback ────────────────────────────
# A safety-domain vocabulary table for Kannada → English and Hindi → English.
# Covers the most common safety terms that appear in industrial reports.
# This is intentionally limited — for production use IndicTrans2 is recommended.

_KN_TO_EN: Dict[str, str] = {
    # Confined space
    "ಸೀಮಿತ ಸ್ಥಳ": "confined space",
    "ಕನ್ಫೈನ್ಡ್ ಸ್ಪೇಸ್": "confined space",
    "ಗ್ಯಾಸ್ ಪರೀಕ್ಷೆ": "gas testing",
    "ವಾತಾವರಣ ಪರೀಕ್ಷೆ": "atmospheric testing",
    "ಪ್ರವೇಶ ಅನುಮತಿ": "entry permit",
    "ಅನುಮತಿ ಇಲ್ಲದೆ": "without permit",
    "ಪ್ರವೇಶಿಸಿದರು": "entered",
    "ಕಾರ್ಮಿಕ": "worker",
    "ಕಾರ್ಮಿಕರು": "workers",
    # Energy isolation
    "ಶಕ್ತಿ ಪ್ರತ್ಯೇಕತೆ": "energy isolation",
    "ಲಾಕ್ ಔಟ್": "lockout",
    "ಟ್ಯಾಗ್ ಔಟ್": "tagout",
    "ವಿದ್ಯುತ್ ಕೆಲಸ": "electrical work",
    "ವಿದ್ಯುತ್ ಸಂಪರ್ಕ": "electrical connection",
    "ಪ್ರತ್ಯೇಕಿಸದೆ": "without isolation",
    "ಪ್ರತ್ಯೇಕಿಸಲಿಲ್ಲ": "not isolated",
    "ಶಕ್ತಿ ಮೂಲ": "energy source",
    # Hot work
    "ಬಿಸಿ ಕೆಲಸ": "hot work",
    "ವೆಲ್ಡಿಂಗ್": "welding",
    "ಕಟ್ಟಿಂಗ್": "cutting",
    "ಗ್ರೈಂಡಿಂಗ್": "grinding",
    "ಅನುಮತಿ ಪತ್ರ": "permit",
    "ಬೆಂಕಿ ಕಾವಲು": "fire watch",
    "ಬೆಂಕಿ ನಿರ್ವಹಣೆ": "fire control",
    # Height
    "ಎತ್ತರದಲ್ಲಿ ಕೆಲಸ": "working at height",
    "ಹಾರ್ನೆಸ್ ಇಲ್ಲದೆ": "without harness",
    "ರಕ್ಷಣಾ ಉಪಕರಣ": "protective equipment",
    "ಸ್ಕ್ಯಾಫೋಲ್ಡ್": "scaffold",
    "ಏಣಿ": "ladder",
    # PPE
    "ಸೂಕ್ತ ಉಪಕರಣ ಇಲ್ಲದೆ": "without ppe",
    "ಪಿಪಿಇ ಧರಿಸದೆ": "without ppe",
    "ವೈಯಕ್ತಿಕ ರಕ್ಷಣಾ": "personal protective equipment",
    # Line of fire
    "ಕ್ರೇನ್": "crane",
    "ಅಮಾನತು ಲೋಡ್": "suspended load",
    "ಹೊರಗಿನ ವಲಯ": "exclusion zone",
    # Vehicle
    "ವಾಹನ": "vehicle",
    "ಫೋರ್ಕ್ಲಿಫ್ಟ್": "forklift",
    "ಪಾದಚಾರಿ": "pedestrian",
    # General
    "ಅಪಘಾತ": "incident",
    "ಅಸುರಕ್ಷಿತ": "unsafe",
    "ಸಮೀಪ ತಪ್ಪಿಸಿಕೊಂಡ": "near miss",
    "ತೀವ್ರ ಗಾಯ": "serious injury",
    "ಸಾವು": "fatality",
    "ಸುರಕ್ಷತೆ": "safety",
    "ಅಪಾಯ": "hazard",
    "ಸಿಬ್ಬಂದಿ": "personnel",
    "ನಿರ್ವಾಹಕ": "operator",
    "ತಂತ್ರಜ್ಞ": "technician",
    "ತನಿಖಾಧಿಕಾರಿ": "inspector",
    "ಮೇಲ್ವಿಚಾರಕ": "supervisor",
    "ದೋಷ": "failure",
    "ನಿಯಂತ್ರಣ": "control",
    "ಕ್ರಮ": "action",
}

_HI_TO_EN: Dict[str, str] = {
    # Confined space
    "सीमित स्थान": "confined space",
    "कंफाइन्ड स्पेस": "confined space",
    "गैस परीक्षण": "gas testing",
    "वायुमंडलीय परीक्षण": "atmospheric testing",
    "प्रवेश अनुमति": "entry permit",
    "बिना अनुमति": "without permit",
    "अनुमति के बिना": "without permit",
    "प्रवेश किया": "entered",
    "श्रमिक": "worker",
    "मजदूर": "worker",
    "श्रमिकों": "workers",
    # Energy isolation
    "ऊर्जा अलगाव": "energy isolation",
    "एनर्जी आइसोलेशन": "energy isolation",
    "लॉकआउट": "lockout",
    "टैगआउट": "tagout",
    "लॉक आउट": "lockout",
    "विद्युत कार्य": "electrical work",
    "बिजली का काम": "electrical work",
    "बिना आइसोलेट": "without isolation",
    "आइसोलेट किए बिना": "without isolation",
    "ऊर्जा स्रोत": "energy source",
    "विद्युत लाइन": "electrical line",
    # Hot work
    "हॉट वर्क": "hot work",
    "गर्म काम": "hot work",
    "वेल्डिंग": "welding",
    "कटिंग": "cutting",
    "ग्राइंडिंग": "grinding",
    "अनुमति पत्र": "permit",
    "अग्नि सुरक्षक": "fire watch",
    "अग्निशामक": "fire extinguisher",
    # Height
    "ऊंचाई पर काम": "working at height",
    "हार्नेस के बिना": "without harness",
    "सुरक्षा उपकरण": "safety equipment",
    "सुरक्षा उपकरण के बिना": "without safety equipment",
    "स्कैफोल्ड": "scaffold",
    "सीढ़ी": "ladder",
    # PPE
    "पीपीई के बिना": "without ppe",
    "व्यक्तिगत सुरक्षा": "personal protective equipment",
    "सुरक्षात्मक उपकरण": "protective equipment",
    # Line of fire
    "क्रेन": "crane",
    "निलंबित भार": "suspended load",
    "बहिष्करण क्षेत्र": "exclusion zone",
    # Vehicle
    "वाहन": "vehicle",
    "फोर्कलिफ्ट": "forklift",
    "पैदल यात्री": "pedestrian",
    # Chemical
    "रासायनिक": "chemical",
    "एसिड": "acid",
    "विषाक्त": "toxic",
    # General
    "दुर्घटना": "incident",
    "असुरक्षित": "unsafe",
    "निकट चूक": "near miss",
    "गंभीर चोट": "serious injury",
    "मृत्यु": "fatality",
    "सुरक्षा": "safety",
    "खतरा": "hazard",
    "कर्मी": "personnel",
    "ऑपरेटर": "operator",
    "तकनीशियन": "technician",
    "पर्यवेक्षक": "supervisor",
    "विफलता": "failure",
    "नियंत्रण": "control",
    "कार्रवाई": "action",
    "काम किया": "worked",
    "बिना": "without",
    "किए बिना": "without",
}


def _dict_translate(text: str, vocab: Dict[str, str]) -> str:
    """Apply dictionary substitution, longest-match first."""
    result = text
    # Sort by length descending so longer phrases match before substrings
    for src, tgt in sorted(vocab.items(), key=lambda x: -len(x[0])):
        result = result.replace(src, tgt)
    return result


# ─── Translation Provider ─────────────────────────────────────────────────────

def _translate_with_deep_translator(text: str, source_lang: str) -> str:
    """
    Translate using deep-translator (GoogleTranslator).
    Falls back to offline dictionary if the library is unavailable or fails.
    """
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source=source_lang, target="en")
        return translator.translate(text) or text
    except ImportError:
        logger.warning("deep-translator not installed. Using offline dictionary fallback.")
        return _offline_translate(text, source_lang)
    except Exception as e:
        logger.warning(f"deep-translator failed: {e}. Using offline dictionary fallback.")
        return _offline_translate(text, source_lang)


def _offline_translate(text: str, source_lang: str) -> str:
    """Translate using built-in safety-domain dictionary."""
    if source_lang == LANG_KANNADA:
        return _dict_translate(text, _KN_TO_EN)
    elif source_lang == LANG_HINDI:
        return _dict_translate(text, _HI_TO_EN)
    return text


def translate_to_english(text: str, source_lang: str) -> Tuple[str, str]:
    """
    Translate text to English.

    Returns:
        (translated_text, method_used)
        method_used is one of: 'passthrough', 'deep_translator', 'offline_dict'
    """
    if not text or not text.strip():
        return text, "passthrough"

    if source_lang == LANG_ENGLISH:
        return text, "passthrough"

    provider = os.getenv("TRANSLATION_PROVIDER", "auto").lower()

    if provider == "offline":
        translated = _offline_translate(text, source_lang)
        return translated, "offline_dict"

    # Default: try deep_translator first, fallback to offline
    translated = _translate_with_deep_translator(text, source_lang)
    method = "deep_translator"
    # If translated == original (no change), also try offline
    if translated == text:
        translated = _offline_translate(text, source_lang)
        method = "offline_dict"
    return translated, method


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def process_report(report_text: str, hint_language: Optional[str] = None) -> Dict:
    """
    Full multilingual processing pipeline for a single report.

    Args:
        report_text:    The raw safety report text (any language)
        hint_language:  Optional language hint from dataset 'language' column

    Returns dict with:
        original_report_text   — unchanged input text
        detected_language      — 'en' / 'kn' / 'hi' / 'unknown'
        detected_language_name — 'English' / 'Kannada' / 'Hindi' / 'Unknown'
        translated_report_text — English text for model input
        translation_method     — how translation was performed
        translation_error      — None or error message string
        is_translated          — True if translation was applied
    """
    original = report_text or ""
    result = {
        "original_report_text":   original,
        "detected_language":      LANG_UNKNOWN,
        "detected_language_name": LANG_DISPLAY[LANG_UNKNOWN],
        "translated_report_text": original,
        "translation_method":     "passthrough",
        "translation_error":      None,
        "is_translated":          False,
    }

    if not original.strip():
        result["detected_language"]      = LANG_UNKNOWN
        result["detected_language_name"] = "Empty/Invalid"
        result["translation_error"]      = "Empty report text"
        return result

    # ── Step 1: Detect language ──────────────────────────────────────────────
    try:
        if hint_language and hint_language.lower() in (LANG_ENGLISH, LANG_KANNADA, LANG_HINDI):
            detected = hint_language.lower()
        else:
            detected = detect_language_by_script(original)
        result["detected_language"]      = detected
        result["detected_language_name"] = LANG_DISPLAY.get(detected, detected)
    except Exception as e:
        logger.error(f"Language detection failed: {e}")
        result["detected_language"]      = LANG_UNKNOWN
        result["detected_language_name"] = LANG_DISPLAY[LANG_UNKNOWN]
        # Try processing original text anyway
        result["translated_report_text"] = original
        return result

    # ── Step 2: Translate if not English ────────────────────────────────────
    if detected == LANG_ENGLISH:
        result["translated_report_text"] = original
        result["translation_method"]     = "passthrough"
        result["is_translated"]          = False
        return result

    try:
        translated, method = translate_to_english(original, detected)
        result["translated_report_text"] = translated
        result["translation_method"]     = method
        result["is_translated"]          = True
    except Exception as e:
        logger.error(f"Translation failed for report: {e}")
        result["translated_report_text"] = original  # Keep original on failure
        result["translation_method"]     = "failed"
        result["translation_error"]      = "Translation unavailable"
        result["is_translated"]          = False

    return result


def process_dataset(rows: list, text_col: str = "report_text",
                    lang_col: Optional[str] = None) -> Tuple[list, Dict]:
    """
    Process all rows in a dataset through the multilingual pipeline.

    Args:
        rows:     List of row dicts from uploaded CSV/Excel
        text_col: Column name containing report text
        lang_col: Optional column name with language hint

    Returns:
        (enriched_rows, stats)
        stats = { 'total', 'english', 'kannada', 'hindi', 'unknown',
                  'translated', 'translation_errors' }
    """
    stats = {
        "total": len(rows),
        "english":  0,
        "kannada":  0,
        "hindi":    0,
        "unknown":  0,
        "translated":         0,
        "translation_errors": 0,
    }
    enriched = []

    for row in rows:
        text    = str(row.get(text_col, "") or "").strip()
        hint    = str(row.get(lang_col, "") or "").strip() if lang_col else None
        ml_result = process_report(text, hint)

        # Merge multilingual fields into row
        new_row = dict(row)
        new_row["original_report_text"]   = ml_result["original_report_text"]
        new_row["detected_language"]      = ml_result["detected_language"]
        new_row["detected_language_name"] = ml_result["detected_language_name"]
        new_row["translated_report_text"] = ml_result["translated_report_text"]
        new_row["translation_method"]     = ml_result["translation_method"]
        new_row["translation_error"]      = ml_result["translation_error"]

        # Overwrite report_text with translated version for downstream ML
        if ml_result["is_translated"] and not ml_result["translation_error"]:
            new_row[text_col] = ml_result["translated_report_text"]

        # Update stats
        lang = ml_result["detected_language"]
        if lang == LANG_ENGLISH:
            stats["english"] += 1
        elif lang == LANG_KANNADA:
            stats["kannada"] += 1
        elif lang == LANG_HINDI:
            stats["hindi"] += 1
        else:
            stats["unknown"] += 1

        if ml_result["is_translated"]:
            stats["translated"] += 1
        if ml_result["translation_error"]:
            stats["translation_errors"] += 1

        enriched.append(new_row)

    return enriched, stats
