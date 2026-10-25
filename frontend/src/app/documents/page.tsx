'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Download,
  X,
  Filter,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface LegalDoc {
  id: string;
  title: string;
  category: string;
  document_type: string;
  summary: string;
  plain_explanation: string;
  essential_clauses: string[];
  key_risks: string[];
  governing_law: string[];
  typical_use_cases: string[];
  template_text?: string;
  jurisdiction: string;
}

interface ConsistencyIssue {
  type: string;
  severity: string;
  message: string;
  snippets?: string[];
}

interface ConsistencyResult {
  status: 'passed' | 'issues_detected';
  issue_count: number;
  issues: ConsistencyIssue[];
  disclaimer: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

export default function DocumentLibraryPage() {
  const { t, language } = useLanguage();
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<'browse' | 'checker'>('browse');
  const [documents, setDocuments] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Document Detail Modal State
  const [activeDoc, setActiveDoc] = useState<LegalDoc | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);

  // Consistency Checker State
  const [checkerText, setCheckerText] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkerResult, setCheckerResult] = useState<ConsistencyResult | null>(null);

  // Fetch documents from backend
  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('q', searchQuery.trim());
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedType !== 'all') params.append('doc_type', selectedType);
        params.append('language', language);

        const res = await fetch(`${API_BASE}/api/v1/library/documents?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error('Failed to fetch legal documents:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchDocuments, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedType, language]);

  // Open Document Details
  const handleOpenDoc = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/library/documents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveDoc(data);
      }
    } catch (err) {
      console.error('Failed to fetch document details:', err);
    }
  };

  // Copy template text
  const handleCopyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Download template text as file
  const handleDownloadTemplate = (doc: LegalDoc) => {
    if (!doc.template_text) return;
    const blob = new Blob([doc.template_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/\s+/g, '_')}_SAMPLE_TEMPLATE.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Run Consistency Checker
  const handleRunConsistencyCheck = async () => {
    if (!checkerText.trim()) return;
    setIsChecking(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/library/check-consistency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: checkerText }),
      });
      if (res.ok) {
        const data = await res.json();
        setCheckerResult(data);
      }
    } catch (err) {
      console.error('Failed to check consistency:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Sample text loader for quick demonstration
  const handleLoadSampleDraft = () => {
    setCheckerText(
      `RESIDENTIAL LEASE AGREEMENT\n\nThis Lease Agreement is made on [Date], between Landlord Priya Sharma and Lessee Rahul Verma.\n\nThe Lessor hereby leases the apartment for a monthly rent of Rs. 25,000 (Rupees Twenty Four Thousand only).\n\nThe term of this agreement shall commence on 01/11/2026 and continue until 31/10/2027. Possession was previously delivered on 15/10/2026.\n\nSecurity Deposit of Rs. __________ shall be refunded upon termination.\n\nSigned by Lessor and Tenant on [Date].`
    );
  };

  return (
    <div className="min-h-screen bg-[#F6E5D0] text-[#000000] flex flex-col font-sans">
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Page Hero */}
        <div className="relative rounded-[4px] p-6 sm:p-10 border border-[#A4A494] bg-[#ffffff]">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs font-bold uppercase tracking-[0.10em]">
              <BookOpen className="w-3.5 h-3.5 text-[#000000]" />
              <span>VIDHIVRAKSH KNOWLEDGE SUITE</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-[-0.02em] text-[#000000] leading-[1.1]">
              {t('library.title')}
            </h1>
            <p className="text-[#000000] text-sm sm:text-base leading-[1.5]">
              {t('library.subtitle')}
            </p>

            {/* View Switcher Tabs */}
            <div className="pt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-5 py-2 rounded-[100px] text-xs font-normal transition-colors flex items-center gap-2 border ${
                  activeTab === 'browse'
                    ? 'border-[#000000] bg-[#000000] text-[#ffffff] font-bold'
                    : 'bg-[#ffffff] text-[#000000] border-[#A4A494] hover:border-[#000000]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('library.catAll')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('checker')}
                className={`px-5 py-2 rounded-[100px] text-xs font-normal transition-colors flex items-center gap-2 border ${
                  activeTab === 'checker'
                    ? 'border-[#000000] bg-[#000000] text-[#ffffff] font-bold'
                    : 'bg-[#ffffff] text-[#000000] border-[#A4A494] hover:border-[#000000]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('library.consistencyTitle')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: BROWSE DOCUMENTS */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Search Bar */}
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 text-[#A4A494] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('library.searchPlaceholder')}
                  className="w-full pl-11 pr-4 py-2.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] placeholder-[#A4A494] text-sm focus:outline-none focus:border-[#000000] transition-colors"
                />
              </div>

              {/* Type Filter */}
              <div className="md:col-span-5 flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  aria-label={t('library.filterType')}
                  className="w-full px-4 py-2.5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] text-[#000000] text-sm focus:outline-none focus:border-[#000000] transition-colors cursor-pointer"
                >
                  <option value="all">{t('library.allTypes')}</option>
                  <option value="template">{t('library.typeTemplate')}</option>
                  <option value="guide">{t('library.typeGuide')}</option>
                  <option value="checklist">{t('library.typeChecklist')}</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: 'all', labelKey: 'library.catAll' },
                { id: 'personal_civil', labelKey: 'library.catPersonal' },
                { id: 'business_commercial', labelKey: 'library.catBusiness' },
                { id: 'property', labelKey: 'library.catProperty' },
                { id: 'procedures_reference', labelKey: 'library.catProcedures' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-[100px] text-xs transition-colors border ${
                    selectedCategory === cat.id
                      ? 'bg-[#000000] text-[#ffffff] font-bold border-[#000000]'
                      : 'bg-[#ffffff] text-[#000000] border-[#A4A494] hover:border-[#000000]'
                  }`}
                >
                  {t(cat.labelKey)}
                </button>
              ))}
            </div>

            {/* Document Card Grid */}
            {loading ? (
              <div className="py-20 text-center text-[#A4A494] text-sm animate-pulse">
                Loading legal documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="py-20 text-center rounded-[4px] bg-[#ffffff] border border-[#A4A494] p-8 space-y-3">
                <Info className="w-8 h-8 text-[#000000] mx-auto" />
                <p className="text-[#000000] text-sm max-w-md mx-auto">
                  {t('library.noDocsFound')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleOpenDoc(doc.id)}
                    className="group rounded-[4px] bg-[#ffffff] border border-[#A4A494] hover:border-[#000000] p-6 flex flex-col justify-between transition-colors cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-[0.10em] uppercase bg-[#F6E5D0] border border-[#A4A494] text-[#000000]">
                          {doc.document_type === 'template'
                            ? t('library.cardSampleBadge')
                            : doc.document_type === 'guide'
                            ? t('library.cardGuideBadge')
                            : t('library.cardChecklistBadge')}
                        </span>
                        <span className="text-[11px] text-[#A4A494] font-mono">
                          {doc.jurisdiction}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#000000] group-hover:text-[#A4A494] transition-colors line-clamp-1">
                        {doc.title}
                      </h3>

                      <p className="text-xs text-[#000000] line-clamp-3 leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#A4A494] flex items-center justify-between text-xs">
                      <span className="text-[#A4A494] font-mono text-[11px]">
                        {doc.governing_law?.[0] || 'Indian Law'}
                      </span>
                      <span className="text-[#000000] font-bold flex items-center gap-1">
                        <span>{t('library.viewDetails')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DETERMINISTIC CONSISTENCY CHECKER */}
        {activeTab === 'checker' && (
          <div className="space-y-6">
            <div className="p-6 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#000000] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#000000]" />
                    <span>{t('library.consistencyTitle')}</span>
                  </h2>
                  <p className="text-xs text-[#A4A494] mt-1">
                    {t('library.consistencyDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleDraft}
                  className="px-3 py-1.5 rounded-[4px] text-xs font-mono bg-[#F6E5D0] border border-[#A4A494] text-[#000000] hover:border-[#000000] transition-colors self-start"
                >
                  Load Sample Inconsistent Draft
                </button>
              </div>

              {/* Text Area */}
              <textarea
                rows={9}
                value={checkerText}
                onChange={(e) => setCheckerText(e.target.value)}
                placeholder={t('library.consistencyPlaceholder')}
                className="w-full p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] placeholder-[#A4A494] text-xs sm:text-sm font-mono focus:outline-none focus:border-[#000000] transition-colors"
              />

              {/* Action Button & Notice */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleRunConsistencyCheck}
                  disabled={isChecking || !checkerText.trim()}
                  className="px-6 py-2.5 rounded-[100px] text-xs sm:text-sm font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isChecking
                      ? t('library.consistencyChecking')
                      : t('library.consistencyBtn')}
                  </span>
                </button>

                <p className="text-[11px] text-[#A4A494] italic">
                  {t('library.consistencyNoticeDetail')}
                </p>
              </div>
            </div>

            {/* Checker Results */}
            {checkerResult && (
              <div className="p-6 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-5 animate-in fade-in duration-150">
                {/* Mandatory Disclaimer Alert */}
                <div className="p-3.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#000000] flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs uppercase tracking-[0.05em] block text-[#000000]">
                      {checkerResult.disclaimer}
                    </span>
                    <span className="text-[11px] text-[#A4A494]">
                      {t('library.consistencyNoticeDetail')}
                    </span>
                  </div>
                </div>

                {/* Status Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#000000] uppercase tracking-[0.10em] font-mono">
                    {t('library.consistencyResultSummary')}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-[4px] text-xs font-bold font-mono border ${
                      checkerResult.status === 'passed'
                        ? 'bg-[#F6E5D0] border-[#000000] text-[#000000]'
                        : 'bg-[#F6E5D0] border-[#000000] text-[#000000]'
                    }`}
                  >
                    {checkerResult.status === 'passed'
                      ? t('library.statusPassed')
                      : t('library.statusIssues').replace('{count}', String(checkerResult.issue_count))}
                  </span>
                </div>

                {/* Findings List */}
                {checkerResult.issues.length > 0 && (
                  <div className="space-y-3">
                    {checkerResult.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#000000] uppercase font-mono">
                            {issue.type.replace(/_/g, ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase bg-[#ffffff] text-[#000000] border border-[#A4A494]">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[#000000]">{issue.message}</p>
                        {issue.snippets && issue.snippets.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1.5">
                            {issue.snippets.map((snip, sIdx) => (
                              <code
                                key={sIdx}
                                className="px-2 py-0.5 rounded-[4px] bg-[#ffffff] text-[#000000] font-mono text-[11px] border border-[#A4A494]"
                              >
                                {snip}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL: DOCUMENT DETAILS & TEMPLATE */}
        {activeDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#000000]/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#ffffff] border border-[#000000] rounded-[4px] overflow-hidden shadow-sm flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#A4A494] flex items-start justify-between gap-4 bg-[#F6E5D0]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase bg-[#ffffff] border border-[#A4A494] text-[#000000] font-bold">
                      {activeDoc.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[#A4A494] font-mono">
                      {activeDoc.jurisdiction}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#000000]">
                    {activeDoc.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="p-1.5 rounded-[4px] text-[#A4A494] hover:text-[#000000] hover:bg-[#ffffff] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Scrollable Area */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#000000]">
                {/* MANDATORY DISCLAIMER NOTICE */}
                <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-[0.05em] text-[#000000]">
                    <ShieldAlert className="w-4 h-4 text-[#000000]" />
                    <span>{t('library.sampleNotice')}</span>
                  </div>
                  <p className="text-xs text-[#A4A494] leading-relaxed">
                    {t('library.sampleNoticeDetail')}
                  </p>
                </div>

                {/* Plain-Language Explanation */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                    {t('library.plainExplanation')}
                  </h3>
                  <p className="text-[#000000] text-xs sm:text-sm leading-relaxed bg-[#F6E5D0] p-4 rounded-[4px] border border-[#A4A494]">
                    {activeDoc.plain_explanation}
                  </p>
                </div>

                {/* Essential Clauses */}
                {activeDoc.essential_clauses && activeDoc.essential_clauses.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                      {t('library.keyClauses')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeDoc.essential_clauses.map((clause, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-3 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-xs text-[#000000]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#000000] flex-shrink-0 mt-0.5" />
                          <span>{clause}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Risks & Warnings */}
                {activeDoc.key_risks && activeDoc.key_risks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                      {t('library.riskWarnings')}
                    </h3>
                    <div className="space-y-1.5">
                      {activeDoc.key_risks.map((risk, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-3 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-xs text-[#000000]"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-[#000000] flex-shrink-0 mt-0.5" />
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Governing Law */}
                {activeDoc.governing_law && activeDoc.governing_law.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                      {t('library.governingLaw')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {activeDoc.governing_law.map((law, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-xs font-mono text-[#000000]"
                        >
                          {law}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Draft Template Content */}
                {activeDoc.template_text && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-[0.10em] text-[#A4A494]">
                        {t('library.templateContent')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyTemplate(activeDoc.template_text!)}
                          className="px-3 py-1.5 rounded-[100px] text-xs font-normal border border-[#000000] bg-transparent text-[#000000] hover:bg-[#000000] hover:text-[#F6E5D0] transition-colors flex items-center gap-1.5"
                        >
                          {copiedTemplate ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{t('library.copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{t('library.copyTemplate')}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadTemplate(activeDoc)}
                          className="px-3 py-1.5 rounded-[100px] text-xs font-normal border border-[#A4A494] bg-[#ffffff] text-[#000000] hover:border-[#000000] transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t('library.downloadText')}</span>
                        </button>
                      </div>
                    </div>

                    <pre className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] font-mono text-xs text-[#000000] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
                      {activeDoc.template_text}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#A4A494] bg-[#F6E5D0] flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="px-5 py-2 rounded-[100px] text-xs font-normal border border-[#000000] bg-[#000000] text-[#ffffff] hover:opacity-90"
                >
                  {t('library.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
