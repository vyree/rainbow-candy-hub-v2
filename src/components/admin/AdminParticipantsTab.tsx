import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Music,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  RefreshCw,
  Hash,
  XCircle,
  Clock,
  ChevronDown,
  Download,
  Image as ImageIcon,
  Layers,
  Eye,
  Calendar,
} from 'lucide-react';
import { Participant, RegistrationFormData, AdminUser, ParticipantStatus } from '../../types/participant';
import { RCEvent } from '../../types/event';
import {
  registerParticipant,
  updateParticipant,
  deleteParticipant,
  formatValue,
  getLocalEvents,
} from '../../services/supabaseClient';
import { ParticipantDownloadJPGModal } from './ParticipantDownloadJPGModal';
import { BaganAcaraDownloadModal } from './BaganAcaraDownloadModal';

interface AdminParticipantsTabProps {
  participants: Participant[];
  currentUser: AdminUser;
  onRefresh: () => void;
  onOpenScoreModal?: (participant: Participant) => void;
}

export const AdminParticipantsTab: React.FC<AdminParticipantsTabProps> = ({
  participants,
  currentUser,
  onRefresh,
  onOpenScoreModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [eventsList, setEventsList] = useState<RCEvent[]>(() => getLocalEvents());

  // Listen for local events updates
  React.useEffect(() => {
    const handleEventsUpdate = (e: Event) => {
      const custom = e as CustomEvent<RCEvent[]>;
      if (custom.detail) {
        setEventsList(custom.detail);
      }
    };
    window.addEventListener('rc_events_updated', handleEventsUpdate);
    return () => window.removeEventListener('rc_events_updated', handleEventsUpdate);
  }, []);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDownloadJPGModalOpen, setIsDownloadJPGModalOpen] = useState(false);
  const [isBaganModalOpen, setIsBaganModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);

  // Form State
  const [formData, setFormData] = useState<RegistrationFormData>({
    idpopup: '',
    fullName: '',
    familyName: '',
    idolSong: '',
    idolArtist: '',
    whatsapp: '',
    notes: '',
    status: 'pending',
    audioLink: '',
    orderNumber: undefined,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role viewer detection
  const isViewer = currentUser?.role === 'viewer';
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);

  // Extract unique families safely
  const uniqueFamilies = Array.from(new Set((participants || []).map((p) => p?.familyName))).filter(Boolean) as string[];

  // Status statistics for quick overview
  const statusStats = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let done = 0;
    let canceled = 0;
    let disqualificated = 0;
    (participants || []).forEach((p) => {
      const st = (p?.status as ParticipantStatus) || 'pending';
      if (st === 'confirmed') confirmed++;
      else if (st === 'done') done++;
      else if (st === 'canceled') canceled++;
      else if (st === 'disqualificated') disqualificated++;
      else pending++;
    });
    return { pending, confirmed, done, canceled, disqualificated, total: (participants || []).length };
  }, [participants]);

  // Filtered participants (Utamakan peserta confirmed dan done nomor 1-30, status lain ditaruh di bawahnya)
  const filtered = useMemo(() => {
    return (participants || [])
      .filter((p) => {
        if (!p) return false;
        const search = (searchTerm || '').toLowerCase().trim();
        const fullName = (p.fullName || '').toLowerCase();
        const familyName = (p.familyName || '').toLowerCase();
        const idolSong = (p.idolSong || '').toLowerCase();
        const idolArtist = (p.idolArtist || '').toLowerCase();
        const idpopupStr = p.idpopup !== undefined && p.idpopup !== null ? String(p.idpopup) : '';
        const wa = p.whatsapp || '';

        const matchesSearch =
          !search ||
          fullName.includes(search) ||
          familyName.includes(search) ||
          idolSong.includes(search) ||
          idolArtist.includes(search) ||
          idpopupStr.includes(search) ||
          wa.includes(search);

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesFamily = familyFilter === 'all' || p.familyName === familyFilter;
        const matchesEvent = eventFilter === 'all' || (p.eventId || 'rc-virgo-party-2026') === eventFilter;

        return matchesSearch && matchesStatus && matchesFamily && matchesEvent;
      })
      .sort((a, b) => {
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        // Prioritaskan status aktif lomba: confirmed dan done
        const aActive = a.status === 'confirmed' || a.status === 'done';
        const bActive = b.status === 'confirmed' || b.status === 'done';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        // Jika sama-sama aktif, urutkan berdasarkan orderNumber (1..30)
        const aOrder = a.orderNumber !== undefined && a.orderNumber !== null ? a.orderNumber : 999999;
        const bOrder = b.orderNumber !== undefined && b.orderNumber !== null ? b.orderNumber : 999999;
        if (aOrder !== bOrder) return aOrder - bOrder;

        return (a.fullName || '').localeCompare(b.fullName || '');
      });
  }, [participants, searchTerm, statusFilter, familyFilter, eventFilter]);

  // Open Create Modal
  const handleOpenAdd = () => {
    if (isViewer) return;
    setFormData({
      idpopup: '',
      fullName: '',
      familyName: '',
      eventId: eventFilter !== 'all' ? eventFilter : (eventsList[0]?.id || 'rc-virgo-party-2026'),
      idolSong: '',
      idolArtist: '',
      whatsapp: '+628',
      notes: '',
      status: 'pending',
      audioLink: '',
      orderNumber: participants.length + 1,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Participant) => {
    if (isViewer) {
      setViewingParticipant(p);
      return;
    }
    setEditingParticipant(p);
    setFormData({
      idpopup: p.idpopup !== undefined ? p.idpopup : '',
      fullName: p.fullName,
      familyName: p.familyName,
      eventId: p.eventId || 'rc-virgo-party-2026',
      idolSong: p.idolSong,
      idolArtist: p.idolArtist || '',
      whatsapp: p.whatsapp,
      notes: p.notes || '',
      status: p.status || 'pending',
      audioLink: p.audioLink || '',
      orderNumber: p.orderNumber,
    });
    setFormError(null);
  };

  // Save (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setFormError('Mode Viewer: Anda tidak memiliki izin untuk menginput atau mengubah data.');
      return;
    }
    if (!formData.fullName.trim() || !formData.familyName.trim() || !formData.idolSong.trim()) {
      setFormError('Nama, Family, dan Judul Lagu wajib diisi.');
      return;
    }

    let parsedIdPopup: number | undefined = undefined;
    if (formData.idpopup !== undefined && formData.idpopup !== '' && formData.idpopup !== null) {
      const cleanDigits = String(formData.idpopup).replace(/^#+/, '').replace(/[^0-9]/g, '').trim();
      if (cleanDigits !== '') {
        const parsed = parseInt(cleanDigits, 10);
        if (isNaN(parsed) || parsed < 0) {
          setFormError('ID PopUp harus berupa angka integer valid.');
          return;
        }
        parsedIdPopup = parsed;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingParticipant) {
        // UPDATE
        const res = await updateParticipant(
          editingParticipant.id,
          {
            idpopup: parsedIdPopup,
            fullName: formData.fullName,
            familyName: formData.familyName,
            eventId: formData.eventId || editingParticipant.eventId || 'rc-virgo-party-2026',
            idolSong: formData.idolSong,
            idolArtist: formData.idolArtist || undefined,
            whatsapp: formData.whatsapp,
            notes: formData.notes || undefined,
            status: (formData.status as ParticipantStatus) || 'pending',
            audioLink: formData.audioLink || undefined,
            orderNumber: formData.orderNumber,
          },
          currentUser.name
        );
        if (!res.success) {
          setFormError(res.error || 'Gagal memperbarui data peserta.');
          setIsSubmitting(false);
          return;
        }
        setEditingParticipant(null);
      } else {
        // CREATE
        const res = await registerParticipant(
          {
            ...formData,
            idpopup: parsedIdPopup,
            eventId: formData.eventId || (eventFilter !== 'all' ? eventFilter : 'rc-virgo-party-2026'),
            status: (formData.status as ParticipantStatus) || 'pending',
          },
          currentUser.name
        );
        if (!res.success) {
          setFormError(res.error || 'Gagal menambahkan peserta.');
          setIsSubmitting(false);
          return;
        }
        setIsAddModalOpen(false);
      }
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (isViewer) {
      alert('Mode Viewer: Anda tidak memiliki izin untuk menghapus data.');
      return;
    }
    if (!deletingParticipant) return;
    setIsSubmitting(true);
    try {
      await deleteParticipant(deletingParticipant.id, currentUser.name);
      setDeletingParticipant(null);
      onRefresh();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Status Change handler
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleQuickStatusChange = async (p: Participant, newStatus: ParticipantStatus) => {
    if (isViewer) return;
    if (p.status === newStatus) return;
    setUpdatingStatusId(p.id);
    try {
      const res = await updateParticipant(
        p.id,
        { status: newStatus },
        currentUser.name
      );
      if (!res.success) {
        alert(res.error || 'Gagal mengubah status peserta');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengubah status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Interactive Status Selector Component
  const renderStatusSelector = (p: Participant) => {
    const currentStatus = (p.status as ParticipantStatus) || 'pending';
    const isUpdating = updatingStatusId === p.id;

    const getStatusColor = (st: ParticipantStatus) => {
      switch (st) {
        case 'done':
          return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
        case 'confirmed':
          return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25';
        case 'canceled':
          return 'bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30';
        case 'disqualificated':
          return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30';
        case 'pending':
        default:
          return 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25';
      }
    };

    if (isViewer) {
      const getStatusLabel = (st: ParticipantStatus) => {
        switch (st) {
          case 'done':
            return '🎯 Done';
          case 'confirmed':
            return '✅ Confirmed';
          case 'canceled':
            return '❌ Canceled';
          case 'disqualificated':
            return '⚠️ Disqualified';
          case 'pending':
          default:
            return '⏳ Pending';
        }
      };

      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold border select-none ${getStatusColor(
            currentStatus
          )}`}
          title={`Status: ${currentStatus}`}
        >
          {getStatusLabel(currentStatus)}
        </span>
      );
    }

    return (
      <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
        <select
          value={currentStatus}
          disabled={isUpdating}
          onChange={(e) => handleQuickStatusChange(p, e.target.value as ParticipantStatus)}
          className={`appearance-none cursor-pointer font-mono font-semibold rounded-full border transition-all pl-2.5 pr-6 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-sm disabled:opacity-50 ${getStatusColor(
            currentStatus
          )}`}
          title="Klik untuk langsung mengubah status peserta (Pending, Confirmed, Done, Canceled, Disqualified)"
        >
          <option value="pending" className="bg-slate-900 text-amber-300">⏳ Pending</option>
          <option value="confirmed" className="bg-slate-900 text-emerald-300">✅ Confirmed</option>
          <option value="done" className="bg-slate-900 text-blue-300">🎯 Done (Selesai Event)</option>
          <option value="canceled" className="bg-slate-900 text-slate-400">❌ Canceled</option>
          <option value="disqualificated" className="bg-slate-900 text-red-400">⚠️ Disqualificated</option>
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none opacity-70" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-luxury text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Manajemen Data Peserta</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {participants.length} peserta terdaftar • Lengkapi ID PopUp, data lagu idola dan status konfirmasi
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsBaganModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 hover:from-pink-500/30 hover:to-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            title="Download Bagan Susunan Acara (Bagan 1 s/d 5 - Total 6 Halaman PNG/JPG)"
          >
            <Layers className="w-4 h-4 text-pink-400" />
            <span>Bagan Acara (6 Hal)</span>
            <span className="px-1.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[10px] font-mono font-bold border border-pink-500/30">
              No. 1-30
            </span>
          </button>

          <button
            onClick={() => setIsDownloadJPGModalOpen(true)}
            disabled={filtered.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download Data Peserta Terfilter (Format PNG / JPG)"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download Data PNG / JPG</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
              {filtered.length}
            </span>
          </button>

          {!isViewer && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Input Data Peserta Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Viewer Info Notice */}
      {isViewer && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Mode Viewer (Hanya Cek Data):</strong> Akun Anda berhak melihat seluruh data peserta, susunan bagan lomba, status, dan skor. Fitur input, edit, dan hapus dinonaktifkan sesuai hak akses.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30 w-fit shrink-0">
            VIEWER READ ONLY
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari ID PopUp, nama peserta, family, lagu idola, atau WA..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
          />
        </div>

        {/* Event Filter */}
        <div>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-400"
          >
            <option value="all">🎪 Semua Event ({participants.length})</option>
            {eventsList.map((ev) => {
              const count = participants.filter((p) => (p.eventId || 'rc-virgo-party-2026') === ev.id).length;
              return (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Semua Status ({participants.length})</option>
            <option value="pending">⏳ Pending ({statusStats.pending})</option>
            <option value="confirmed">✅ Confirmed ({statusStats.confirmed})</option>
            <option value="done">🎯 Done / Selesai Event ({statusStats.done})</option>
            <option value="canceled">❌ Canceled ({statusStats.canceled})</option>
            <option value="disqualificated">⚠️ Disqualificated ({statusStats.disqualificated})</option>
          </select>
        </div>

        {/* Family Filter */}
        <div>
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Semua Family ({uniqueFamilies.length})</option>
            {uniqueFamilies.map((fam) => (
              <option key={fam} value={fam}>
                {fam}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Status Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Semua ({statusStats.total})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('confirmed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'confirmed'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          <span>✅ Confirmed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{statusStats.confirmed}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('done')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'done'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
          }`}
        >
          <span>🎯 Done (Selesai Event)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{statusStats.done}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
          }`}
        >
          <span>⏳ Pending</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{statusStats.pending}</span>
        </button>

        {statusStats.canceled > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('canceled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'canceled'
                ? 'bg-slate-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <span>❌ Canceled</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{statusStats.canceled}</span>
          </button>
        )}

        {statusStats.disqualificated > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('disqualificated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'disqualificated'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            <span>⚠️ Disqualified</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{statusStats.disqualificated}</span>
          </button>
        )}
      </div>

      {/* Filter Information & Quick Download Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-2 py-1 text-xs">
        <div className="flex items-center gap-2 flex-wrap text-slate-400">
          <span>
            Menampilkan <strong className="text-amber-400 font-mono font-bold">{filtered.length}</strong> dari{' '}
            <strong className="text-slate-200 font-mono font-bold">{participants.length}</strong> peserta
          </span>
          {(statusFilter !== 'all' || familyFilter !== 'all' || searchTerm) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
              <Filter className="w-3 h-3 text-amber-400" />
              <span>
                Filter Aktif: {statusFilter !== 'all' ? `Status: ${statusFilter}` : ''}
                {familyFilter !== 'all' ? ` • Family: ${familyFilter}` : ''}
                {searchTerm ? ` • "${searchTerm}"` : ''}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsBaganModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 hover:from-pink-500/30 hover:to-amber-500/30 text-amber-300 border border-amber-500/35 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <span>Bagan Acara (6 Hal PNG/JPG)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDownloadJPGModalOpen(true)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-pink-500/15 hover:from-amber-500/25 hover:to-pink-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Unduh {filtered.length} Data Peserta (PNG / JPG)</span>
          </button>
        </div>
      </div>

      {/* Participants List Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* MOBILE VIEW: Compact, Clear, Legible Cards */}
        <div className="block md:hidden p-4 space-y-3">
          {filtered.length > 0 ? (
            filtered.map((p, idx) => (
              <div
                key={p.id}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition-all shadow-md space-y-3"
              >
                {/* Header: ID PopUp & Status Direct Switcher */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.orderNumber !== undefined && p.orderNumber !== null ? (
                      <span className="font-mono text-xs font-bold text-amber-300">
                        #{p.orderNumber}
                        {(p.status === 'confirmed' || p.status === 'done') && p.orderNumber >= 1 && p.orderNumber <= 30 && (
                          <span className="ml-1 text-[10px] text-pink-400 font-sans font-medium">
                            (Bagan {Math.ceil(p.orderNumber / 6)})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-slate-500 font-normal">
                        -
                      </span>
                    )}
                    {p.idpopup !== undefined ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono font-bold">
                        ID: #{p.idpopup}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono italic">
                        ID: not available
                      </span>
                    )}
                  </div>
                  {/* Status Tag - Direct Quick Change */}
                  <div>{renderStatusSelector(p)}</div>
                </div>

                {/* Event & Juri Tag */}
                {(() => {
                  const evId = p.eventId || 'rc-virgo-party-2026';
                  const ev = eventsList.find((e) => e.id === evId);
                  const title = ev ? ev.title : evId;
                  const judges = (ev?.judges || []).map((j: any) => typeof j === 'string' ? j : j?.name || '');
                  return (
                    <div className="flex items-center justify-between gap-2 text-[11px] bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-amber-300 font-medium truncate">
                        <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{title}</span>
                      </span>
                      {judges.length > 0 && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          Juri: {judges.filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Body: Nama Peserta & Family */}
                <div>
                  <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5 flex-wrap">
                    <span>{p.fullName}</span>
                    {p.winnerTitle && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                        {p.winnerTitle}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
                    <span className="font-medium text-slate-300">{formatValue(p.familyName)}</span>
                  </div>
                </div>

                {/* Body: Lagu & Idola */}
                <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/40 text-xs">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{formatValue(p.idolSong)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 pl-5">
                    Mirip:{' '}
                    <span className="text-slate-300 font-medium">{formatValue(p.idolArtist)}</span>
                  </div>
                  {p.audioLink && (
                    <div className="mt-1.5 pl-5">
                      <a
                        href={p.audioLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                      >
                        <span>Link Audio Minus-One</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer: WhatsApp Link & Edit Button */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div>
                    {p.whatsapp && p.whatsapp !== '-' ? (
                      <a
                        href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-mono transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{p.whatsapp}</span>
                      </a>
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">WA: not available</span>
                    )}
                  </div>

                  {isViewer ? (
                    <button
                      onClick={() => setViewingParticipant(p)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Lihat Detail</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Data</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs">
              Tidak ada data peserta yang cocok dengan kriteria pencarian.
            </div>
          )}
        </div>

        {/* DESKTOP VIEW: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">No / Urut</th>
                <th className="py-3.5 px-4 font-semibold">Event & Juri</th>
                <th className="py-3.5 px-4 font-semibold">ID PopUp</th>
                <th className="py-3.5 px-4 font-semibold">Nama Peserta & Family</th>
                <th className="py-3.5 px-4 font-semibold">Lagu & Artis Idola</th>
                <th className="py-3.5 px-4 font-semibold">WhatsApp</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Skor Audio</th>
                <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map((p, idx) => {
                  const hasScores = p.scores && p.totalScore !== undefined;
                  const judgeCount = p.scores?.judgeScores ? Object.keys(p.scores.judgeScores).length : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Order / Number - Berurutan dari 1 (Mudah Dihitung) */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {p.orderNumber !== undefined && p.orderNumber !== null ? (
                          <>
                            <span className="text-amber-300 text-sm">#{p.orderNumber}</span>
                            {(p.status === 'confirmed' || p.status === 'done') && p.orderNumber >= 1 && p.orderNumber <= 30 && (
                              <span className="block text-[10px] text-pink-400 font-sans font-medium">
                                Bagan {Math.ceil(p.orderNumber / 6)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500 font-normal">-</span>
                        )}
                      </td>

                      {/* Event & Juri */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const evId = p.eventId || 'rc-virgo-party-2026';
                          const ev = eventsList.find((e) => e.id === evId);
                          const title = ev ? ev.title : evId;
                          const judges = (ev?.judges || []).map((j: any) => typeof j === 'string' ? j : j?.name || '');
                          return (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-mono font-bold max-w-[140px] truncate" title={title}>
                                <Calendar className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{title}</span>
                              </span>
                              {judges.length > 0 && (
                                <div className="text-[10px] text-slate-400 font-sans max-w-[140px] truncate" title={`Juri: ${judges.filter(Boolean).join(', ')}`}>
                                  <span className="text-slate-500 font-mono">Juri:</span> {judges.filter(Boolean).join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* ID PopUp */}
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        {p.idpopup !== undefined ? (
                          <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[11px]">
                            #{p.idpopup}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">not available</span>
                        )}
                      </td>

                      {/* Name & Family */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                          <span>{p.fullName}</span>
                          {p.winnerTitle && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                              {p.winnerTitle}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          <span>{formatValue(p.familyName)}</span>
                        </div>
                      </td>

                      {/* Song & Artist */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{formatValue(p.idolSong)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Mirip:{' '}
                          <span className="text-slate-300 font-medium">
                            {formatValue(p.idolArtist)}
                          </span>
                        </div>
                        {p.audioLink ? (
                          <a
                            href={p.audioLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline mt-1"
                          >
                            <span>Audio Minus-One</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 block mt-0.5">Audio: not available</span>
                        )}
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-4 font-mono">
                        {p.whatsapp && p.whatsapp !== '-' ? (
                          <a
                            href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{p.whatsapp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">not available</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusSelector(p)}
                      </td>

                      {/* Scores */}
                      <td className="py-3.5 px-4 font-mono">
                        {hasScores ? (
                          <div>
                            <span className="text-sm font-black text-amber-400">
                              {p.totalScore?.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {judgeCount > 0 ? `${judgeCount} Juri Dinilai` : '1 Juri Dinilai'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">not available</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end">
                          {isViewer ? (
                            <button
                              onClick={() => setViewingParticipant(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/30 transition-colors cursor-pointer"
                              title="Lihat Detail Data Peserta"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                              title="Edit Data Peserta"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Tidak ada data peserta yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INPUT / EDIT DATA PESERTA */}
      <AnimatePresence>
        {(isAddModalOpen || editingParticipant) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div>
                  <h3 className="font-serif-luxury font-bold text-xl text-slate-100">
                    {editingParticipant ? 'Edit Data Peserta' : 'Input Peserta Baru'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lomba Menyanyi Mirip Idola • RC Birthday & Virgo Party
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingParticipant(null);
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                  {formError}
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmitForm} className="space-y-4">
                {/* Event Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Event yang Diikuti *</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Pemisah Antar-Event</span>
                  </label>
                  <select
                    value={formData.eventId || 'rc-virgo-party-2026'}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-medium cursor-pointer"
                  >
                    {eventsList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.status.toUpperCase()}) {ev.judges?.length ? `• Juri: ${ev.judges.join(', ')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Lengkap Peserta *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="cth: Aurelia Stella"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Family RC *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.familyName}
                      onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                      placeholder="cth: RC Royal Blossom"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* ID PopUp Column */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-amber-400" />
                      <span>ID PopUp (Integer)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Opsional / Angka</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.idpopup !== undefined ? formData.idpopup : ''}
                    onChange={(e) => setFormData({ ...formData, idpopup: e.target.value })}
                    placeholder="cth: 53106499 (jika kosong: not available)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Judul Lagu Idola *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.idolSong}
                      onChange={(e) => setFormData({ ...formData, idolSong: e.target.value })}
                      placeholder="cth: Sang Dewi"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Artis / Penyanyi Idola
                    </label>
                    <input
                      type="text"
                      value={formData.idolArtist || ''}
                      onChange={(e) => setFormData({ ...formData, idolArtist: e.target.value })}
                      placeholder="cth: Lyodra / Titi DJ (jika kosong: not available)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nomor WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+6281234567890"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status Peserta (Default: Pending)
                    </label>
                    <select
                      value={formData.status || 'pending'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="pending">⏳ Pending (Default)</option>
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="done">🎯 Done (Selesai Mengikuti Event)</option>
                      <option value="canceled">❌ Canceled</option>
                      <option value="disqualificated">⚠️ Disqualificated</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nomor Urut Tampil
                    </label>
                    <input
                      type="number"
                      value={formData.orderNumber || ''}
                      onChange={(e) => setFormData({ ...formData, orderNumber: parseInt(e.target.value) || undefined })}
                      placeholder="cth: 1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Link Audio / Minus-One (Opsional)
                    </label>
                    <input
                      type="url"
                      value={formData.audioLink || ''}
                      onChange={(e) => setFormData({ ...formData, audioLink: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Catatan Khusus Panitia / Juri
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan kunci nada, versi lagu, atau kebutuhan audio..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                {/* Submit Buttons & Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
                  {editingParticipant ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = editingParticipant;
                        setEditingParticipant(null);
                        setDeletingParticipant(target);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Peserta</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setEditingParticipant(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-lg shadow-amber-400/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Menyimpan...' : editingParticipant ? 'Simpan Perubahan' : 'Tambah Peserta'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE CONFIRMATION */}
      <AnimatePresence>
        {deletingParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 text-center">
                Konfirmasi Hapus Peserta
              </h3>
              <p className="text-xs text-slate-400 text-center mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus data peserta{' '}
                <strong className="text-slate-100">{deletingParticipant.fullName}</strong> ({deletingParticipant.familyName})?
                Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingParticipant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Data'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DETAIL PESERTA (READ-ONLY UNTUK VIEWER) */}
      <AnimatePresence>
        {viewingParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury font-bold text-lg text-slate-100">
                      Detail Data Peserta
                    </h3>
                    <p className="text-xs text-slate-400">
                      Mode Viewer • Tinjauan Informasi Lengkap
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingParticipant(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Card Grid */}
              <div className="space-y-4 text-xs">
                {/* ID & Order Number */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Nomor Urut Tampil</span>
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {viewingParticipant.orderNumber !== undefined && viewingParticipant.orderNumber !== null
                        ? `#${viewingParticipant.orderNumber}`
                        : '-'}
                    </span>
                    {viewingParticipant.orderNumber !== undefined &&
                      viewingParticipant.orderNumber !== null &&
                      viewingParticipant.orderNumber >= 1 &&
                      viewingParticipant.orderNumber <= 30 && (
                        <span className="ml-1 text-[10px] text-pink-400 font-sans">
                          (Bagan {Math.ceil(viewingParticipant.orderNumber / 6)})
                        </span>
                      )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">ID PopUp Registrasi</span>
                    {viewingParticipant.idpopup !== undefined ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 font-mono font-bold">
                        #{viewingParticipant.idpopup}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">not available</span>
                    )}
                  </div>
                </div>

                {/* Nama & Gelar */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                  <span className="text-slate-400 block text-[11px]">Nama Lengkap & Panggilan</span>
                  <div className="font-bold text-base text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>{viewingParticipant.fullName}</span>
                    {viewingParticipant.winnerTitle && (
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                        {viewingParticipant.winnerTitle}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    <span>Family: <strong>{formatValue(viewingParticipant.familyName)}</strong></span>
                  </div>
                </div>

                {/* Lagu & Idola */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span>{formatValue(viewingParticipant.idolSong)}</span>
                  </div>
                  <div className="text-slate-400 pl-5">
                    Mirip Artis: <span className="text-slate-200 font-medium">{formatValue(viewingParticipant.idolArtist)}</span>
                  </div>
                  {viewingParticipant.audioLink && (
                    <div className="pl-5 pt-1">
                      <a
                        href={viewingParticipant.audioLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        <span>Buka Link Audio Minus-One</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Kontak WhatsApp & Status */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">WhatsApp</span>
                    {viewingParticipant.whatsapp && viewingParticipant.whatsapp !== '-' ? (
                      <a
                        href={`https://wa.me/${viewingParticipant.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-mono"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{viewingParticipant.whatsapp}</span>
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">not available</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Status Keikutsertaan</span>
                    {renderStatusSelector(viewingParticipant)}
                  </div>
                </div>

                {/* Skor Audio jika ada */}
                {viewingParticipant.totalScore !== undefined && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px] mb-1">Akumulasi Skor Audio Juri</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-black text-amber-400">
                        {viewingParticipant.totalScore.toFixed(1)}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({Object.keys(viewingParticipant.scores?.judgeScores || {}).length} Juri telah menilai)
                      </span>
                    </div>
                  </div>
                )}

                {/* Catatan Khusus */}
                {viewingParticipant.notes && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px] mb-1">Catatan Tambahan</span>
                    <p className="text-slate-300 italic">{viewingParticipant.notes}</p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-5 mt-5 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingParticipant(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Tutup Tinjauan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DOWNLOAD DATA PESERTA (FORMAT JPG / PNG) */}
      <ParticipantDownloadJPGModal
        isOpen={isDownloadJPGModalOpen}
        onClose={() => setIsDownloadJPGModalOpen(false)}
        filteredParticipants={filtered}
        totalAllParticipants={participants.length}
        filters={{
          searchTerm,
          statusFilter,
          familyFilter,
        }}
        currentUser={currentUser}
      />

      {/* MODAL: DOWNLOAD BAGAN ACARA (6 HALAMAN PNG / JPG) */}
      <BaganAcaraDownloadModal
        isOpen={isBaganModalOpen}
        onClose={() => setIsBaganModalOpen(false)}
        participants={participants}
        currentUser={currentUser}
      />
    </div>
  );
};

