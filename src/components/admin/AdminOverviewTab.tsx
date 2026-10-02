import React, { useMemo } from 'react';
import {
  Users,
  Award,
  Crown,
  CheckCircle2,
  Mic,
  TrendingUp,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { Participant, EventSettings, AuditLog, AdminUser } from '../../types/participant';

interface AdminOverviewTabProps {
  participants: Participant[];
  eventSettings: EventSettings;
  auditLogs?: AuditLog[];
  currentUser: AdminUser;
  onNavigateTab: (tab: 'participants' | 'scoring' | 'roles' | 'reports' | 'settings') => void;
  onUpdateEventSettings: (updated: Partial<EventSettings>) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  participants,
  eventSettings,
  currentUser,
  onNavigateTab,
  onUpdateEventSettings,
}) => {
  // Hanya hitung peserta dengan status 'confirmed'
  const confirmedParticipants = useMemo(
    () => (participants || []).filter((p) => p && p.status === 'confirmed'),
    [participants]
  );
  const total = confirmedParticipants.length;
  const confirmed = total;
  const isViewer = currentUser?.role === 'viewer';

  // Hanya hitung yang sudah dinilai dari peserta yang status 'confirmed'
  const scoredParticipants = useMemo(
    () =>
      confirmedParticipants.filter(
        (p) =>
          (p.totalScore !== undefined && p.totalScore > 0) ||
          (p.scores && Object.keys(p.scores).length > 0)
      ),
    [confirmedParticipants]
  );
  const scoredCount = scoredParticipants.length;

  // Urutkan peserta berdasarkan nomor urut tampil (orderNumber)
  const orderedParticipants = useMemo(() => {
    const list = confirmedParticipants.length > 0 ? confirmedParticipants : participants;
    return [...list].sort((a, b) => {
      const aOrder = a.orderNumber !== undefined && a.orderNumber !== null ? a.orderNumber : 9999;
      const bOrder = b.orderNumber !== undefined && b.orderNumber !== null ? b.orderNumber : 9999;
      return aOrder - bOrder;
    });
  }, [confirmedParticipants, participants]);

  const currentPerformer =
    orderedParticipants.find((p) => p.id === eventSettings.currentPerformingId) ||
    orderedParticipants[0];

  // Kandidat Juara: hanya hitung peserta yang status 'confirmed'
  const ranked = useMemo(
    () =>
      [...confirmedParticipants]
        .filter((p) => p.totalScore !== undefined && p.totalScore > 0)
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)),
    [confirmedParticipants]
  );

  const scoredWithPoints = confirmedParticipants.filter((p) => (p.totalScore || 0) > 0);
  const averageScore = scoredWithPoints.length > 0
    ? (scoredWithPoints.reduce((acc, p) => acc + (p.totalScore || 0), 0) / scoredWithPoints.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5" />
              <span>Pusat Kendali Acara</span>
            </div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-black text-slate-100">
              Halo, {currentUser.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Panel manajemen pendaftaran, sistem penilaian juri audio, direktori peserta, dan laporan rekapitulasi <strong>RC Birthday Celebration & Virgo Party 2026</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab('participants')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{isViewer ? 'Lihat Data Peserta' : 'Input / Kelola Peserta'}</span>
            </button>
            <button
              onClick={() => onNavigateTab(isViewer ? 'reports' : 'scoring')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{isViewer ? 'Lihat Rekapitulasi Laporan' : 'Input Nilai Juri'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Peserta</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black font-mono text-slate-100">{total}</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>{confirmed} terkonfirmasi</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Sudah Dinilai</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black font-mono text-slate-100">
              {scoredCount} <span className="text-sm font-normal text-slate-500">/ {total}</span>
            </p>
            <p className="text-[11px] text-amber-400 mt-1 font-mono">
              Progress: {total > 0 ? Math.round((scoredCount / total) * 100) : 0}%
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Rata-Rata Skor</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black font-mono text-slate-100">{averageScore}</p>
            <p className="text-[11px] text-slate-400 mt-1">Skala 0 - 100 Poin</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Status Panggung</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-base font-bold text-slate-100 uppercase tracking-wide">
              {eventSettings.activeRound.replace('_', ' ')}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1">
              Pendaftaran: {eventSettings.isRegistrationOpen ? 'Buka' : 'Tutup'}
            </p>
          </div>
        </div>
      </div>

      {/* Stage Controller & Leaderboard Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Controller (Lihat Peserta) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif-luxury font-bold text-slate-100 text-base flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-400" />
                <span>Lihat Peserta</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                ON AIR
              </span>
            </div>

            {currentPerformer ? (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-2">
                <p className="text-xs text-amber-400 font-mono font-bold">
                  No. Urut {currentPerformer.orderNumber || 1}
                </p>
                <h4 className="text-lg font-bold text-slate-100">{currentPerformer.fullName}</h4>
                <p className="text-xs text-slate-400">Family: {currentPerformer.familyName}</p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 mt-2">
                  <p className="text-xs font-semibold text-slate-200">
                    🎵 {currentPerformer.idolSong}
                  </p>
                  {currentPerformer.idolArtist && (
                    <p className="text-[11px] text-slate-400">Idola: {currentPerformer.idolArtist}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">Belum ada peserta yang dipilih</p>
            )}

            {/* Change Performer Selector - Only for non-viewers */}
            {!isViewer && (
              <div className="mt-4">
                <label className="block text-[11px] text-slate-400 mb-1">Ganti Peserta di Panggung:</label>
                <select
                  value={eventSettings.currentPerformingId || ''}
                  onChange={(e) => onUpdateEventSettings({ currentPerformingId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  {orderedParticipants.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.orderNumber || '-'} {p.fullName} - {p.idolSong}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isViewer ? (
            <button
              onClick={() => onNavigateTab('reports')}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Lihat Rekap Nilai & Juara</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigateTab('scoring')}
              className="w-full mt-4 py-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Beri Nilai Peserta Ini</span>
            </button>
          )}
        </div>

        {/* Realtime Top 3 Ranked Leaderboard */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif-luxury font-bold text-slate-100 text-base flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Kandidat Juara Tertinggi (Audio Scoring)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rekapitulasi otomatis bobot 30% Teknik + 30% Kemiripan + 20% Penjiwaan + 20% Presentasi
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Lihat Rekap Lengkap</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {ranked.length > 0 ? (
              <div className="space-y-2.5">
                {ranked.slice(0, 3).map((p, idx) => {
                  const medals = ['🥇 Juara 1 (Rp500.000)', '🥈 Juara 2 (Rp300.000)', '🥉 Juara 3 (Rp200.000)'];
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                          {medals[idx] || `#${idx + 1}`}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span>{p.fullName}</span>
                            {p.idpopup !== undefined && (
                              <span className="text-[11px] font-mono text-amber-400 font-normal">
                                #{p.idpopup}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">
                            {p.familyName || 'not available'} • <span className="text-slate-300">"{p.idolSong || 'not available'}"</span> ({p.idolArtist || 'not available'})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black font-mono text-amber-400">
                          {p.totalScore?.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-slate-400">Total Poin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/50">
                <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Belum ada peserta yang dinilai oleh juri.</p>
                <button
                  onClick={() => onNavigateTab('scoring')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Mulai Penilaian
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Kriteria: Teknikalitas (30%), Kemiripan (30%), Penjiwaan (20%), Presentasi Audio (20%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
