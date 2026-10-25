'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  FileText,
  Plus,
  Shield,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Gavel,
  BookOpen,
  ChevronRight,
  X,
  Lock,
  LogIn,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

interface CaseSummary {
  id: string;
  case_number: string;
  title: string;
  client_name: string;
  court: string;
  case_type: string;
  status: string;
  stage: string;
  next_hearing_date?: string;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  event_date: string;
  title: string;
  description?: string;
  created_at: string;
}

interface EvidenceDoc {
  id: string;
  title: string;
  document_type?: string;
  bates_number?: string;
  relevance?: string;
  created_at: string;
}

interface CaseNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface CaseTask {
  id: string;
  title: string;
  due_date?: string;
  is_completed: boolean;
  priority: string;
  created_at: string;
}

interface FullCaseDetail extends CaseSummary {
  opposing_party?: string;
  opposing_counsel?: string;
  summary?: string;
  timeline_events: TimelineEvent[];
  evidence_documents: EvidenceDoc[];
  notes: CaseNote[];
  tasks: CaseTask[];
}

interface DashboardMetrics {
  active_cases: number;
  upcoming_deadlines: number;
  pending_tasks: number;
  total_evidence: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

export default function CaseManagementPage() {
  const { t } = useLanguage();
  const { user, token, isAuthenticated, login } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Case Details
  const [activeCase, setActiveCase] = useState<FullCaseDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'evidence' | 'notes' | 'tasks'>('overview');

  // New Case Modal State
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [newCaseData, setNewCaseData] = useState({
    case_number: '',
    title: '',
    client_name: '',
    court: '',
    case_type: 'Civil',
    opposing_party: '',
    opposing_counsel: '',
    stage: 'Evidence / Cross-Examination',
    next_hearing_date: '',
    summary: '',
    status: 'active',
  });
  const [isCreatingCase, setIsCreatingCase] = useState<boolean>(false);

  // Quick Action Sub-form States
  const [subFormType, setSubFormType] = useState<'timeline' | 'evidence' | 'note' | 'task' | null>(null);
  const [subFormData, setSubFormData] = useState<any>({});
  const [submittingSubForm, setSubmittingSubForm] = useState<boolean>(false);

  const isLawyer = isAuthenticated && (user?.role === 'lawyer' || user?.role === 'admin');

  // Fetch Dashboard and Cases
  const fetchData = async () => {
    if (!token || !isLawyer) return;
    setLoading(true);
    try {
      // 1. Dashboard metrics
      const dashRes = await fetch(`${API_BASE}/api/v1/cases/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (dashRes.ok) {
        const dData = await dashRes.json();
        setMetrics(dData);
      }

      // 2. Cases list
      const casesRes = await fetch(`${API_BASE}/api/v1/cases`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (casesRes.ok) {
        const cData = await casesRes.json();
        setCases(cData.cases || []);
      }
    } catch (err) {
      console.error('Failed to load lawyer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLawyer) {
      fetchData();
    }
  }, [isLawyer, token]);

  // Load Full Case Details
  const handleOpenCase = async (caseId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCase(data);
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('Failed to fetch case detail:', err);
    }
  };

  // Demo Advocate Quick Login
  const handleDemoLawyerLogin = async () => {
    try {
      await login({ email: 'priya.law@example.test', password: 'DemoPass123!' });
    } catch (err) {
      console.error('Failed demo login:', err);
    }
  };

  // Create New Case
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseData.case_number || !newCaseData.title || !newCaseData.client_name) return;

    setIsCreatingCase(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(newCaseData),
      });
      if (res.ok) {
        setShowNewCaseModal(false);
        setNewCaseData({
          case_number: '',
          title: '',
          client_name: '',
          court: '',
          case_type: 'Civil',
          opposing_party: '',
          opposing_counsel: '',
          stage: 'Evidence / Cross-Examination',
          next_hearing_date: '',
          summary: '',
          status: 'active',
        });
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to create case:', err);
    } finally {
      setIsCreatingCase(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/cases/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ is_completed: !currentStatus }),
      });
      if (res.ok && activeCase) {
        setActiveCase({
          ...activeCase,
          tasks: activeCase.tasks.map((t) =>
            t.id === taskId ? { ...t, is_completed: !currentStatus } : t
          ),
        });
        // refresh dashboard metrics
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Submit Sub-items (timeline event, evidence, note, task)
  const handleAddSubItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !subFormType) return;
    setSubmittingSubForm(true);

    let endpoint = '';
    if (subFormType === 'timeline') endpoint = `${API_BASE}/api/v1/cases/${activeCase.id}/timeline`;
    else if (subFormType === 'evidence') endpoint = `${API_BASE}/api/v1/cases/${activeCase.id}/evidence`;
    else if (subFormType === 'note') endpoint = `${API_BASE}/api/v1/cases/${activeCase.id}/notes`;
    else if (subFormType === 'task') endpoint = `${API_BASE}/api/v1/cases/${activeCase.id}/tasks`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(subFormData),
      });
      if (res.ok) {
        setSubFormType(null);
        setSubFormData({});
        handleOpenCase(activeCase.id);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add sub item:', err);
    } finally {
      setSubmittingSubForm(false);
    }
  };

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F6E5D0] text-[#000000] flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* If user is NOT a lawyer, display restricted view */}
        {!isLawyer ? (
          <div className="py-16 max-w-xl mx-auto text-center space-y-6 rounded-[4px] bg-[#ffffff] border border-[#A4A494] p-8">
            <div className="w-14 h-14 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] flex items-center justify-center mx-auto text-[#000000]">
              <Lock className="w-7 h-7 text-[#000000]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-[4px] text-xs font-mono uppercase tracking-[0.10em] bg-[#F6E5D0] border border-[#A4A494] text-[#000000]">
                {t('cases.restrictedBadge')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-normal text-[#000000]">
                {t('cases.restrictedNotice')}
              </h1>
              <p className="text-[#A4A494] text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
                {t('cases.restrictedDesc')}
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDemoLawyerLogin}
                className="w-full sm:w-auto px-6 py-2.5 rounded-[100px] text-xs sm:text-sm font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('cases.loginAsAdvocate')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* LAWYER WORKSPACE CONTENT */
          <div className="space-y-8">
            {/* Page Header */}
            <div className="relative rounded-[4px] p-6 sm:p-8 border border-[#A4A494] bg-[#ffffff]">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs font-bold uppercase tracking-[0.10em]">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>ADVOCATE WORKSPACE • {user?.name}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-[#000000]">
                    {t('cases.title')}
                  </h1>
                  <p className="text-[#000000] text-xs sm:text-sm max-w-2xl leading-relaxed">
                    {t('cases.subtitle')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewCaseModal(true)}
                  className="px-5 py-2.5 rounded-[100px] text-xs sm:text-sm font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] transition-colors flex items-center gap-2 self-start cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('cases.newCaseBtn')}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                  {t('cases.activeCases')}
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-[#000000]">
                  {metrics?.active_cases ?? 0}
                </p>
              </div>

              <div className="p-5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                  {t('cases.upcomingDeadlines')}
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-[#000000]">
                  {metrics?.upcoming_deadlines ?? 0}
                </p>
              </div>

              <div className="p-5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                  {t('cases.pendingTasks')}
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-[#000000]">
                  {metrics?.pending_tasks ?? 0}
                </p>
              </div>

              <div className="p-5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                  {t('cases.totalEvidence')}
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-[#000000]">
                  {metrics?.total_evidence ?? 0}
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 relative">
                <Search className="w-4 h-4 text-[#A4A494] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cases by title, case number, or client name..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] placeholder-[#A4A494] text-sm focus:outline-none focus:border-[#000000]"
                />
              </div>

              <div className="md:col-span-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-sm focus:outline-none focus:border-[#000000] cursor-pointer"
                >
                  <option value="all">{t('cases.filterAll')}</option>
                  <option value="active">{t('cases.statusActive')}</option>
                  <option value="pending_hearing">{t('cases.statusPendingHearing')}</option>
                  <option value="reserved">{t('cases.statusReserved')}</option>
                  <option value="disposed">{t('cases.statusDisposed')}</option>
                </select>
              </div>
            </div>

            {/* Case List Grid */}
            {loading ? (
              <div className="py-20 text-center text-[#A4A494] text-sm animate-pulse">
                Loading advocate cases...
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="py-20 text-center rounded-[4px] bg-[#ffffff] border border-[#A4A494] p-8 space-y-3">
                <Briefcase className="w-8 h-8 text-[#000000] mx-auto opacity-40" />
                <p className="text-[#A4A494] text-sm max-w-md mx-auto">
                  {t('cases.noCases')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenCase(c.id)}
                    className="group rounded-[4px] bg-[#ffffff] border border-[#A4A494] hover:border-[#000000] p-6 flex flex-col justify-between space-y-4 transition-colors cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-[#A4A494]">
                          {c.case_number}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase border border-[#A4A494] bg-[#F6E5D0] text-[#000000]"
                        >
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#000000] group-hover:text-[#1F3A2E] transition-colors line-clamp-1">
                        {c.title}
                      </h3>

                      <div className="space-y-1 text-xs text-[#000000]">
                        <div className="flex justify-between">
                          <span className="text-[#A4A494]">{t('cases.clientName')}:</span>
                          <span className="font-medium text-[#000000]">{c.client_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#A4A494]">{t('cases.court')}:</span>
                          <span className="truncate max-w-[150px]">{c.court}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#A4A494]">{t('cases.stage')}:</span>
                          <span className="text-[#000000] font-medium">{c.stage}</span>
                        </div>
                        {c.next_hearing_date && (
                          <div className="flex justify-between text-[#000000] font-mono text-[11px] pt-1 border-t border-[#A4A494]">
                            <span className="text-[#A4A494]">Next Hearing:</span>
                            <span className="font-bold">{c.next_hearing_date}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#A4A494] flex items-center justify-between text-xs text-[#000000] font-bold">
                      <span>{t('cases.viewCase')}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODAL: FULL CASE WORKSPACE */}
            {activeCase && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#000000]/60 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#ffffff] border border-[#000000] rounded-[4px] overflow-hidden flex flex-col">
                  {/* Case Modal Header */}
                  <div className="p-6 border-b border-[#A4A494] bg-[#F6E5D0] flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase bg-[#ffffff] border border-[#A4A494] text-[#000000]">
                          {activeCase.case_number}
                        </span>
                        <span className="text-xs text-[#A4A494] font-mono">
                          {activeCase.court}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#000000]">
                        {activeCase.title}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveCase(null)}
                      className="p-1.5 rounded text-[#A4A494] hover:text-[#000000]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tab Selector */}
                  <div className="px-6 py-2.5 border-b border-[#A4A494] bg-[#ffffff] flex flex-wrap gap-2 text-xs">
                    {[
                      { id: 'overview', label: t('cases.tabOverview') },
                      { id: 'timeline', label: `${t('cases.tabTimeline')} (${activeCase.timeline_events.length})` },
                      { id: 'evidence', label: `${t('cases.tabEvidence')} (${activeCase.evidence_documents.length})` },
                      { id: 'notes', label: `${t('cases.tabNotes')} (${activeCase.notes.length})` },
                      { id: 'tasks', label: `${t('cases.tabTasks')} (${activeCase.tasks.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-1.5 rounded-[100px] border transition-colors ${
                          activeTab === tab.id
                            ? 'bg-[#000000] text-[#ffffff] border-[#000000] font-bold'
                            : 'bg-[#ffffff] text-[#000000] border-[#A4A494] hover:border-[#000000]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm text-[#000000]">
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] space-y-1">
                            <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                              {t('cases.clientName')}
                            </span>
                            <p className="font-bold text-[#000000] text-sm">{activeCase.client_name}</p>
                          </div>
                          <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] space-y-1">
                            <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                              {t('cases.opposingParty')}
                            </span>
                            <p className="font-bold text-[#000000] text-sm">
                              {activeCase.opposing_party || '—'}
                            </p>
                          </div>
                          <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] space-y-1">
                            <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                              {t('cases.opposingCounsel')}
                            </span>
                            <p className="font-bold text-[#000000] text-sm">
                              {activeCase.opposing_counsel || '—'}
                            </p>
                          </div>
                          <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] space-y-1">
                            <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                              {t('cases.stage')}
                            </span>
                            <p className="font-bold text-[#000000] text-sm">{activeCase.stage}</p>
                          </div>
                          <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] space-y-1">
                            <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                              {t('cases.nextHearing')}
                            </span>
                            <p className="font-bold text-[#000000] text-sm font-mono">
                              {activeCase.next_hearing_date || 'Not Scheduled'}
                            </p>
                          </div>
                          <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] space-y-1">
                            <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494]">
                              {t('cases.status')}
                            </span>
                            <p className="font-bold text-[#000000] text-sm uppercase font-mono">
                              {activeCase.status}
                            </p>
                          </div>
                        </div>

