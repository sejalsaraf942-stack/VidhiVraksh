'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldAlert } from 'lucide-react';

export default function Footer() {
  const { t, supportedLanguages, language, setLanguage } = useLanguage();
  const pathname = usePathname();

  // Do not render footer inside the full-screen interactive workspace
  if (pathname === '/workspace') {
    return null;
  }

  return (
    <footer className="border-t border-[#A4A494] bg-[#F6E5D0] text-[#000000] text-xs py-14">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Prominent Legal Disclaimer Callout: Pure White card with 4px radius */}
        <div className="rounded-[4px] p-5 mb-12 bg-[#ffffff] border border-[#A4A494] flex items-start gap-3.5 text-[#000000] text-xs">
          <ShieldAlert className="w-5 h-5 text-[#1F3A2E] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-[#1F3A2E] uppercase tracking-[0.10em] text-[11px] block sm:inline sm:mr-2">
              {t('common.disclaimerTitle')}:
            </span>
            {t('footer.disclaimerNotice')}
          </div>
        </div>

        {/* 4-Column Grid: Brand + 3 Link Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#A4A494]">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#C4A47A]/70">
                <Image
                  src="/vidhivraksh-emblem.png"
                  alt="VIDHIVRAKSH Emblem"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-bold text-[#1F3A2E] tracking-tight">
                VIDHIVRAKSH
              </span>
            </Link>
            <p className="text-xs text-[#A4A494] leading-relaxed font-normal">
              {t('footer.desc')}
            </p>
          </div>

          {/* Column 1: Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.10em] text-[#000000]">
              {t('footer.col.features')}
            </h4>
            <ul className="space-y-2 text-xs text-[#A4A494]">
              <li>
                <Link href="/documents" className="hover:text-[#000000] transition-colors">
                  {t('footer.link.bnsExplorer')}
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-[#000000] transition-colors">
                  {t('footer.link.contractExplainer')}
                </Link>
              </li>
              <li>
                <Link href="/workspace" className="hover:text-[#000000] transition-colors">
                  {t('footer.link.firGuide')}
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-[#000000] transition-colors">
                  {t('footer.link.docLibrary')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.10em] text-[#000000]">
              {t('footer.col.resources')}
            </h4>
            <ul className="space-y-2 text-xs text-[#A4A494]">
              <li>
                <Link href="/#about" className="hover:text-[#000000] transition-colors">
                  {t('footer.link.about')}
                </Link>
              </li>
              <li>
                <Link href="/#workflow" className="hover:text-[#000000] transition-colors">
                  {t('nav.workflow')}
                </Link>
              </li>
              <li>
                <Link href="/#modes" className="hover:text-[#000000] transition-colors">
                  {t('nav.modes')}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#000000] transition-colors">
                  {t('nav.faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Privacy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.10em] text-[#000000]">
              {t('footer.col.legal')}
            </h4>
            <ul className="space-y-2 text-xs text-[#A4A494]">
              <li>
                <Link href="/#faq" className="hover:text-[#000000] transition-colors">
                  {t('footer.link.terms')}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#000000] transition-colors">
                  {t('footer.link.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-[#000000] transition-colors">
                  {t('footer.link.disclaimer')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Language Selection Row */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#A4A494]">
          <span className="text-xs text-[#A4A494]">
            {t('footer.languagesSupported')}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1 rounded-[100px] text-[11px] transition-colors ${
                  language === lang.code
                    ? 'bg-[#000000] text-[#ffffff] font-bold border border-[#000000]'
                    : 'text-[#000000] hover:border-[#000000] bg-[#ffffff] border border-[#A4A494]'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 text-center text-[#A4A494] text-[11px]">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
