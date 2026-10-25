'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  User,
  Shield,
  Layers,
  Sparkles,
  LogOut,
  MessageSquare,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationItem {
  id: string;
  title: string;
  language: string;
  mode: string;
  created_at: string;
}

interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { t } = useLanguage();
  const { user, token, signOut, toggleMode } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;

    setLoadingData(true);
    Promise.all([
      fetch(`${API_URL}/api/v1/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/api/v1/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([convs, docs]) => {
        setConversations(convs);
        setDocuments(docs);
      })
      .catch(() => {
        // Fallback
      })
      .finally(() => setLoadingData(false));
  }, [isOpen, token]);

  if (!isOpen || !user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-[4px] bg-[#ffffff] border border-[#000000] p-6 sm:p-8 text-left max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-5 right-5 p-1.5 rounded-[4px] bg-[#F6E5D0] text-[#000000] hover:bg-[#000000] hover:text-[#ffffff] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#A4A494]">
          <div className="w-14 h-14 rounded-[4px] bg-[#000000] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 id="profile-modal-title" className="text-xl font-bold text-[#000000]">
              {user.name}
            </h3>
            <p className="text-xs text-[#A4A494] font-mono">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono uppercase tracking-[0.10em] bg-[#F6E5D0] text-[#000000] border border-[#A4A494]">
                {user.role}
              </span>
              <span className="text-xs text-[#A4A494]">•</span>
              <span className="text-xs text-[#000000] font-mono">
                {user.subscription === 'professional' ? t('profile.proPlan') : t('profile.freePlan')}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Switcher Banner */}
        <div className="rounded-[4px] p-4 bg-[#F6E5D0] border border-[#A4A494] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-[#ffffff] border border-[#A4A494] flex items-center justify-center text-[#000000] shrink-0">
              <Layers className="w-4 h-4 text-[#000000]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.10em] text-[#A4A494] block">
                {t('profile.mode')}
              </span>
              <span className="text-sm font-bold text-[#000000]">
                {user.mode === 'professional' ? t('profile.modePro') : t('profile.modeNormal')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleMode}
            className="px-4 py-2 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#ffffff] text-[#000000] hover:bg-[#000000] hover:text-[#ffffff] transition-colors text-center"
          >
            {user.mode === 'professional' ? t('profile.switchToNormal') : t('profile.switchToPro')}
          </button>
        </div>

        {/* Tab Content: Saved Conversations & Documents */}
        <div className="space-y-6">
          {/* Saved Consultations */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono uppercase tracking-[0.10em] text-[#A4A494] flex items-center gap-1.5 font-bold">
                <MessageSquare className="w-3.5 h-3.5 text-[#000000]" />
                {t('profile.history')}
              </span>
              <span className="text-xs text-[#A4A494] font-mono">
                ({conversations.length})
              </span>
            </div>

            {conversations.length > 0 ? (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-between text-xs hover:border-[#000000] transition-colors"
                  >
                    <div>
                      <span className="font-bold text-[#000000] block">{c.title}</span>
                      <span className="text-[10px] text-[#A4A494] font-mono">
                        {c.mode} • {c.language.toUpperCase()}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A4A494]" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A4A494] p-3 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494]">
                {t('profile.noHistory')}
              </p>
            )}
          </div>

          {/* Uploaded Documents */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono uppercase tracking-[0.10em] text-[#A4A494] flex items-center gap-1.5 font-bold">
                <FileText className="w-3.5 h-3.5 text-[#000000]" />
                {t('profile.documents')}
              </span>
              <span className="text-xs text-[#A4A494] font-mono">
                ({documents.length})
              </span>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-between text-xs hover:border-[#000000] transition-colors"
                  >
                    <div>
                      <span className="font-bold text-[#000000] block">{d.filename}</span>
                      <span className="text-[10px] text-[#A4A494] font-mono">
                        {Math.round(d.file_size / 1024)} KB • {d.file_type}
                      </span>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1F3A2E]" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A4A494] p-3 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494]">
                {t('profile.noDocuments')}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer / Sign Out */}
        <div className="mt-8 pt-6 border-t border-[#A4A494] flex items-center justify-between">
          <button
            type="button"
            onClick={async () => {
              await signOut();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-[100px] text-xs font-bold text-red-800 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('auth.signout')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-[100px] text-xs font-bold bg-[#000000] text-[#ffffff] border border-[#000000] hover:bg-transparent hover:text-[#000000] transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
