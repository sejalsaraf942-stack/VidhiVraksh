'use client';

import React, { useId, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import {
  BookOpen,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Circle,
  FileText,
  LoaderCircle,
  MessageSquareText,
  ScanSearch,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { ResearchTrace, TraceStep, TraceStepStatus } from '@/types/research';

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  question_received: MessageSquareText,
  safety_screening: ShieldCheck,
  clarity_check: ScanSearch,
  corpus_search: Search,
  records_review: BookOpen,
  answer_preparation: FileText,
};

type TraceState = 'running' | 'complete' | 'failed';

interface LegalResearchTraceProps {
  /** `running` while the request is in flight, `failed` when it did not complete, otherwise `complete`. */
  state: TraceState;
  /** Steps reported by the server; required when `state` is `complete`. */
  trace?: ResearchTrace | null;
  defaultOpen?: boolean;
  /** Announce state changes to screen readers (only for the reply currently being produced). */
  announce?: boolean;
}

function StatusIcon({ status }: { status: TraceStepStatus }) {
  if (status === 'running') {
    return <LoaderCircle className="w-3.5 h-3.5 text-[#1F3A2E] motion-safe:animate-spin" aria-hidden />;
  }
  if (status === 'completed') {
    return <CircleCheck className="w-3.5 h-3.5 text-[#1F3A2E] vr-trace-pop" aria-hidden />;
  }
  if (status === 'failed') {
    return <CircleAlert className="w-3.5 h-3.5 text-[#000000] vr-trace-pop" aria-hidden />;
  }
  return <Circle className="w-3.5 h-3.5 text-[#A4A494]" aria-hidden />;
}

/**
 * Compact, expandable record of the research the assistant performed for one reply.
 * Rows come from real server events; nothing is replayed or simulated.
 */
export default function LegalResearchTrace({
  state,
  trace,
  defaultOpen = true,
  announce = false,
}: LegalResearchTraceProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const panelId = useId();

  const fill = (text: string, values: Record<string, string | number | null | undefined>) =>
    Object.entries(values).reduce((acc, [key, value]) => acc.replace(`{${key}}`, String(value ?? '—')), text);

  const describeOutcome = (step: TraceStep): string => {
    const d = step.details || {};
    switch (step.outcome) {
      case 'received': {
        const langName = SUPPORTED_LANGUAGES.find((l) => l.code === d.language)?.nativeName || d.language;
        const modeName = d.mode === 'professional' ? t('workspace.modePro') : t('workspace.modeNormal');
        return fill(t('trace.outcome.received'), { language: langName, mode: modeName });
      }
      case 'matches_found':
        return fill(t('trace.outcome.matches_found'), { matched: d.records_matched, searched: d.records_searched });
      case 'no_matches':
        return fill(t('trace.outcome.no_matches'), { searched: d.records_searched });
      case 'records_selected':
        return fill(t('trace.outcome.records_selected'), { count: d.records?.length ?? 0 });
      case 'grounded_answer':
        return d.record_title
          ? fill(t('trace.outcome.grounded_answer'), { title: d.record_title })
          : t('trace.step.answer_preparation');
      default:
        return t(`trace.outcome.${step.outcome}`, step.outcome);
    }
  };

  // Server-reported steps once the reply exists; while running or failed a single client-side row is shown.
  const steps: TraceStep[] = state === 'complete' && trace?.steps?.length ? trace.steps : [];

  const summary =
    state === 'running'
      ? t('trace.summaryRunning')
      : state === 'failed'
      ? t('trace.summaryFailed')
      : fill(t('trace.summaryDone'), { count: steps.filter((s) => s.status === 'completed').length });

  const headerStatus: TraceStepStatus = state === 'running' ? 'running' : state === 'failed' ? 'failed' : 'completed';

  const hasDetails = (step: TraceStep) =>
    (step.id === 'corpus_search' && step.details?.records_searched != null) ||
    (step.id === 'records_review' && (step.details?.records?.length ?? 0) > 0);

  return (
    <section
      aria-label={t('trace.title')}
      className="relative mb-3 rounded-[4px] border border-[#A4A494]/60 bg-[#F6E5D0]/40 text-[11px] sm:text-xs min-w-0"
    >
      {announce && (
        <span className="sr-only" aria-live="polite" role="status">
          {summary}
        </span>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left rounded-[4px] hover:bg-[#F6E5D0]/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#C4A47A] transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <StatusIcon status={headerStatus} />
          <span className="font-mono uppercase tracking-[0.08em] text-[10px] text-[#1F3A2E] shrink-0">{t('trace.title')}</span>
          <span className="text-[#000000]/80 truncate">{summary}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0 text-[#1F3A2E]/80">
          <span className="sr-only">{open ? t('trace.hideSteps') : t('trace.showSteps')}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="px-3 pb-2.5"
      >
        <ol className="relative space-y-0.5 border-l border-[#A4A494]/60 ml-[7px] pl-3.5">
          {state === 'running' && (
            <li className="vr-trace-row relative py-1">
              <div className="flex items-start gap-2">
                <span className="absolute -left-[21.5px] top-[5px] bg-[#FBF5EC] rounded-full">
                  <StatusIcon status="running" />
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-[#000000]">
                    {t('trace.inflight.label')}
                    <span className="sr-only"> — {t('trace.status.running')}</span>
                  </div>
                  <div className="text-[#1F3A2E]/75">{t('trace.inflight.desc')}</div>
                  <div className="mt-1.5 h-[2px] w-32 max-w-full overflow-hidden rounded-full bg-[#A4A494]/30" aria-hidden>
                    <div className="h-full w-1/3 rounded-full bg-[#C4A47A] vr-trace-progress" />
                  </div>
                </div>
              </div>
            </li>
          )}

          {state === 'failed' && (
            <li className="vr-trace-row relative py-1">
              <div className="flex items-start gap-2">
                <span className="absolute -left-[21.5px] top-[5px] bg-[#FBF5EC] rounded-full">
                  <StatusIcon status="failed" />
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-[#000000]">
                    {t('trace.inflight.label')}
                    <span className="sr-only"> — {t('trace.status.failed')}</span>
                  </div>
                  {/* The reply body carries the explanation; here only the state is shown to avoid repeating it. */}
                  <div className="text-[#000000]/80">{t('trace.status.failed')}</div>
                </div>
              </div>
            </li>
          )}

          {steps.map((step, index) => {
            const Icon = STEP_ICONS[step.id] || Circle;
            const expandable = hasDetails(step);
            const isExpanded = Boolean(expandedSteps[step.id]);
            const detailsId = `${panelId}-${step.id}`;
            return (
              <li
                key={step.id}
                className="vr-trace-row relative py-1"
                style={{ '--vr-i': index } as React.CSSProperties}
              >
                <div className="flex items-start gap-2">
                  <span className="absolute -left-[21.5px] top-[5px] bg-[#FBF5EC] rounded-full">
                    <StatusIcon status={step.status} />
                  </span>
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#1F3A2E]/70" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium text-[#000000]">{t(`trace.step.${step.id}`)}</span>
                      <span className="sr-only">— {t(`trace.status.${step.status}`)}</span>
                      {expandable && (
                        <button
                          type="button"
                          onClick={() => setExpandedSteps((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
                          aria-expanded={isExpanded}
                          aria-controls={detailsId}
                          className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#1F3A2E] underline decoration-[#C4A47A] underline-offset-2 hover:text-[#000000] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#C4A47A] rounded-[2px]"
                        >
                          {isExpanded ? t('trace.hideDetails') : t('trace.showDetails')}
                        </button>
                      )}
                    </div>
                    <div className="text-[#1F3A2E]/80 break-words">{describeOutcome(step)}</div>

                    {expandable && isExpanded && (
                      <div id={detailsId} className="vr-trace-reveal mt-1.5">
                        {step.id === 'corpus_search' && (
                          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494]/50 p-2">
                            <dt className="text-[#1F3A2E]/70">{t('trace.detail.method')}</dt>
                            <dd className="text-[#000000]">{t('trace.detail.keywordMatch')}</dd>
                            <dt className="text-[#1F3A2E]/70">{t('trace.detail.recordsSearched')}</dt>
                            <dd className="text-[#000000] font-mono">{step.details.records_searched}</dd>
                            <dt className="text-[#1F3A2E]/70">{t('trace.detail.recordsMatched')}</dt>
                            <dd className="text-[#000000] font-mono">{step.details.records_matched ?? 0}</dd>
                            {step.details.duration_ms != null && (
                              <>
                                <dt className="text-[#1F3A2E]/70">{t('trace.detail.timeTaken')}</dt>
                                <dd className="text-[#000000] font-mono">{step.details.duration_ms} ms</dd>
                              </>
                            )}
                          </dl>
                        )}
                        {step.id === 'records_review' && (
                          <ul className="space-y-1.5">
                            {step.details.records!.map((rec) => (
                              <li key={rec.id} className="rounded-[4px] bg-[#ffffff] border border-[#A4A494]/50 p-2 min-w-0">
                                <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#1F3A2E]/80">
                                  {t(rec.kind === 'landmark_case' ? 'source.kind.landmark_case' : 'source.kind.statutory_summary')}
                                </div>
                                <div className="font-medium text-[#000000] break-words">
                                  {rec.title}
                                  {rec.kind === 'landmark_case' && rec.year ? ` (${rec.year})` : ''}
                                </div>
                                {rec.kind === 'landmark_case' && rec.citation && (
                                  <div className="text-[#1F3A2E]/80 font-mono text-[10px]">{rec.citation}</div>
                                )}
                                {rec.matched_terms.length > 0 && (
                                  <div className="mt-1 flex flex-wrap items-center gap-1">
                                    <span className="text-[#1F3A2E]/70">{t('trace.detail.matchedTerms')}:</span>
                                    {rec.matched_terms.map((term) => (
                                      <span key={term} className="px-1.5 py-px rounded-[3px] bg-[#F6E5D0] border border-[#C4A47A]/50 text-[#000000]">
                                        {term}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
