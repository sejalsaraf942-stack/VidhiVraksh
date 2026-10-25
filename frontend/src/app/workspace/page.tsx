'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';
import BrandEmblem from '@/components/BrandEmblem';
import LegalResearchTrace from '@/components/LegalResearchTrace';
import LegalSourceCard from '@/components/LegalSourceCard';
import type { LegalSource, ResearchTrace, TraceFailureReason } from '@/types/research';
import UserProfileModal from '@/components/UserProfileModal';
import SafetyWarningModal, { WarningData } from '@/components/SafetyWarningModal';
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Menu,
  Shield,
  Layers,
  Sparkles,
  ArrowLeft,
  Copy,
  CheckCheck,
  AlertCircle,
  HelpCircle,
  Scale,
  BookOpen,
  LogIn,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: string;
  mode?: string;
  sources?: LegalSource[];
  limitations?: string;
  created_at?: string;
  /** Research steps the server performed for this reply. */
  trace?: ResearchTrace | null;
  /** Set on a client-side error reply whose request never completed. */
  failureReason?: TraceFailureReason;
  /** Received in this session (animate it and open its trace); false for history. */
  fresh?: boolean;
}

// Requests that have not answered by then are stopped so the UI never stays stuck loading.
const REQUEST_TIMEOUT_MS = 30000;

