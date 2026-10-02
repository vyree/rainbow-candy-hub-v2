import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Mic,
  Music2,
  Flame,
  Sparkles,
  Save,
  CheckCircle2,
  ExternalLink,
  User,
  FileSpreadsheet,
  Layers,
  Info,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  CheckCircle,
  Filter,
  Users,
  Minus,
  Plus,
  Lock,
  Unlock,
  Edit3,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  FileText,
  Check,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { Participant, ParticipantScores, AdminUser, JudgeScoreDetail } from '../../types/participant';
import {
  submitJudgeIndividualScore,
  fetchAdminUsers,
  subscribeToAdminUsers,
  getLocalAdminUsers,
} from '../../services/supabaseClient';
import { JudgeChatDock } from './JudgeChatDock';

interface AdminScoringTabProps {
  participants: Participant[];
  currentUser: AdminUser;
  onRefresh: () => void;
}

export const AdminScoringTab: React.FC<AdminScoringTabProps> = ({
  participants,
  currentUser,
  onRefresh,
}) => {
  const isSuperadmin = currentUser.role === 'superadmin';

  // Fetch admin_users from database to dynamically display judge names
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => getLocalAdminUsers());

  useEffect(() => {
    fetchAdminUsers().then((res) => {
      if (res.data && res.data.length > 0) {
        setAdminUsers(res.data);
      }
    });
    const unsub = subscribeToAdminUsers((updated) => {
      if (updated && updated.length > 0) {
        setAdminUsers(updated);
      }
    });
    return () => unsub();
  }, []);

  // Designated Judges dynamically derived from database admin_users table
  const judgesList = useMemo(() => {
    const judgeUsers = adminUsers.filter((u) => u.role === 'juri' || u.username.startsWith('juri'));
    const sorted = [...judgeUsers].sort((a, b) =>
      a.username.localeCompare(b.username, undefined, { numeric: true })
    );

    if (sorted.length > 0) {
      return sorted.map((u, idx) => ({
        id: u.id,
        username: u.username,
        label: u.name || `Juri ${idx + 1}`,
        name: u.name || `Dewan Juri ${idx + 1}`,
        email: u.email || '',
        role: u.role,
        avatar: u.avatar || '🎙️',
        roleTitle: u.roleTitle || `Dewan Juri ${idx + 1}`,
        isActive: u.isActive,
      }));
    }

    // Default fallback if loading from database
    return [
      { id: 'usr-juri1', username: 'juri1', label: 'Juri 1', name: 'Dewan Juri 1', email: '', role: 'juri' as const, avatar: '🎙️', roleTitle: 'Dewan Juri 1', isActive: true },
      { id: 'usr-juri2', username: 'juri2', label: 'Juri 2', name: 'Dewan Juri 2', email: '', role: 'juri' as const, avatar: '🎵', roleTitle: 'Dewan Juri 2', isActive: true },
      { id: 'usr-juri3', username: 'juri3', label: 'Juri 3', name: 'Dewan Juri 3', email: '', role: 'juri' as const, avatar: '🔥', roleTitle: 'Dewan Juri 3', isActive: true },
      { id: 'usr-juri4', username: 'juri4', label: 'Juri 4', name: 'Dewan Juri 4', email: '', role: 'juri' as const, avatar: '✨', roleTitle: 'Dewan Juri 4', isActive: true },
      { id: 'usr-juri5', username: 'juri5', label: 'Juri 5', name: 'Dewan Juri 5', email: '', role: 'juri' as const, avatar: '🌟', roleTitle: 'Dewan Juri 5', isActive: true },
    ];
  }, [adminUsers]);

  // Active scoring judge (if judge, locked to themselves; if superadmin, can inspect/switch judge sheet)
  const defaultJudgeId = currentUser.role === 'juri' ? currentUser.id : (judgesList[0]?.id || 'usr-juri1');
  const [activeJudgeId, setActiveJudgeId] = useState<string>(defaultJudgeId);

  const activeJudgeInfo = useMemo(() => {
    const found = judgesList.find((j) => j.id === activeJudgeId || j.username === activeJudgeId);
    if (found) return found;

    if (currentUser.role === 'juri') {
      const dbUser = adminUsers.find((u) => u.id === currentUser.id || u.username === currentUser.username);
      const u = dbUser || currentUser;
      return {
        id: u.id,
        username: u.username,
        label: u.name || currentUser.name || 'Juri',
        name: u.name || currentUser.name || 'Dewan Juri',
        avatar: u.avatar || currentUser.avatar || '🎙️',
        roleTitle: u.roleTitle || 'Dewan Juri',
      };
    }

    return judgesList[0] || {
      id: currentUser.id,
      username: currentUser.username,
      label: currentUser.name,
      name: currentUser.name,
      avatar: currentUser.avatar || '🎙️',
      roleTitle: 'Dewan Juri',
    };
  }, [judgesList, activeJudgeId, currentUser, adminUsers]);

  // Filter participants to only those with status "confirmed" or "done" for judge scoring
  // Diurutkan secara tegas berdasarkan Urutan Tampil (orderNumber 1 - 30) agar memudahkan juri dalam menilai
  const confirmedParticipants = useMemo(() => {
    return participants
      .filter(
        (p) =>
          p.status === 'confirmed' ||
          p.status === 'done' ||
          (p.status as string)?.toLowerCase() === 'confirmed' ||
          (p.status as string)?.toLowerCase() === 'done'
      )
      .sort((a, b) => {
        const orderA = typeof a.orderNumber === 'number' && a.orderNumber > 0 ? a.orderNumber : 999999;
        const orderB = typeof b.orderNumber === 'number' && b.orderNumber > 0 ? b.orderNumber : 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (new Date(a.created_at).getTime() || 0) - (new Date(b.created_at).getTime() || 0);
      });
  }, [participants]);

  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    () => confirmedParticipants[0]?.id || ''
  );

  // Sync selected participant when confirmedParticipants updates
  useEffect(() => {
    if (confirmedParticipants.length > 0) {
      const exists = confirmedParticipants.some((p) => p.id === selectedParticipantId);
      if (!exists) {
        setSelectedParticipantId(confirmedParticipants[0].id);
      }
    }
  }, [confirmedParticipants, selectedParticipantId]);

  // Mobile drawer state for participant selector
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Search & filter states for participant list sidebar
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scored' | 'unscored'>('all');
  const [filterBagan, setFilterBagan] = useState<number | 'all'>('all');

  const selectedParticipant =
    confirmedParticipants.find((p) => p.id === selectedParticipantId) || confirmedParticipants[0];

  // Current participant index and navigation helpers (strictly following stage appearance order)
  const currentParticipantIndex = useMemo(() => {
    return confirmedParticipants.findIndex((p) => p.id === selectedParticipant?.id);
  }, [confirmedParticipants, selectedParticipant?.id]);

  const prevParticipant =
    currentParticipantIndex > 0 ? confirmedParticipants[currentParticipantIndex - 1] : null;
  const nextParticipant =
    currentParticipantIndex >= 0 && currentParticipantIndex < confirmedParticipants.length - 1
      ? confirmedParticipants[currentParticipantIndex + 1]
      : null;

  // Scored counts for active judge
  const scoredCount = useMemo(() => {
    return confirmedParticipants.filter(
      (p) => p.scores?.judgeScores?.[activeJudgeInfo.id]?.total !== undefined
    ).length;
  }, [confirmedParticipants, activeJudgeInfo.id]);

  const unscoredCount = confirmedParticipants.length - scoredCount;
  const progressPercent =
    confirmedParticipants.length > 0
      ? Math.round((scoredCount / confirmedParticipants.length) * 100)
      : 0;

  // Filtered participant list based on search, status, and optional bagan filter
  const filteredParticipants = useMemo(() => {
    return confirmedParticipants.filter((p) => {
      const myJudgeScore = p.scores?.judgeScores?.[activeJudgeInfo.id];
      const hasMyScore = myJudgeScore?.total !== undefined;
      if (filterStatus === 'scored' && !hasMyScore) return false;
      if (filterStatus === 'unscored' && hasMyScore) return false;

      if (filterBagan !== 'all') {
        const pOrder = typeof p.orderNumber === 'number' ? p.orderNumber : 0;
        if (pOrder <= 0) return false;
        const pBagan = Math.ceil(pOrder / 6);
        if (pBagan !== filterBagan) return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(term) ||
        (p.familyName && p.familyName.toLowerCase().includes(term)) ||
        (p.idolSong && p.idolSong.toLowerCase().includes(term)) ||
        (p.idolArtist && p.idolArtist.toLowerCase().includes(term)) ||
        String(p.orderNumber || '').includes(term) ||
        (p.orderNumber ? `bagan ${Math.ceil(p.orderNumber / 6)}`.includes(term) : false)
      );
    });
  }, [confirmedParticipants, activeJudgeInfo.id, filterStatus, filterBagan, searchTerm]);

  // Get current active judge's individual score sheet for selected participant
  const currentJudgeScores: JudgeScoreDetail | undefined =
    selectedParticipant?.scores?.judgeScores?.[activeJudgeInfo.id];
  const hasExistingScore = Boolean(currentJudgeScores && currentJudgeScores.total !== undefined);

  // Form states initialized to current judge's evaluation (default to 0)
  const [teknikalitas, setTeknikalitas] = useState<number>(() => currentJudgeScores?.teknikalitas ?? 0);
  const [kemiripan, setKemiripan] = useState<number>(() => currentJudgeScores?.kemiripan ?? 0);
  const [penjiwaan, setPenjiwaan] = useState<number>(() => currentJudgeScores?.penjiwaan ?? 0);
  const [presentasi, setPresentasi] = useState<number>(() => currentJudgeScores?.presentasi ?? 0);
  const [judgeNotes, setJudgeNotes] = useState<string>(() => currentJudgeScores?.notes ?? '');

  // Lock state: If already scored in database, lock slides to prevent accidental changes
  const [isLocked, setIsLocked] = useState<boolean>(() => hasExistingScore);

  // Modals for "Are you sure?" validation and unlock confirmation
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showUnlockConfirmModal, setShowUnlockConfirmModal] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when selecting a different participant or switching judge view
  const handleSelectParticipant = (p: Participant) => {
    setSelectedParticipantId(p.id);
    const jScore = p.scores?.judgeScores?.[activeJudgeInfo.id];
    const hasScore = Boolean(jScore && jScore.total !== undefined);
    setTeknikalitas(jScore?.teknikalitas ?? 0);
    setKemiripan(jScore?.kemiripan ?? 0);
    setPenjiwaan(jScore?.penjiwaan ?? 0);
    setPresentasi(jScore?.presentasi ?? 0);
    setJudgeNotes(jScore?.notes ?? '');
    setIsLocked(hasScore);
    setSaveSuccess(false);
    setShowConfirmModal(false);
    setShowUnlockConfirmModal(false);
    setIsMobileDrawerOpen(false);
  };

  // Helper stepper to adjust scores incrementally on mobile
  const adjustScore = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
    min: number,
    max: number
  ) => {
    if (isLocked) return;
    setter((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      if (next < min) return min;
      if (next > max) return max;
      return next;
    });
  };

  const handleSwitchJudgeView = (jId: string) => {
    setActiveJudgeId(jId);
    if (selectedParticipant) {
      const jScore = selectedParticipant.scores?.judgeScores?.[jId];
      const hasScore = Boolean(jScore && jScore.total !== undefined);
      setTeknikalitas(jScore?.teknikalitas ?? 0);
      setKemiripan(jScore?.kemiripan ?? 0);
      setPenjiwaan(jScore?.penjiwaan ?? 0);
      setPresentasi(jScore?.presentasi ?? 0);
      setJudgeNotes(jScore?.notes ?? '');
      setIsLocked(hasScore);
      setSaveSuccess(false);
      setShowConfirmModal(false);
      setShowUnlockConfirmModal(false);
    }
  };

  // Unlock handlers
  const handleRequestUnlock = () => {
    if (hasExistingScore) {
      setShowUnlockConfirmModal(true);
    } else {
      setIsLocked(false);
    }
  };

  const handleConfirmUnlock = () => {
    setIsLocked(false);
    setShowUnlockConfirmModal(false);
  };

  // Cancel edit and re-lock
  const handleCancelEdit = () => {
    if (currentJudgeScores) {
      setTeknikalitas(currentJudgeScores.teknikalitas ?? 0);
      setKemiripan(currentJudgeScores.kemiripan ?? 0);
      setPenjiwaan(currentJudgeScores.penjiwaan ?? 0);
      setPresentasi(currentJudgeScores.presentasi ?? 0);
      setJudgeNotes(currentJudgeScores.notes ?? '');
    }
    setIsLocked(true);
    setShowConfirmModal(false);
  };

  // Calculate live total for active judge's sheet
  const currentTotal = Math.round((teknikalitas + kemiripan + penjiwaan + presentasi) * 10) / 10;

  // Open Save Confirmation Breakdown Modal
  const handleOpenSaveConfirmation = () => {
    if (!selectedParticipant) return;
    setShowConfirmModal(true);
  };

  // Execute Save Score to Supabase
  const handleExecuteSaveScore = async () => {
    if (!selectedParticipant) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await submitJudgeIndividualScore(
        selectedParticipant.id,
        activeJudgeInfo.id,
        activeJudgeInfo.name,
        {
          teknikalitas: Number(teknikalitas),
          kemiripan: Number(kemiripan),
          penjiwaan: Number(penjiwaan),
          presentasi: Number(presentasi),
          notes: judgeNotes.trim(),
        }
      );

      if (!res.success) {
        alert(res.error || 'Gagal menyimpan lembar nilai juri');
        setIsSaving(false);
        return;
      }

      setSaveSuccess(true);
      setIsLocked(true);
      setShowConfirmModal(false);
      onRefresh();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert('Gagal menyimpan nilai: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif-luxury text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              <span>Lembar Penilaian Dewan Juri</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              1 Juri = 1 Lembar Nilai
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Penilaian murni berbasis audio: <strong>30% Teknikalitas</strong>, <strong>30% Kemiripan</strong>, <strong>20% Penjiwaan</strong>, dan <strong>20% Presentasi Audio</strong> (Total {judgesList.length} Dewan Juri).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Chat Juri Button */}
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/50 p-2.5 px-3.5 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 group"
            title="Buka Chat Real-time Dewan Juri"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[9.5px] text-amber-400 uppercase font-mono font-bold block leading-tight">
                Diskusi Real-time
              </span>
              <p className="text-xs font-bold text-slate-100 leading-tight">Chat Juri</p>
            </div>
          </button>

          {/* Judge Active Card */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2.5 px-4 rounded-2xl shadow-lg">
            <span className="text-2xl">{activeJudgeInfo.avatar}</span>
            <div>
              <span className="text-[10px] text-amber-400 uppercase font-mono font-bold block">
                Lembar Nilai Aktif
              </span>
              <p className="text-xs font-bold text-slate-100">{activeJudgeInfo.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Superadmin Mode Judge Switcher */}
      {isSuperadmin && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="font-bold">Mode Superadmin:</span>
            <span className="text-slate-400">Pilih lembar nilai juri yang ingin diisi/ditinjau:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {judgesList.map((j) => (
              <button
                key={j.id}
                onClick={() => handleSwitchJudgeView(j.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeJudgeId === j.id
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{j.avatar}</span>
                <span>{j.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Context & Navigation Header */}
      {selectedParticipant && (
        <div className="lg:hidden sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border border-amber-400/30 rounded-2xl p-3.5 shadow-2xl shadow-black/80 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
                  Urut #{selectedParticipant.orderNumber || currentParticipantIndex + 1}
                </span>
                {selectedParticipant.orderNumber && selectedParticipant.orderNumber >= 1 && selectedParticipant.orderNumber <= 30 && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-sans font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 shrink-0">
                    Bagan {Math.ceil(selectedParticipant.orderNumber / 6)}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {selectedParticipant.familyName}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-100 truncate mt-0.5">
                {selectedParticipant.fullName}
              </h3>
              <p className="text-[11px] text-amber-300 truncate">
                🎵 {selectedParticipant.idolSong}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[9px] text-slate-400 uppercase font-mono block leading-none">
                  Total Anda
                </span>
                <span className="text-sm font-black font-mono text-amber-400">
                  {currentTotal.toFixed(1)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:border-amber-400/40 active:scale-95 transition-all relative flex items-center justify-center"
                title="Buka Chat Juri"
                aria-label="Buka Chat Juri"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-95 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px]">Daftar</span>
              </button>
            </div>
          </div>

          {/* Quick Prev / Next Participant Navigation (Ordered by Appearance) */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <button
              type="button"
              disabled={!prevParticipant}
              onClick={() => prevParticipant && handleSelectParticipant(prevParticipant)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:border-amber-400/40 active:scale-95 transition-all truncate"
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="font-mono font-bold text-amber-300">#{prevParticipant?.orderNumber ?? '-'}</span>
              <span className="truncate max-w-[80px]">{prevParticipant ? prevParticipant.fullName : 'Awal'}</span>
            </button>

            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              #{selectedParticipant.orderNumber || currentParticipantIndex + 1} ({currentParticipantIndex + 1}/{confirmedParticipants.length})
            </span>

            <button
              type="button"
              disabled={!nextParticipant}
              onClick={() => nextParticipant && handleSelectParticipant(nextParticipant)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:border-amber-400/40 active:scale-95 transition-all truncate"
            >
              <span className="font-mono font-bold text-amber-300">#{nextParticipant?.orderNumber ?? '-'}</span>
              <span className="truncate max-w-[80px]">{nextParticipant ? nextParticipant.fullName : 'Akhir'}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Participant List (Desktop) & Right Audio Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Participant List with Independent Dynamic Scroll (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-4 bg-slate-900/95 border border-slate-800 rounded-3xl p-4 shadow-2xl flex-col lg:sticky lg:top-20 lg:h-[calc(100vh-6.5rem)] backdrop-blur-md overflow-hidden">
          {/* Header & Participant Count */}
          <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-800 shrink-0">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Urutan Tampil Peserta</span>
              <span className="text-[10px] text-slate-400">Sesuai Jadwal Panggung (#1 - #30)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                {confirmedParticipants.length} Confirmed
              </span>
            </div>
          </div>

          {/* Quick Search & Status Filter */}
          <div className="pt-3 pb-2 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari peserta / no urut / lagu..."
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`flex-1 py-1 px-1 rounded-lg text-center transition-all ${
                  filterStatus === 'all'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua ({confirmedParticipants.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('scored')}
                className={`flex-1 py-1 px-1 rounded-lg text-center transition-all ${
                  filterStatus === 'scored'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dinilai ({scoredCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('unscored')}
                className={`flex-1 py-1 px-1 rounded-lg text-center transition-all ${
                  filterStatus === 'unscored'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Belum ({unscoredCount})
              </button>
            </div>

            {/* Quick Bagan Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[9px] font-mono">
              <button
                type="button"
                onClick={() => setFilterBagan('all')}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-all ${
                  filterBagan === 'all'
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                Semua Bagan
              </button>
              {[1, 2, 3, 4, 5].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setFilterBagan(b)}
                  className={`px-1.5 py-0.5 rounded-md whitespace-nowrap transition-all ${
                    filterBagan === b
                      ? 'bg-pink-500 text-white font-bold'
                      : 'bg-slate-950 text-pink-400/80 border border-pink-500/20 hover:border-pink-500/40'
                  }`}
                  title={`Bagan ${b}: Peserta #${(b - 1) * 6 + 1} - #${b * 6}`}
                >
                  Bagan {b}
                </button>
              ))}
            </div>
          </div>

          {/* Independent Scrollable List of Participants */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 custom-scrollbar overscroll-contain my-1">
            {filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 italic px-2">
                {searchTerm
                  ? `Tidak ada peserta yang cocok dengan "${searchTerm}".`
                  : 'Tidak ada peserta pada kategori/bagan ini.'}
              </div>
            ) : (
              filteredParticipants.map((p, idx) => {
                const isSelected = p.id === selectedParticipant?.id;
                const myJudgeScore = p.scores?.judgeScores?.[activeJudgeInfo.id];
                const hasMyScore = myJudgeScore?.total !== undefined;
                const completedJudgesCount = p.scores?.judgeScores
                  ? Object.keys(p.scores.judgeScores).length
                  : 0;
                const baganNum =
                  p.orderNumber && p.orderNumber >= 1 && p.orderNumber <= 30
                    ? Math.ceil(p.orderNumber / 6)
                    : null;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectParticipant(p)}
                    className={`w-full p-2.5 rounded-2xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-semibold'
                        : 'bg-slate-950/60 hover:bg-slate-800/90 border border-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-black flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-slate-950 text-amber-300 border-amber-400/40 shadow-sm'
                            : 'bg-slate-800 text-amber-400 border-slate-700/80'
                        }`}
                        title={`Urutan Tampil #${p.orderNumber || idx + 1}`}
                      >
                        #{p.orderNumber || idx + 1}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <p className="text-xs font-bold truncate leading-tight">{p.fullName}</p>
                          {baganNum && (
                            <span
                              className={`text-[9px] font-mono px-1 rounded shrink-0 font-bold ${
                                isSelected
                                  ? 'bg-slate-950/20 text-slate-950'
                                  : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              }`}
                            >
                              B{baganNum}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] truncate mt-0.5 ${
                            isSelected ? 'text-slate-800 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {p.idolSong} • {p.familyName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end">
                      {hasMyScore ? (
                        <span
                          className={`text-xs font-mono font-black px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-slate-950 text-amber-300'
                              : 'bg-amber-400/15 text-amber-300 border border-amber-400/20'
                          }`}
                        >
                          {myJudgeScore.total?.toFixed(1)}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] italic ${
                            isSelected ? 'text-slate-800 font-medium' : 'text-slate-500'
                          }`}
                        >
                          Belum dinilai
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono mt-0.5 ${
                          isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {completedJudgesCount}/{judgesList.length} Juri
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Sticky Sidebar Footer: Active Judge Progress Bar */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Progress Nilai {activeJudgeInfo.name}:</span>
              <span className="text-amber-400 font-bold">
                {scoredCount}/{confirmedParticipants.length} Peserta ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Audio Scoring Form & Multi-Judge Sheet */}
        <div className="w-full lg:col-span-8 xl:col-span-8 space-y-6">
          {selectedParticipant ? (
            <>
              {/* Stage Performance Sequence Navigator (Desktop & Tablet) */}
              <div className="hidden sm:flex bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!prevParticipant}
                  onClick={() => prevParticipant && handleSelectParticipant(prevParticipant)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:border-amber-400/40 active:scale-95 transition-all cursor-pointer"
                  title={prevParticipant ? `Peserta Sebelumnya: #${prevParticipant.orderNumber} ${prevParticipant.fullName}` : 'Sudah di peserta pertama'}
                >
                  <ChevronLeft className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 font-mono block leading-none">Sebelumnya</span>
                    <span className="font-bold text-xs text-amber-300 truncate max-w-[130px] block mt-0.5">
                      #{prevParticipant?.orderNumber ?? '-'} {prevParticipant?.fullName}
                    </span>
                  </div>
                </button>

                <div className="text-center px-2">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-mono font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-xl">
                      Urutan Tampil #{selectedParticipant.orderNumber || currentParticipantIndex + 1}
                    </span>
                    {selectedParticipant.orderNumber && selectedParticipant.orderNumber >= 1 && selectedParticipant.orderNumber <= 30 && (
                      <span className="text-[11px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-1 rounded-xl">
                        Bagan {Math.ceil(selectedParticipant.orderNumber / 6)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">
                    Peserta ke-{currentParticipantIndex + 1} dari {confirmedParticipants.length} (Sesuai Urutan Tampil Panggung)
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!nextParticipant}
                  onClick={() => nextParticipant && handleSelectParticipant(nextParticipant)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:border-amber-400/40 active:scale-95 transition-all cursor-pointer"
                  title={nextParticipant ? `Peserta Selanjutnya: #${nextParticipant.orderNumber} ${nextParticipant.fullName}` : 'Sudah di peserta terakhir'}
                >
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono block leading-none">Berikutnya</span>
                    <span className="font-bold text-xs text-amber-300 truncate max-w-[130px] block mt-0.5">
                      #{nextParticipant?.orderNumber ?? '-'} {nextParticipant?.fullName}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              </div>

              {/* Participant Profile Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30">
                        Urutan Tampil #{selectedParticipant.orderNumber || currentParticipantIndex + 1}
                      </span>
                      {selectedParticipant.orderNumber && selectedParticipant.orderNumber >= 1 && selectedParticipant.orderNumber <= 30 && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-sans font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          Bagan {Math.ceil(selectedParticipant.orderNumber / 6)}
                        </span>
                      )}
                      {selectedParticipant.idpopup !== undefined && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          ID PopUp: #{selectedParticipant.idpopup}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        Family: {selectedParticipant.familyName}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1.5">
                      {selectedParticipant.fullName}
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-300/90 mt-0.5">
                      🎵 Lagu Idola: <strong>"{selectedParticipant.idolSong}"</strong> (Artis Idola:{' '}
                      {selectedParticipant.idolArtist || 'Penyanyi Asli'})
                    </p>
                  </div>

                  {/* Audio Link */}
                  {selectedParticipant.audioLink ? (
                    <a
                      href={selectedParticipant.audioLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors shadow-sm"
                    >
                      <Music2 className="w-4 h-4 text-blue-400" />
                      <span>Putar Audio Minus-One</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                      Minus-One Live Stage
                    </span>
                  )}
                </div>

                {/* 5 Judge Comparison Cards for this Participant */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                      <span>Status 5 Lembar Nilai Juri</span>
                    </span>
                    {selectedParticipant.totalScore !== undefined && (
                      <span className="text-xs font-mono font-bold text-amber-400">
                        Total Akumulasi: {selectedParticipant.totalScore.toFixed(1)} Poin
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {judgesList.map((j) => {
                      const jScore = selectedParticipant.scores?.judgeScores?.[j.id];
                      const isCurrentActive = activeJudgeId === j.id;
                      return (
                        <div
                          key={j.id}
                          onClick={() => isSuperadmin && handleSwitchJudgeView(j.id)}
                          className={`p-3 rounded-2xl border transition-all ${
                            isCurrentActive
                              ? 'bg-amber-400/10 border-amber-400/50 shadow-md'
                              : 'bg-slate-950/60 border-slate-800/80'
                          } ${isSuperadmin ? 'cursor-pointer hover:border-amber-400/40' : ''}`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1 gap-1">
                            <span className="font-bold text-slate-200 flex items-center gap-1 min-w-0" title={j.name}>
                              <span className="shrink-0">{j.avatar}</span>
                              <span className="truncate">{j.name}</span>
                            </span>
                            {jScore ? (
                              <span className="font-mono font-black text-amber-400 text-sm shrink-0">
                                {jScore.total?.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic shrink-0">Belum</span>
                            )}
                          </div>

                          {jScore ? (
                            <p className="text-[9px] text-slate-400 font-mono truncate">
                              T:{jScore.teknikalitas} M:{jScore.kemiripan} J:{jScore.penjiwaan} P:{jScore.presentasi}
                            </p>
                          ) : (
                            <p className="text-[9px] text-slate-600 font-mono">Menunggu input</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rubric Sliders for Current Judge Sheet */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6 pb-24 lg:pb-8">
                {/* Clear Participant Evaluation Reminder Header inside Form */}
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                      Target Lembar Nilai Juri
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                      Peserta: <span className="text-amber-300">{selectedParticipant.fullName}</span> (#{selectedParticipant.orderNumber || currentParticipantIndex + 1})
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-mono">Penilai:</span>
                    <span className="text-xs font-bold text-amber-400">{activeJudgeInfo.name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="font-serif-luxury font-bold text-slate-100 text-lg">
                      Input 4 Pilar Penilaian Audio
                    </h4>
                    <p className="text-xs text-slate-400">
                      Gunakan tombol <span className="text-amber-400 font-bold">[-] [+]</span> atau geser slider untuk akurasi nilai
                    </p>
                  </div>
                  <span className="text-2xl">{activeJudgeInfo.avatar}</span>
                </div>

                {/* Lock Status / Edit Mode Banner */}
                {isLocked ? (
                  <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-sky-300">Lembar Nilai Terkunci</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30">
                            TERSIMPAN
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Slide dan stepper nilai dikunci untuk mencegah perubahan yang tidak disengaja.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestUnlock}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Nilai</span>
                    </button>
                  </div>
                ) : hasExistingScore ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Unlock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300">Mode Edit Nilai Aktif</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                            KUNCI DIBUKA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Silakan sesuaikan slider nilai, lalu simpan perubahan Anda.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Batal Ubah</span>
                    </button>
                  </div>
                ) : null}

                <div className="space-y-5">
                  {/* 1. TEKNIKALITAS (30%) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <Music2 className="w-4 h-4 text-amber-400" />
                        <span>1. Teknikalitas Vokal (Maks 30%)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => adjustScore(setTeknikalitas, -0.5, 0, 30)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Kurangi 0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-base sm:text-lg font-mono font-black text-amber-400 min-w-[54px] text-center">
                          {teknikalitas.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => adjustScore(setTeknikalitas, 0.5, 0, 30)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Tambah 0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ketepatan nada (pitch/fals), tempo & ketukan, kontrol pernapasan, dinamika vokal, dan kestabilan suara.
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="0.5"
                      disabled={isLocked}
                      value={teknikalitas}
                      onChange={(e) => setTeknikalitas(parseFloat(e.target.value))}
                      className={`w-full h-2 rounded-lg appearance-none accent-amber-400 ${
                        isLocked ? 'bg-slate-900 cursor-not-allowed opacity-50' : 'bg-slate-800 cursor-pointer'
                      }`}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.0 (Dasar)</span>
                      <span>15.0 (Sedang)</span>
                      <span>30.0 (Sempurna)</span>
                    </div>
                  </div>

                  {/* 2. KEMIRIPAN (30%) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-amber-400" />
                        <span>2. Kemiripan Karakter Idola (Maks 30%)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => adjustScore(setKemiripan, -0.5, 0, 30)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Kurangi 0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-base sm:text-lg font-mono font-black text-amber-400 min-w-[54px] text-center">
                          {kemiripan.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => adjustScore(setKemiripan, 0.5, 0, 30)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Tambah 0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Karakter suara (timbre), cengkok vokal khas idola, vibrasi, artikulasi gaya khas penyanyi idola.
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="0.5"
                      disabled={isLocked}
                      value={kemiripan}
                      onChange={(e) => setKemiripan(parseFloat(e.target.value))}
                      className={`w-full h-2 rounded-lg appearance-none accent-amber-400 ${
                        isLocked ? 'bg-slate-900 cursor-not-allowed opacity-50' : 'bg-slate-800 cursor-pointer'
                      }`}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.0 (Kurang Mirip)</span>
                      <span>15.0 (Cukup Mirip)</span>
                      <span>30.0 (Sangat Identik)</span>
                    </div>
                  </div>

                  {/* 3. PENJIWAAN (20%) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span>3. Penjiwaan & Soul (Maks 20%)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => adjustScore(setPenjiwaan, -0.5, 0, 20)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Kurangi 0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-base sm:text-lg font-mono font-black text-amber-400 min-w-[54px] text-center">
                          {penjiwaan.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => adjustScore(setPenjiwaan, 0.5, 0, 20)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Tambah 0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Penghayatan makna lirik, ekspresi emosional yang tertuang dalam audio vokal, penyampaian rasa ke pendengar.
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      disabled={isLocked}
                      value={penjiwaan}
                      onChange={(e) => setPenjiwaan(parseFloat(e.target.value))}
                      className={`w-full h-2 rounded-lg appearance-none accent-amber-400 ${
                        isLocked ? 'bg-slate-900 cursor-not-allowed opacity-50' : 'bg-slate-800 cursor-pointer'
                      }`}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.0 (Datar)</span>
                      <span>10.0 (Menyentuh)</span>
                      <span>20.0 (Sangat Mendalam)</span>
                    </div>
                  </div>

                  {/* 4. PRESENTASI AUDIO (20%) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>4. Presentasi Audio & Flow (Maks 20%)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => adjustScore(setPresentasi, -0.5, 0, 20)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Kurangi 0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-base sm:text-lg font-mono font-black text-amber-400 min-w-[54px] text-center">
                          {presentasi.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => adjustScore(setPresentasi, 0.5, 0, 20)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Tambah 0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Kejelasan artikulasi vokal, keseimbangan audio suara dengan minus-one, transisi dinamika, dan kerapian audio.
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      disabled={isLocked}
                      value={presentasi}
                      onChange={(e) => setPresentasi(parseFloat(e.target.value))}
                      className={`w-full h-2 rounded-lg appearance-none accent-amber-400 ${
                        isLocked ? 'bg-slate-900 cursor-not-allowed opacity-50' : 'bg-slate-800 cursor-pointer'
                      }`}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.0 (Standar)</span>
                      <span>10.0 (Jernih & Rapi)</span>
                      <span>20.0 (Masterclass Audio)</span>
                    </div>
                  </div>
                </div>

                {/* Judge Commentary Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Catatan Khusus dari {activeJudgeInfo.name}:
                  </label>
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    value={judgeNotes}
                    onChange={(e) => setJudgeNotes(e.target.value)}
                    placeholder={
                      isLocked
                        ? 'Lembar nilai terkunci. Klik tombol Edit Nilai untuk mengubah catatan.'
                        : 'Tuliskan catatan teknis vokal atau masukan spesifik untuk peserta ini...'
                    }
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none transition-colors resize-none ${
                      isLocked
                        ? 'bg-slate-950/50 border-slate-800/60 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-400'
                    }`}
                  />
                </div>

                {/* Total & Save/Edit Score Button (Desktop: visible; Mobile: hidden so only Floating Bottom Action Bar is shown) */}
                <div className="pt-4 border-t border-slate-800 hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono flex items-center gap-1.5">
                      <span>Total Lembar Nilai Ini ({activeJudgeInfo.name}):</span>
                      {isLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                          <Lock className="w-3 h-3" /> Terkunci
                        </span>
                      )}
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black font-mono text-amber-400">
                        {currentTotal.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">/ 100.0 Poin</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Lembar Nilai Tersimpan!</span>
                      </motion.div>
                    )}

                    {isLocked ? (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleRequestUnlock}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit Nilai Juri</span>
                        </button>
                        {nextParticipant && (
                          <button
                            type="button"
                            onClick={() => handleSelectParticipant(nextParticipant)}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                            title={`Lanjut ke Urutan Tampil #${nextParticipant.orderNumber} (${nextParticipant.fullName})`}
                          >
                            <span>Lanjut ke #{nextParticipant.orderNumber} ({nextParticipant.fullName.split(' ')[0]})</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {hasExistingScore && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
                          >
                            Batal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleOpenSaveConfirmation}
                          disabled={isSaving}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{hasExistingScore ? 'Simpan Perubahan Nilai' : 'Simpan Lembar Nilai Juri'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                {confirmedParticipants.length === 0
                  ? 'Belum Ada Peserta Terkonfirmasi'
                  : 'Pilih Peserta Lomba'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {confirmedParticipants.length === 0
                  ? 'Dashboard penilaian juri hanya menampilkan peserta dengan status "Confirmed". Pastikan panitia telah mengonfirmasi pendaftaran peserta di tab Peserta.'
                  : 'Pilih salah satu peserta dari daftar di sebelah kiri untuk mulai mengisi lembar penilaian juri.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Action Bar for Mobile View */}
      {selectedParticipant && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 bg-slate-950/95 border border-amber-400/50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              Menilai: <strong className="text-slate-200">#{selectedParticipant.orderNumber || currentParticipantIndex + 1} {selectedParticipant.fullName}</strong>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black font-mono text-amber-400">
                {currentTotal.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/ 100 Poin</span>
              {isLocked && (
                <span className="text-[9px] font-mono text-sky-400 font-bold ml-1">
                  (🔒 Terkunci)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {saveSuccess && (
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> OK!
              </span>
            )}

            {isLocked ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRequestUnlock}
                  className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-500/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {nextParticipant && (
                  <button
                    type="button"
                    onClick={() => handleSelectParticipant(nextParticipant)}
                    className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    title={`Lanjut ke #${nextParticipant.orderNumber}`}
                  >
                    <span>#{nextParticipant.orderNumber}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {hasExistingScore && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenSaveConfirmation}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/30 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{hasExistingScore ? 'Simpan Ubah' : 'Simpan Nilai'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation & Detailed Validation Modal Before Save */}
      <AnimatePresence>
        {showConfirmModal && selectedParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-lg bg-slate-900 border border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100">
                      Konfirmasi Lembar Nilai
                    </h3>
                    <p className="text-xs text-slate-400">
                      Periksa kembali rincian poin sebelum disimpan ke server
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Participant & Judge Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-amber-400 block uppercase">
                    Peserta Lomba (#{selectedParticipant.orderNumber || currentParticipantIndex + 1})
                  </span>
                  <h4 className="text-sm font-bold text-slate-100 truncate">
                    {selectedParticipant.fullName}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {selectedParticipant.idolSong} • Mirip: {selectedParticipant.idolArtist}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-mono">Penilai:</span>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
                    <span>{activeJudgeInfo.avatar}</span>
                    <span>{activeJudgeInfo.name}</span>
                  </span>
                </div>
              </div>

              {/* 4 Pillars Detailed Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Rincian 4 Pilar Penilaian:
                </span>
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-amber-400" />
                      1. Teknikalitas Vokal (Maks 30%)
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {teknikalitas.toFixed(1)} pt
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-amber-400" />
                      2. Kemiripan Karakter Idola (Maks 30%)
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {kemiripan.toFixed(1)} pt
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      3. Penjiwaan & Soul (Maks 20%)
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {penjiwaan.toFixed(1)} pt
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      4. Presentasi Audio & Flow (Maks 20%)
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {presentasi.toFixed(1)} pt
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-200">Total Akumulasi Poin:</span>
                    <span className="text-base font-black font-mono text-amber-400">
                      {currentTotal.toFixed(1)} / 100.0 pt
                    </span>
                  </div>
                </div>
              </div>

              {/* Commentary Review */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 block font-mono mb-1">
                  Catatan Juri:
                </span>
                <p className="text-slate-200 italic">
                  {judgeNotes.trim() ? `"${judgeNotes.trim()}"` : '(Tidak ada catatan khusus)'}
                </p>
              </div>

              {/* Validation / Are You Sure Warning */}
              {currentTotal === 0 ? (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Peringatan:</strong> Total nilai masih 0.0 poin. Pastikan Anda telah menggeser slider nilai sebelum menyimpan.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-start gap-2.5 text-xs text-amber-200">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Are you sure?</strong> Setelah disimpan, lembar nilai ini akan otomatis <strong>dikunci</strong> untuk keamanan data.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  Batal / Cek Ulang
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleExecuteSaveScore}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan ke Server...' : 'Ya, Konfirmasi & Simpan Nilai'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unlock Confirmation Modal (Are you sure to Edit?) */}
      <AnimatePresence>
        {showUnlockConfirmModal && selectedParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnlockConfirmModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-slate-900 border border-sky-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto">
                <Unlock className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  Buka Kunci untuk Edit Nilai?
                </h3>
                <p className="text-xs text-slate-400">
                  Lembar nilai untuk <strong className="text-slate-200">{selectedParticipant.fullName}</strong> saat ini terkunci dengan total nilai{' '}
                  <strong className="text-amber-400 font-mono font-bold">
                    {currentJudgeScores?.total?.toFixed(1) || currentTotal.toFixed(1)} poin
                  </strong>
                  .
                </p>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/20 text-xs text-sky-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Are you sure?</strong> Membuka kunci akan mengaktifkan kembali slider dan stepper agar Anda dapat memperbarui skor.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal (Tetap Kunci)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnlock}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Ya, Buka Kunci & Edit</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer / Bottom Sheet for Participant Selection */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-h-[85vh] bg-slate-900 border-t border-amber-400/40 rounded-t-3xl p-4 sm:p-5 shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Handle */}
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 shrink-0" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Pilih Peserta Lomba</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pilih peserta untuk membuka lembar penilaian juri
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Filter */}
              <div className="py-3 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari peserta / lagu / family..."
                    className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      filterStatus === 'all'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    Semua ({confirmedParticipants.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('scored')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      filterStatus === 'scored'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    Dinilai ({scoredCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('unscored')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      filterStatus === 'unscored'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    Belum ({unscoredCount})
                  </button>
                </div>

                {/* Quick Bagan Filter Pills in Mobile Drawer */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar text-[9px] font-mono">
                  <button
                    type="button"
                    onClick={() => setFilterBagan('all')}
                    className={`px-2 py-1 rounded-md whitespace-nowrap transition-all ${
                      filterBagan === 'all'
                        ? 'bg-slate-200 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Semua Bagan
                  </button>
                  {[1, 2, 3, 4, 5].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFilterBagan(b)}
                      className={`px-2 py-1 rounded-md whitespace-nowrap transition-all ${
                        filterBagan === b
                          ? 'bg-pink-500 text-white font-bold'
                          : 'bg-slate-950 text-pink-400/80 border border-pink-500/20'
                      }`}
                    >
                      Bagan {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
                {filteredParticipants.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 italic">
                    Tidak ada peserta yang sesuai.
                  </div>
                ) : (
                  filteredParticipants.map((p, idx) => {
                    const isSelected = p.id === selectedParticipant?.id;
                    const myJudgeScore = p.scores?.judgeScores?.[activeJudgeInfo.id];
                    const hasMyScore = myJudgeScore?.total !== undefined;
                    const baganNum =
                      p.orderNumber && p.orderNumber >= 1 && p.orderNumber <= 30
                        ? Math.ceil(p.orderNumber / 6)
                        : null;

                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectParticipant(p)}
                        className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-semibold'
                            : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div
                            className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-slate-950 text-amber-300 border-amber-400/40 shadow-sm'
                                : 'bg-slate-800 text-amber-400 border-slate-700'
                            }`}
                          >
                            #{p.orderNumber || idx + 1}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 truncate">
                              <p className="text-xs font-bold truncate">{p.fullName}</p>
                              {baganNum && (
                                <span
                                  className={`text-[9px] font-mono px-1 rounded shrink-0 font-bold ${
                                    isSelected
                                      ? 'bg-slate-950/20 text-slate-950'
                                      : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                  }`}
                                >
                                  B{baganNum}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[10px] truncate mt-0.5 ${
                                isSelected ? 'text-slate-800' : 'text-slate-400'
                              }`}
                            >
                              {p.idolSong} • {p.familyName}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {hasMyScore ? (
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-slate-950 text-amber-300'
                                  : 'bg-amber-400/15 text-amber-300'
                              }`}
                            >
                              {myJudgeScore.total?.toFixed(1)}
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] italic ${
                                isSelected ? 'text-slate-800' : 'text-slate-500'
                              }`}
                            >
                              Belum
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Judge Chat Floating Dock & Mobile Bottom Sheet */}
      <JudgeChatDock
        currentUser={currentUser}
        activeJudgeId={activeJudgeId}
        judgesList={judgesList}
        currentParticipant={selectedParticipant}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
        onSelectParticipant={(participantId) => {
          const found = participants.find((p) => p.id === participantId);
          if (found) {
            handleSelectParticipant(found);
          }
        }}
      />
    </div>
  );
};
