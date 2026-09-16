import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  LogOut,
  ArrowRight,
  Database,
  ScrollText,
  Feather,
  Heart,
  Layers,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Image as ImageIcon,
} from 'lucide-react';
import { Poet, Poetry, Category } from '../types.js';
import { AdminBannerManager } from './AdminBannerManager.js';
import { getPoetry, saveDocument, removeDocument } from '../lib/database.js';

interface AdminDashboardProps {
  categories: Category[];
  poets: Poet[];
  onCategoriesUpdated: () => Promise<void>;
  onPoetsUpdated: () => Promise<void>;
  onPoetryUpdated: () => Promise<void>;
  onBannerUpdated?: () => Promise<void>;
  onClose: () => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
  adminUsername?: string;
}

interface AdminStats {
  totalPoets: number;
  totalPoetry: number;
  totalGhazals: number;
  totalAshar: number;
  totalKalam: number;
  totalPublished: number;
  totalDrafts: number;
  totalLikes: number;
  totalCategories: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  categories,
  poets,
  onCategoriesUpdated,
  onPoetsUpdated,
  onPoetryUpdated,
  onBannerUpdated,
  onClose,
  onLogout,
  onShowToast,
  adminUsername = 'admin',
}) => {
  // Navigation tabs: 'overview' (Dashboard) | 'poets' (Manage Poets) | 'poetry' (Manage Poetry) | 'banners' (Banners)
  const [activeTab, setActiveTab] = useState<'overview' | 'poets' | 'poetry' | 'banners'>('overview');

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  // Poetry List (fetched with status=all so admin sees published & drafts)
  const [adminPoetryList, setAdminPoetryList] = useState<Poetry[]>([]);
  const [isLoadingPoetry, setIsLoadingPoetry] = useState(false);

  // Poet Management State
  const [poetSearch, setPoetSearch] = useState('');
  const [isPoetModalOpen, setIsPoetModalOpen] = useState(false);
  const [editingPoet, setEditingPoet] = useState<Poet | null>(null);
  const [poetNameUrdu, setPoetNameUrdu] = useState('');
  const [poetNameEnglish, setPoetNameEnglish] = useState('');
  const [poetTitleOrEra, setPoetTitleOrEra] = useState('');
  const [poetFeatured, setPoetFeatured] = useState(false);
  const [isSubmittingPoet, setIsSubmittingPoet] = useState(false);
  const [deletingPoet, setDeletingPoet] = useState<Poet | null>(null);

  // Poetry Management State
  const [poetrySearch, setPoetrySearch] = useState('');
  const [poetryTypeFilter, setPoetryTypeFilter] = useState<'all' | 'ghazal' | 'ashar' | 'nazm' | 'kalam'>('all');
  const [poetryStatusFilter, setPoetryStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [poetryPoetFilter, setPoetryPoetFilter] = useState<string>('all');
  const [isPoetryModalOpen, setIsPoetryModalOpen] = useState(false);
  const [editingPoetry, setEditingPoetry] = useState<Poetry | null>(null);
  const [formPoetId, setFormPoetId] = useState('');
  const [formPoetNameUrdu, setFormPoetNameUrdu] = useState('');
  const [formPoetNameEnglish, setFormPoetNameEnglish] = useState('');
  const [formPoetryType, setFormPoetryType] = useState<'ghazal' | 'ashar' | 'nazm' | 'kalam'>('ghazal');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formVersesText, setFormVersesText] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formFeatured, setFormFeatured] = useState(false);
  const [isSubmittingPoetry, setIsSubmittingPoetry] = useState(false);
  const [deletingPoetry, setDeletingPoetry] = useState<Poetry | null>(null);

  const fetchStats = async () => {
    const allPoetry = await getPoetry('all');
    setAdminPoetryList(allPoetry);
    const totalGhazals = allPoetry.filter(p => p.poetryType === 'ghazal').length;
    const totalAshar = allPoetry.filter(p => p.poetryType === 'ashar').length;
    const totalKalam = allPoetry.filter(p => p.poetryType === 'kalam').length;
    setStats({
      totalPoets: poets.length,
      totalPoetry: allPoetry.length,
      totalGhazals,
      totalAshar,
      totalKalam,
      totalPublished: allPoetry.filter(p => p.status === 'published').length,
      totalDrafts: allPoetry.filter(p => p.status === 'draft').length,
      totalLikes: allPoetry.reduce((sum, p) => sum + (p.likesCount || 0), 0),
      totalCategories: categories.length,
    });
  };

  const fetchAdminPoetry = async () => {
    try {
      setIsLoadingPoetry(true);
      setAdminPoetryList(await getPoetry('all'));
    } catch (err) {
      console.error('Error fetching admin poetry list:', err);
    } finally {
      setIsLoadingPoetry(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchAdminPoetry()]).catch((err) => console.error(err));
  }, []);

  // Recalculate local stats if server response is pending
  const displayStats = useMemo(() => {
    if (stats) return stats;
    const totalGhazals = adminPoetryList.filter(p => p.poetryType === 'ghazal').length;
    const totalAshar = adminPoetryList.filter(p => p.poetryType === 'ashar').length;
    const totalKalam = adminPoetryList.filter(p => p.poetryType === 'kalam' || (!p.poetryType && p.versesUrdu.length > 2)).length;
    return {
      totalPoets: poets.length,
      totalPoetry: adminPoetryList.length,
      totalGhazals,
      totalAshar,
      totalKalam,
      totalPublished: adminPoetryList.filter(p => p.status === 'published').length,
      totalDrafts: adminPoetryList.filter(p => p.status === 'draft').length,
      totalLikes: adminPoetryList.reduce((acc, p) => acc + (p.likesCount || 0), 0),
      totalCategories: categories.length,
    };
  }, [stats, poets, adminPoetryList, categories]);

  // --- POET OPERATIONS ---

  const handleOpenAddPoet = () => {
    setEditingPoet(null);
    setPoetNameUrdu('');
    setPoetNameEnglish('');
    setPoetTitleOrEra('');
    setPoetFeatured(false);
    setIsPoetModalOpen(true);
  };

  const handleOpenEditPoet = (poet: Poet) => {
    setEditingPoet(poet);
    setPoetNameUrdu(poet.nameUrdu);
    setPoetNameEnglish(poet.nameEnglish || '');
    setPoetTitleOrEra(poet.titleOrEra || '');
    setPoetFeatured(Boolean(poet.featured));
    setIsPoetModalOpen(true);
  };

  const handleSavePoet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poetNameUrdu.trim()) {
      onShowToast('Poet name in Urdu is required');
      return;
    }

    setIsSubmittingPoet(true);
    try {
      const payload = {
        nameUrdu: poetNameUrdu.trim(),
        nameEnglish: poetNameEnglish.trim(),
        titleOrEra: poetTitleOrEra.trim(),
        featured: poetFeatured,
      };

      if (editingPoet) {
        const updatedPoet = { ...editingPoet, ...payload };
        await saveDocument('poets', editingPoet.id, updatedPoet);

        // Keep existing poetry linked to the poet when the poet name changes.
        const allPoetry = await getPoetry('all');
        for (const poem of allPoetry) {
          if (poem.poetId === editingPoet.id || poem.poetNameUrdu === editingPoet.nameUrdu) {
            await saveDocument('poetry', poem.id, {
              ...poem,
              poetId: editingPoet.id,
              poetNameUrdu: payload.nameUrdu,
              poetNameEnglish: payload.nameEnglish,
            });
          }
        }
        onShowToast('Poet updated successfully');
      } else {
        const id = `poet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await saveDocument('poets', id, {
          id,
          ...payload,
          createdAt: new Date().toISOString(),
        });
        onShowToast('New poet added successfully');
      }

      // Re-fetch poets so they update immediately in state & Home Screen
      await onPoetsUpdated();
      await fetchStats();
      setIsPoetModalOpen(false);
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Error saving poet');
    } finally {
      setIsSubmittingPoet(false);
    }
  };

  const handleDeletePoet = async (poet: Poet) => {
    try {
      await removeDocument('poets', poet.id);
      onShowToast(`Poet deleted successfully`);
      setDeletingPoet(null);
      await onPoetsUpdated();
      await fetchStats();
    } catch (err) {
      console.error(err);
      onShowToast('Error deleting poet');
    }
  };

  const filteredPoets = useMemo(() => {
    if (!poetSearch.trim()) return poets;
    const q = poetSearch.toLowerCase().trim();
    return poets.filter(
      p =>
        p.nameUrdu.toLowerCase().includes(q) ||
        p.nameEnglish?.toLowerCase().includes(q) ||
        p.titleOrEra?.toLowerCase().includes(q)
    );
  }, [poets, poetSearch]);

  // --- POETRY OPERATIONS ---

  const handleOpenAddPoetry = () => {
    setEditingPoetry(null);
    const firstPoet = poets[0];
    setFormPoetId(firstPoet?.id || '');
    setFormPoetNameUrdu(firstPoet?.nameUrdu || '');
    setFormPoetNameEnglish(firstPoet?.nameEnglish || '');
    setFormPoetryType('ghazal');
    setFormCategoryId(categories[0]?.id || 'cat-ishq');
    setFormVersesText('');
    setFormStatus('published');
    setFormFeatured(false);
    setIsPoetryModalOpen(true);
  };

  const handleOpenEditPoetry = (item: Poetry) => {
    setEditingPoetry(item);
    setFormPoetId(item.poetId || '');
    setFormPoetNameUrdu(item.poetNameUrdu);
    setFormPoetNameEnglish(item.poetNameEnglish || '');
    setFormPoetryType(item.poetryType === 'nazm' ? 'nazm' : item.poetryType === 'kalam' ? 'kalam' : item.poetryType === 'ashar' ? 'ashar' : 'ghazal');
    setFormCategoryId(item.categoryId || categories[0]?.id || 'cat-ishq');
    setFormVersesText(item.versesUrdu.join('\n'));
    setFormStatus(item.status);
    setFormFeatured(Boolean(item.featured));
    setIsPoetryModalOpen(true);
  };

  const handleSelectPoetInForm = (poetId: string) => {
    setFormPoetId(poetId);
    const found = poets.find(p => p.id === poetId);
    if (found) {
      setFormPoetNameUrdu(found.nameUrdu);
      setFormPoetNameEnglish(found.nameEnglish || '');
    }
  };

  const handleSavePoetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPoetNameUrdu.trim()) {
      onShowToast('Please select or enter poet name');
      return;
    }

    const lines = formVersesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      onShowToast('Please enter at least one verse');
      return;
    }

    setIsSubmittingPoetry(true);
    try {
      const payload = {
        poetId: formPoetId || undefined,
        poetNameUrdu: formPoetNameUrdu.trim(),
        poetNameEnglish: formPoetNameEnglish.trim(),
        categoryId: formCategoryId || categories[0]?.id || 'cat-ishq',
        versesUrdu: lines,
        poetryType: formPoetryType,
        status: formStatus,
        featured: formFeatured,
      };

      if (editingPoetry) {
        await saveDocument('poetry', editingPoetry.id, {
          ...editingPoetry,
          ...payload,
          updatedAt: new Date().toISOString(),
        });
        onShowToast('Poetry updated successfully');
      } else {
        const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await saveDocument('poetry', id, {
          id,
          ...payload,
          likesCount: 0,
          createdAt: new Date().toISOString(),
        });
        onShowToast('New poetry added successfully');
      }

      await onPoetryUpdated();
      await fetchAdminPoetry();
      await fetchStats();
      setIsPoetryModalOpen(false);
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Error saving poetry');
    } finally {
      setIsSubmittingPoetry(false);
    }
  };

  const handleTogglePoetryStatus = async (item: Poetry) => {
    try {
      await saveDocument('poetry', item.id, {
        ...item,
        status: item.status === 'published' ? 'draft' : 'published',
        updatedAt: new Date().toISOString(),
      });
      onShowToast(item.status === 'published' ? 'Status changed to Draft' : 'Status changed to Published');
      await onPoetryUpdated();
      await fetchAdminPoetry();
      await fetchStats();
    } catch (err) {
      onShowToast('Error updating status');
    }
  };

  const handleDeletePoetry = async (item: Poetry) => {
    try {
      await removeDocument('poetry', item.id);
      onShowToast('Poetry deleted successfully');
      setDeletingPoetry(null);
      await onPoetryUpdated();
      await fetchAdminPoetry();
      await fetchStats();
    } catch (err) {
      console.error(err);
      onShowToast('Error deleting poetry');
    }
  };

  const filteredPoetry = useMemo(() => {
    return adminPoetryList.filter(p => {
      // Type filter
      if (poetryTypeFilter !== 'all') {
        if (poetryTypeFilter === 'ghazal') {
          if (p.poetryType !== 'ghazal' && p.versesUrdu.length <= 2) return false;
        } else if (poetryTypeFilter === 'ashar') {
          if (p.poetryType !== 'ashar' && p.versesUrdu.length > 2) return false;
        } else if (poetryTypeFilter === 'nazm') {
          if (p.poetryType !== 'nazm') return false;
        } else if (poetryTypeFilter === 'kalam') {
          if (p.poetryType !== 'kalam') return false;
        }
      }
      // Status filter
      if (poetryStatusFilter !== 'all' && p.status !== poetryStatusFilter) return false;
      // Poet filter
      if (poetryPoetFilter !== 'all' && p.poetId !== poetryPoetFilter && p.poetNameUrdu !== poetryPoetFilter) {
        return false;
      }
      // Search query
      if (poetrySearch.trim()) {
        const q = poetrySearch.toLowerCase().trim();
        const inPoet = p.poetNameUrdu.toLowerCase().includes(q) || p.poetNameEnglish?.toLowerCase().includes(q);
        const inVerses = p.versesUrdu.some(v => v.toLowerCase().includes(q));
        return inPoet || inVerses;
      }
      return true;
    });
  }, [adminPoetryList, poetryTypeFilter, poetryStatusFilter, poetryPoetFilter, poetrySearch]);

  return (
    <div id="admin-dashboard-root" className="w-full space-y-6 animate-in fade-in duration-200 font-sans-ui">
      {/* Top Admin Navigation Header */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Database Status */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-200 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans-ui text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Admin Dashboard
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans-ui font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Firebase Firestore Connected
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-sans-ui">
                Harf-e-Qalam Database • User: <span className="font-semibold text-stone-700">{adminUsername}</span>
              </p>
            </div>
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 cursor-pointer"
              title="Back to Home"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Action Buttons (Back to Home & Logout) */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            id="admin-refresh-stats-btn"
            type="button"
            onClick={() => {
              fetchStats();
              fetchAdminPoetry();
              onShowToast('Database stats refreshed');
            }}
            disabled={isRefreshingStats}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-sans-ui font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 rounded-xl transition-colors cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStats ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="admin-back-to-home-btn"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-sans-ui font-medium text-stone-700 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Back to Home</span>
          </button>

          <button
            id="admin-logout-btn"
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-sans-ui font-medium text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100/80 border border-red-200/70 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-1.5 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
        {/* Tab 1: Dashboard */}
        <button
          id="admin-tab-overview"
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer font-sans-ui text-xs sm:text-sm ${
            activeTab === 'overview'
              ? 'bg-stone-900 text-amber-100 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 font-medium'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        {/* Tab 2: Manage Poets */}
        <button
          id="admin-tab-poets"
          type="button"
          onClick={() => setActiveTab('poets')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer font-sans-ui text-xs sm:text-sm ${
            activeTab === 'poets'
              ? 'bg-stone-900 text-amber-100 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 font-medium'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Poets</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-sans-ui font-semibold ${
              activeTab === 'poets' ? 'bg-stone-800 text-amber-200' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {poets.length}
          </span>
        </button>

        {/* Tab 3: Manage Poetry */}
        <button
          id="admin-tab-poetry"
          type="button"
          onClick={() => setActiveTab('poetry')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer font-sans-ui text-xs sm:text-sm ${
            activeTab === 'poetry'
              ? 'bg-stone-900 text-amber-100 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 font-medium'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Poetry</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-sans-ui font-semibold ${
              activeTab === 'poetry' ? 'bg-stone-800 text-amber-200' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {adminPoetryList.length}
          </span>
        </button>

        {/* Tab 4: Manage Banners */}
        <button
          id="admin-tab-banners"
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer font-sans-ui text-xs sm:text-sm ${
            activeTab === 'banners'
              ? 'bg-stone-900 text-amber-100 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 font-medium'
          }`}
        >
          <ImageIcon className="w-4 h-4 shrink-0" />
          <span>Banners</span>
        </button>
      </div>

      {/* ================= TAB 1: DASHBOARD ================= */}
      {activeTab === 'overview' && (
        <div id="admin-section-overview" className="space-y-6">
          {/* 5 Core Required Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Poets */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-stone-500">
                <span className="font-sans-ui text-xs font-semibold text-stone-600">Total Poets</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="font-sans-ui text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                {displayStats.totalPoets}
              </div>
              <div className="text-[11px] text-stone-500 font-sans-ui">
                Poets in database
              </div>
            </div>

            {/* Total Poetry */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-stone-500">
                <span className="font-sans-ui text-xs font-semibold text-stone-600">Total Poetry</span>
                <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="font-sans-ui text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                {displayStats.totalPoetry}
              </div>
              <div className="text-[11px] text-stone-500 font-sans-ui">
                All poetry records
              </div>
            </div>

            {/* Total Ghazals */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-stone-500">
                <span className="font-sans-ui text-xs font-semibold text-stone-600">Ghazals</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <ScrollText className="w-4 h-4" />
                </div>
              </div>
              <div className="font-sans-ui text-2xl sm:text-3xl font-bold text-purple-950 tracking-tight">
                {displayStats.totalGhazals}
              </div>
              <div className="text-[11px] text-purple-700/80 font-sans-ui">
                Complete ghazals
              </div>
            </div>

            {/* Total Ash'ar */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-stone-500">
                <span className="font-sans-ui text-xs font-semibold text-stone-600">Ash'ar</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Feather className="w-4 h-4" />
                </div>
              </div>
              <div className="font-sans-ui text-2xl sm:text-3xl font-bold text-blue-950 tracking-tight">
                {displayStats.totalAshar}
              </div>
              <div className="text-[11px] text-blue-700/80 font-sans-ui">
                Selected couplets
              </div>
            </div>

            {/* Total Kalam */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-1.5 col-span-2 sm:col-span-1 text-left">
              <div className="flex items-center justify-between text-stone-500">
                <span className="font-sans-ui text-xs font-semibold text-stone-600">Kalam</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="font-sans-ui text-2xl sm:text-3xl font-bold text-emerald-950 tracking-tight">
                {displayStats.totalKalam}
              </div>
              <div className="text-[11px] text-emerald-700/80 font-sans-ui">
                Nazm & collections
              </div>
            </div>
          </div>

          {/* Quick Actions & Status Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('poets');
                handleOpenAddPoet();
              }}
              className="p-4 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-2xl flex items-center gap-3 text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans-ui text-sm sm:text-base font-bold text-stone-900 leading-snug">
                  Add Poet
                </h3>
                <p className="text-[11px] text-stone-500 font-sans-ui">
                  Adds directly to Home Screen grid
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('poetry');
                handleOpenAddPoetry();
              }}
              className="p-4 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-2xl flex items-center gap-3 text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ScrollText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans-ui text-sm sm:text-base font-bold text-stone-900 leading-snug">
                  Add Poetry
                </h3>
                <p className="text-[11px] text-stone-500 font-sans-ui">
                  Create and publish ghazals, ashar or kalam
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-4 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-2xl flex items-center gap-3 text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ArrowRight className="w-5 h-5 rotate-180" />
              </div>
              <div>
                <h3 className="font-sans-ui text-sm sm:text-base font-bold text-stone-900 leading-snug">
                  Back to Home
                </h3>
                <p className="text-[11px] text-stone-500 font-sans-ui">
                  Return to Home Screen poet grid
                </p>
              </div>
            </button>
          </div>

          {/* Database Health Card */}
          <div className="bg-stone-900 text-amber-50 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-300" />
                <h3 className="font-sans-ui text-base sm:text-lg font-bold text-white tracking-tight">
                  Persistent Database
                </h3>
              </div>
              <p className="text-xs text-stone-300 font-sans-ui max-w-xl">
                All poets and poetry records are securely persisted on the server and remain intact across restarts.
              </p>
            </div>
            <div className="flex items-center gap-4 self-start sm:self-center">
              <div className="text-left">
                <span className="text-[11px] text-stone-400 font-sans-ui block">Published</span>
                <span className="font-sans-ui text-lg font-bold text-amber-300">{displayStats.totalPublished}</span>
              </div>
              <div className="h-8 w-px bg-stone-700" />
              <div className="text-left">
                <span className="text-[11px] text-stone-400 font-sans-ui block">Drafts</span>
                <span className="font-sans-ui text-lg font-bold text-stone-300">{displayStats.totalDrafts}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MANAGE POETS ================= */}
      {activeTab === 'poets' && (
        <div id="admin-section-poets" className="space-y-4">
          {/* Header Bar: Add button + Search Input */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <h2 className="font-sans-ui text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                Manage Poets
              </h2>
              <span className="text-xs font-sans-ui font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                Total: {filteredPoets.length}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <input
                  id="admin-poet-search-input"
                  type="text"
                  value={poetSearch}
                  onChange={(e) => setPoetSearch(e.target.value)}
                  placeholder="Search poets..."
                  className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-colors font-sans-ui"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                {poetSearch && (
                  <button
                    type="button"
                    onClick={() => setPoetSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Add Poet Button */}
              <button
                id="admin-add-poet-btn"
                type="button"
                onClick={handleOpenAddPoet}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-50 rounded-xl text-xs font-sans-ui font-semibold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Add Poet</span>
              </button>
            </div>
          </div>

          {/* Poets List Table / Cards */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            {filteredPoets.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="font-sans-ui text-sm text-stone-600">No poets found</p>
                <button
                  type="button"
                  onClick={() => setPoetSearch('')}
                  className="text-xs text-amber-800 font-sans-ui font-semibold underline cursor-pointer"
                >
                  View All Poets
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredPoets.map((poet) => (
                  <div
                    key={poet.id}
                    id={`admin-poet-row-${poet.id}`}
                    className="p-3.5 sm:p-4 hover:bg-stone-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    {/* Poet Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                        <span className="font-nastaliq text-sm sm:text-base font-bold text-stone-800">
                          {poet.nameUrdu.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-nastaliq text-base sm:text-lg font-bold text-stone-900 truncate">
                            {poet.nameUrdu}
                          </h3>
                          {poet.featured && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-sans-ui font-semibold">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-500 font-sans-ui">
                          {poet.nameEnglish && <span>{poet.nameEnglish}</span>}
                          {poet.titleOrEra && (
                            <>
                              <span>•</span>
                              <span className="font-nastaliq text-stone-600 truncate max-w-[200px]">
                                {poet.titleOrEra}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit + Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPoet(poet)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-sans-ui font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 border border-stone-200/80 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPoet(poet)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-sans-ui font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: MANAGE POETRY ================= */}
      {activeTab === 'poetry' && (
        <div id="admin-section-poetry" className="space-y-4">
          {/* Header Bar: Add button + Filters */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <h2 className="font-sans-ui text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  Manage Poetry
                </h2>
                <span className="text-xs font-sans-ui font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  Total: {filteredPoetry.length}
                </span>
              </div>

              {/* Add Poetry Button */}
              <button
                id="admin-add-poetry-btn"
                type="button"
                onClick={handleOpenAddPoetry}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-50 rounded-xl text-xs font-sans-ui font-semibold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Add Poetry</span>
              </button>
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-stone-100">
              {/* Search text */}
              <div className="relative sm:col-span-2">
                <input
                  id="admin-poetry-search-input"
                  type="text"
                  value={poetrySearch}
                  onChange={(e) => setPoetrySearch(e.target.value)}
                  placeholder="Search poetry or poet..."
                  className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-colors font-sans-ui"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                {poetrySearch && (
                  <button
                    type="button"
                    onClick={() => setPoetrySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Poetry Type Filter */}
              <div>
                <select
                  id="admin-poetry-type-filter"
                  value={poetryTypeFilter}
                  onChange={(e) => setPoetryTypeFilter(e.target.value as any)}
                  className="w-full py-2 px-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-sans-ui font-medium cursor-pointer"
                >
                  <option value="all">Poetry Type: All</option>
                  <option value="ghazal">Ghazal</option>
                  <option value="ashar">Ash'ar</option>
                  <option value="nazm">Nazm</option>
                  <option value="kalam">Kalam</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  id="admin-poetry-status-filter"
                  value={poetryStatusFilter}
                  onChange={(e) => setPoetryStatusFilter(e.target.value as any)}
                  className="w-full py-2 px-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-sans-ui font-medium cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Poetry List */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            {isLoadingPoetry ? (
              <div className="p-8 text-center font-sans-ui text-sm text-stone-500">Loading poetry...</div>
            ) : filteredPoetry.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="font-sans-ui text-sm text-stone-600">No poetry found</p>
                <button
                  type="button"
                  onClick={() => {
                    setPoetrySearch('');
                    setPoetryTypeFilter('all');
                    setPoetryStatusFilter('all');
                  }}
                  className="text-xs text-amber-800 font-sans-ui font-semibold underline cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredPoetry.map((item) => {
                  const typeLabel =
                    item.poetryType === 'ghazal'
                      ? 'Ghazal'
                      : item.poetryType === 'nazm'
                      ? 'Nazm'
                      : item.poetryType === 'ashar'
                      ? "Ash'ar"
                      : 'Kalam';
                  return (
                    <div
                      key={item.id}
                      id={`admin-poetry-row-${item.id}`}
                      className="p-4 hover:bg-stone-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Poet & Verses preview */}
                      <div className="space-y-1.5 min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-nastaliq text-base font-bold text-stone-900">
                            {item.poetNameUrdu}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-sans-ui font-semibold ${
                              item.poetryType === 'ghazal'
                                ? 'bg-purple-100 text-purple-900'
                                : item.poetryType === 'nazm'
                                ? 'bg-amber-100 text-amber-900'
                                : item.poetryType === 'ashar'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {typeLabel}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-sans-ui font-semibold ${
                              item.status === 'published'
                                ? 'bg-stone-100 text-stone-700'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {item.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          {item.featured && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-sans-ui font-semibold">
                              Featured
                            </span>
                          )}
                        </div>

                        {/* Verses snippet in Urdu */}
                        <div dir="rtl" className="font-nastaliq text-sm sm:text-base text-stone-700 leading-relaxed pr-2 border-r-2 border-amber-300/80 text-right">
                          <p>{item.versesUrdu[0]}</p>
                          {item.versesUrdu[1] && <p>{item.versesUrdu[1]}</p>}
                          {item.versesUrdu.length > 2 && (
                            <span className="text-[10px] text-stone-500 font-sans-ui block mt-0.5" dir="ltr">
                              + {item.versesUrdu.length - 2} more verses
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePoetryStatus(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-sans-ui font-medium transition-colors cursor-pointer ${
                            item.status === 'published'
                              ? 'text-emerald-700 bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100'
                              : 'text-stone-600 bg-stone-50 border-stone-200/80 hover:bg-stone-100'
                          }`}
                          title={item.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {item.status === 'published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{item.status === 'published' ? 'Published' : 'Draft'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditPoetry(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-sans-ui font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 border border-stone-200/80 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPoetry(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-sans-ui font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200/70 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: MANAGE BANNERS ================= */}
      {activeTab === 'banners' && (
        <AdminBannerManager
          onBannerUpdated={onBannerUpdated}
          onShowToast={onShowToast}
        />
      )}

      {/* ================= MODAL: ADD / EDIT POET ================= */}
      {isPoetModalOpen && (
        <div
          id="admin-poet-modal"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-sans-ui text-lg font-bold text-stone-900">
                {editingPoet ? 'Edit Poet' : 'Add Poet'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPoetModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePoet} className="space-y-4">
              {/* Urdu Name */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                  Poet Name (Urdu) *
                </label>
                <input
                  id="form-poet-name-urdu"
                  type="text"
                  dir="rtl"
                  value={poetNameUrdu}
                  onChange={(e) => setPoetNameUrdu(e.target.value)}
                  placeholder="مثلاً: احمد فراز"
                  required
                  className="w-full py-2.5 px-3 bg-stone-50 border border-stone-200 rounded-xl text-base text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-nastaliq"
                />
              </div>

              {/* English Name */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                  English Name (Optional)
                </label>
                <input
                  id="form-poet-name-english"
                  type="text"
                  dir="ltr"
                  value={poetNameEnglish}
                  onChange={(e) => setPoetNameEnglish(e.target.value)}
                  placeholder="e.g. Ahmad Faraz"
                  className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-sans-ui"
                />
              </div>

              {/* Title or Era */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                  Title or Era
                </label>
                <input
                  id="form-poet-title-era"
                  type="text"
                  dir="rtl"
                  value={poetTitleOrEra}
                  onChange={(e) => setPoetTitleOrEra(e.target.value)}
                  placeholder="مثلاً: شاعرِ مشرق، خدائے سخن"
                  className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-nastaliq"
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="form-poet-featured"
                  type="checkbox"
                  checked={poetFeatured}
                  onChange={(e) => setPoetFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                />
                <label htmlFor="form-poet-featured" className="text-xs font-sans-ui text-stone-700 cursor-pointer">
                  Mark as Featured Poet
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPoetModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans-ui font-medium text-stone-600 hover:text-stone-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="form-poet-submit-btn"
                  type="submit"
                  disabled={isSubmittingPoet}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-50 text-xs font-sans-ui font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingPoet ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT POETRY ================= */}
      {isPoetryModalOpen && (
        <div
          id="admin-poetry-modal"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-sans-ui text-lg font-bold text-stone-900">
                {editingPoetry ? 'Edit Poetry' : 'Add Poetry'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPoetryModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePoetry} className="space-y-4">
              {/* Select Poet */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                  Select Poet *
                </label>
                <select
                  id="form-poetry-poet-select"
                  value={formPoetId}
                  onChange={(e) => handleSelectPoetInForm(e.target.value)}
                  className="w-full py-2.5 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-sans-ui"
                >
                  <option value="">-- Select Poet --</option>
                  {poets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameUrdu} {p.nameEnglish ? `(${p.nameEnglish})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Or manual poet name if not in list */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                  Or Enter Poet Name (Urdu)
                </label>
                <input
                  id="form-poetry-poet-name"
                  type="text"
                  dir="rtl"
                  value={formPoetNameUrdu}
                  onChange={(e) => setFormPoetNameUrdu(e.target.value)}
                  placeholder="مثلاً: علامہ اقبال"
                  required
                  className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-base text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-nastaliq"
                />
              </div>

              {/* Poetry Type: غزل | اشعار | کلام */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                  Poetry Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPoetryType('ghazal')}
                    className={`py-2 px-3 rounded-xl border text-xs font-sans-ui font-medium transition-all cursor-pointer ${
                      formPoetryType === 'ghazal'
                        ? 'bg-stone-900 text-amber-50 border-stone-900 font-semibold shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    غزل (Ghazal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPoetryType('ashar')}
                    className={`py-2 px-3 rounded-xl border text-xs font-sans-ui font-medium transition-all cursor-pointer ${
                      formPoetryType === 'ashar'
                        ? 'bg-stone-900 text-amber-50 border-stone-900 font-semibold shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    اشعار (Ash'ar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPoetryType('nazm')}
                    className={`py-2 px-3 rounded-xl border text-xs font-sans-ui font-medium transition-all cursor-pointer ${
                      formPoetryType === 'nazm'
                        ? 'bg-stone-900 text-amber-50 border-stone-900 font-semibold shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    نظم (Nazm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPoetryType('kalam')}
                    className={`py-2 px-3 rounded-xl border text-xs font-sans-ui font-medium transition-all cursor-pointer ${
                      formPoetryType === 'kalam'
                        ? 'bg-stone-900 text-amber-50 border-stone-900 font-semibold shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    کلام (Kalam)
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                  Category / Theme
                </label>
                <select
                  id="form-poetry-category-select"
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-sans-ui"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameUrdu} ({c.nameEnglish})
                    </option>
                  ))}
                </select>
              </div>

              {/* Urdu Poetry Text Area */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                  Enter Urdu Poetry Verses (one verse per line) *
                </label>
                <textarea
                  id="form-poetry-verses-text"
                  dir="rtl"
                  rows={6}
                  value={formVersesText}
                  onChange={(e) => setFormVersesText(e.target.value)}
                  placeholder="پہلا مصرع یہاں درج کریں&#10;دوسرا مصرع یہاں درج کریں"
                  required
                  className="w-full py-2.5 px-3 bg-stone-50 border border-stone-200 rounded-xl text-base text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-nastaliq leading-relaxed"
                />
              </div>

              {/* Status Selector & Featured */}
              <div className="grid grid-cols-2 gap-3 pt-1 text-left">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
                    Status
                  </label>
                  <select
                    id="form-poetry-status-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-sans-ui font-medium cursor-pointer"
                  >
                    <option value="published">Publish</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="form-poetry-featured"
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                  />
                  <label htmlFor="form-poetry-featured" className="text-xs font-sans-ui text-stone-700 cursor-pointer">
                    Featured Poetry
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPoetryModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans-ui font-medium text-stone-600 hover:text-stone-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="form-poetry-submit-btn"
                  type="submit"
                  disabled={isSubmittingPoetry}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-50 text-xs font-sans-ui font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingPoetry ? 'Saving...' : formStatus === 'published' ? 'Publish' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE POET CONFIRMATION MODAL ================= */}
      {deletingPoet && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans-ui text-base font-bold text-stone-900">
              Delete Poet "{deletingPoet.nameUrdu}"?
            </h3>
            <p className="text-xs text-stone-500 font-sans-ui">
              This poet will be permanently removed from the database and the Home Screen grid.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPoet(null)}
                className="px-4 py-2 text-xs font-sans-ui font-medium text-stone-600 hover:text-stone-800 bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePoet(deletingPoet)}
                className="px-4 py-2 text-xs font-sans-ui font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE POETRY CONFIRMATION MODAL ================= */}
      {deletingPoetry && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans-ui text-base font-bold text-stone-900">
              Delete this poetry?
            </h3>
            <p dir="rtl" className="font-nastaliq text-xs text-stone-600 line-clamp-2 px-2">
              {deletingPoetry.versesUrdu[0]}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPoetry(null)}
                className="px-4 py-2 text-xs font-sans-ui font-medium text-stone-600 hover:text-stone-800 bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePoetry(deletingPoetry)}
                className="px-4 py-2 text-xs font-sans-ui font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