interface ConversationItem {
  id: string;
  title: string;
  mode: string;
  language: string;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

export default function WorkspacePage() {
  const { language, t } = useLanguage();
  const { user, token, isAuthenticated, openAuthModal, toggleMode, setUserProfile } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  // Phase 7: Intelligent Safety & Warning States
  const [activeWarning, setActiveWarning] = useState<WarningData | null>(null);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isChatTerminated, setIsChatTerminated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // The in-flight chat request, so it can be stopped on timeout, navigation or unmount.
  const inFlightRef = useRef<{ controller: AbortController; reason: 'timeout' | 'navigation' | null } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeMode = user?.mode || 'normal';

  // Suggested prompts
  const suggestedPrompts = [
    t('workspace.prompt1'),
    t('workspace.prompt2'),
    t('workspace.prompt3'),
    t('workspace.prompt4'),
    t('workspace.prompt5'),
    t('workspace.prompt6'),
  ];

  // Load conversations when user authenticates or token changes
  useEffect(() => {
    if (!isAuthenticated && !token) {
      setConversations([]);
      return;
    }
    fetchConversations();
  }, [isAuthenticated, token]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/conversations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const abortInFlight = () => {
    if (inFlightRef.current) {
      inFlightRef.current.reason = 'navigation';
      inFlightRef.current.controller.abort();
    }
  };

  // Stop any in-flight request when leaving the workspace
  useEffect(() => () => abortInFlight(), []);

  const loadConversation = async (convId: string) => {
    abortInFlight();
    setActiveConversationId(convId);
    setIsSidebarOpen(false);
    try {
      const res = await fetch(`${API_URL}/api/v1/conversations/${convId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setIsChatTerminated(Boolean(data.is_terminated));
        const loaded: MessageItem[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          type:
            m.type ||
            (m.role === 'assistant' && m.content.startsWith('⚠️ SAFETY REFUSAL') ? 'safety_refusal' : undefined),
          sources: m.sources || [],
          trace: m.trace || null,
          created_at: m.created_at,
        }));
        setMessages(loaded);
      }
    } catch (err) {
      console.error('Failed to load conversation details', err);
    }
  };

  const handleStartNewChat = () => {
    abortInFlight();
    setActiveConversationId(null);
    setMessages([]);
    setInputContent('');
    setIsChatTerminated(false);
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputContent).trim();
    if (!text || isSending || isChatTerminated) return;

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const tempUserMsgId = 'user-' + Date.now();
    const newUserMsg: MessageItem = {
      id: tempUserMsgId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputContent('');
    setIsSending(true);

    const request = { controller: new AbortController(), reason: null as 'timeout' | 'navigation' | null };
    inFlightRef.current = request;
    const timeoutId = setTimeout(() => {
      request.reason = 'timeout';
      request.controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}/api/v1/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        signal: request.controller.signal,
        body: JSON.stringify({
          content: text,
          conversation_id: activeConversationId || undefined,
          mode: activeMode,
          language: language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403 && /suspended/i.test(err.detail || '') && user) {
          setUserProfile({ ...user, status: 'suspended' });
        }
        throw new Error(err.detail || t('workspace.errorSend'));
      }

      const data = await res.json();
      setActiveConversationId(data.conversation_id);

      // Phase 7: Check safety enforcement payload
      if (data.warning) {
        setActiveWarning(data.warning);
        setIsWarningModalOpen(true);
        if (data.warning.is_suspended && user) {
          setUserProfile({ ...user, status: 'suspended' });
        }
      }
      if (data.is_terminated) {
        setIsChatTerminated(true);
      }

      const assistantMsg: MessageItem = {
        id: data.assistant_message.id || 'asst-' + Date.now(),
        role: 'assistant',
        content: data.assistant_message.content,
        type: data.assistant_message.type,
        mode: data.assistant_message.mode,
        sources: data.assistant_message.sources || [],
        limitations: data.assistant_message.limitations,
        created_at: new Date().toISOString(),
        trace: data.assistant_message.trace || null,
        fresh: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      fetchConversations();
    } catch (err: any) {
      // The user moved to another conversation: drop the reply silently.
      if (request.reason === 'navigation') return;
      const failureReason: TraceFailureReason =
        request.reason === 'timeout' ? 'timeout' : err instanceof TypeError ? 'network' : 'generic';
      const errorMsg: MessageItem = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        // Server errors carry a user-facing detail; network failures and timeouts get a translated message.
        content: failureReason === 'generic' ? err.message || t('workspace.errorSend') : t(`trace.failed.${failureReason}`),
        type: 'error',
        failureReason,
        fresh: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      clearTimeout(timeoutId);
      if (inFlightRef.current === request) inFlightRef.current = null;
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRename = async (convId: string) => {
    if (!editTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/conversations/${convId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: editTitle.trim() } : c))
        );
      }
    } catch (err) {
      console.error('Failed to rename conversation', err);
    } finally {
      setEditingConvId(null);
      setEditTitle('');
    }
  };

  const handleDelete = async (convId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/conversations/${convId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConversationId === convId) {
          handleStartNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className="flex h-screen w-full bg-[#F6E5D0] text-[#000000] overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#000000]/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 shrink-0 bg-[#ffffff] border-r border-[#A4A494] flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#A4A494] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#C4A47A]/70">
              <Image src="/vidhivraksh-emblem.png" alt="VIDHIVRAKSH Emblem" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#1F3A2E]">VIDHIVRAKSH</span>
              <span className="text-[9px] text-[#000000]/70 uppercase tracking-[0.10em]">
                {t('app.subtagline')}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              title={t('workspace.navHome')}
              className="p-1.5 rounded-[4px] text-[#A4A494] hover:text-[#000000] hover:bg-[#F6E5D0] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-[4px] text-[#A4A494] hover:text-[#000000] hover:bg-[#F6E5D0] md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Consultation Button */}
        <div className="p-3 pb-2">
          <button
            type="button"
            onClick={handleStartNewChat}
            className="w-full py-2.5 px-3 rounded-[100px] text-xs font-normal border border-[#000000] bg-transparent text-[#000000] hover:bg-[#000000] hover:text-[#F6E5D0] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('workspace.newChat')}</span>
          </button>
        </div>

        {/* Module Quick Nav */}
        <div className="px-3 pb-3 grid grid-cols-4 gap-1 text-center">
          <Link
            href="/documents"
            title="Legal Document Library"
            className="p-1 rounded-[4px] border border-[#A4A494]/60 bg-[#ffffff] hover:border-[#1F3A2E] text-[10px] font-medium text-[#1F3A2E] truncate transition-colors"
          >
            Library
          </Link>
          <Link
            href="/land-research"
            title="Land Ownership Research"
            className="p-1 rounded-[4px] border border-[#A4A494]/60 bg-[#ffffff] hover:border-[#1F3A2E] text-[10px] font-medium text-[#1F3A2E] truncate transition-colors"
          >
            Land
          </Link>
          <Link
            href="/case-management"
            title="Lawyer Case Management"
            className="p-1 rounded-[4px] border border-[#A4A494]/60 bg-[#ffffff] hover:border-[#1F3A2E] text-[10px] font-medium text-[#1F3A2E] truncate transition-colors"
          >
            Cases
          </Link>
          <Link
            href="/pricing"
            title="Pricing"
            className="p-1 rounded-[4px] border border-[#A4A494]/60 bg-[#ffffff] hover:border-[#1F3A2E] text-[10px] font-medium text-[#1F3A2E] truncate transition-colors"
          >
            Pricing
          </Link>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-[0.10em] text-[#A4A494]">
            {t('workspace.conversations')}
          </div>

          {!isAuthenticated ? (
            <div className="p-4 text-center rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] my-3">
              <p className="text-xs text-[#A4A494] mb-3">{t('workspace.signInRequired')}</p>
              <button
                type="button"
                onClick={openAuthModal}
                className="w-full py-2 px-3 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('auth.signin')}</span>
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-[#A4A494]">
              {t('workspace.noConversations')}
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = editingConvId === conv.id;
              const isDeleting = deleteConfirmId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`group relative rounded-[4px] px-2.5 py-2 text-xs transition-colors flex items-center justify-between gap-1.5 border ${
                    isActive
                      ? 'bg-[#F6E5D0] border-[#000000] text-[#000000] font-bold'
                      : 'hover:bg-[#F6E5D0] text-[#000000] border-transparent'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(conv.id);
                          if (e.key === 'Escape') setEditingConvId(null);
                        }}
                        autoFocus
                        className="w-full px-2 py-1 rounded bg-[#ffffff] border border-[#C4A47A] text-xs text-[#000000] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRename(conv.id)}
                        className="p-1 text-[#1F3A2E] hover:text-[#C4A47A]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingConvId(null)}
                        className="p-1 text-[#A4A494] hover:text-[#000000]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isDeleting ? (
                    <div className="flex items-center justify-between w-full py-0.5">
                      <span className="text-[11px] text-[#000000] font-bold">Delete?</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(conv.id)}
                          className="px-2 py-0.5 rounded bg-[#000000] text-[11px] text-[#F6E5D0] hover:bg-[#1F3A2E]"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-0.5 rounded bg-[#A4A494] text-[11px] text-[#000000] hover:opacity-80"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => loadConversation(conv.id)}
                        className="flex items-center gap-2 truncate text-left flex-1"
                      >
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-[#C4A47A]' : 'text-[#A4A494] group-hover:text-[#1F3A2E]'
                          }`}
                        />
                        <span className="truncate">{conv.title}</span>
                      </button>

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingConvId(conv.id);
                            setEditTitle(conv.title);
                          }}
                          title={t('workspace.rename')}
                          className="p-1 text-[#A4A494] hover:text-[#1F3A2E]"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(conv.id)}
                          title={t('workspace.delete')}
                          className="p-1 text-[#A4A494] hover:text-[#000000]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Mode switch & Account */}
        <div className="p-3 border-t border-[#A4A494] bg-[#ffffff] space-y-2">
          {isAuthenticated && user && (
            <div className="p-2.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2 truncate text-left hover:opacity-80 transition-opacity"
              >
                <div className="w-7 h-7 rounded-full bg-[#000000] text-[#ffffff] font-bold text-xs flex items-center justify-center shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-[#000000] truncate">{user.name}</div>
                  <div className="text-[10px] text-[#A4A494] font-mono uppercase">{user.role}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={toggleMode}
                title={activeMode === 'professional' ? t('workspace.modeSwitchToNormal') : t('workspace.modeSwitchToPro')}
                className="px-2 py-1 rounded-[4px] text-[10px] font-mono border border-[#A4A494] bg-[#ffffff] text-[#000000] hover:border-[#000000] flex items-center gap-1 shrink-0 transition-colors"
              >
                <Layers className="w-3 h-3 text-[#A4A494]" />
                <span className="font-bold">{activeMode === 'professional' ? 'PRO' : 'NORM'}</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <LanguageSelector />
            <span className="text-[10px] text-[#A4A494] font-mono">v4.0.0</span>
          </div>
        </div>
      </aside>

      {/* Central Chat Column */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F6E5D0]">
        {/* Workspace Top Header Bar */}
        <header className="h-14 border-b border-[#A4A494] px-4 sm:px-6 flex items-center justify-between bg-[#ffffff] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] hover:border-[#000000] md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Link
              href="/"
              title={t('workspace.navHome')}
              className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium text-[#1F3A2E] border border-[#A4A494] hover:bg-[#F6E5D0] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('workspace.navHome')}</span>
            </Link>

            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#000000] shrink-0" />
              <h2 className="hidden sm:block text-sm font-bold text-[#000000] truncate max-w-md">
                {activeConversationId
                  ? conversations.find((c) => c.id === activeConversationId)?.title ||
                    t('workspace.title')
                  : t('workspace.newChat')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mode Indicator & Switcher */}
            <button
              type="button"
              onClick={toggleMode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-[100px] text-xs font-mono whitespace-nowrap bg-[#ffffff] border border-[#A4A494] text-[#000000] hover:border-[#000000] transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#A4A494]" />
              <span className="font-bold uppercase tracking-[0.05em]">
                {activeMode === 'professional' ? t('workspace.modePro') : t('workspace.modeNormal')}
              </span>
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={openAuthModal}
                className="px-3.5 py-1 rounded-[100px] text-xs font-normal whitespace-nowrap border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 transition-opacity"
              >
                {t('auth.signin')}
              </button>
            )}
          </div>
        </header>

        {/* Informational Disclaimer Banner */}
        <div className="px-4 sm:px-6 py-1.5 bg-[#ffffff] border-b border-[#A4A494] flex items-center justify-between text-[11px] text-[#A4A494] shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Shield className="w-3.5 h-3.5 text-[#000000] shrink-0" />
            <span className="truncate">{t('workspace.disclaimer')}</span>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 space-y-6">
          {messages.length === 0 ? (
            /* Welcome Screen when conversation has no messages */
            <div className="max-w-3xl mx-auto py-8 text-center animate-in fade-in duration-200">
              {/* Emblem */}
              <BrandEmblem size={128} priority className="mx-auto mb-4" />

              <h1 className="text-2xl sm:text-3xl font-normal tracking-[-0.02em] text-[#000000] mb-2">
                {t('workspace.welcomeTitle')}
              </h1>
              <p className="text-xs sm:text-sm text-[#A4A494] max-w-xl mx-auto mb-8 leading-relaxed">
                {t('workspace.welcomeSubtitle')}
              </p>

              {/* Mode indicator card */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-xs font-mono text-[#000000] mb-8">
                <Sparkles className="w-3.5 h-3.5 text-[#000000]" />
                <span>
                  {activeMode === 'professional'
                    ? t('workspace.modeProDesc')
                    : t('workspace.modeNormalDesc')}
                </span>
              </div>

              {/* 6 Suggested Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {suggestedPrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(promptText)}
                    className="p-3.5 rounded-[4px] bg-[#ffffff] hover:border-[#000000] border border-[#A4A494] text-[#000000] transition-colors text-xs leading-relaxed flex items-start gap-2.5 group cursor-pointer shadow-none"
                  >
                    <BookOpen className="w-4 h-4 text-[#A4A494] shrink-0 mt-0.5 group-hover:text-[#000000] transition-colors" />
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message List */
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isClarification = msg.type === 'clarification_needed';
              const isRefusal = msg.type === 'safety_refusal';
              const isCrisis = msg.type === 'crisis_support';
              const isInsufficient = msg.type === 'insufficient_info';
              const hasSources = msg.sources && msg.sources.length > 0;
              const sourcesOpen = expandedSources[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 max-w-3xl ${
                    isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#C4A47A]/70 shrink-0 mt-1">
                      <Image src="/vidhivraksh-emblem.png" alt="VIDHIVRAKSH" fill className="object-contain" />
                    </div>
                  )}

                  <div
                    className={`min-w-0 rounded-[4px] p-4 sm:p-5 text-sm leading-relaxed border ${msg.fresh && !isUser ? 'vr-answer-in ' : ''}${
                      isUser
                        ? 'bg-[#ffffff] border-[#000000] text-[#000000] max-w-xl'
                        : isRefusal
                        ? 'bg-[#ffffff] border-[#000000] text-[#000000] w-full'
                        : isClarification || isCrisis
                        ? 'bg-[#ffffff] border-[#C4A47A] text-[#000000] w-full'
                        : isInsufficient
                        ? 'bg-[#ffffff] border-[#A4A494] text-[#000000] w-full'
                        : 'bg-[#ffffff] border-[#A4A494] text-[#000000] w-full shadow-none'
                    }`}
                  >
                    {/* Header badge for Assistant messages */}
                    {!isUser && (
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#A4A494]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#000000] text-xs tracking-wider">VIDHIVRAKSH</span>
                          {msg.mode && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] uppercase">
                              {msg.mode === 'professional' ? 'Professional' : 'Normal'}
                            </span>
                          )}
                          {isClarification && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" />
                              Clarification Required
                            </span>
                          )}
                          {isRefusal && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#1F3A2E] border border-[#1F3A2E] text-[#F6E5D0] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-[#C4A47A]" />
                              Safety Refusal
                            </span>
                          )}
                          {isCrisis && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#C4A47A] text-[#1F3A2E] flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Support Resources
                            </span>
                          )}
                          {isInsufficient && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#A4A494] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Corpus Limitation
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title={t('workspace.copyResponse')}
                          className="flex items-center gap-1 text-[11px] text-[#A4A494] hover:text-[#000000] transition-colors p-1"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-[#000000]" />
                              <span className="text-[#000000]">{t('workspace.copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{t('workspace.copyResponse')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Research trace: what the server actually did for this reply */}
                    {!isUser && (msg.trace?.steps?.length || msg.failureReason) && (
                      <LegalResearchTrace
                        state={msg.failureReason ? 'failed' : 'complete'}
                        trace={msg.trace}
                        defaultOpen={Boolean(msg.fresh)}
                        announce={Boolean(msg.fresh)}
                      />
                    )}

                    {/* Content Body with Markdown-like Paragraph rendering */}
                    <div className="space-y-2 whitespace-pre-wrap font-sans text-xs sm:text-sm text-[#000000]">
                      {msg.content}
                    </div>

                    {/* Expandable Statutory References Accordion */}
                    {hasSources && (
                      <div className="mt-4 pt-3 border-t border-[#A4A494]">
                        <button
                          type="button"
                          onClick={() => toggleSources(msg.id)}
                          aria-expanded={Boolean(sourcesOpen)}
                          className="w-full flex items-center justify-between p-2 rounded-[4px] bg-[#F6E5D0] hover:bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-[#000000]" />
                            <span className="font-bold">{t('workspace.sourcesTitle')}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000]">
                              {msg.sources!.length} {t('workspace.sourcesCount')}
                            </span>
                          </div>
                          {sourcesOpen ? (
                            <ChevronUp className="w-4 h-4 text-[#000000]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#000000]" />
                          )}
                        </button>

                        {sourcesOpen && (
                          <div className="mt-2.5 space-y-2 vr-trace-reveal">
                            {msg.sources!.map((src) => (
                              <LegalSourceCard key={src.id} source={src} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* In-flight reply: live research trace until the server answers */}
          {isSending && (
            <div className="flex gap-3 sm:gap-4 max-w-3xl mr-auto justify-start">
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#C4A47A]/70 shrink-0 mt-1">
                <Image src="/vidhivraksh-emblem.png" alt="VIDHIVRAKSH" fill className="object-contain" />
              </div>
              <div className="min-w-0 w-full rounded-[4px] p-3 sm:p-4 bg-[#ffffff] border border-[#A4A494] vr-answer-in">
                <LegalResearchTrace state="running" announce />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bottom Composer */}
        <div className="p-4 sm:p-5 border-t border-[#A4A494] bg-[#ffffff] shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Phase 7: Persistent Chat Termination Banner */}
            {isChatTerminated && (
              <div className="mb-3 p-3 rounded-[4px] bg-[#F6E5D0] border border-[#000000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 text-xs text-[#000000]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{t('safety.chatTerminatedDesc')}</span>
                </div>
                {user?.status !== 'suspended' && (
                  <button
                    type="button"
                    onClick={handleStartNewChat}
                    className="px-3 py-1 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 shrink-0 transition-opacity"
                  >
                    {t('safety.startNewChat')}
                  </button>
                )}
              </div>
            )}

            {/* Account Suspension Banner */}
            {user?.status === 'suspended' && (
              <div className="mb-3 p-3 rounded-[4px] bg-[#F6E5D0] border border-[#000000] flex items-center gap-2.5 text-xs text-[#000000] animate-in fade-in">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{t('safety.accountSuspendedBanner')}</span>
              </div>
            )}

            <div className="relative rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] focus-within:border-[#000000] transition-colors flex items-end p-2 sm:p-2.5">
              <textarea
                ref={textareaRef}
                rows={2}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  user?.status === 'suspended'
                    ? t('safety.accountSuspendedBanner')
                    : isChatTerminated
                    ? t('safety.chatInputLocked')
                    : t('workspace.inputPlaceholder')
                }
                disabled={isSending || isChatTerminated || user?.status === 'suspended'}
                className="w-full px-2 py-1.5 bg-transparent resize-none outline-none text-xs sm:text-sm text-[#000000] placeholder-[#A4A494] max-h-36 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputContent.trim() || isSending || isChatTerminated || user?.status === 'suspended'}
                aria-label={t('workspace.send')}
                className="p-2 sm:px-4 sm:py-2 rounded-[100px] bg-[#1F3A2E] text-[#F6E5D0] hover:bg-[#C4A47A] hover:text-[#000000] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">{t('workspace.send')}</span>
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-[#A4A494] font-mono">
              <span>{t('workspace.inputHint')}</span>
              <span className="hidden sm:inline">{t('workspace.disclaimerShort')}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Profile Modal & Safety Warning Modal (the Auth Modal is mounted once in the root layout) */}
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <SafetyWarningModal
        isOpen={isWarningModalOpen}
        warning={activeWarning}
        onClose={() => setIsWarningModalOpen(false)}
        onStartNewChat={handleStartNewChat}
      />
    </div>
  );
}
