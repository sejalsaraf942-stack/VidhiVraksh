'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { MapPin, Database, FileCheck, UserX, KeyRound } from 'lucide-react';

export default function TrustSection() {
  const { t } = useLanguage();

  const trustPoints = [
    {
      icon: MapPin,
      title: t('trust.point1.title'),
      desc: t('trust.point1.desc'),
    },
    {
      icon: Database,
      title: t('trust.point2.title'),
      desc: t('trust.point2.desc'),
    },
    {
      icon: FileCheck,
      title: t('trust.point3.title'),
      desc: t('trust.point3.desc'),
    },
    {
      icon: UserX,
      title: t('trust.point4.title'),
      desc: t('trust.point4.desc'),
    },
    {
      icon: KeyRound,
      title: t('trust.point5.title'),
      desc: t('trust.point5.desc'),
    },
  ];

  return (
    <section className="py-20 lg:py-24 border-b border-[#A4A494] bg-[#F6E5D0] relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[4px] text-xs font-bold uppercase tracking-[0.10em] text-[#000000] bg-[#ffffff] border border-[#A4A494]">
            {t('trust.tag')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-[1.2] text-[#000000]">
            {t('trust.title')}
          </h2>
          <p className="text-[15px] text-[#000000] font-normal leading-[1.5]">
            {t('trust.subtitle')}
          </p>
        </div>

        {/* 5 Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-[4px] p-6 bg-[#ffffff] border border-[#A4A494] hover:border-[#000000] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-center text-[#000000] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#000000] mb-2 leading-[1.3]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#A4A494] leading-[1.5] font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
