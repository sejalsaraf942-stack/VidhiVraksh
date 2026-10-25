'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function AuthModal() {
  const { t, language } = useLanguage();
  const { isAuthModalOpen, closeAuthModal, signUp, login } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'citizen' | 'business'>('citizen');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    closeAuthModal();
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  // 1. Submit Sign-Up Form
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError(t('auth.errorGeneral'));
      return;
    }

    if (!password || password.length === 0) {
      setError(t('auth.errorPasswordShort'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errorPasswordShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await signUp({
        email: trimmedEmail,
        password,
        confirm_password: confirmPassword,
        name: name.trim() || undefined,
        role,
        language,
        remember_me: rememberMe,
      });
      setSuccessMsg(t('auth.successSignup'));
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err: any) {
      const msg = err.message || t('auth.errorGeneral');
      // Enforce exact duplicate registration message
      if (msg.includes('USER ALREADY EXISTS') || msg === 'USER ALREADY EXISTS' || msg.includes('USER ALREDY EXISTS')) {
        setError('USER ALREADY EXISTS');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Login Form
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError(t('auth.errorEmptyFields'));
      return;
    }

    setLoading(true);
    try {
      await login({
        email: trimmedEmail,
        password,
        remember_me: rememberMe,
      });
      setSuccessMsg(t('auth.successLogin'));
      setTimeout(() => {
        handleClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || t('auth.errorInvalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Quick Demo Logins for Testing
  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await login({
        email: demoEmail,
        password: demoPass,
        remember_me: true,
      });
      setSuccessMsg(t('auth.successLogin'));
      setTimeout(() => {
        handleClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || t('auth.errorInvalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-[4px] bg-[#ffffff] border border-[#000000] p-6 sm:p-8 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label={t('common.close')}
          className="absolute top-5 right-5 p-1.5 rounded-[4px] bg-[#F6E5D0] text-[#000000] hover:bg-[#000000] hover:text-[#ffffff] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs font-mono uppercase tracking-[0.10em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#000000]" />
            <span>VIDHIVRAKSH Security</span>
          </div>

          <div className="flex border-b border-[#A4A494] mb-4">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-[0.05em] transition-colors cursor-pointer border-b-2 ${
                mode === 'login'
                  ? 'border-[#000000] text-[#000000]'
                  : 'border-transparent text-[#A4A494] hover:text-[#000000]'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-[0.05em] transition-colors cursor-pointer border-b-2 ${
                mode === 'signup'
                  ? 'border-[#000000] text-[#000000]'
                  : 'border-transparent text-[#A4A494] hover:text-[#000000]'
              }`}
            >
              {t('auth.signup')}
            </button>
          </div>

          <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-bold text-[#000000]">
            {mode === 'login' ? t('auth.modalLoginTitle') : t('auth.modalSignupTitle')}
          </h3>
          <p className="text-xs text-[#A4A494] mt-1 leading-relaxed">
            {mode === 'login' ? t('auth.modalLoginSubtitle') : t('auth.modalSignupSubtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-[4px] bg-[#ffffff] border border-[#000000] text-[#000000] text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#000000] shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-[4px] bg-[#ffffff] border border-[#1F3A2E] text-[#1F3A2E] text-xs flex items-start gap-2.5 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-[#1F3A2E] shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- LOG IN FORM --- */}
        {mode === 'login' ? (
          <div>
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs uppercase tracking-[0.10em] text-[#A4A494] mb-1">
                  {t('auth.emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#A4A494]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] focus:border-[#000000] text-xs text-[#000000] placeholder-[#A4A494] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.10em] text-[#A4A494] mb-1">
                  {t('auth.passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#A4A494]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] focus:border-[#000000] text-xs text-[#000000] placeholder-[#A4A494] outline-none transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#000000] py-0.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-[2px] border-[#A4A494] text-[#000000] accent-[#000000] cursor-pointer"
                />
                <span>{t('auth.rememberMe')}</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? '...' : t('auth.btnLogin')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-xs text-[#000000] hover:underline transition-colors"
                >
                  {t('auth.switchToSignup')}
                </button>
              </div>
            </form>

            {/* Quick Demo Logins */}
            <div className="mt-5 pt-4 border-t border-[#A4A494]">
              <span className="text-[10px] font-mono uppercase tracking-[0.10em] text-[#A4A494] block mb-2">
                {t('auth.quickDemo')}
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('aarav@example.test', 'DemoPass123!')}
                  className="w-full py-2 px-3 rounded-[4px] text-xs text-left bg-[#F6E5D0] hover:border-[#000000] border border-[#A4A494] text-[#000000] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{t('auth.demoCitizen')}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#000000]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('priya.law@example.test', 'DemoPass123!')}
                  className="w-full py-2 px-3 rounded-[4px] text-xs text-left bg-[#F6E5D0] hover:border-[#000000] border border-[#A4A494] text-[#000000] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{t('auth.demoLawyer')}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#000000]" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* --- SIGN UP FORM --- */
          <div>
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-[0.10em] text-[#A4A494] mb-1">
                  {t('auth.emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#A4A494]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] focus:border-[#000000] text-xs text-[#000000] placeholder-[#A4A494] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs uppercase tracking-[0.10em] text-[#A4A494] mb-1">
                    {t('auth.passwordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#A4A494]" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                      className="w-full pl-10 pr-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] focus:border-[#000000] text-xs text-[#000000] placeholder-[#A4A494] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.10em] text-[#A4A494] mb-1">
                    {t('auth.confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#A4A494]" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      className="w-full pl-10 pr-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] focus:border-[#000000] text-xs text-[#000000] placeholder-[#A4A494] outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.10em] text-[#A4A494] mb-1">
                  {t('auth.nameOptionalLabel')}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-[#A4A494]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.namePlaceholder')}
                    className="w-full pl-10 pr-4 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] focus:border-[#000000] text-xs text-[#000000] placeholder-[#A4A494] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.10em] text-[#A4A494] mb-1">
                  {t('auth.roleLabel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`py-2 px-3 rounded-[4px] text-xs font-medium border text-center transition-colors cursor-pointer ${
                      role === 'citizen'
                        ? 'bg-[#000000] border-[#000000] text-[#ffffff] font-bold'
                        : 'bg-[#F6E5D0] border-[#A4A494] text-[#000000] hover:border-[#000000]'
                    }`}
                  >
                    {t('auth.roleCitizen')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('business')}
                    className={`py-2 px-3 rounded-[4px] text-xs font-medium border text-center transition-colors cursor-pointer ${
                      role === 'business'
                        ? 'bg-[#000000] border-[#000000] text-[#ffffff] font-bold'
                        : 'bg-[#F6E5D0] border-[#A4A494] text-[#000000] hover:border-[#000000]'
                    }`}
                  >
                    {t('auth.roleBusiness')}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#000000] py-0.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-[2px] border-[#A4A494] text-[#000000] accent-[#000000] cursor-pointer"
                />
                <span>{t('auth.rememberMe')}</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? '...' : t('auth.btnSignup')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs text-[#000000] hover:underline transition-colors"
                >
                  {t('auth.switchToLogin')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
