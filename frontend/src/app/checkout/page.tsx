'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Lock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

function CheckoutContent() {
  const { t } = useLanguage();
  const { user, token, isAuthenticated, openAuthModal, setUserProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId = searchParams.get('plan') || 'pro_legal';
  const interval = searchParams.get('interval') || 'monthly';

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'netbanking' | 'card'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Plan metadata
  const planInfo = {
    pro_legal: {
      name: t('pricing.proPlan'),
      priceMonthly: 499,
      priceYearly: 4999,
      features: [
        '30 Landmark Supreme Court Judgments with Ratio Decidendi',
        'Article 141 Binding Constitutional Precedent Citations',
        'IPC ↔ BNS Comparative Transition Matrix',
        'Automated Contract Consistency Checker',
      ],
    },
    advocate_suite: {
      name: t('pricing.advocatePlan'),
      priceMonthly: 1499,
      priceYearly: 14990,
      features: [
        'All Pro Legal Capabilities',
        'Lawyer Case Management & CNR Registry',
        'Court Hearing Diaries & Task Deadlines',
        'Evidence & Exhibit Vault',
      ],
    },
  }[planId] || {
    name: t('pricing.proPlan'),
    priceMonthly: 499,
    priceYearly: 4999,
    features: ['30 Landmark Supreme Court Judgments with Ratio Decidendi'],
  };

  const amount = interval === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly;

  const handleCompletePurchase = async () => {
    if (!isAuthenticated || !token) {
      openAuthModal();
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_interval: interval,
          payment_method: paymentMethod,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Checkout failed');
      }

      const data = await res.json();
      if (data.user) {
        setUserProfile(data.user);
      }
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to complete simulated purchase');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F6E5D0] text-[#000000] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-[4px] bg-[#ffffff] border border-[#000000] p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-[#F6E5D0] border border-[#000000] flex items-center justify-center mx-auto text-[#000000]">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#000000]">
              {t('checkout.successTitle')}
            </h2>
            <p className="text-sm text-[#000000] leading-relaxed">
              {t('checkout.successDesc')}
            </p>
          </div>

          <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-left text-xs font-mono space-y-2">
            <div className="flex justify-between text-[#A4A494]">
              <span>Plan:</span>
              <span className="text-[#000000] font-bold">{planInfo.name}</span>
            </div>
            <div className="flex justify-between text-[#A4A494]">
              <span>Billing Cycle:</span>
              <span className="text-[#000000] capitalize">{interval}</span>
            </div>
            <div className="flex justify-between text-[#A4A494]">
              <span>Demonstration Amount:</span>
              <span className="text-[#000000] font-bold">₹{amount.toLocaleString('en-IN')} (Simulated)</span>
            </div>
            <div className="flex justify-between text-[#A4A494]">
              <span>Status:</span>
              <span className="text-[#000000] font-bold">ACTIVE (Professional Mode)</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/workspace"
              className="flex-1 py-2.5 px-4 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>{t('checkout.enterWorkspace')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/case-management"
              className="py-2.5 px-4 rounded-[100px] text-xs font-normal border border-[#A4A494] bg-[#ffffff] text-[#000000] hover:border-[#000000] transition-colors text-center"
            >
              Case Management
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6E5D0] text-[#000000] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb / Back */}
        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.10em] text-[#A4A494] hover:text-[#000000] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('checkout.cancelBtn')}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-normal tracking-[-0.02em] text-[#000000]">
            {t('checkout.title')}
          </h1>
          <p className="text-sm text-[#000000]">
            {t('checkout.subtitle')}
          </p>
        </div>

        {/* Prototype Warning Banner */}
        <div className="p-4 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#000000] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-[0.10em] block text-[#000000] mb-0.5 text-xs">
              Zero Payment Guarantee
            </span>
            <span>{t('checkout.disclaimer')}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-[4px] bg-[#ffffff] border border-[#000000] text-[#000000] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Simulated Payment Channel Selection */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-[4px] p-6 bg-[#ffffff] border border-[#A4A494] space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                {t('checkout.paymentMethod')}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* UPI Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-[4px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'upi'
                      ? 'bg-[#F6E5D0] border-[#000000] font-bold'
                      : 'bg-[#ffffff] border-[#A4A494] hover:border-[#000000]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <QrCode className="w-5 h-5 text-[#000000]" />
                    <span className="text-[10px] font-mono text-[#A4A494]">Simulated</span>
                  </div>
                  <span className="text-xs font-bold text-[#000000] block">
                    {t('checkout.methodUpi')}
                  </span>
                  <span className="text-[11px] text-[#A4A494] mt-1">
                    demo@vidhivraksh
                  </span>
                </button>

                {/* Net Banking Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-4 rounded-[4px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'netbanking'
                      ? 'bg-[#F6E5D0] border-[#000000] font-bold'
                      : 'bg-[#ffffff] border-[#A4A494] hover:border-[#000000]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Building className="w-5 h-5 text-[#000000]" />
                    <span className="text-[10px] font-mono text-[#A4A494]">Simulated</span>
                  </div>
                  <span className="text-xs font-bold text-[#000000] block">
                    {t('checkout.methodNetbanking')}
                  </span>
                  <span className="text-[11px] text-[#A4A494] mt-1">
                    Demo National Bank
                  </span>
                </button>

                {/* Card Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-[4px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'card'
                      ? 'bg-[#F6E5D0] border-[#000000] font-bold'
                      : 'bg-[#ffffff] border-[#A4A494] hover:border-[#000000]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <CreditCard className="w-5 h-5 text-[#000000]" />
                    <span className="text-[10px] font-mono text-[#A4A494]">Simulated</span>
                  </div>
                  <span className="text-xs font-bold text-[#000000] block">
                    {t('checkout.methodCard')}
                  </span>
                  <span className="text-[11px] text-[#A4A494] mt-1">
                    •••• 4242 (Test)
                  </span>
                </button>
              </div>

              {/* Inset Note */}
              <div className="p-3.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-xs space-y-1">
                <div className="flex items-center gap-2 text-[#000000] font-bold uppercase tracking-[0.05em]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sandbox Environment — No Real Information Required</span>
                </div>
                <p className="text-[#A4A494] text-[11px] leading-relaxed">
                  This checkout is entirely local. Clicking the button below confirms your simulated purchase, logs a demo entitlement transaction in your local database, and switches your profile into Professional Mode immediately.
                </p>
              </div>
            </div>

            {/* Included Capabilities */}
            <div className="rounded-[4px] p-6 bg-[#ffffff] border border-[#A4A494] space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494] block">
                Entitlement Capabilities
              </span>
              <ul className="space-y-2 text-xs text-[#000000]">
                {planInfo.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#000000] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <div className="rounded-[4px] p-6 bg-[#ffffff] border border-[#A4A494] space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                {t('checkout.orderSummary')}
              </h2>

              <div className="space-y-3 pb-4 border-b border-[#A4A494] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A4A494]">{t('checkout.selectedPlan')}</span>
                  <span className="text-[#000000] font-bold">{planInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A4A494]">{t('checkout.billingInterval')}</span>
                  <span className="text-[#000000] capitalize">{interval}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A4A494]">Demo Subtotal</span>
                  <span className="text-[#000000]">₹{amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A4A494]">GST / Tax (Demo)</span>
                  <span className="text-[#000000]">₹0 (Simulated)</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs uppercase font-bold tracking-[0.10em] text-[#A4A494]">
                  {t('checkout.amountDue')}
                </span>
                <div className="text-right">
                  <div className="text-3xl font-normal text-[#000000]">
                    ₹{amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#A4A494] font-mono">
                    Zero Real Currency Charged
                  </div>
                </div>
              </div>

              <div className="pt-4">
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="w-full py-2.5 px-4 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In to Activate Entitlement</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompletePurchase}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('checkout.processing')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('checkout.completeBtn')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F6E5D0] text-[#000000] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#000000] animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
