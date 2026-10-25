'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileText,
  ShieldAlert,
  Car,
  GitCompare,
  FolderOpen,
  FileSearch,
  MapPin,
  Briefcase,
  Scale,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Info
} from 'lucide-react';

interface FeatureItem {
  id: number;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  badgeKey: string;
  detailKey: string;
  buttonKey: string;
  targetRoute: string;
  isPrototype: boolean;
  sampleInputKey?: string;
  sampleSource?: string;
}

export default function CoreFeatures() {
  const { t } = useLanguage();
  const [activeModalFeature, setActiveModalFeature] = useState<FeatureItem | null>(null);

  const featuresList: FeatureItem[] = [
    {
      id: 1,
      icon: Sparkles,
      titleKey: 'features.item1.title',
      descKey: 'features.item1.desc',
      badgeKey: 'features.item1.badge',
      detailKey: 'features.item1.detail',
      buttonKey: 'features.btn.openAssistant',
      targetRoute: '/workspace',
      isPrototype: true,
      sampleSource: 'General Clauses Act & Judicial Maxims',
    },
    {
      id: 2,
      icon: FileText,
      titleKey: 'features.item2.title',
      descKey: 'features.item2.desc',
      badgeKey: 'features.item2.badge',
      detailKey: 'features.item2.detail',
      buttonKey: 'features.btn.exploreDocs',
      targetRoute: '/documents',
      isPrototype: true,
      sampleSource: 'Indian Contract Act, 1872 (Sec 10, 23, 73)',
    },
    {
      id: 3,
      icon: ShieldAlert,
      titleKey: 'features.item3.title',
      descKey: 'features.item3.desc',
      badgeKey: 'features.item3.badge',
      detailKey: 'features.item3.detail',
      buttonKey: 'features.btn.crimeGuide',
      targetRoute: '/workspace',
      isPrototype: true,
      sampleSource: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (Sec 173)',
    },
    {
      id: 4,
      icon: Car,
      titleKey: 'features.item4.title',
      descKey: 'features.item4.desc',
      badgeKey: 'features.item4.badge',
      detailKey: 'features.item4.detail',
      buttonKey: 'features.btn.challanHelp',
      targetRoute: '/workspace',
      isPrototype: true,
      sampleSource: 'Motor Vehicles (Amendment) Act, 2019',
    },
    {
      id: 5,
      icon: GitCompare,
      titleKey: 'features.item5.title',
      descKey: 'features.item5.desc',
      badgeKey: 'features.item5.badge',
      detailKey: 'features.item5.detail',
      buttonKey: 'features.btn.bnsMatrix',
      targetRoute: '/documents',
      isPrototype: true,
      sampleSource: 'IPC (1860) ↔ BNS (2023) Statutory Cross-Reference Matrix',
    },
    {
      id: 6,
      icon: FolderOpen,
      titleKey: 'features.item6.title',
      descKey: 'features.item6.desc',
      badgeKey: 'features.item6.badge',
      detailKey: 'features.item6.detail',
      buttonKey: 'features.btn.browseLibrary',
      targetRoute: '/documents',
      isPrototype: true,
      sampleSource: 'Indian Stamp Act, 1899 & Registration Act, 1908',
    },
    {
      id: 7,
      icon: FileSearch,
      titleKey: 'features.item7.title',
      descKey: 'features.item7.desc',
      badgeKey: 'features.item7.badge',
      detailKey: 'features.item7.detail',
      buttonKey: 'features.btn.checkContract',
      targetRoute: '/documents',
      isPrototype: true,
      sampleSource: 'Specific Relief Act, 1963 & Contract Validity Principles',
    },
    {
      id: 8,
      icon: MapPin,
      titleKey: 'features.item8.title',
      descKey: 'features.item8.desc',
      badgeKey: 'features.item8.badge',
      detailKey: 'features.item8.detail',
      buttonKey: 'features.btn.researchLand',
      targetRoute: '/land-research',
      isPrototype: false,
      sampleSource: 'Transfer of Property Act, 1882 & State Land Revenue Codes',
    },
    {
      id: 9,
      icon: Briefcase,
      titleKey: 'features.item9.title',
      descKey: 'features.item9.desc',
      badgeKey: 'features.item9.badge',
      detailKey: 'features.item9.detail',
      buttonKey: 'features.btn.msmeDisputes',
      targetRoute: '/workspace',
      isPrototype: false,
      sampleSource: 'MSMED Act, 2006 (Sec 15-18) & Arbitration Act, 1996',
    },
    {
      id: 10,
      icon: Scale,
      titleKey: 'features.item10.title',
      descKey: 'features.item10.desc',
      badgeKey: 'features.item10.badge',
      detailKey: 'features.item10.detail',
      buttonKey: 'features.btn.manageCases',
      targetRoute: '/case-management',
      isPrototype: false,
      sampleSource: 'Advocates Act, 1961 & e-Courts Integrated Framework',
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-24 border-b border-[#A4A494] bg-[#F6E5D0] relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[4px] text-xs font-bold uppercase tracking-[0.10em] text-[#000000] bg-[#ffffff] border border-[#A4A494]">
            {t('features.header.tag')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-[1.2] text-[#000000]">
            {t('features.header.title')}
          </h2>
          <p className="text-[15px] text-[#000000] font-normal leading-[1.5]">
            {t('features.header.subtitle')}
          </p>
        </div>

        {/* 10 Feature Cards Grid: Pure White cards, 4px radius, 1px Bone border */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                className="rounded-[4px] p-6 bg-[#ffffff] border border-[#A4A494] hover:border-[#000000] transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Icon & Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-center text-[#000000]">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-bold tracking-[0.10em] uppercase bg-[#F6E5D0] text-[#000000] border border-[#A4A494]">
                        {t(item.badgeKey)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveModalFeature(item)}
                        title={t('common.viewDetails')}
                        className="p-1 rounded-[4px] text-[#A4A494] hover:text-[#000000] hover:bg-[#F6E5D0] transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-[#000000] mb-2 leading-[1.3]">
                    {t(item.titleKey)}
                  </h3>
                  <p className="text-sm text-[#000000] leading-[1.5] font-normal mb-6">
                    {t(item.descKey)}
                  </p>
                </div>

                {/* Bottom Action: Pravah Pill Ghost CTA */}
                <div className="pt-4 border-t border-[#A4A494]">
                  <Link
                    href={item.targetRoute}
                    className="w-full py-2 px-4 rounded-[100px] text-xs font-normal border border-[#000000] bg-transparent text-[#000000] hover:bg-[#000000] hover:text-[#F6E5D0] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{t(item.buttonKey)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Modal: Pure White card with 4px radius and 1px Bone border */}
      {activeModalFeature && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-2xl rounded-[4px] bg-[#ffffff] border border-[#000000] p-6 sm:p-8 shadow-sm text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#A4A494]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-center text-[#000000] shrink-0">
                  {React.createElement(activeModalFeature.icon, { className: 'w-4 h-4' })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#000000]">
                    {t(activeModalFeature.titleKey)}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#A4A494] tracking-[0.05em] uppercase font-mono">
                      {t('modal.prototypeTitle')}
                    </span>
                    <span className="text-[#A4A494]">•</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] font-bold tracking-[0.10em] uppercase">
                      {t(activeModalFeature.badgeKey)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalFeature(null)}
                aria-label={t('common.close')}
                className="p-1 rounded-[4px] text-[#A4A494] hover:text-[#000000] hover:bg-[#F6E5D0] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-5">
              {/* Notice Banner */}
              <div className="rounded-[4px] p-3.5 bg-[#F6E5D0] border border-[#A4A494] flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-[#000000] shrink-0 mt-0.5" />
                <div className="text-xs text-[#000000] leading-relaxed">
                  <div className="font-bold text-[#000000] mb-0.5">{t('modal.prototypeNotice')}</div>
                  {t('modal.prototypeNoticeDesc')}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494] mb-1.5">
                  {t('modal.keyCapabilities')}
                </h4>
                <p className="text-sm text-[#000000] leading-relaxed bg-[#F6E5D0] p-3.5 rounded-[4px] border border-[#A4A494]">
                  {t(activeModalFeature.detailKey)}
                </p>
              </div>

              {/* Statutory Source Reference */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494] mb-1.5">
                  {t('modal.statutorySource')}
                </h4>
                <div className="flex items-center gap-2 p-2.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-xs text-[#000000] font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-[#A4A494] shrink-0" />
                  <span>{activeModalFeature.sampleSource}</span>
                </div>
              </div>

              {/* Sample Output */}
              <div className="rounded-[4px] p-3.5 bg-[#ffffff] border border-[#A4A494] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-[#A4A494]">
                  <span>{t('modal.sampleOutput')}</span>
                  <span className="text-[#000000] font-bold">● {t('common.ready')}</span>
                </div>
                <p className="text-xs text-[#000000] leading-relaxed">
                  {t(activeModalFeature.descKey)}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#A4A494] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-[#A4A494] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                <span>{t('modal.disclaimer')}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href={activeModalFeature.targetRoute}
                  onClick={() => setActiveModalFeature(null)}
                  className="w-full sm:w-auto px-5 py-2 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 text-center"
                >
                  {t(activeModalFeature.buttonKey)}
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveModalFeature(null)}
                  className="px-4 py-2 rounded-[4px] text-xs text-[#A4A494] hover:text-[#000000]"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
