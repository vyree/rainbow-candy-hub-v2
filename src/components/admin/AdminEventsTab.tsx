import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Radio,
  Lock,
  Search,
  Sparkles,
  Award,
  Crown,
  AlertTriangle,
  X,
  RefreshCw,
  ShieldCheck,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { RCEvent, EventStatus, EventWinner, EventPrizes } from '../../types/event';
import { AdminUser, Participant } from '../../types/participant';
import {
  fetchEvents,
  saveEvent,
  deleteEvent,
  subscribeToEvents,
  getLocalAdminUsers,
} from '../../services/supabaseClient';

interface AdminEventsTabProps {
  currentUser: AdminUser;
  participants: Participant[];
  onNavigateToEventPreview?: (eventId: string) => void;
}

export const AdminEventsTab: React.FC<AdminEventsTabProps> = ({
  currentUser,
  participants,
  onNavigateToEventPreview,
}) => {
  const [events, setEvents] = useState<RCEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<RCEvent | null>(null);
  const [selectedEventForWinners, setSelectedEventForWinners] = useState<RCEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<RCEvent | null>(null);

  // Form State for Event
  const [formData, setFormData] = useState<Partial<RCEvent>>({
    title: '',
    subtitle: '',
    slug: '',
    category: 'Lomba Musik & Vokal',
    status: 'open',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    time: '10:00 WIB',
    venue: 'Panggung Utama Live Room Rainbow Candy',
    maxParticipants: 50,
    registrationDeadline: '',
    description: '',
    rulesSummary: [],
    prizes: {
      juara1: 'Rp 1.500.000 + E-Sertifikat + Trophy Emas',
      juara2: 'Rp 1.000.000 + E-Sertifikat + Trophy Perak',
      juara3: 'Rp 500.000 + E-Sertifikat + Trophy Perunggu',
    },
    judges: ['Bunda Corla', 'Kak David', 'Mbak Tiara', 'Bang Jono'],
    isFeatured: false,
  });

  // Winner Designation Form State
  const [winnerForm, setWinnerForm] = useState<{
    juara1: Partial<EventWinner>;
    juara2: Partial<EventWinner>;
    juara3: Partial<EventWinner>;
  }>({
    juara1: { rank: 1, title: 'Juara 1 Utama', participantName: '', familyName: '', idolSong: '', idolArtist: '', reward: '' },
    juara2: { rank: 2, title: 'Juara 2', participantName: '', familyName: '', idolSong: '', idolArtist: '', reward: '' },
    juara3: { rank: 3, title: 'Juara 3', participantName: '', familyName: '', idolSong: '', idolArtist: '', reward: '' },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper to format judges to string
  const formatJudgesToString = (judgesList: any): string => {
    if (!judgesList) return '';
    if (Array.isArray(judgesList)) {
      return judgesList
        .map((j) => (typeof j === 'string' ? j : j?.name || ''))
        .filter(Boolean)
        .join(', ');
    }
    if (typeof judgesList === 'string') return judgesList;
    return '';
  };

  // Available Judges in system
  const availableJudges = useMemo(() => {
    try {
      const adminUsers = getLocalAdminUsers();
      return (Array.isArray(adminUsers) ? adminUsers : []).filter((u) => u && u.role === 'juri');
    } catch {
      return [];
    }
  }, []);

  const isSuperadmin = currentUser.role === 'superadmin';

  // Load Events
  const loadEventsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchEvents();
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load events in CMS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEventsData();
    const unsubscribe = subscribeToEvents((updated) => {
      if (Array.isArray(updated)) {
        setEvents(updated);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEventsData();
    setIsRefreshing(false);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return list.filter((ev) => {
      if (!ev) return false;
      const matchStatus = statusFilter === 'all' ? true : ev.status === statusFilter;
      const q = (searchQuery || '').trim().toLowerCase();
      const matchQuery =
        !q ||
        (ev.title || '').toLowerCase().includes(q) ||
        (ev.category || '').toLowerCase().includes(q) ||
        (ev.subtitle && ev.subtitle.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q));

      return matchStatus && matchQuery;
    });
  }, [events, statusFilter, searchQuery]);

  // Event Stats
  const stats = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return {
      total: list.length,
      open: list.filter((e) => e?.status === 'open').length,
      ongoing: list.filter((e) => e?.status === 'ongoing').length,
      ended: list.filter((e) => e?.status === 'ended').length,
    };
  }, [events]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      id: `rc-event-${Date.now()}`,
      slug: `event-${Date.now()}`,
      title: '',
      subtitle: '',
      category: 'Lomba Nyanyi Mirip Idola',
      status: 'open',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      time: '10:00 WIB',
      venue: 'Panggung Utama Live Room Rainbow Candy',
      maxParticipants: 50,
      registrationDeadline: '2026-09-12 23:59 WIB',
      description: '',
      rulesSummary: [
        'Terbuka untuk seluruh member keluarga Fams & umum',
        'Lagu idola bebas dengan audio kualitas jernih',
        'Keputusan dewan juri bersifat mutlak dan final',
      ],
      prizes: {
        juara1: 'Rp 1.500.000 + E-Sertifikat + Trophy Emas',
        juara2: 'Rp 1.000.000 + E-Sertifikat + Trophy Perak',
        juara3: 'Rp 500.000 + E-Sertifikat + Trophy Perunggu',
      },
      judges: availableJudges.length > 0 ? availableJudges.map((j) => j.name) : ['Bunda Corla', 'Kak David', 'Mbak Tiara', 'Bang Jono'],
      winners: [],
      isFeatured: false,
    });
    setFormError(null);
    setIsEventModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (event: RCEvent) => {
    setEditingEvent(event);

    const normalizedJudges = Array.isArray(event.judges)
      ? event.judges.map((j: any) => (typeof j === 'string' ? j : j?.name || '')).filter(Boolean)
      : typeof event.judges === 'string'
      ? (event.judges as string).split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const normalizedRules = Array.isArray(event.rulesSummary)
      ? event.rulesSummary.map(String).filter(Boolean)
      : typeof event.rulesSummary === 'string'
      ? (event.rulesSummary as string).split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    setFormData({
      ...event,
      prizes: event.prizes || {
        juara1: '',
        juara2: '',
        juara3: '',
      },
      rulesSummary: normalizedRules,
      judges: normalizedJudges,
    });
    setFormError(null);
    setIsEventModalOpen(true);
  };

  // Open Winner Management Modal
  const handleOpenWinnerModal = (event: RCEvent) => {
    setSelectedEventForWinners(event);
    const existingWinners = Array.isArray(event.winners) ? event.winners : [];
    const w1 = existingWinners.find((w) => w.rank === 1);
    const w2 = existingWinners.find((w) => w.rank === 2);
    const w3 = existingWinners.find((w) => w.rank === 3);

    setWinnerForm({
      juara1: {
        rank: 1,
        title: 'Juara 1 Utama',
        participantName: w1?.participantName || '',
        familyName: w1?.familyName || '',
        idolSong: w1?.idolSong || '',
        idolArtist: w1?.idolArtist || '',
        reward: w1?.reward || event.prizes?.juara1 || 'Rp 1.500.000 + E-Sertifikat + Trophy',
        notes: w1?.notes || 'Performa vokal terbaik dengan penjiwaan luar biasa',
      },
      juara2: {
        rank: 2,
        title: 'Juara 2',
        participantName: w2?.participantName || '',
        familyName: w2?.familyName || '',
        idolSong: w2?.idolSong || '',
        idolArtist: w2?.idolArtist || '',
        reward: w2?.reward || event.prizes?.juara2 || 'Rp 1.000.000 + E-Sertifikat',
        notes: w2?.notes || 'Artikulasi dan keselarasan nada yang sangat stabil',
      },
      juara3: {
        rank: 3,
        title: 'Juara 3',
        participantName: w3?.participantName || '',
        familyName: w3?.familyName || '',
        idolSong: w3?.idolSong || '',
        idolArtist: w3?.idolArtist || '',
        reward: w3?.reward || event.prizes?.juara3 || 'Rp 500.000 + E-Sertifikat',
        notes: w3?.notes || 'Karakter suara kuat dan memukau penonton',
      },
    });

    setIsWinnerModalOpen(true);
  };

  // Submit Event Form
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title?.trim()) {
      setFormError('Nama Event wajib diisi');
      return;
    }

    if (!formData.startDate) {
      setFormError('Tanggal pelaksanaan event wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const eventToSave: RCEvent = {
        id: editingEvent ? editingEvent.id : formData.id || `rc-event-${Date.now()}`,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || '',
        category: formData.category || 'Lomba Musik & Vokal',
        status: formData.status || 'open',
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        time: formData.time || '10:00 WIB',
        venue: formData.venue || 'Live Room Rainbow Candy',
        maxParticipants: Number(formData.maxParticipants) || 50,
        registrationDeadline: formData.registrationDeadline || '',
        description: formData.description || '',
        rulesSummary: Array.isArray(formData.rulesSummary) ? formData.rulesSummary : [],
        posterUrl: formData.posterUrl || '',
        bannerUrl: formData.bannerUrl || '',
        prizes: formData.prizes || { juara1: '', juara2: '', juara3: '' },
        judges: formData.judges || [],
        winners: editingEvent ? editingEvent.winners : [],
        isFeatured: Boolean(formData.isFeatured),
        createdAt: editingEvent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await saveEvent(eventToSave, currentUser.name);
      if (res.success) {
        setIsEventModalOpen(false);
        await loadEventsData();
      } else {
        setFormError(res.error || 'Gagal menyimpan event');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan saat menyimpan event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Winner Form
  const handleSubmitWinners = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForWinners) return;

    setIsSubmitting(true);
    try {
      const winnersList: EventWinner[] = [];

      if (winnerForm.juara1.participantName?.trim()) {
        winnersList.push({
          rank: 1,
          title: 'Juara 1 Utama',
          participantName: winnerForm.juara1.participantName.trim(),
          familyName: winnerForm.juara1.familyName?.trim() || 'Rainbow Candy Family',
          idolSong: winnerForm.juara1.idolSong?.trim() || '',
          idolArtist: winnerForm.juara1.idolArtist?.trim() || '',
          reward: winnerForm.juara1.reward?.trim() || selectedEventForWinners.prizes?.juara1 || '',
          notes: winnerForm.juara1.notes?.trim() || '',
        });
      }

      if (winnerForm.juara2.participantName?.trim()) {
        winnersList.push({
          rank: 2,
          title: 'Juara 2',
          participantName: winnerForm.juara2.participantName.trim(),
          familyName: winnerForm.juara2.familyName?.trim() || 'Rainbow Candy Family',
          idolSong: winnerForm.juara2.idolSong?.trim() || '',
          idolArtist: winnerForm.juara2.idolArtist?.trim() || '',
          reward: winnerForm.juara2.reward?.trim() || selectedEventForWinners.prizes?.juara2 || '',
          notes: winnerForm.juara2.notes?.trim() || '',
        });
      }

      if (winnerForm.juara3.participantName?.trim()) {
        winnersList.push({
          rank: 3,
          title: 'Juara 3',
          participantName: winnerForm.juara3.participantName.trim(),
          familyName: winnerForm.juara3.familyName?.trim() || 'Rainbow Candy Family',
          idolSong: winnerForm.juara3.idolSong?.trim() || '',
          idolArtist: winnerForm.juara3.idolArtist?.trim() || '',
          reward: winnerForm.juara3.reward?.trim() || selectedEventForWinners.prizes?.juara3 || '',
          notes: winnerForm.juara3.notes?.trim() || '',
        });
      }

      const updatedEvent: RCEvent = {
        ...selectedEventForWinners,
        winners: winnersList,
        status: 'ended', // Automatically ensure ended status so it displays on public landing page
        updatedAt: new Date().toISOString(),
      };

      await saveEvent(updatedEvent, currentUser.name);
      setIsWinnerModalOpen(false);
      await loadEventsData();
    } catch (err: any) {
      alert('Gagal menyimpan hasil pemenang: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Change Status
  const handleQuickStatusChange = async (event: RCEvent, newStatus: EventStatus) => {
    try {
      const updated = { ...event, status: newStatus, updatedAt: new Date().toISOString() };
      await saveEvent(updated, currentUser.name);
      await loadEventsData();
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  // Delete Event
  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    const targetId = deletingEvent.id;
    try {
      // Optimistic update so UI responds instantly
      setEvents((prev) => prev.filter((e) => e.id !== targetId));
      setDeletingEvent(null);
      await deleteEvent(targetId, currentUser.name);
      await loadEventsData();
    } catch (err) {
      console.error('Error deleting event:', err);
      await loadEventsData();
    }
  };

  // Filter participants of a specific event
  const getEventParticipantsCount = (eventId: string) => {
    return participants.filter((p) => (p.eventId || 'rc-virgo-party-2026') === eventId).length;
  };

  // Helper to prefill winner from existing participants of this event
  const participantsForCurrentEvent = useMemo(() => {
    if (!selectedEventForWinners) return [];
    return participants.filter((p) => (p.eventId || 'rc-virgo-party-2026') === selectedEventForWinners.id);
  }, [selectedEventForWinners, participants]);

  return (
    <div className="space-y-8">
      {/* Top Banner & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif-luxury text-2xl font-bold text-white">
              CMS Manajemen Event Rainbow Candy
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Database Multi-Event
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Atur pembuatan event baru, kuota, periode waktu, alokasi juri, hingga penetapan resmi Juara 1, 2, dan 3 untuk halaman landing publik.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {isSuperadmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-400/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Event Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
          <p className="text-xs text-slate-400 font-mono">Total Event</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left">
          <p className="text-xs text-emerald-400 font-mono">Pendaftaran Buka</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.open}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
          <p className="text-xs text-amber-400 font-mono">Sedang Berlangsung</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{stats.ongoing}</p>
        </div>
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-left">
          <p className="text-xs text-purple-400 font-mono">Selesai (Ended)</p>
          <p className="text-2xl font-bold text-purple-300 mt-1">{stats.ended}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'open', 'ongoing', 'closed', 'ended'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-400 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari event..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* EVENTS LIST TABLE / CARDS */}
      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((ev) => {
            const count = getEventParticipantsCount(ev.id);
            const winnersCount = ev.winners?.length || 0;

            return (
              <div
                key={ev.id}
                className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Title & Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {ev.category}
                      </span>
                      <span className="text-xs font-mono text-slate-500">ID: {ev.id}</span>
                      {ev.id === 'rc-virgo-party-2026' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          EVENT UTAMA / ANNIVERSARY
                        </span>
                      ) : ev.isFeatured ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          FEATURED
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-serif-luxury text-xl font-bold text-white flex items-center gap-2">
                      {ev.title}
                    </h3>
                    {ev.subtitle && <p className="text-xs text-slate-400">{ev.subtitle}</p>}
                  </div>

                  {/* Status Dropdown & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* View in Catalog / Web Preview Button */}
                    {onNavigateToEventPreview && (
                      <button
                        type="button"
                        onClick={() => onNavigateToEventPreview(ev.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                        title="Lihat tampilan publik event ini di Web / Katalog"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Lihat di Web</span>
                      </button>
                    )}

                    {/* Quick Status Select */}
                    <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                      <span className="text-[11px] font-mono text-slate-400 pl-2 pr-1">Status:</span>
                      <select
                        value={ev.status}
                        onChange={(e) => handleQuickStatusChange(ev, e.target.value as EventStatus)}
                        className="bg-slate-950 text-white text-xs rounded-lg px-2 py-1 font-semibold border-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                      >
                        <option value="open">🟢 Open (Buka)</option>
                        <option value="ongoing">🟡 Ongoing</option>
                        <option value="closed">🔒 Closed</option>
                        <option value="ended">🏆 Ended (Selesai)</option>
                      </select>
                    </div>

                    {/* Manage Winners Modal Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenWinnerModal(ev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors cursor-pointer"
                      title="Atur Juara 1, 2, 3 tanpa point untuk publik"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Atur Juara ({winnersCount})</span>
                    </button>

                    {/* Edit Event Button */}
                    {isSuperadmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(ev)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        title="Edit detail event"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Event Button */}
                    {isSuperadmin && (
                      <button
                        type="button"
                        onClick={() => setDeletingEvent(ev)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                        title="Hapus event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub details: Periode, Kuota, Juri, Hadiah */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/60 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Periode & Jam</span>
                    <span className="text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      {ev.startDate} • {ev.time}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Peserta Terdaftar</span>
                    <span className="text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 text-cyan-400" />
                      {count} / {ev.maxParticipants} Kuota
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Hadiah Juara 1</span>
                    <span className="text-amber-300 font-semibold truncate block mt-0.5">
                      {ev.prizes?.juara1 || 'Belum diatur'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Juri Bertugas</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.isArray(ev.judges) && ev.judges.length > 0 ? (
                        ev.judges.slice(0, 3).map((j, i) => {
                          const judgeName = typeof j === 'string' ? j : (j as any)?.name || 'Juri';
                          return (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono"
                            >
                              {judgeName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-slate-500 text-[10px]">Semua Juri</span>
                      )}
                      {Array.isArray(ev.judges) && ev.judges.length > 3 && (
                        <span className="text-slate-500 text-[10px]">+{ev.judges.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Winner Status Banner if event has winners */}
                {Array.isArray(ev.winners) && ev.winners.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Pemenang Resmi Terpasang:</strong> Juara 1 (
                      {ev.winners.find((w) => w.rank === 1)?.participantName || '-'}) • Juara 2 (
                      {ev.winners.find((w) => w.rank === 2)?.participantName || '-'}) • Juara 3 (
                      {ev.winners.find((w) => w.rank === 3)?.participantName || '-'})
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 p-6 rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
            <Calendar className="w-10 h-10 text-amber-400/50 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Tidak ada event yang sesuai</p>
            <p className="text-xs text-slate-500">Silakan ubah filter atau tambahkan event baru.</p>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT EVENT */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-white">
                    {editingEvent ? 'Edit Data Event' : 'Buat Event Baru Rainbow Candy'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data akan otomatis tersimpan di database dan tampil di katalog event publik.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitEvent} className="space-y-4">
                {/* Event Name & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">
                      Nama Event <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Contoh: RC Birthday Celebration 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Tagline / Subtitle</label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Contoh: Kompetisi Nyanyi Mirip Idola"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Kategori & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Kategori Event</label>
                    <select
                      value={formData.category || 'Lomba Musik & Vokal'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Lomba Musik & Vokal">Lomba Musik & Vokal</option>
                      <option value="Lomba Nyanyi Mirip Idola">Lomba Nyanyi Mirip Idola</option>
                      <option value="Karaoke Battle Duet">Karaoke Battle Duet</option>
                      <option value="Konser & Perayaan Fams">Konser & Perayaan Fams</option>
                      <option value="Festival Musik Akustik">Festival Musik Akustik</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Status Pendaftaran</label>
                    <select
                      value={formData.status || 'open'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="open">🟢 Open (Pendaftaran Dibuka)</option>
                      <option value="ongoing">🟡 Ongoing (Sedang Berlangsung)</option>
                      <option value="closed">🔒 Closed (Pendaftaran Ditutup)</option>
                      <option value="ended">🏆 Ended (Selesai & Rekap Juara)</option>
                    </select>
                  </div>
                </div>

                {/* Periode, Waktu, Venue, Kuota */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Tanggal Mulai *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Jam Acara</label>
                    <input
                      type="text"
                      value={formData.time || ''}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="10:00 WIB"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Kuota Peserta</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={formData.maxParticipants || 50}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 50 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Batas Akhir Registrasi & Venue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Batas Akhir Pendaftaran</label>
                    <input
                      type="text"
                      value={formData.registrationDeadline || ''}
                      onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                      placeholder="Contoh: 12 September 2026 23:59 WIB"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Lokasi / Venue</label>
                    <input
                      type="text"
                      value={formData.venue || ''}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Panggung Utama Live Room Rainbow Candy"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Deskripsi Event */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Deskripsi & Informasi Event</label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tuliskan latar belakang, kemeriahan, dan gambaran umum acara ini..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Ketentuan / Aturan Lomba */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    Aturan & Ketentuan Lomba (1 baris = 1 butir aturan)
                  </label>
                  <textarea
                    rows={3}
                    value={Array.isArray(formData.rulesSummary) ? formData.rulesSummary.join('\n') : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rulesSummary: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Terbuka untuk seluruh member keluarga Fams & umum&#10;Lagu idola bebas dengan audio kualitas jernih&#10;Keputusan dewan juri bersifat mutlak dan final"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Aturan ini akan ditampilkan pada halaman detail dan pendaftaran event publik.
                  </p>
                </div>

                {/* Hadiah Pemenang */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-amber-300 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hadiah Lomba</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Juara 1</label>
                      <input
                        type="text"
                        value={formData.prizes?.juara1 || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            prizes: { ...formData.prizes!, juara1: e.target.value },
                          })
                        }
                        placeholder="Rp 1.500.000 + E-Sertifikat + Trophy"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Juara 2</label>
                      <input
                        type="text"
                        value={formData.prizes?.juara2 || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            prizes: { ...formData.prizes!, juara2: e.target.value },
                          })
                        }
                        placeholder="Rp 1.000.000 + E-Sertifikat"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Juara 3</label>
                      <input
                        type="text"
                        value={formData.prizes?.juara3 || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            prizes: { ...formData.prizes!, juara3: e.target.value },
                          })
                        }
                        placeholder="Rp 500.000 + E-Sertifikat"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Dewan Juri Assignment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    Dewan Juri yang Ditugaskan (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={formatJudgesToString(formData.judges)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        judges: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Bunda Corla, Kak David, Mbak Tiara, Bang Jono"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-500">
                    Juri yang ditugaskan akan memiliki wewenang menilai peserta pada event ini.
                  </p>
                </div>

                {/* Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>{editingEvent ? 'Simpan Perubahan' : 'Buat Event Sekarang'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: DESIGNATE JUARA 1, 2, 3 (WITHOUT POINTS) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isWinnerModalOpen && selectedEventForWinners && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl my-8 bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h3 className="font-serif-luxury text-xl font-bold text-white">
                      Penetapan Juara Resmi (Tanpa Point)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Event: <strong>{selectedEventForWinners.title}</strong>. Informasi ini akan langsung tampil di Hall of Fame pada halaman event publik yang sudah berstatus <em>Ended</em>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWinnerModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitWinners} className="space-y-6">
                {/* JUARA 1 */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-amber-300 flex items-center gap-1.5">
                      👑 JUARA 1 UTAMA
                    </span>
                    {participantsForCurrentEvent.length > 0 && (
                      <select
                        onChange={(e) => {
                          const p = participantsForCurrentEvent.find((item) => item.id === e.target.value);
                          if (p) {
                            setWinnerForm({
                              ...winnerForm,
                              juara1: {
                                ...winnerForm.juara1,
                                participantName: p.fullName,
                                familyName: p.familyName,
                                idolSong: p.idolSong,
                                idolArtist: p.idolArtist,
                              },
                            });
                          }
                        }}
                        className="text-[11px] bg-slate-900 text-amber-300 border border-amber-400/40 rounded-lg px-2 py-1"
                      >
                        <option value="">-- Pilih dari Peserta Event --</option>
                        {participantsForCurrentEvent.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.orderNumber || p.idpopup || '-'} {p.fullName} ({p.familyName})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nama Pemenang Juara 1</label>
                      <input
                        type="text"
                        value={winnerForm.juara1.participantName || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara1: { ...winnerForm.juara1, participantName: e.target.value },
                          })
                        }
                        placeholder="Nama Peserta"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Family / Komunitas</label>
                      <input
                        type="text"
                        value={winnerForm.juara1.familyName || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara1: { ...winnerForm.juara1, familyName: e.target.value },
                          })
                        }
                        placeholder="Nama Family"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Lagu Idola yang Dibawakan</label>
                      <input
                        type="text"
                        value={winnerForm.juara1.idolSong || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara1: { ...winnerForm.juara1, idolSong: e.target.value },
                          })
                        }
                        placeholder="Judul Lagu"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Hadiah Juara 1</label>
                      <input
                        type="text"
                        value={winnerForm.juara1.reward || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara1: { ...winnerForm.juara1, reward: e.target.value },
                          })
                        }
                        placeholder="Rp 1.500.000 + E-Sertifikat + Trophy"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* JUARA 2 */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                      🥈 JUARA 2
                    </span>
                    {participantsForCurrentEvent.length > 0 && (
                      <select
                        onChange={(e) => {
                          const p = participantsForCurrentEvent.find((item) => item.id === e.target.value);
                          if (p) {
                            setWinnerForm({
                              ...winnerForm,
                              juara2: {
                                ...winnerForm.juara2,
                                participantName: p.fullName,
                                familyName: p.familyName,
                                idolSong: p.idolSong,
                                idolArtist: p.idolArtist,
                              },
                            });
                          }
                        }}
                        className="text-[11px] bg-slate-900 text-slate-300 border border-slate-700 rounded-lg px-2 py-1"
                      >
                        <option value="">-- Pilih dari Peserta Event --</option>
                        {participantsForCurrentEvent.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.orderNumber || p.idpopup || '-'} {p.fullName} ({p.familyName})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nama Pemenang Juara 2</label>
                      <input
                        type="text"
                        value={winnerForm.juara2.participantName || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara2: { ...winnerForm.juara2, participantName: e.target.value },
                          })
                        }
                        placeholder="Nama Peserta"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Family / Komunitas</label>
                      <input
                        type="text"
                        value={winnerForm.juara2.familyName || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara2: { ...winnerForm.juara2, familyName: e.target.value },
                          })
                        }
                        placeholder="Nama Family"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Lagu Idola yang Dibawakan</label>
                      <input
                        type="text"
                        value={winnerForm.juara2.idolSong || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara2: { ...winnerForm.juara2, idolSong: e.target.value },
                          })
                        }
                        placeholder="Judul Lagu"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Hadiah Juara 2</label>
                      <input
                        type="text"
                        value={winnerForm.juara2.reward || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara2: { ...winnerForm.juara2, reward: e.target.value },
                          })
                        }
                        placeholder="Rp 1.000.000 + E-Sertifikat"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* JUARA 3 */}
                <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                      🥉 JUARA 3
                    </span>
                    {participantsForCurrentEvent.length > 0 && (
                      <select
                        onChange={(e) => {
                          const p = participantsForCurrentEvent.find((item) => item.id === e.target.value);
                          if (p) {
                            setWinnerForm({
                              ...winnerForm,
                              juara3: {
                                ...winnerForm.juara3,
                                participantName: p.fullName,
                                familyName: p.familyName,
                                idolSong: p.idolSong,
                                idolArtist: p.idolArtist,
                              },
                            });
                          }
                        }}
                        className="text-[11px] bg-slate-900 text-amber-400 border border-amber-800/60 rounded-lg px-2 py-1"
                      >
                        <option value="">-- Pilih dari Peserta Event --</option>
                        {participantsForCurrentEvent.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.orderNumber || p.idpopup || '-'} {p.fullName} ({p.familyName})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nama Pemenang Juara 3</label>
                      <input
                        type="text"
                        value={winnerForm.juara3.participantName || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara3: { ...winnerForm.juara3, participantName: e.target.value },
                          })
                        }
                        placeholder="Nama Peserta"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Family / Komunitas</label>
                      <input
                        type="text"
                        value={winnerForm.juara3.familyName || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara3: { ...winnerForm.juara3, familyName: e.target.value },
                          })
                        }
                        placeholder="Nama Family"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Lagu Idola yang Dibawakan</label>
                      <input
                        type="text"
                        value={winnerForm.juara3.idolSong || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara3: { ...winnerForm.juara3, idolSong: e.target.value },
                          })
                        }
                        placeholder="Judul Lagu"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Hadiah Juara 3</label>
                      <input
                        type="text"
                        value={winnerForm.juara3.reward || ''}
                        onChange={(e) =>
                          setWinnerForm({
                            ...winnerForm,
                            juara3: { ...winnerForm.juara3, reward: e.target.value },
                          })
                        }
                        placeholder="Rp 500.000 + E-Sertifikat"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>
                    Sistem akan menyajikan daftar juara secara prestisius <strong>tanpa menampilkan perolehan point</strong>, sesuai protokol privasi & etika penjurian Rainbow Candy.
                  </span>
                </div>

                {/* Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsWinnerModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-amber-500 text-white text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>Tetapkan Juara & Publikasikan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      <AnimatePresence>
        {deletingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Hapus Event?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Apakah Anda yakin ingin menghapus event <strong>"{deletingEvent.title}"</strong>? Data peserta yang tertaut pada event ini tidak akan terhapus, tetapi event tidak akan lagi tampil di katalog.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 cursor-pointer"
                >
                  Hapus Permanen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
