'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  MapPin,
  FileSearch,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Building,
  Layers,
  Info,
  LogIn,
  Check,
  X,
} from 'lucide-react';

interface LandEntry {
  id: string;
  state: string;
  district: string;
  locality?: string;
  survey_number: string;
  property_description?: string;
  verification_status: 'unverified' | 'in_progress' | 'completed';
  notes?: string;
  created_at?: string;
}

interface SimulatedRecord {
  id: string;
  state: string;
  district: string;
  locality: string;
  survey_number: string;
  owner_name: string;
  total_area: string;
  encumbrance_status: string;
  chain_of_title: string[];
  red_flags: string[];
}

interface ChecklistItem {
  step: number;
  title: string;
  description: string;
  importance: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

export default function LandResearchPage() {
  const { t } = useLanguage();
  const { user, token, isAuthenticated, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'simulated' | 'my_entries' | 'checklist'>('simulated');
  const [simulatedRecords, setSimulatedRecords] = useState<SimulatedRecord[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [myEntries, setMyEntries] = useState<LandEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false);

  // New Entry Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    state: 'Maharashtra',
    district: 'Pune',
    locality: '',
    survey_number: '',
    property_description: '',
    verification_status: 'unverified',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Interactive Checklist completion tracking in local session
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Fetch simulated records and checklist
  useEffect(() => {
    async function fetchSimulatedData() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/land-research/simulated-examples`);
        if (res.ok) {
          const data = await res.json();
          setSimulatedRecords(data.simulated_records || []);
          setChecklist(data.educational_checklist || []);
        }
      } catch (err) {
        console.error('Failed to fetch simulated land data:', err);
      }
    }
    fetchSimulatedData();
  }, []);

  // Fetch user research entries if authenticated
  useEffect(() => {
    async function fetchUserEntries() {
      if (!isAuthenticated || !token) {
        setMyEntries([]);
        return;
      }
      setLoadingEntries(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/land-research`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setMyEntries(data.entries || []);
        }
      } catch (err) {
        console.error('Failed to fetch user land entries:', err);
      } finally {
        setLoadingEntries(false);
      }
    }

    fetchUserEntries();
  }, [isAuthenticated, token]);

  // Handle Create Entry
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }
    if (!formData.state || !formData.district || !formData.survey_number) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/land-research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newEntry = await res.json();
        setMyEntries((prev) => [newEntry, ...prev]);
        setShowAddForm(false);
        setFormData({
          state: 'Maharashtra',
          district: 'Pune',
          locality: '',
          survey_number: '',
          property_description: '',
          verification_status: 'unverified',
          notes: '',
        });
      }
    } catch (err) {
      console.error('Failed to create land entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!token) return;
    if (!window.confirm(t('land.deleteConfirm'))) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/land-research/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        setMyEntries((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete land entry:', err);
    }
  };

  // Toggle Verification Checklist step
  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F6E5D0] text-[#000000] flex flex-col font-sans">
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Page Hero */}
        <div className="relative rounded-[4px] p-6 sm:p-10 border border-[#A4A494] bg-[#ffffff]">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs font-bold uppercase tracking-[0.10em]">
              <MapPin className="w-3.5 h-3.5 text-[#000000]" />
              <span>DUE DILIGENCE SIMULATOR</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-[-0.02em] text-[#000000] leading-[1.1]">
              {t('land.title')}
            </h1>
            <p className="text-[#000000] text-sm sm:text-base leading-[1.5]">
              {t('land.subtitle')}
            </p>

            {/* MANDATORY PERSISTENT DEMO BANNER */}
            <div className="pt-2">
              <div className="p-4 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#000000] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-[0.05em] block text-[#000000]">
                    {t('land.demoBanner')}
                  </span>
                  <p className="text-xs text-[#A4A494] leading-relaxed">
                    VIDHIVRAKSH does not connect to real government registration portals (e.g., IGR Maharashtra, Bhoomi Karnataka, Bhulekh UP). All datasets are illustrative for citizen legal literacy.
                  </p>
                </div>
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="pt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('simulated')}
                className={`px-5 py-2 rounded-[100px] text-xs font-normal transition-colors flex items-center gap-2 border ${
                  activeTab === 'simulated'
                    ? 'border-[#000000] bg-[#000000] text-[#ffffff] font-bold'
                    : 'bg-[#ffffff] text-[#000000] border-[#A4A494] hover:border-[#000000]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('land.tabSimulated')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my_entries')}
                className={`px-5 py-2 rounded-[100px] text-xs font-normal transition-colors flex items-center gap-2 border ${
                  activeTab === 'my_entries'
                    ? 'border-[#000000] bg-[#000000] text-[#ffffff] font-bold'
                    : 'bg-[#ffffff] text-[#000000] border-[#A4A494] hover:border-[#000000]'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>{t('land.tabMyEntries')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`px-5 py-2 rounded-[100px] text-xs font-normal transition-colors flex items-center gap-2 border ${
                  activeTab === 'checklist'
                    ? 'border-[#000000] bg-[#000000] text-[#ffffff] font-bold'
                    : 'bg-[#ffffff] text-[#000000] border-[#A4A494] hover:border-[#000000]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('land.tabChecklist')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: SIMULATED RECORDS */}
        {activeTab === 'simulated' && (
          <div className="space-y-6">
            <p className="text-xs text-[#A4A494]">
              {t('land.simulatedRecordsDesc')}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {simulatedRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-[4px] bg-[#ffffff] border border-[#A4A494] p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Fictional Demonstration Notice */}
                    <div className="p-2.5 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#A4A494] text-[10px] font-mono uppercase tracking-[0.10em] text-center">
                      {t('land.fictionalNotice')}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-[#A4A494] font-mono mb-1">
                        <span>{rec.id}</span>
                        <span>{rec.state}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#000000] flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-[#000000] flex-shrink-0" />
                        <span>
                          {rec.locality}, {rec.district}
                        </span>
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#A4A494]">
                        <span className="text-[#A4A494]">{t('land.simSurvey')}</span>
                        <span className="font-mono text-[#000000] font-bold">{rec.survey_number}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#A4A494]">
                        <span className="text-[#A4A494]">{t('land.simOwner')}</span>
                        <span className="text-[#000000] font-medium">{rec.owner_name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#A4A494]">
                        <span className="text-[#A4A494]">{t('land.simArea')}</span>
                        <span className="text-[#000000]">{rec.total_area}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#A4A494]">
                        <span className="text-[#A4A494]">{t('land.simEncumbrance')}</span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            rec.encumbrance_status.toLowerCase().includes('nil')
                              ? 'text-[#1F3A2E]'
                              : 'text-[#C4A47A]'
                          }`}
                        >
                          {rec.encumbrance_status}
                        </span>
                      </div>
                    </div>

                    {/* Chain of Title */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-[#A4A494] block">
                        {t('land.simChain')}
                      </span>
                      <ul className="space-y-1 text-xs text-[#000000]">
                        {rec.chain_of_title.map((link, lIdx) => (
                          <li
                            key={lIdx}
                            className="p-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[11px]"
                          >
                            {link}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Red Flags / Due Diligence Notes */}
                    {rec.red_flags && rec.red_flags.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-mono uppercase tracking-[0.10em] text-red-700 flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                          <span>{t('land.simRedFlags')}</span>
                        </span>
                        <div className="space-y-1">
                          {rec.red_flags.map((flag, fIdx) => (
                            <div
                              key={fIdx}
                              className="p-2 rounded-[4px] bg-red-50 border border-red-200 text-[11px] text-red-800"
                            >
                              {flag}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MY RESEARCH ENTRIES */}
        {activeTab === 'my_entries' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-normal text-[#000000]">
                  {t('land.tabMyEntries')}
                </h2>
                <p className="text-xs text-[#A4A494]">
                  Track properties you are inspecting and manage verification notes.
                </p>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-5 py-2 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] transition-colors flex items-center gap-2 self-start cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('land.newEntryBtn')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="px-5 py-2 rounded-[100px] text-xs font-bold border border-[#000000] bg-transparent text-[#000000] hover:bg-[#000000] hover:text-[#ffffff] transition-colors flex items-center gap-2 self-start"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In to Save Entries</span>
                </button>
              )}
            </div>

            {/* Create Entry Form Drawer */}
            {showAddForm && (
              <form
                onSubmit={handleCreateEntry}
                className="p-6 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-4 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between border-b border-[#A4A494] pb-3">
                  <h3 className="text-xs font-bold text-[#000000] uppercase tracking-[0.10em]">
                    {t('land.createEntryTitle')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded text-[#A4A494] hover:text-[#000000]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                      {t('land.state')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                      {t('land.district')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                      {t('land.locality')}
                    </label>
                    <input
                      type="text"
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                      {t('land.surveyNo')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.survey_number}
                      onChange={(e) => setFormData({ ...formData, survey_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                      {t('land.propertyDesc')}
                    </label>
                    <input
                      type="text"
                      value={formData.property_description}
                      onChange={(e) =>
                        setFormData({ ...formData, property_description: e.target.value })
                      }
                      placeholder="e.g., Residential Plot 44, 1800 sq ft"
                      className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.10em] text-[#A4A494] block mb-1">
                      {t('land.verificationStatus')}
                    </label>
                    <select
                      value={formData.verification_status}
                      onChange={(e) =>
                        setFormData({ ...formData, verification_status: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-[4px] bg-[#F6E5D0] border border-[#A4A494] text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
                    >
                      <option value="unverified">{t('land.statusUnverified')}</option>
                      <option value="in_progress">{t('land.statusInProgress')}</option>
                      <option value="completed">{t('land.statusCompleted')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-[100px] text-xs text-[#A4A494] hover:text-[#000000]"
                  >
                    {t('land.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-[100px] text-xs font-bold border border-[#000000] bg-[#000000] text-[#ffffff] hover:bg-transparent hover:text-[#000000] disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? t('land.saving') : t('land.saveEntry')}
                  </button>
                </div>
              </form>
            )}

            {/* Entries List */}
            {loadingEntries ? (
              <div className="py-20 text-center text-[#A4A494] text-sm animate-pulse">
                Loading saved entries...
              </div>
            ) : myEntries.length === 0 ? (
              <div className="py-20 text-center rounded-[4px] bg-[#ffffff] border border-[#A4A494] p-8 space-y-3">
                <Info className="w-8 h-8 text-[#000000] mx-auto opacity-40" />
                <p className="text-[#A4A494] text-sm max-w-md mx-auto">
                  {t('land.noEntries')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-5 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono uppercase tracking-[0.05em] border ${
                          entry.verification_status === 'completed'
                            ? 'bg-[#ffffff] border-[#1F3A2E] text-[#1F3A2E]'
                            : entry.verification_status === 'in_progress'
                            ? 'bg-[#ffffff] border-[#C4A47A] text-[#000000]'
                            : 'bg-[#F6E5D0] border-[#A4A494] text-[#A4A494]'
                        }`}
                      >
                        {entry.verification_status === 'completed'
                          ? t('land.statusCompleted')
                          : entry.verification_status === 'in_progress'
                          ? t('land.statusInProgress')
                          : t('land.statusUnverified')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1 rounded text-[#A4A494] hover:text-red-700 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-[#000000]">
                      {entry.locality ? `${entry.locality}, ` : ''}
                      {entry.district}, {entry.state}
                    </h4>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#A4A494]">
                        <span className="text-[#A4A494]">{t('land.surveyNo')}</span>
                        <span className="font-mono text-[#000000] font-bold">{entry.survey_number}</span>
                      </div>
                      {entry.property_description && (
                        <p className="text-[#000000] text-xs pt-1">
                          {entry.property_description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TITLE VERIFICATION CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <div className="p-6 rounded-[4px] bg-[#ffffff] border border-[#A4A494] space-y-4">
              <h2 className="text-lg font-bold text-[#000000] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#000000]" />
                <span>{t('land.tabChecklist')}</span>
              </h2>
              <p className="text-xs text-[#A4A494]">
                Essential legal due diligence procedure before purchasing any land parcel or property in India.
              </p>

              <div className="space-y-4 pt-2">
                {checklist.map((item) => {
                  const isDone = !!completedSteps[item.step];
                  return (
                    <div
                      key={item.step}
                      className={`p-5 rounded-[4px] border transition-all ${
                        isDone
                          ? 'bg-[#F6E5D0] border-[#000000]'
                          : 'bg-[#ffffff] border-[#A4A494]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleStep(item.step)}
                            className="mt-0.5 text-[#000000] hover:opacity-70 cursor-pointer"
                          >
                            {isDone ? (
                              <CheckSquare className="w-5 h-5 text-[#000000]" />
                            ) : (
                              <Square className="w-5 h-5 text-[#A4A494]" />
                            )}
                          </button>
                          <div className="space-y-1">
                            <h3
                              className={`text-sm font-bold ${
                                isDone ? 'text-[#A4A494] line-through' : 'text-[#000000]'
                              }`}
                            >
                              {t('land.stepTitle')
                                .replace('{step}', String(item.step))
                                .replace('{title}', item.title)}
                            </h3>
                            <p className="text-xs text-[#000000] leading-relaxed">
                              {item.description}
                            </p>
                            <div className="pt-1.5 flex items-start gap-1 text-[11px] text-[#000000]">
                              <span className="font-bold uppercase tracking-[0.10em]">
                                {t('land.stepImportance')}
                              </span>
                              <span className="text-[#A4A494]">{item.importance}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStep(item.step)}
                          className={`px-3 py-1 rounded-[100px] text-[11px] border transition-colors ${
                            isDone
                              ? 'bg-[#000000] text-[#ffffff] border-[#000000]'
                              : 'bg-transparent text-[#000000] border-[#A4A494] hover:border-[#000000]'
                          }`}
                        >
                          {isDone ? t('land.markPending') : t('land.markDone')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
