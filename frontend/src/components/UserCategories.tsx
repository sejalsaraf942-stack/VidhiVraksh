'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Users, Store, GraduationCap, Check } from 'lucide-react';

export default function UserCategories() {
  const { t } = useLanguage();

  const categories = [
    {
      icon: Users,
      title: t('users.cat1.title'),
      desc: t('users.cat1.desc'),
      items: [
        t('users.cat1.item1'),
        t('users.cat1.item2'),
        t('users.cat1.item3'),
      ],
    },
    {
      icon: Store,
      title: t('users.cat2.title'),
      desc: t('users.cat2.desc'),
      items: [
        t('users.cat2.item1'),
        t('users.cat2.item2'),
        t('users.cat2.item3'),
      ],
    },
    {
      icon: GraduationCap,
      title: t('users.cat3.title'),
      desc: t('users.cat3.desc'),
      items: [
        t('users.cat3.item1'),
        t('users.cat3.item2'),
        t('users.cat3.item3'),
      ],
    },
  ];

  return (
    <section id="users" className="py-20 lg:py-24 border-b border-[#A4A494] bg-[#F6E5D0] relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[4px] text-xs font-bold uppercase tracking-[0.10em] text-[#000000] bg-[#ffffff] border border-[#A4A494]">
            {t('users.tag')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] leading-[1.2] text-[#000000]">
            {t('users.title')}
          </h2>
          <p className="text-[15px] text-[#000000] font-normal leading-[1.5]">
            {t('users.subtitle')}
          </p>
        </div>

        {/* 3 Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="rounded-[4px] p-6 bg-[#ffffff] border border-[#A4A494] hover:border-[#000000] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-center text-[#000000] mb-5">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-bold text-[#000000] mb-2 leading-[1.3]">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-[#000000] leading-[1.5] font-normal mb-6">
                    {cat.desc}
                  </p>

                  <ul className="space-y-2.5 pt-4 border-t border-[#A4A494] text-xs text-[#A4A494]">
                    {cat.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#000000] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
