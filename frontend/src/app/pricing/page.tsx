'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  Check,
  AlertTriangle,
  ArrowRight,
  Layers,
} from 'lucide-react';

export default function PricingPage() {
  const { t } = useLanguage();
  const { user, isAuthenticated, toggleMode } = useAuth();
  const router = useRouter();

  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  const isPro = Boolean(
    user?.is_pro_entitled ||
    user?.subscription === 'professional' ||
    user?.role === 'lawyer' ||
    user?.role === 'admin'
  );

  const comparisonRows = [
    {
      feature: 'Citizen Statutory Guidance (10 Enactments)',
      normal: 'Yes (Plain Language)',
      pro: 'Yes (Advanced Judicial Context)',
    },
    {
      feature: '30 Landmark Supreme Court Precedents',
      normal: 'Basic Mentions',
      pro: 'Full Ratio, Facts, Holdings & Citations',
    },
    {
      feature: 'Article 141 Binding Constitutional Precedents',
      normal: 'No',
      pro: 'Yes (Authoritative Briefing)',
    },
    {
      feature: 'IPC ↔ BNS Comparative Transition Matrix',
      normal: 'Basic Cross-Ref',
      pro: 'Detailed Procedural & Penalty Mapping',
    },
    {
      feature: 'Legal Document Templates & Consistency Checker',
      normal: 'Standard Samples',
      pro: 'Automated Consistency Audit & Clause Breakdown',
    },
    {
      feature: 'Lawyer Case Management & Hearing Diary',
      normal: 'No',
      pro: 'Yes (Full Case Tracker & Exhibit Vault)',
    },
    {
      feature: 'Multi-lingual Legal Translation (6 Languages)',
      normal: 'Yes',
      pro: 'Yes',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6E5D0] text-[#000000] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-12">
        
        {/* Header / Intro */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block px-2 py-0.5 rounded-[4px] text-xs font-bold uppercase tracking-[0.10em] text-[#000000] bg-[#ffffff] border border-[#A4A494]">
            {t('pricing.tag')}
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal tracking-[-0.02em] text-[#000000] leading-[1.1]">
            {t('pricing.title')}
          </h1>
          <p className="text-base sm:text-lg text-[#000000] leading-[1.5]">
            {t('pricing.subtitle')}
          </p>

          {/* Prototype Demonstration Disclaimer Banner */}
          <div className="mt-6 p-4 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs sm:text-sm flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-[#000000] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-[0.10em] block text-[#000000] mb-0.5 text-xs">
                Prototype Demonstration
              </span>
              <span>{t('pricing.disclaimer')}</span>
            </div>
          </div>

          {/* Billing Interval Toggle */}
          <div className="pt-6 flex items-center justify-center">
            <div className="p-1 rounded-[100px] bg-[#ffffff] border border-[#A4A494] flex items-center">
              <button
                type="button"
                onClick={() => setInterval('monthly')}
                className={`px-5 py-1.5 rounded-[100px] text-xs font-normal transition-colors cursor-pointer ${
                  interval === 'monthly'
                    ? 'bg-[#000000] text-[#ffffff] font-bold'
                    : 'text-[#A4A494] hover:text-[#000000]'
                }`}
              >
                {t('pricing.monthly')}
              </button>
              <button
                type="button"
                onClick={() => setInterval('yearly')}
                className={`px-5 py-1.5 rounded-[100px] text-xs font-normal transition-colors cursor-pointer ${
                  interval === 'yearly'
                    ? 'bg-[#000000] text-[#ffffff] font-bold'
                    : 'text-[#A4A494] hover:text-[#000000]'
                }`}
              >
                <span>{t('pricing.yearly')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Plan 1: Free Citizen */}
          <div className="rounded-[4px] p-7 bg-[#ffffff] border border-[#A4A494] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                  Citizen Tier
                </span>
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] uppercase font-bold tracking-[0.10em] bg-[#F6E5D0] text-[#000000] border border-[#A4A494]">
                  Free Forever
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#000000] mb-2 leading-[1.2]">
                {t('pricing.citizenPlan')}
              </h2>
              <p className="text-xs text-[#A4A494] mb-6 leading-relaxed">
                {t('pricing.citizenDesc')}
              </p>

              <div className="mb-6 pb-6 border-b border-[#A4A494]">
                <span className="text-4xl font-normal text-[#000000]">₹0</span>
                <span className="text-xs text-[#A4A494] ml-2 font-mono">
                  {t('pricing.citizenPeriod')}
                </span>
              </div>

              <ul className="space-y-3 text-xs text-[#000000]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Plain-language legal explanations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Statutory search across 10 core Acts</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>FIR rights & Traffic challan guide</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>All 6 Indian languages supported</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/workspace"
                className="w-full py-2.5 px-4 rounded-[100px] text-xs font-normal border border-[#000000] bg-transparent text-[#000000] hover:bg-[#000000] hover:text-[#F6E5D0] transition-colors block text-center"
              >
                {!isPro ? t('pricing.currentPlan') : 'Launch Citizen Workspace'}
              </Link>
            </div>
          </div>

          {/* Plan 2: Pro Legal (Recommended) */}
          <div className="rounded-[4px] p-7 bg-[#ffffff] border-2 border-[#000000] flex flex-col justify-between relative">
            <div className="absolute -top-3 left-6 px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-[0.10em] uppercase bg-[#000000] text-[#ffffff]">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-[0.10em] text-[#000000]">
                  Professional Tier
                </span>
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] uppercase font-bold tracking-[0.10em] bg-[#F6E5D0] text-[#000000] border border-[#A4A494]">
                  Full Precedents
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#000000] mb-2 leading-[1.2]">
                {t('pricing.proPlan')}
              </h2>
              <p className="text-xs text-[#A4A494] mb-6 leading-relaxed">
                {t('pricing.proDesc')}
              </p>

              <div className="mb-6 pb-6 border-b border-[#A4A494]">
                <span className="text-4xl font-normal text-[#000000]">
                  {interval === 'monthly' ? '₹499' : '₹4,999'}
                </span>
                <span className="text-xs text-[#A4A494] ml-2 font-mono">
                  {interval === 'monthly' ? '/ month' : '/ year (simulated)'}
                </span>
              </div>

              <ul className="space-y-3 text-xs text-[#000000]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>30 Landmark Supreme Court judicial decisions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Article 141 constitutional binding holdings</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Formal case citations & ratio decidendi</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Automated contract consistency checker</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>IPC ↔ BNS side-by-side transition matrix</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              {isPro ? (
                <button
                  type="button"
                  onClick={toggleMode}
                  className="w-full py-2.5 px-4 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {user?.mode === 'professional' ? t('pricing.currentPlan') : 'Switch to Professional Mode'}
                  </span>
                </button>
              ) : (
                <Link
                  href={`/checkout?plan=pro_legal&interval=${interval}`}
                  className="w-full py-2.5 px-4 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span>{t('pricing.choosePlan')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Plan 3: Advocate Suite */}
          <div className="rounded-[4px] p-7 bg-[#ffffff] border border-[#A4A494] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                  Advocate Enterprise
                </span>
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] uppercase font-bold tracking-[0.10em] bg-[#F6E5D0] text-[#000000] border border-[#A4A494]">
                  Practicing Bar
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#000000] mb-2 leading-[1.2]">
                {t('pricing.advocatePlan')}
              </h2>
              <p className="text-xs text-[#A4A494] mb-6 leading-relaxed">
                {t('pricing.advocateDesc')}
              </p>

              <div className="mb-6 pb-6 border-b border-[#A4A494]">
                <span className="text-4xl font-normal text-[#000000]">
                  {interval === 'monthly' ? '₹1,499' : '₹14,990'}
                </span>
                <span className="text-xs text-[#A4A494] ml-2 font-mono">
                  {interval === 'monthly' ? '/ month' : '/ year (simulated)'}
                </span>
              </div>

              <ul className="space-y-3 text-xs text-[#000000]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Everything included in Pro Legal</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Lawyer Case Management & CNR tracking</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Hearing diaries & deadline reminders</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Evidence & exhibit indexing vault</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                  <span>Priority case study retrieval engine</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href={`/checkout?plan=advocate_suite&interval=${interval}`}
                className="w-full py-2.5 px-4 rounded-[100px] text-xs font-normal border border-[#000000] bg-transparent text-[#000000] hover:bg-[#000000] hover:text-[#F6E5D0] transition-colors flex items-center justify-center gap-2"
              >
                <span>{t('pricing.choosePlan')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table: Normal vs Professional */}
        <div className="mt-16 rounded-[4px] bg-[#ffffff] border border-[#A4A494] p-6 sm:p-8">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
              Detailed Breakdown
            </span>
            <h3 className="text-2xl font-normal text-[#000000]">
              {t('pricing.comparisonTitle')}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#A4A494] text-[#A4A494] font-mono text-[11px] uppercase tracking-[0.10em]">
                  <th className="py-3 px-4">Feature / Capability</th>
                  <th className="py-3 px-4">Normal Mode (Citizen)</th>
                  <th className="py-3 px-4 text-[#000000] font-bold">Professional Mode (Advocate)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A4A494]">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F6E5D0] transition-colors">
                    <td className="py-3.5 px-4 font-normal text-[#000000]">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-4 text-[#A4A494]">
                      {row.normal}
                    </td>
                    <td className="py-3.5 px-4 text-[#000000] font-bold">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
