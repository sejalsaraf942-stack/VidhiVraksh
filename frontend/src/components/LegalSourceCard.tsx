'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ExternalLink, FileText, Landmark } from 'lucide-react';
import type { LegalSource } from '@/types/research';

/** Returns a safe http(s) URL, or null for anything else (relative paths, file:, javascript:, ...). */
function safeExternalUrl(url?: string): URL | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed : null;
  } catch {
    return null;
  }
}

interface LegalSourceCardProps {
  source: LegalSource;
}

/**
 * One retrieved corpus record. Only metadata present on the record is shown; nothing is inferred.
 * Landmark cases are corpus summaries of judgments, statutory records are prototype summaries.
 */
export default function LegalSourceCard({ source }: LegalSourceCardProps) {
  const { t } = useLanguage();
  const isCase = Boolean(source.is_landmark_case);
  const link = safeExternalUrl(source.official_url);
  const court = isCase ? source.court : source.court_or_authority;

  const facts: Array<[string, string | number | null | undefined]> = [
    [t('source.court'), court],
    [t('source.citation'), isCase ? source.citation : source.section],
    [t('source.statute'), source.statute],
  ];

  return (
    <article className="relative rounded-[4px] bg-[#ffffff] border border-[#A4A494]/70 p-3 sm:p-3.5 text-xs space-y-2 min-w-0">
      <header className="space-y-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.06em] text-[#1F3A2E] bg-[#F6E5D0] border border-[#C4A47A]/60 rounded-[4px] px-1.5 py-0.5">
          {isCase ? <Landmark className="w-3 h-3" aria-hidden="true" /> : <FileText className="w-3 h-3" aria-hidden="true" />}
          {t(isCase ? 'source.kind.landmark_case' : 'source.kind.statutory_summary')}
        </span>
        <h4 className="text-[13px] font-bold text-[#000000] leading-snug break-words">
          {source.title}
          {isCase && source.year ? <span className="font-normal text-[#1F3A2E]/80"> ({source.year})</span> : null}
        </h4>
      </header>

      <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className="text-[#1F3A2E]/70">{label}</dt>
              <dd className="text-[#000000] break-words">{value}</dd>
            </React.Fragment>
          ))}
      </dl>

      {source.legal_principle && (
        <p className="text-[11px] leading-relaxed text-[#000000]">
          <span className="font-bold text-[#1F3A2E]">{t('source.principle')}: </span>
          {source.legal_principle}
        </p>
      )}
      {source.holding_summary && (
        <p className="text-[11px] leading-relaxed text-[#000000]">
          <span className="font-bold text-[#1F3A2E]">{t('source.summary')}: </span>
          {source.holding_summary}
        </p>
      )}
      {source.why_it_matters && (
        <p className="text-[11px] leading-relaxed text-[#000000]">
          <span className="font-bold text-[#1F3A2E]">{t('source.whyItMatters')}: </span>
          {source.why_it_matters}
        </p>
      )}

      <footer className="pt-1.5 border-t border-[#A4A494]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        {source.limitations && (
          <p className="text-[10px] text-[#1F3A2E]/75 leading-relaxed">
            <span className="font-bold">{t('source.caveat')}: </span>
            {source.limitations}
          </p>
        )}
        {link && (
          <a
            href={link.toString()}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 shrink-0 text-[11px] font-medium text-[#1F3A2E] underline decoration-[#C4A47A] underline-offset-2 hover:text-[#000000] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4A47A] rounded-[2px]"
          >
            {t('source.officialPortal')} · {link.hostname}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            <span className="sr-only">({t('source.opensNewTab')})</span>
          </a>
        )}
      </footer>
    </article>
  );
}
