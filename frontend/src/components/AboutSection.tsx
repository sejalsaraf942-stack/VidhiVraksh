'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutSection() {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-20 lg:py-24 bg-[#1F3A2E] text-[#ffffff] relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading with Uppercase Tracked Classification Badge */}
        <div className="max-w-3xl mb-16 text-left">
          <div className="inline-block px-2 py-0.5 rounded-[4px] text-xs font-bold uppercase tracking-[0.10em] text-[#000000] bg-[#ffffff] mb-4">
            {t('about.tag')}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-normal leading-[1.2] tracking-[-0.02em] text-[#ffffff]">
            {t('about.title')}
          </h2>
        </div>

        {/* 2-Column Problem/Vision Rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
          
          {/* Item 1: The Problem / The Challenge */}
          <div className="flex items-start gap-5">
            {/* 3x3 Diamond Grid Marker (Pravah signature) */}
            <div className="w-10 h-10 shrink-0 grid grid-cols-3 gap-1 pt-1" aria-hidden="true">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-2 h-2 rotate-45 bg-[#A4A494]" />
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-[#ffffff] leading-[1.3]">
                {t('about.challenge.title')}
              </h3>
              <div className="space-y-3 text-[15px] text-[#A4A494] leading-[1.5] font-normal">
                <p>{t('about.challenge.p1')}</p>
                <p>{t('about.challenge.p2')}</p>
              </div>
              <div className="pt-2 text-xs font-mono uppercase tracking-[0.10em] text-[#A4A494]/80">
                ENACTMENTS: IPC • CrPC • IEA → BNS • BNSS • BSA
              </div>
            </div>
          </div>

          {/* Item 2: The Solution / The Mission */}
          <div className="flex items-start gap-5">
            {/* 3x3 Diamond Grid Marker in White */}
            <div className="w-10 h-10 shrink-0 grid grid-cols-3 gap-1 pt-1" aria-hidden="true">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-2 h-2 rotate-45 bg-[#ffffff]" />
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-[#ffffff] leading-[1.3]">
                {t('about.mission.title')}
              </h3>
              <div className="space-y-3 text-[15px] text-[#A4A494] leading-[1.5] font-normal">
                <p>{t('about.mission.p1')}</p>
                <p>{t('about.mission.p2')}</p>
              </div>
              <div className="pt-2 text-xs font-mono uppercase tracking-[0.10em] text-[#ffffff]">
                METHOD: DETERMINISTIC RETRIEVAL // GROUNDED CITATIONS
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
