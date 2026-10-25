'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

interface BrandEmblemProps {
  /** Outer size in pixels, rings included. The logo itself occupies 60% of it. */
  size?: number;
  priority?: boolean;
  className?: string;
}

const RING_TICKS = Array.from({ length: 60 }, (_, i) => i * 6);

/**
 * The round VIDHIVRAKSH logo framed by fine gold "dial" rings with node points,
 * the legal-tech linework used across the brand.
 */
export default function BrandEmblem({ size = 224, priority = false, className = '' }: BrandEmblemProps) {
  const { t } = useLanguage();
  const logo = size * 0.6;
  const point = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    // Rounded so server and client render identical attribute strings (avoids hydration mismatches).
    return { x: Math.round((100 + r * Math.cos(rad)) * 100) / 100, y: Math.round((100 + r * Math.sin(rad)) * 100) / 100 };
  };

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" aria-hidden="true" fill="none">
        <circle cx="100" cy="100" r="66" stroke="#C4A47A" strokeOpacity="0.8" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="81" stroke="#C4A47A" strokeOpacity="0.5" strokeWidth="0.5" strokeDasharray="1 2.5" />
        <circle cx="100" cy="100" r="96" stroke="#A4A494" strokeOpacity="0.45" strokeWidth="0.5" />
        <g stroke="#C4A47A" strokeOpacity="0.55" strokeWidth="0.5">
          {RING_TICKS.map((deg) => {
            const a = point(70, deg);
            const b = point(deg % 30 === 0 ? 74.5 : 72, deg);
            return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>
        {[
          [66, 205, '#C4A47A'],
          [66, 335, '#C4A47A'],
          [81, 120, '#1F3A2E'],
          [81, 280, '#C4A47A'],
          [96, 40, '#1F3A2E'],
        ].map(([r, deg, color]) => {
          const p = point(r as number, deg as number);
          return (
            <g key={`${r}-${deg}`}>
              <circle cx={p.x} cy={p.y} r="1.8" fill={color as string} />
              <circle cx={p.x} cy={p.y} r="3.4" stroke={color as string} strokeOpacity="0.45" strokeWidth="0.5" />
            </g>
          );
        })}
      </svg>
      <div
        className="absolute rounded-full overflow-hidden shadow-[0_8px_24px_-12px_rgba(31,58,46,0.45)]"
        style={{ width: logo, height: logo, left: (size - logo) / 2, top: (size - logo) / 2 }}
      >
        <Image src="/vidhivraksh-emblem.png" alt={`${t('brand.name')} — ${t('app.tagline')}`} fill sizes={`${Math.ceil(logo)}px`} className="object-contain" priority={priority} />
      </div>
    </div>
  );
}
