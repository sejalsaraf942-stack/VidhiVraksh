'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage, supportedLanguages, currentLanguageInfo, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('nav.languageSelect')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal rounded-[4px] border border-[#A4A494] bg-[#ffffff] text-[#000000] hover:border-[#000000] transition-colors focus:outline-none"
      >
        <Globe className="w-3.5 h-3.5 text-[#A4A494] shrink-0" />
        <span className="font-normal text-[#000000]">{currentLanguageInfo.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#A4A494] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('nav.languageSelect')}
          className="absolute right-0 mt-1 w-48 rounded-[4px] bg-[#ffffff] border border-[#A4A494] shadow-sm py-1 z-50 animate-in fade-in duration-100"
        >
          <div className="px-3 py-1.5 border-b border-[#A4A494] text-[11px] font-bold tracking-[0.10em] uppercase text-[#A4A494]">
            {t('nav.languageSelect')}
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#F6E5D0] text-[#000000] font-bold'
                    : 'text-[#000000] hover:bg-[#F6E5D0]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[13px]">{lang.nativeName}</span>
                  <span className="text-[11px] text-[#A4A494]">{lang.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#000000]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
