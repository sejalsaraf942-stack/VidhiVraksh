'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import BrandEmblem from '@/components/BrandEmblem';
import { Typewriter } from '@/components/ui/typewriter-text';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowRight, ShieldCheck, Scale, FileText } from 'lucide-react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export default function Hero() {
  const { t, language } = useLanguage();
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
  const title = t('hero.title');

  return (
    <section className="relative bg-[#F6E5D0] py-16 lg:py-24 border-b border-[#A4A494]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Two-Column Grid: Left Text (48%), Right Schematic / Emblem (52%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Dossier Typography & Pill CTA */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Classification Badge */}
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-[4px] border border-[#A4A494] bg-[#ffffff] text-[#000000] text-xs font-bold tracking-[0.10em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#000000]" />
              <span>{t('hero.badge')}</span>
            </div>

            {/* Intro Lead-in Line (28px weight 400 in Charcoal) */}
            <div className="text-2xl sm:text-[28px] font-normal leading-[1.3] text-[#000000]">
              {t('app.subtagline')}
            </div>

            {/* Main Statement (44-48px weight 400 in Ink Black, -0.02em tracking) */}
            <h1 className="text-4xl sm:text-5xl font-normal tracking-[-0.02em] leading-[1.1] text-[#000000]">
              {/* Screen readers get the full sentence once; the typed version is visual only. */}
              <span className="sr-only">{title}</span>
              {/* The invisible copy reserves the final size so the layout does not shift while typing. */}
              <span aria-hidden="true" className="grid">
                <span className="invisible col-start-1 row-start-1">{title}|</span>
                <span className="col-start-1 row-start-1">
                  {prefersReducedMotion ? (
                    title
                  ) : (
                    <Typewriter key={language} text={title} speed={70} cursor="|" className="[&>span]:text-[#C4A47A]" />
                  )}
                </span>
              </span>
            </h1>

            {/* Body Explanation (15-17px in Charcoal, 1.5 line height) */}
            <p className="text-base sm:text-[17px] text-[#000000] font-normal leading-[1.5] max-w-xl">
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons: Pravah Pill CTA + Square Outlined Secondary */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[100px] text-[15px] font-medium border border-[#1F3A2E] bg-[#1F3A2E] text-[#F6E5D0] hover:bg-[#C4A47A] hover:border-[#C4A47A] hover:text-[#000000] shadow-sm transition-all cursor-pointer"
              >
                <span>{t('hero.btn.getStarted')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[4px] text-[14px] font-normal border border-[#A4A494] bg-[#ffffff] text-[#1F3A2E] hover:border-[#1F3A2E] transition-colors cursor-pointer"
              >
                <span>{t('pricing.tag')}</span>
              </Link>
            </div>

            {/* Key Metric Stats (Pure White cards on Parchment, 4px radius) */}
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#A4A494]">
              <div className="p-3.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494]">
                <div className="text-2xl font-bold tracking-tight text-[#000000]">
                  {t('hero.stat1.val')}
                </div>
                <div className="text-xs text-[#A4A494] tracking-[0.05em] uppercase mt-0.5">
                  {t('hero.stat1.label')}
                </div>
              </div>
              <div className="p-3.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494]">
                <div className="text-2xl font-bold tracking-tight text-[#000000]">
                  {t('hero.stat2.val')}
                </div>
                <div className="text-xs text-[#A4A494] tracking-[0.05em] uppercase mt-0.5">
                  {t('hero.stat2.label')}
                </div>
              </div>
              <div className="p-3.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494]">
                <div className="text-2xl font-bold tracking-tight text-[#000000]">
                  30 Cases
                </div>
                <div className="text-xs text-[#A4A494] tracking-[0.05em] uppercase mt-0.5">
                  Landmark Precedents
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Wireframe Schematic Panel & Inset Alert Cards */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-[4px] bg-[#ffffff] border border-[#A4A494] p-6 sm:p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[420px]">
              
              {/* Subtle Wireframe Grid Background (1px strokes on white) */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, #A4A494 1px, transparent 1px), linear-gradient(to bottom, #A4A494 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Technical Schematic Header */}
              <div className="w-full flex items-center justify-between border-b border-[#A4A494] pb-3 mb-6 relative z-10 text-[11px] font-mono uppercase text-[#A4A494] tracking-[0.10em]">
                <span>DOSSIER // ARCHITECTURE</span>
                <span>STATUS: ACTIVE</span>
              </div>

              {/* Brand Emblem Centerpiece */}
              <BrandEmblem size={208} priority className="relative z-10" />

              {/* Overlaid Inset Alert Card (Engineering Callout) */}
              <div className="w-full rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] p-3.5 text-left relative z-10 mt-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[10px] font-bold tracking-[0.10em] uppercase text-[#000000]">
                    CRITICAL // ARTICLE 141
                  </span>
                  <span className="text-[10px] font-mono text-[#A4A494]">GROUNDED CORPUS</span>
                </div>
                <div className="text-xs font-bold text-[#000000] pt-1">
                  Supreme Court Judicial Decisions & BNS Matrix
                </div>
                <p className="text-[11px] text-[#A4A494] leading-relaxed">
                  Deterministic retrieval across statutory provisions, judicial holdings, and procedural checklists.
                </p>
              </div>

              {/* Schematic Footer Coordinates */}
              <div className="w-full flex items-center justify-between pt-3 mt-4 border-t border-[#A4A494] text-[10px] font-mono text-[#A4A494] relative z-10">
                <span>SYSTEM: VIDHIVRAKSH-V2</span>
                <span>ENC: LOCAL DETERMINISTIC</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
