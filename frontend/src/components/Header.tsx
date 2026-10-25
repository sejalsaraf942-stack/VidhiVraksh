'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import LanguageSelector from './LanguageSelector';
import UserProfileModal from './UserProfileModal';
import {
  Menu,
  X,
  Sparkles,
  BookOpen,
  MapPin,
  Briefcase,
  ChevronDown,
  Layers,
  LogIn,
  LogOut,
  Tag,
  ArrowRight,
} from 'lucide-react';

export default function Header() {
  const { t } = useLanguage();
  const { user, isAuthenticated, openAuthModal, signOut, toggleMode } = useAuth();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // The 4 workspace options under the single "VIDHIVRAKSH WORKSPACE" dropdown
  const workspaceOptions = [
    {
      href: '/workspace',
      labelKey: 'nav.dropdownWorkspace',
      icon: Sparkles,
      descKey: 'app.subtagline',
    },
    {
      href: '/documents',
      labelKey: 'nav.library',
      icon: BookOpen,
      descKey: 'features.item6.title',
    },
    {
      href: '/land-research',
      labelKey: 'nav.landResearch',
      icon: MapPin,
      descKey: 'features.item8.title',
    },
    {
      href: '/case-management',
      labelKey: 'nav.caseManagement',
      icon: Briefcase,
      descKey: 'features.item10.title',
    },
  ];

  const isWorkspaceActive = workspaceOptions.some((opt) => pathname === opt.href);

  // Debounced desktop hover handlers to prevent jitter
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setWorkspaceDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setWorkspaceDropdownOpen(false);
    }, 200);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setWorkspaceDropdownOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setWorkspaceDropdownOpen((prev) => !prev);
    }
  };

  // Full-screen interactive consultation workspace manages its own unified top bar & sidebar
  if (pathname === '/workspace') {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#F6E5D0] border-b border-[#A4A494]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* 1. Left Cluster: Brand Logo Lockup */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-1 ring-[#C4A47A]/70 flex-shrink-0">
                <Image
                  src="/vidhivraksh-emblem.png"
                  alt="VIDHIVRAKSH Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#1F3A2E]">
                  VIDHIVRAKSH
                </span>
                <span className="text-[10px] text-[#000000]/70 tracking-[0.10em] uppercase hidden sm:block">
                  {t('app.subtagline')}
                </span>
              </div>
            </Link>

            {/* Vertical Hairline Divider */}
            <div className="hidden lg:block h-5 w-[1px] bg-[#A4A494]" />

            {/* 2. Middle Cluster: Desktop Navigation (Dropdown + Pricing) */}
            <nav className="hidden lg:flex items-center gap-4 text-xs sm:text-sm text-[#000000]" aria-label="Main Navigation">
              
              {/* Single VIDHIVRAKSH WORKSPACE Navigation Item with Dropdown */}
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  id="workspace-dropdown-trigger"
                  aria-haspopup="true"
                  aria-expanded={workspaceDropdownOpen}
                  aria-controls="workspace-dropdown-menu"
                  onClick={() => setWorkspaceDropdownOpen((prev) => !prev)}
                  onKeyDown={handleKeyDown}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-[4px] border transition-colors cursor-pointer text-xs uppercase tracking-[0.10em] ${
                    isWorkspaceActive || workspaceDropdownOpen
                      ? 'bg-[#ffffff] border-[#A4A494] text-[#000000] font-bold'
                      : 'border-transparent hover:border-[#A4A494] text-[#000000]'
                  }`}
                >
                  <span>{t('nav.workspaceDropdown')}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#A4A494] transition-transform duration-200 ${
                      workspaceDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {workspaceDropdownOpen && (
                  <div
                    id="workspace-dropdown-menu"
                    role="menu"
                    aria-labelledby="workspace-dropdown-trigger"
                    className="absolute left-0 mt-1 w-72 rounded-[4px] bg-[#ffffff] border border-[#A4A494] shadow-sm p-1.5 z-50 animate-in fade-in duration-100"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-[0.10em] uppercase text-[#A4A494] border-b border-[#A4A494] mb-1">
                      {t('nav.workspaceDropdown')}
                    </div>
                    {workspaceOptions.map((opt) => {
                      const IconComp = opt.icon;
                      const isActive = pathname === opt.href;
                      return (
                        <Link
                          key={opt.href}
                          href={opt.href}
                          role="menuitem"
                          onClick={() => setWorkspaceDropdownOpen(false)}
                          className={`flex items-start gap-2.5 p-2 rounded-[4px] transition-colors ${
                            isActive
                              ? 'bg-[#F6E5D0] text-[#000000] font-bold'
                              : 'hover:bg-[#F6E5D0] text-[#000000]'
                          }`}
                        >
                          <div className="p-1.5 rounded-[4px] shrink-0 mt-0.5 bg-[#F6E5D0] text-[#000000]">
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs uppercase tracking-[0.05em]">
                              {t(opt.labelKey)}
                            </span>
                            <span className="text-[11px] text-[#A4A494] truncate mt-0.5">
                              {t(opt.descKey)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pricing Nav Link */}
              <Link
                href="/pricing"
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-[4px] border transition-colors text-xs uppercase tracking-[0.10em] whitespace-nowrap ${
                  pathname === '/pricing'
                    ? 'bg-[#ffffff] border-[#A4A494] text-[#000000] font-bold'
                    : 'border-transparent hover:border-[#A4A494] text-[#000000]'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-[#A4A494] shrink-0" />
                <span>{t('nav.pricing')}</span>
              </Link>
            </nav>
          </div>

          {/* 3. Right Cluster: Controls & Pill CTA */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Vertical Hairline Separator */}
            <div className="h-5 w-[1px] bg-[#A4A494]" />

            {/* Authenticated User / Sign In Pill */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* Mode Switcher Pill */}
                <button
                  type="button"
                  onClick={toggleMode}
                  title={user.mode === 'professional' ? t('profile.switchToNormal') : t('profile.switchToPro')}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-[100px] text-xs border border-[#A4A494] bg-[#ffffff] text-[#000000] hover:border-[#000000] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#A4A494]" />
                  <span className="font-bold uppercase tracking-[0.05em]">
                    {user.mode === 'professional' ? t('profile.modePro') : t('profile.modeNormal')}
                  </span>
                </button>

                {/* Profile Button */}
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[100px] bg-[#ffffff] border border-[#A4A494] hover:border-[#000000] text-xs text-[#000000] transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-[#000000] text-[#ffffff] font-bold text-[10px] flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] xl:max-w-[120px] truncate font-normal">{user.name}</span>
                  <span className="px-1 py-0.5 rounded-[4px] text-[10px] uppercase font-bold tracking-[0.05em] bg-[#F6E5D0] text-[#A4A494] hidden md:inline">
                    {user.role}
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[100px] text-xs font-normal border border-[#000000] text-[#000000] bg-transparent hover:bg-[#000000] hover:text-[#F6E5D0] transition-colors whitespace-nowrap cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('auth.signin')}</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t('nav.mobileMenu')}
              className="p-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] hover:border-[#000000] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-[#000000]" /> : <Menu className="w-4 h-4 text-[#000000]" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#A4A494] bg-[#F6E5D0] px-5 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
            {/* VIDHIVRAKSH WORKSPACE Group */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#A4A494] px-2 block mb-1">
                {t('nav.workspaceDropdown')}
              </span>
              <div className="grid grid-cols-1 gap-1">
                {workspaceOptions.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-[4px] text-xs font-normal transition-colors flex items-center justify-between border ${
                        isActive
                          ? 'bg-[#ffffff] text-[#000000] font-bold border-[#A4A494]'
                          : 'text-[#000000] hover:bg-[#ffffff] border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <IconComponent className="w-3.5 h-3.5 text-[#000000]" />
                        <span className="uppercase tracking-[0.05em]">{t(item.labelKey)}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#A4A494]" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="pt-2 border-t border-[#A4A494]">
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-[4px] text-xs text-[#000000] hover:bg-[#ffffff] transition-colors flex items-center gap-2"
              >
                <Tag className="w-3.5 h-3.5 text-[#000000]" />
                <span className="uppercase tracking-[0.05em]">{t('nav.pricing')}</span>
              </Link>
            </div>

            {/* Account Controls on Mobile */}
            <div className="pt-3 border-t border-[#A4A494]">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-[4px] bg-[#ffffff] border border-[#A4A494] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#000000] block">{user.name}</span>
                      <span className="text-[11px] text-[#A4A494]">
                        {user.role.toUpperCase()} • {user.mode === 'professional' ? t('profile.modePro') : t('profile.modeNormal')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="px-2 py-1 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-[11px]"
                      >
                        {user.mode === 'professional' ? 'Normal' : 'Pro'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-[4px] bg-[#000000] text-[#ffffff] text-[11px]"
                      >
                        {t('profile.title')}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 rounded-[4px] text-center text-xs text-[#000000] border border-[#A4A494] hover:border-[#000000] bg-[#ffffff] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#A4A494]" />
                    <span>{t('auth.signout')}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal();
                  }}
                  className="w-full py-2.5 rounded-[100px] text-center text-xs font-normal border border-[#000000] text-[#000000] bg-transparent hover:bg-[#000000] hover:text-[#F6E5D0] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('auth.signin')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
