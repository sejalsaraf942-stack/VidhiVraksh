'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { User, Briefcase, Check } from 'lucide-react';

export default function ModesSection() {
  const { t } = useLanguage();

  return (
    <section id="modes" className="py-20 lg:py-24 border-b border-[#A4A494] bg-[#F6E5D0] relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[4px] text-xs font-bold uppercase tracking-[0.10em] text-[#000000] bg-[#ffffff] border border-[#A4A494]">
            {t('modes.tag')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-[1.2] text-[#000000]">
            {t('modes.title')}
          </h2>
          <p className="text-[15px] text-[#000000] font-normal leading-[1.5]">
            {t('modes.subtitle')}
          </p>
        </div>

        {/* 2 Modes Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Card 1: Normal Mode */}
          <div className="rounded-[4px] p-7 bg-[#ffffff] border border-[#A4A494] hover:border-[#000000] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#A4A494]">
                <div className="w-10 h-10 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-center text-[#000000]">
                  <User className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-bold tracking-[0.10em] uppercase bg-[#F6E5D0] text-[#000000] border border-[#A4A494]">
                  {t('modes.normal.badge')}
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#000000] mb-2 leading-[1.3]">
                {t('modes.normal.name')}
              </h3>
              <p className="text-sm text-[#000000] leading-[1.5] mb-6 font-normal">
                {t('modes.normal.desc')}
              </p>

              <ul className="space-y-3 pt-4 border-t border-[#A4A494]">
                {[
                  t('modes.normal.feat1'),
                  t('modes.normal.feat2'),
                  t('modes.normal.feat3'),
                  t('modes.normal.feat4'),
                  t('modes.normal.feat5'),
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-[#000000]">
                    <Check className="w-3.5 h-3.5 text-[#000000] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#A4A494]">
              <Link
                href="/workspace"
                className="w-full py-2.5 rounded-[100px] text-center text-xs font-normal border border-[#000000] bg-transparent text-[#000000] hover:bg-[#000000] hover:text-[#F6E5D0] transition-colors block"
              >
                {t('modes.normal.cta')}
              </Link>
            </div>
          </div>

          {/* Card 2: Professional Mode */}
          <div className="rounded-[4px] p-7 bg-[#ffffff] border-2 border-[#000000] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#A4A494]">
                <div className="w-10 h-10 rounded-[4px] bg-[#000000] text-[#ffffff] flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-bold tracking-[0.10em] uppercase bg-[#000000] text-[#ffffff]">
                  {t('modes.pro.badge')}
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#000000] mb-2 leading-[1.3]">
                {t('modes.pro.name')}
              </h3>
              <p className="text-sm text-[#000000] leading-[1.5] mb-6 font-normal">
                {t('modes.pro.desc')}
              </p>

              <ul className="space-y-3 pt-4 border-t border-[#A4A494]">
                {[
                  t('modes.pro.feat1'),
                  t('modes.pro.feat2'),
                  t('modes.pro.feat3'),
                  t('modes.pro.feat4'),
                  t('modes.pro.feat5'),
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-[#000000]">
                    <Check className="w-3.5 h-3.5 text-[#000000] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#A4A494]">
              <Link
                href="/pricing"
                className="w-full py-2.5 rounded-[100px] text-center text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 transition-opacity block"
              >
                {t('modes.pro.cta')}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
