import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Radio,
  Crown,
  Music,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { RCEvent, EventStatus } from '../types/event';
import { RC_LOGO_IMAGE } from '../assets/logo';

interface EventListPageProps {
  events: RCEvent[];
  currentTheme: ThemeConfig;
  onSelectEvent: (eventId: string) => void;
  onNavigateToProfile: () => void;
  onGoToAdmin?: () => void;
}

export const EventListPage: React.FC<EventListPageProps> = ({
  events,
  currentTheme,
  onSelectEvent,
  onNavigateToProfile,
  onGoToAdmin,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return list.filter((ev) => {
      if (!ev) return false;
      const matchStatus =
        activeFilter === 'all'
          ? true
          : activeFilter === 'open'
          ? ev.status === 'open' || ev.status === 'ongoing'
          : ev.status === 'ended';

      const query = (searchQuery || '').trim().toLowerCase();
      const matchSearch =
        !query ||
        (ev.title || '').toLowerCase().includes(query) ||
        (ev.category || '').toLowerCase().includes(query) ||
        (ev.subtitle && ev.subtitle.toLowerCase().includes(query)) ||
        (ev.description && ev.description.toLowerCase().includes(query));

      return matchStatus && matchSearch;
    });
  }, [events, activeFilter, searchQuery]);

  const counts = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return {
      all: list.length,
      open: list.filter((e) => e?.status === 'open' || e?.status === 'ongoing').length,
      ended: list.filter((e) => e?.status === 'ended').length,
    };
  }, [events]);

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            Pendaftaran Dibuka
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Sedang Berlangsung
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <Lock className="w-3.5 h-3.5" />
            Pendaftaran Ditutup
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            Selesai (Ended)
          </span>
        );
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.bgClass} ${currentTheme.textPrimary} transition-colors duration-300`}>
      {/* Header Bar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-2xl ${currentTheme.cardBg} ${currentTheme.cardBorder}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Back to Profile Button */}
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-current/15 hover:bg-white/5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke</span> Profil Fams RC
          </button>

          {/* Brand Center / Title */}
          <div
            onClick={onNavigateToProfile}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-white/40 flex items-center justify-center">
              <img
                src={RC_LOGO_IMAGE}
                alt="Rainbow Candy Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="font-serif-luxury text-base sm:text-lg font-bold text-current leading-none">
                Rainbow Candy
              </div>
              <span className="text-[10px] font-mono opacity-70">Katalog Event Resmi</span>
            </div>
          </div>

          {/* Admin shortcut */}
          {onGoToAdmin && (
            <button
              type="button"
              onClick={onGoToAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-400 hover:text-amber-300 border border-current/10 hover:border-amber-400/30 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Portal Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section Banner */}
      <section className="relative py-12 sm:py-16 overflow-hidden border-b border-current/10">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-sm"
            style={{
              backgroundColor: `${currentTheme.accentPrimary}15`,
              borderColor: `${currentTheme.accentPrimary}35`,
              color: currentTheme.accentPrimary,
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Katalog & Kalender Acara Rainbow Candy</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif-luxury text-3xl sm:text-5xl font-black text-current tracking-tight"
          >
            Panggung Kompetisi & Acara Keluarga
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base opacity-85 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Pilih event yang sedang membuka registrasi untuk mendaftarkan diri, atau jelajahi rekap event yang telah selesai untuk melihat Hall of Fame para peraih juara.
          </motion.p>
        </div>
      </section>

      {/* Filter & Search Bar Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tab Filters */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-current/10 w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-current opacity-70 hover:opacity-100 hover:bg-white/5'
              }`}
            >
              Semua Event ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('open')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'open'
                  ? 'bg-emerald-500 text-white shadow-md font-bold'
                  : 'text-current opacity-70 hover:opacity-100 hover:bg-white/5'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Pendaftaran Buka ({counts.open})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('ended')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'ended'
                  ? 'bg-purple-600 text-white shadow-md font-bold'
                  : 'text-current opacity-70 hover:opacity-100 hover:bg-white/5'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-purple-300" />
              Selesai / Ended ({counts.ended})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari event, genre, tema..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-current/15 text-xs sm:text-sm placeholder:opacity-50 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* EVENTS LIST CARDS GRID */}
        <div className="mt-8">
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredEvents.map((ev, index) => {
                const isOpen = ev.status === 'open' || ev.status === 'ongoing';
                const isEnded = ev.status === 'ended';
                const firstWinner = Array.isArray(ev.winners) ? ev.winners.find((w) => w.rank === 1) : undefined;

                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className={`group relative rounded-3xl p-6 sm:p-7 border backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                      isEnded
                        ? 'bg-slate-900/60 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/5'
                        : `${currentTheme.cardBg} ${currentTheme.cardBorder} hover:border-amber-400/60 shadow-amber-400/5`
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-current/90 border border-current/15">
                          {ev.category}
                        </span>
                        {getStatusBadge(ev.status)}
                      </div>

                      {/* Event Title & Subtitle */}
                      <div>
                        <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-current group-hover:text-amber-300 transition-colors leading-snug">
                          {ev.title}
                        </h2>
                        {ev.subtitle && (
                          <p className="text-xs opacity-75 font-medium mt-1 line-clamp-1">
                            {ev.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Description Excerpt */}
                      <p className="text-xs sm:text-sm opacity-80 font-normal leading-relaxed line-clamp-2">
                        {ev.description}
                      </p>

                      {/* Key Details Rows */}
                      <div className="pt-2 pb-2 space-y-2 text-xs border-y border-current/10">
                        <div className="flex items-center gap-2 opacity-85">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-medium">
                            {ev.startDate} {ev.endDate ? `s/d ${ev.endDate}` : ''} • {ev.time}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 opacity-85">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>

                        {ev.prizes?.juara1 && (
                          <div className="flex items-center gap-2 opacity-85">
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold truncate text-amber-300/90">
                              Juara 1: {ev.prizes.juara1}
                            </span>
                          </div>
                        )}

                        {isOpen && ev.registrationDeadline && (
                          <div className="flex items-center gap-2 opacity-75 text-[11px] font-mono">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Batas Daftar: {ev.registrationDeadline}</span>
                          </div>
                        )}
                      </div>

                      {/* Winner Showcase Preview for Ended Events */}
                      {isEnded && firstWinner && (
                        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-purple-300 font-mono font-bold text-[11px]">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>JUARA 1 TERPILIH:</span>
                          </div>
                          <p className="font-bold text-white text-sm">
                            {firstWinner.participantName}{' '}
                            <span className="text-xs font-normal text-purple-300">
                              ({firstWinner.familyName})
                            </span>
                          </p>
                          {firstWinner.idolSong && (
                            <p className="text-[11px] text-purple-200/80 italic line-clamp-1">
                              "{firstWinner.idolSong}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-6 mt-2">
                      {isOpen ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectEvent(ev.id)}
                            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <Music className="w-4 h-4" />
                            <span>Daftar Event</span>
                            <ArrowRight className="w-4 h-4 ml-0.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectEvent(ev.id)}
                          className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>Ended — Lihat Rekap & Juara</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 p-8 rounded-3xl bg-white/5 border border-current/10 max-w-md mx-auto space-y-4">
              <Calendar className="w-12 h-12 text-amber-400 mx-auto opacity-75" />
              <h3 className="font-serif-luxury text-xl font-bold text-current">
                Tidak Ada Event Ditemukan
              </h3>
              <p className="text-xs opacity-75 leading-relaxed">
                Tidak ada data event yang cocok dengan filter atau kata kunci pencarian Anda. Coba reset filter atau ubah kata kunci.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