                        {activeCase.summary && (
                          <div className="space-y-2">
                            <span className="text-xs font-mono uppercase tracking-[0.10em] text-[#000000] font-bold">
                              {t('cases.summary')}
                            </span>
                            <p className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] leading-relaxed text-xs">
                              {activeCase.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: TIMELINE */}
                    {activeTab === 'timeline' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-mono uppercase tracking-[0.10em] text-[#000000] font-bold">
                            Procedural Timeline
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSubFormType('timeline');
                              setSubFormData({ event_date: '', title: '', description: '' });
                            }}
                            className="px-3 py-1.5 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] transition-colors"
                          >
                            + {t('cases.addTimelineEvent')}
                          </button>
                        </div>

                        {subFormType === 'timeline' && (
                          <form
                            onSubmit={handleAddSubItem}
                            className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#000000] space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="date"
                                required
                                value={subFormData.event_date || ''}
                                onChange={(e) =>
                                  setSubFormData({ ...subFormData, event_date: e.target.value })
                                }
                                className="px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                              />
                              <input
                                type="text"
                                required
                                placeholder="Event Title"
                                value={subFormData.title || ''}
                                onChange={(e) =>
                                  setSubFormData({ ...subFormData, title: e.target.value })
                                }
                                className="px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Description"
                              value={subFormData.description || ''}
                              onChange={(e) =>
                                setSubFormData({ ...subFormData, description: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSubFormType(null)}
                                className="px-3 py-1 text-xs text-[#A4A494] hover:text-[#000000]"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submittingSubForm}
                                className="px-4 py-1.5 rounded-[100px] text-xs bg-[#000000] text-[#ffffff] font-bold border border-[#000000]"
                              >
                                Save Event
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-3">
                          {activeCase.timeline_events.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-4 rounded-[4px] bg-[#ffffff] border border-[#A4A494] flex items-start gap-4"
                            >
                              <span className="px-2 py-1 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] font-mono text-xs flex-shrink-0">
                                {ev.event_date}
                              </span>
                              <div>
                                <h5 className="font-bold text-[#000000] text-xs sm:text-sm">
                                  {ev.title}
                                </h5>
                                {ev.description && (
                                  <p className="text-xs text-[#A4A494] mt-1">{ev.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB: EVIDENCE */}
                    {activeTab === 'evidence' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-mono uppercase tracking-[0.10em] text-[#000000] font-bold">
                            Exhibits & Document Register
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSubFormType('evidence');
                              setSubFormData({
                                title: '',
                                document_type: 'Agreement',
                                bates_number: '',
                                relevance: '',
                              });
                            }}
                            className="px-3 py-1.5 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] transition-colors"
                          >
                            + {t('cases.addEvidence')}
                          </button>
                        </div>

                        {subFormType === 'evidence' && (
                          <form
                            onSubmit={handleAddSubItem}
                            className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#000000] space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input
                                type="text"
                                required
                                placeholder="Exhibit / Document Name"
                                value={subFormData.title || ''}
                                onChange={(e) =>
                                  setSubFormData({ ...subFormData, title: e.target.value })
                                }
                                className="px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                              />
                              <input
                                type="text"
                                placeholder="Category / Type"
                                value={subFormData.document_type || ''}
                                onChange={(e) =>
                                  setSubFormData({ ...subFormData, document_type: e.target.value })
                                }
                                className="px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                              />
                              <input
                                type="text"
                                placeholder="Bates / Exhibit No. (e.g. Ex. P-1)"
                                value={subFormData.bates_number || ''}
                                onChange={(e) =>
                                  setSubFormData({ ...subFormData, bates_number: e.target.value })
                                }
                                className="px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Legal Relevance / Proving Fact"
                              value={subFormData.relevance || ''}
                              onChange={(e) =>
                                setSubFormData({ ...subFormData, relevance: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSubFormType(null)}
                                className="px-3 py-1 text-xs text-[#A4A494] hover:text-[#000000]"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submittingSubForm}
                                className="px-4 py-1.5 rounded-[100px] text-xs bg-[#000000] text-[#ffffff] font-bold border border-[#000000]"
                              >
                                Save Evidence
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeCase.evidence_documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="p-4 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#000000] text-xs sm:text-sm">
                                  {doc.title}
                                </span>
                                {doc.bates_number && (
                                  <span className="px-2 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] font-mono text-[10px] text-[#000000]">
                                    {doc.bates_number}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#A4A494]">
                                {doc.document_type || 'General'}
                              </p>
                              {doc.relevance && (
                                <p className="text-xs text-[#000000] pt-1 border-t border-[#A4A494]">
                                  <strong className="text-[#000000]">Relevance:</strong>{' '}
                                  {doc.relevance}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB: NOTES */}
                    {activeTab === 'notes' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-mono uppercase tracking-[0.10em] text-[#000000] font-bold">
                            Research Notes & Strategy
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSubFormType('note');
                              setSubFormData({ title: '', content: '' });
                            }}
                            className="px-3 py-1.5 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] transition-colors"
                          >
                            + {t('cases.addNote')}
                          </button>
                        </div>

                        {subFormType === 'note' && (
                          <form
                            onSubmit={handleAddSubItem}
                            className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#000000] space-y-3"
                          >
                            <input
                              type="text"
                              required
                              placeholder="Subject / Issue"
                              value={subFormData.title || ''}
                              onChange={(e) =>
                                setSubFormData({ ...subFormData, title: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                            />
                            <textarea
                              rows={4}
                              required
                              placeholder="Legal Analysis / Notes..."
                              value={subFormData.content || ''}
                              onChange={(e) =>
                                setSubFormData({ ...subFormData, content: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs font-mono focus:border-[#000000]"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSubFormType(null)}
                                className="px-3 py-1 text-xs text-[#A4A494] hover:text-[#000000]"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submittingSubForm}
                                className="px-4 py-1.5 rounded-[100px] text-xs bg-[#000000] text-[#ffffff] font-bold border border-[#000000]"
                              >
                                Save Note
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-3">
                          {activeCase.notes.map((note) => (
                            <div
                              key={note.id}
                              className="p-4 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-2"
                            >
                              <h5 className="font-bold text-[#000000] text-sm">{note.title}</h5>
                              <p className="text-xs text-[#000000] whitespace-pre-wrap leading-relaxed">
                                {note.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB: TASKS */}
                    {activeTab === 'tasks' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-mono uppercase tracking-[0.10em] text-[#000000] font-bold">
                            Deadlines & Action Items
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSubFormType('task');
                              setSubFormData({ title: '', due_date: '', priority: 'high' });
                            }}
                            className="px-3 py-1.5 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] transition-colors"
                          >
                            + {t('cases.addTask')}
                          </button>
                        </div>

                        {subFormType === 'task' && (
                          <form
                            onSubmit={handleAddSubItem}
                            className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#000000] space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input
                                type="text"
                                required
                                placeholder="Task Title"
                                value={subFormData.title || ''}
                                onChange={(e) =>
                                  setSubFormData({ ...subFormData, title: e.target.value })
                                }
                                className="px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                              />
                              <input
                                type="date"
                                value={subFormData.due_date || ''}
                                onChange={(e) =>
                                  setSubFormData({ ...subFormData, due_date: e.target.value })
                                }
                                className="px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                              />
                              <select
                                value={subFormData.priority || 'high'}
                                onChange={(e) =>
                                  setSubFormData({ ...subFormData, priority: e.target.value })
                                }
                                className="px-3 py-2 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-xs focus:border-[#000000]"
                              >
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSubFormType(null)}
                                className="px-3 py-1 text-xs text-[#A4A494] hover:text-[#000000]"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submittingSubForm}
                                className="px-4 py-1.5 rounded-[100px] text-xs bg-[#000000] text-[#ffffff] font-bold border border-[#000000]"
                              >
                                Save Task
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-2">
                          {activeCase.tasks.map((task) => (
                            <div
                              key={task.id}
                              className={`p-3.5 rounded-[4px] border flex items-center justify-between transition-colors ${
                                task.is_completed
                                  ? 'bg-[#F6E5D0] border-[#A4A494] opacity-60'
                                  : 'bg-[#ffffff] border-[#A4A494]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id, task.is_completed)}
                                  className="text-[#000000] hover:opacity-70"
                                >
                                  {task.is_completed ? (
                                    <CheckSquare className="w-5 h-5 text-[#000000]" />
                                  ) : (
                                    <Square className="w-5 h-5 text-[#A4A494]" />
                                  )}
                                </button>
                                <span
                                  className={`text-xs sm:text-sm font-medium ${
                                    task.is_completed
                                      ? 'line-through text-[#A4A494]'
                                      : 'text-[#000000]'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {task.due_date && (
                                  <span className="font-mono text-[11px] text-[#A4A494]">
                                    Due: {task.due_date}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase border ${
                                    task.priority === 'high'
                                      ? 'bg-red-50 text-red-800 border-red-200'
                                      : 'bg-[#F6E5D0] text-[#000000] border-[#A4A494]'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-[#A4A494] bg-[#F6E5D0] flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveCase(null)}
                      className="px-5 py-2 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] transition-colors"
                    >
                      Close Case File
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: CREATE NEW CASE */}
            {showNewCaseModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-sm animate-in fade-in duration-150">
                <form
                  onSubmit={handleCreateCase}
                  className="w-full max-w-2xl bg-[#ffffff] border border-[#000000] rounded-[4px] p-6 sm:p-8 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#A4A494] pb-3">
                    <h3 className="text-sm font-bold text-[#000000] uppercase tracking-[0.10em]">
                      {t('cases.newCaseBtn')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewCaseModal(false)}
                      className="p-1 rounded text-[#A4A494] hover:text-[#000000]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                        {t('cases.caseNumber')} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS(COMM) 184/2026"
                        value={newCaseData.case_number}
                        onChange={(e) =>
                          setNewCaseData({ ...newCaseData, case_number: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                        {t('cases.titleField')} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Tech v. Stellar Systems"
                        value={newCaseData.title}
                        onChange={(e) =>
                          setNewCaseData({ ...newCaseData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                        {t('cases.clientName')} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Client Full Name"
                        value={newCaseData.client_name}
                        onChange={(e) =>
                          setNewCaseData({ ...newCaseData, client_name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                        {t('cases.court')} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. High Court of Delhi"
                        value={newCaseData.court}
                        onChange={(e) =>
                          setNewCaseData({ ...newCaseData, court: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                        {t('cases.opposingParty')}
                      </label>
                      <input
                        type="text"
                        placeholder="Opposing Party Name"
                        value={newCaseData.opposing_party}
                        onChange={(e) =>
                          setNewCaseData({ ...newCaseData, opposing_party: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                        {t('cases.nextHearing')}
                      </label>
                      <input
                        type="date"
                        value={newCaseData.next_hearing_date}
                        onChange={(e) =>
                          setNewCaseData({ ...newCaseData, next_hearing_date: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                      {t('cases.summary')}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief overview of case..."
                      value={newCaseData.summary}
                      onChange={(e) =>
                        setNewCaseData({ ...newCaseData, summary: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCaseModal(false)}
                      className="px-4 py-2 rounded-[100px] text-xs text-[#A4A494] hover:text-[#000000]"
                    >
                      {t('cases.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingCase}
                      className="px-5 py-2 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] disabled:opacity-50 transition-colors"
                    >
                      {isCreatingCase ? t('cases.saving') : t('cases.saveCase')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
