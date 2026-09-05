import { DetectedLanguage, LANGUAGE_DISPLAY, LANGUAGE_FLAG } from '../types';
import { Languages, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { MultilingualStats } from '../types';

// ─── Language Badge ───────────────────────────────────────────────────────────
interface LanguageBadgeProps {
  language: DetectedLanguage;
  size?: 'sm' | 'md';
  showFlag?: boolean;
}

export function LanguageBadge({ language, size = 'md', showFlag = true }: LanguageBadgeProps) {
  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-0.5 text-xs';

  const colorClass: Record<DetectedLanguage, string> = {
    en: 'bg-blue-50 text-blue-700 border border-blue-200',
    kn: 'bg-orange-50 text-orange-700 border border-orange-200',
    hi: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    unknown: 'bg-slate-100 text-slate-600 border border-slate-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${colorClass[language]} shadow-2xs`}>
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
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';

  if (translationError) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} bg-red-50 text-red-700 border border-red-200 shadow-2xs`}>
        <AlertCircle className="w-3 h-3" />
        Translation unavailable
      </span>
    );
  }

  if (!isTranslated) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} bg-slate-100 text-slate-600 border border-slate-200`}>
        Original
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs`}>
      <ArrowRightLeft className="w-3 h-3" />
      Translated
      {method === 'offline_dict' && <span className="opacity-70">(dict)</span>}
    </span>
  );
}

// ─── Multilingual Stats Card ──────────────────────────────────────────────────
interface MultilingualStatsBannerProps {
  stats: MultilingualStats;
}

export function MultilingualStatsBanner({ stats }: MultilingualStatsBannerProps) {
  if (stats.total === 0) return null;

  const hasNonEnglish = stats.kannada > 0 || stats.hindi > 0;

  return (
    <div className="card border-purple-100 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/20 animate-in">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0 text-purple-600 shadow-xs">
          <Languages className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">Multilingual Intelligence</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Automatic language detection and real-time translation complete
          </p>
        </div>
      </div>

      {/* Language breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Reports', value: stats.total, color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
          { label: 'English',        value: stats.english,  color: 'text-blue-600', bg: 'bg-blue-50/60 border-blue-100' },
          { label: 'Kannada',        value: stats.kannada,  color: 'text-orange-600', bg: 'bg-orange-50/60 border-orange-100' },
          { label: 'Hindi',          value: stats.hindi,    color: 'text-emerald-600', bg: 'bg-emerald-50/60 border-emerald-100' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl p-3 border text-center shadow-2xs ${item.bg}`}>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Status checklist */}
      <div className="space-y-2 bg-white rounded-xl p-3 border border-slate-200/80">
        <StatusLine ok={true} text="Language detected for all reports" />
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
      <div className="flex items-start gap-2 text-xs text-slate-400">
        <span className="flex-shrink-0 mt-0.5 font-bold">—</span>
        {text}
      </div>
    );
  }
  return (
    <div className={`flex items-start gap-2 text-xs font-medium ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
      <span className={`flex-shrink-0 mt-0.5 font-bold ${ok ? 'text-emerald-500' : 'text-red-500'}`}>{ok ? '✓' : '✗'}</span>
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
      <p className="text-slate-700 text-sm leading-relaxed">{originalText}</p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Original */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <LanguageBadge language={language} size="sm" />
          <span className="text-xs font-medium text-slate-500">Original text</span>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed">{originalText}</p>
      </div>
      {/* Translated */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <LanguageBadge language="en" size="sm" />
          <span className="text-xs font-medium text-indigo-700">Translated (used for NLP analysis)</span>
          {translationError && (
            <span className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3" /> {translationError}
            </span>
          )}
        </div>
        <p className="text-slate-800 text-sm leading-relaxed font-medium">{translatedText}</p>
      </div>
    </div>
  );
}
