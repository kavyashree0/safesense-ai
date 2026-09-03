import { DetectedLanguage, LANGUAGE_DISPLAY, LANGUAGE_FLAG } from '../types';
import { Languages, AlertCircle, ArrowRightLeft } from 'lucide-react';

// ─── Language Badge ───────────────────────────────────────────────────────────
interface LanguageBadgeProps {
  language: DetectedLanguage;
  size?: 'sm' | 'md';
  showFlag?: boolean;
}

export function LanguageBadge({ language, size = 'md', showFlag = true }: LanguageBadgeProps) {
  const sizeClass = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2.5 py-0.5 text-xs';

  const colorClass: Record<DetectedLanguage, string> = {
    en: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    kn: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    hi: 'bg-green-500/15 text-green-300 border border-green-500/30',
    unknown: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${colorClass[language]}`}>
      {showFlag && <span className="text-xs">{LANGUAGE_FLAG[language]}</span>}
      {LANGUAGE_DISPLAY[language]}
    </span>
  );
}

// ─── Translation Badge ────────────────────────────────────────────────────────
interface TranslationBadgeProps {
  isTranslated: boolean;
  translationError?: string | null;
  method?: string;
  size?: 'sm' | 'md';
}

export function TranslationBadge({
  isTranslated,
  translationError,
  method,
  size = 'md',
}: TranslationBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';

  if (translationError) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} bg-red-500/15 text-red-400 border border-red-500/30`}>
        <AlertCircle className="w-3 h-3" />
        Translation unavailable
      </span>
    );
  }

  if (!isTranslated) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} bg-slate-500/15 text-slate-400 border border-slate-500/30`}>
        Original
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} bg-violet-500/15 text-violet-300 border border-violet-500/30`}>
      <ArrowRightLeft className="w-3 h-3" />
      Translated
      {method === 'offline_dict' && <span className="opacity-60">(dict)</span>}
    </span>
  );
}

// ─── Multilingual Stats Card ──────────────────────────────────────────────────
import { MultilingualStats } from '../types';

interface MultilingualStatsBannerProps {
  stats: MultilingualStats;
}

export function MultilingualStatsBanner({ stats }: MultilingualStatsBannerProps) {
  if (stats.total === 0) return null;

  const hasNonEnglish = stats.kannada > 0 || stats.hindi > 0;

  return (
    <div className="card border-violet-500/20 bg-violet-900/5 animate-in">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
          <Languages className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">Multilingual Processing</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Language detection and translation complete
          </p>
        </div>
      </div>

      {/* Language breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Reports', value: stats.total, color: 'text-white' },
          { label: 'English',        value: stats.english,  color: 'text-blue-400' },
          { label: 'Kannada',        value: stats.kannada,  color: 'text-orange-400' },
          { label: 'Hindi',          value: stats.hindi,    color: 'text-green-400' },
        ].map(item => (
          <div key={item.label} className="bg-slate-800/60 rounded-lg px-3 py-2 text-center">
            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Status checklist */}
      <div className="space-y-1.5">
        <StatusLine ok={true}  text="Language detected for all reports" />
        <StatusLine ok={hasNonEnglish && stats.translate_enabled}
                    na={!hasNonEnglish}
                    text={
                      !hasNonEnglish
                        ? 'No non-English reports found (no translation needed)'
                        : stats.translate_enabled
                          ? `${stats.translated} non-English report${stats.translated !== 1 ? 's' : ''} translated to English`
                          : 'Translation disabled — original text used'
                    }
        />
        <StatusLine ok={true} text="Ready for SIF analysis via existing NLP pipeline" />
        {stats.translation_errors > 0 && (
          <StatusLine
            ok={false}
            text={`${stats.translation_errors} report${stats.translation_errors !== 1 ? 's' : ''} could not be translated — original text used`}
          />
        )}
      </div>
    </div>
  );
}

function StatusLine({
  ok,
  na,
  text,
}: {
  ok: boolean;
  na?: boolean;
  text: string;
}) {
  if (na) {
    return (
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <span className="flex-shrink-0 mt-0.5">—</span>
        {text}
      </div>
    );
  }
  return (
    <div className={`flex items-start gap-2 text-xs ${ok ? 'text-green-400' : 'text-red-400'}`}>
      <span className="flex-shrink-0 mt-0.5">{ok ? '✓' : '✗'}</span>
      {text}
    </div>
  );
}

// ─── Inline translation display for report detail / table ─────────────────────
interface TranslationRevealProps {
  originalText: string;
  translatedText: string;
  language: DetectedLanguage;
  isTranslated: boolean;
  translationError?: string | null;
}

export function TranslationReveal({
  originalText,
  translatedText,
  language,
  isTranslated,
  translationError,
}: TranslationRevealProps) {
  if (!isTranslated) {
    return (
      <p className="text-slate-300 text-sm leading-relaxed">{originalText}</p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Original */}
      <div className="bg-slate-800/50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <LanguageBadge language={language} size="sm" />
          <span className="text-xs text-slate-500">Original</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{originalText}</p>
      </div>
      {/* Translated */}
      <div className="bg-slate-800/50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <LanguageBadge language="en" size="sm" />
          <span className="text-xs text-slate-500">Translated (used for analysis)</span>
          {translationError && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {translationError}
            </span>
          )}
        </div>
        <p className="text-slate-200 text-sm leading-relaxed">{translatedText}</p>
      </div>
    </div>
  );
}
