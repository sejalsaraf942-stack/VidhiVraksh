'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, AlertTriangle, X, Check, Send, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export interface WarningData {
  warning_id: string;
  warning_number: number;
  max_warnings: number;
  rule_id: string;
  reason: string;
  is_suspended: boolean;
}

interface SafetyWarningModalProps {
  isOpen: boolean;
  warning: WarningData | null;
  onClose: () => void;
  onStartNewChat?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

export default function SafetyWarningModal({
  isOpen,
  warning,
  onClose,
  onStartNewChat,
}: SafetyWarningModalProps) {
  const { t } = useLanguage();
  const { token } = useAuth();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!isOpen || !warning) return null;

  const isSuspended = warning.is_suspended || warning.warning_number >= 3;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewReason.trim() || !token) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/safety/review-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          warning_id: warning.warning_id,
          reason: reviewReason.trim(),
        }),
      });
      if (res.ok) {
        setReviewSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to submit warning review request:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#000000]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#ffffff] border border-[#000000] rounded-[4px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isSuspended
            ? 'bg-[#F6E5D0] border-[#000000]'
            : 'bg-[#F6E5D0] border-[#A4A494]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-[4px] ${
              isSuspended
                ? 'bg-[#1F3A2E] border border-[#1F3A2E] text-[#C4A47A]'
                : 'bg-[#ffffff] border border-[#A4A494] text-[#000000]'
            }`}>
              {isSuspended ? <Lock className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <span className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono uppercase tracking-[0.10em] border ${
                isSuspended
                  ? 'bg-[#1F3A2E] text-[#F6E5D0] border-[#1F3A2E]'
                  : 'bg-[#ffffff] text-[#000000] border-[#A4A494]'
              }`}>
                {isSuspended
                  ? t('safety.accountSuspendedBadge')
                  : t('safety.warningBadge')
                      .replace('{number}', String(warning.warning_number))
                      .replace('{max}', String(warning.max_warnings || 3))}
              </span>
              <h2 className="text-lg font-bold text-[#000000] mt-1">
                {t('safety.warningModalTitle')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#A4A494] hover:text-[#000000] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-[#000000]">
          {/* Reason Card */}
          <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
              <span>{t('safety.ruleLabel')}</span>
              <span className="text-[#000000] font-bold">{warning.rule_id}</span>
            </div>
            <p className="text-[#000000] text-xs leading-relaxed">
              {warning.reason}
            </p>
          </div>

          {/* Policy Consequence Explanation */}
          <div className={`p-4 rounded-[4px] border ${
            isSuspended
              ? 'bg-[#ffffff] border-[#000000] text-[#000000]'
              : warning.warning_number === 2
              ? 'bg-[#ffffff] border-[#C4A47A] text-[#000000]'
              : 'bg-[#F6E5D0] border-[#A4A494] text-[#000000]'
          }`}>
            <p className="text-xs leading-relaxed font-medium">
              {isSuspended
                ? t('safety.consequence3')
                : warning.warning_number === 2
                ? t('safety.consequence2')
                : t('safety.consequence1')}
            </p>
          </div>

          {/* Chat Terminated Note */}
          <div className="flex items-start gap-2.5 text-xs text-[#000000]">
            <AlertTriangle className="w-4 h-4 text-[#C4A47A] flex-shrink-0 mt-0.5" />
            <p>{t('safety.chatTerminatedDesc')}</p>
          </div>

          {/* Dispute / Review Request Expandable */}
          <div className="pt-2 border-t border-[#A4A494]">
            {!reviewSubmitted ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="w-full py-2 text-xs text-[#A4A494] hover:text-[#000000] flex items-center justify-between transition-colors"
                >
                  <span>{t('safety.reviewPrompt')}</span>
                  <span className="flex items-center gap-1 font-bold text-[#000000]">
                    {t('safety.reviewBtn')}
                    {showReviewForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>

                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="mt-2 space-y-2.5">
                    <textarea
                      rows={3}
                      required
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      placeholder={t('safety.reviewReasonPlaceholder')}
                      className="w-full p-3 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs placeholder-[#A4A494] focus:outline-none focus:border-[#000000]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !reviewReason.trim()}
                        className="px-4 py-1.5 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSubmittingReview ? t('safety.reviewSubmitting') : t('safety.submitReviewBtn')}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-[4px] bg-[#ffffff] border border-[#1F3A2E] text-[#1F3A2E] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1F3A2E]" />
                <span>{t('safety.reviewSubmittedSuccess')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-[#A4A494] bg-[#F6E5D0] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          {!isSuspended && onStartNewChat && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartNewChat();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-[100px] text-xs font-normal bg-[#ffffff] border border-[#A4A494] text-[#000000] hover:border-[#000000] transition-colors"
            >
              {t('safety.startNewChat')}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-5 py-2 rounded-[100px] text-xs font-bold transition-colors ${
              isSuspended
                ? 'bg-[#1F3A2E] hover:bg-[#000000] text-[#F6E5D0] border border-[#1F3A2E]'
                : 'border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000]'
            }`}
          >
            {t('safety.acknowledgeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
