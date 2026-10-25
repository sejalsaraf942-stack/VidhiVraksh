'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { MousePointerClick, MessageSquare, Cpu, CheckCheck, UserCheck } from 'lucide-react';

export default function WorkflowSection() {
  const { t } = useLanguage();

  const steps = [
    {
      num: t('workflow.step1.num'),
      icon: MousePointerClick,
      title: t('workflow.step1.title'),
      desc: t('workflow.step1.desc'),
    },
    {
      num: t('workflow.step2.num'),
      icon: MessageSquare,
      title: t('workflow.step2.title'),
      desc: t('workflow.step2.desc'),
    },
    {
      num: t('workflow.step3.num'),
      icon: Cpu,
      title: t('workflow.step3.title'),
      desc: t('workflow.step3.desc'),
    },
    {
      num: t('workflow.step4.num'),
      icon: CheckCheck,
      title: t('workflow.step4.title'),
      desc: t('workflow.step4.desc'),
    },
    {
      num: t('workflow.step5.num'),
      icon: UserCheck,
      title: t('workflow.step5.title'),
      desc: t('workflow.step5.desc'),
    },
  ];

  return (
    <section id="workflow" className="py-20 lg:py-24 border-b border-[#A4A494] bg-[#F6E5D0] relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[4px] text-xs font-bold uppercase tracking-[0.10em] text-[#000000] bg-[#ffffff] border border-[#A4A494]">
            {t('workflow.tag')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-[1.2] text-[#000000]">
            {t('workflow.title')}
          </h2>
          <p className="text-[15px] text-[#000000] font-normal leading-[1.5]">
            {t('workflow.subtitle')}
          </p>
        </div>

        {/* 5-Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="rounded-[4px] p-5 bg-[#ffffff] border border-[#A4A494] hover:border-[#000000] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#A4A494]">
                    <span className="text-xl font-bold font-mono text-[#000000]">
                      {s.num}
                    </span>
                    <div className="w-8 h-8 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-center text-[#000000]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#000000] mb-2 leading-[1.3]">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#A4A494] leading-[1.5] font-normal">
                    {s.desc}
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
