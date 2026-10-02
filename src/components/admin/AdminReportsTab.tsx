import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Crown,
  Award,
  Copy,
  Check,
  Sparkles,
  Users,
  Music,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Hash,
  Eye,
  X,
  Sliders,
  Layers,
  MessageSquareQuote,
  Search,
  ArrowUpDown,
  Filter,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Participant, AdminUser, EventSettings, JudgeScoreDetail } from '../../types/participant';
import {
  formatValue,
  determineAndLockWinners,
  unlockAndResetWinners,
  fetchEventSettings,
  INITIAL_EVENT_SETTINGS,
  fetchAdminUsers,
  subscribeToAdminUsers,
  getLocalAdminUsers,
} from '../../services/supabaseClient';
import { ReportDownloadModal } from './ReportDownloadModal';
import { ReportNotesExcelModal } from './ReportNotesExcelModal';
import { WinnerCertificateModal } from './WinnerCertificateModal';

interface AdminReportsTabProps {
  participants: Participant[];
  currentUser: AdminUser;
  onRefresh?: () => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  participants,
  currentUser,
  onRefresh,
}) => {
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [isDetermining, setIsDetermining] = useState(false);
  const [determineMessage, setDetermineMessage] = useState<string | null>(null);
  const [eventSettings, setEventSettings] = useState<EventSettings>(INITIAL_EVENT_SETTINGS);
  const [inspectedParticipant, setInspectedParticipant] = useState<Participant | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedCertRank, setSelectedCertRank] = useState<1 | 2 | 3 | 'all'>(1);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => getLocalAdminUsers());

  // Table Search, Filter, Sort & Pagination state
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [tableSort, setTableSort] = useState<string>('point_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    fetchEventSettings().then(setEventSettings);

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

  // Reset pagination on filter/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, tableFilter, tableSort]);

  const isSuperadmin = currentUser.role === 'superadmin';

  // Base list of confirmed, done, and disqualified participants (sorted by stage appearance order)
  const confirmedParticipants = useMemo(() => {
    return participants
      .filter((p) => p.status === 'confirmed' || p.status === 'done' || p.status === 'disqualificated')
      .sort((a, b) => {
        const orderA = typeof a.orderNumber === 'number' && a.orderNumber > 0 ? a.orderNumber : 999999;
        const orderB = typeof b.orderNumber === 'number' && b.orderNumber > 0 ? b.orderNumber : 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (new Date(a.created_at).getTime() || 0) - (new Date(b.created_at).getTime() || 0);
      });
  }, [participants]);

  // Dynamic list of designated judges
  const judgesList = useMemo(() => {
    const judgeUsers = adminUsers.filter((u) => u.role === 'juri' || u.username.startsWith('juri'));
    const sorted = [...judgeUsers].sort((a, b) =>
      a.username.localeCompare(b.username, undefined, { numeric: true })
    );

    if (sorted.length > 0) {
      return sorted.map((u, idx) => ({
        id: u.id,
        username: u.username,
        code: `J${idx + 1}`,
        label: `Juri ${idx + 1}`,
        name: `Juri ${idx + 1}`,
      }));
    }

    // Default fallback
    return [
      { id: 'usr-juri1', username: 'juri1', code: 'J1', label: 'Juri 1', name: 'Juri 1' },
      { id: 'usr-juri2', username: 'juri2', code: 'J2', label: 'Juri 2', name: 'Juri 2' },
      { id: 'usr-juri3', username: 'juri3', code: 'J3', label: 'Juri 3', name: 'Juri 3' },
      { id: 'usr-juri4', username: 'juri4', code: 'J4', label: 'Juri 4', name: 'Juri 4' },
      { id: 'usr-juri5', username: 'juri5', code: 'J5', label: 'Juri 5', name: 'Juri 5' },
    ];
  }, [adminUsers]);

  // Ranked participants by aggregated audio score (From active Confirmed Participants only, excluding DQ)
  const ranked = useMemo(() => {
    return [...confirmedParticipants]
      .filter((p) => p.status !== 'disqualificated' && p.totalScore !== undefined && p.totalScore > 0)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [confirmedParticipants]);

  // Rank map based on points (id -> rank number 1, 2, 3...)
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    ranked.forEach((p, idx) => {
      map.set(p.id, idx + 1);
    });
    return map;
  }, [ranked]);

  // Check if official winners have been locked by Super Admin
  const isWinnersLocked = useMemo(() => {
    return Boolean(
      eventSettings.officialWinners?.juara1Id ||
      confirmedParticipants.some((p) => p.winnerTitle === 'Juara 1')
    );
  }, [eventSettings.officialWinners, confirmedParticipants]);

  // Determine & Lock Winners based on accumulated total scores
  const handleDetermineWinners = async () => {
    if (currentUser.role !== 'superadmin') return;
    if (ranked.length === 0) {
      alert('Belum ada peserta yang memiliki nilai dari Dewan Juri untuk ditentukan sebagai juara.');
      return;
    }

    const confirmAction = window.confirm(
      `Apakah Anda yakin ingin mengunci penetapan Juara 1, 2, dan 3 berdasarkan akumulasi total nilai ${judgesList.length} dewan juri?\n\nTop 1: ${ranked[0]?.fullName || '-'} (${ranked[0]?.totalScore?.toFixed(1) || '-'} Poin)\nTop 2: ${ranked[1]?.fullName || '-'} (${ranked[1]?.totalScore?.toFixed(1) || '-'} Poin)\nTop 3: ${ranked[2]?.fullName || '-'} (${ranked[2]?.totalScore?.toFixed(1) || '-'} Poin)\n\nSetelah dikunci, informasi juara akan terbuka secara resmi pada podium.`
    );
    if (!confirmAction) return;

    setIsDetermining(true);
    setDetermineMessage(null);

    try {
      const winnerAssignments: { participantId: string; winnerTitle: string }[] = [];
      if (ranked[0]) winnerAssignments.push({ participantId: ranked[0].id, winnerTitle: 'Juara 1' });
      if (ranked[1]) winnerAssignments.push({ participantId: ranked[1].id, winnerTitle: 'Juara 2' });
      if (ranked[2]) winnerAssignments.push({ participantId: ranked[2].id, winnerTitle: 'Juara 3' });
      if (ranked[3]) winnerAssignments.push({ participantId: ranked[3].id, winnerTitle: 'Juara Harapan 1' });
      if (ranked[4]) winnerAssignments.push({ participantId: ranked[4].id, winnerTitle: 'Juara Favorit' });

      const res = await determineAndLockWinners(winnerAssignments, currentUser.name);
      if (res.success) {
        setDetermineMessage('Selamat! Pemenang resmi berhasil dikalkulasi & dikunci ke sistem database.');
        const updatedSettings = await fetchEventSettings();
        setEventSettings(updatedSettings);
        if (onRefresh) onRefresh();
      } else {
        setDetermineMessage('Gagal mengunci pemenang: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      setDetermineMessage('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsDetermining(false);
    }
  };

  // Unlock and Reset Winners
  const handleUnlockWinners = async () => {
    if (currentUser.role !== 'superadmin') return;
    const confirmUnlock = window.confirm(
      'Apakah Anda yakin ingin membuka kunci penetapan juara?\n\nInformasi Juara 1, 2, dan 3 akan kembali disembunyikan/dikunci sampai Anda menetapkannya kembali.'
    );
    if (!confirmUnlock) return;

    setIsDetermining(true);
    try {
      const res = await unlockAndResetWinners(currentUser.name);
      if (res.success) {
        setDetermineMessage('Kunci penetapan juara berhasil dibuka. Status juara direset ke evaluasi.');
        const updatedSettings = await fetchEventSettings();
        setEventSettings(updatedSettings);
        if (onRefresh) onRefresh();
      } else {
        setDetermineMessage('Gagal membuka kunci juara: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      setDetermineMessage('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsDetermining(false);
    }
  };

  // Helper to count how many judges have scored a participant
  const getJudgeScoreCount = (p: Participant) => {
    return Object.keys(p.scores?.judgeScores || {}).length;
  };

  // Items per page limit for table pagination
  const ITEMS_PER_PAGE = 10;

  // Processed table list (Filtered & Sorted over confirmed participants)
  const filteredAndSortedParticipants = useMemo(() => {
    let list = [...confirmedParticipants];

    // Filter Scope
    if (tableFilter === 'scored') {
      list = list.filter((p) => p.status !== 'disqualificated' && (p.totalScore || 0) > 0);
    } else if (tableFilter === 'unscored') {
      list = list.filter((p) => p.status !== 'disqualificated' && (!p.totalScore || p.totalScore === 0));
    } else if (tableFilter === 'disqualified') {
      list = list.filter((p) => p.status === 'disqualificated');
    } else if (tableFilter === 'full_judged') {
      list = list.filter((p) => p.status !== 'disqualificated' && getJudgeScoreCount(p) >= judgesList.length);
    } else if (tableFilter === 'partial_judged') {
      list = list.filter((p) => {
        if (p.status === 'disqualificated') return false;
        const count = getJudgeScoreCount(p);
        return count > 0 && count < judgesList.length;
      });
    } else if (tableFilter === 'top3') {
      list = list.filter((p) => p.status !== 'disqualificated' && (rankMap.get(p.id) || 999) <= 3);
    } else if (tableFilter === 'top10') {
      list = list.filter((p) => p.status !== 'disqualificated' && (rankMap.get(p.id) || 999) <= 10);
    }

    // Search Query
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          (p.familyName && p.familyName.toLowerCase().includes(q)) ||
          (p.idolSong && p.idolSong.toLowerCase().includes(q)) ||
          (p.idolArtist && p.idolArtist.toLowerCase().includes(q)) ||
          (p.idpopup && p.idpopup.toString().includes(q)) ||
          (p.orderNumber && p.orderNumber.toString().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      const isDQA = a.status === 'disqualificated';
      const isDQB = b.status === 'disqualificated';
      const scoreA = a.totalScore || 0;
      const scoreB = b.totalScore || 0;
      const rankA = rankMap.get(a.id) || 9999;
      const rankB = rankMap.get(b.id) || 9999;
      const orderA = a.orderNumber ?? 9999;
      const orderB = b.orderNumber ?? 9999;
      const idPopA = a.idpopup ?? 999999;
      const idPopB = b.idpopup ?? 999999;

      if (tableSort === 'point_desc') {
        if (isDQA && !isDQB) return 1;
        if (!isDQA && isDQB) return -1;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return rankA - rankB;
      } else if (tableSort === 'point_asc') {
        if (isDQA && !isDQB) return 1;
        if (!isDQA && isDQB) return -1;
        if (scoreA !== scoreB) return scoreA - scoreB;
        return rankA - rankB;
      } else if (tableSort === 'order_asc') {
        return orderA - orderB;
      } else if (tableSort === 'order_desc') {
        return orderB - orderA;
      } else if (tableSort === 'idpopup_asc') {
        return idPopA - idPopB;
      } else if (tableSort === 'idpopup_desc') {
        return idPopB - idPopA;
      } else if (tableSort === 'name_asc') {
        return a.fullName.localeCompare(b.fullName);
      } else if (tableSort === 'name_desc') {
        return b.fullName.localeCompare(a.fullName);
      } else if (tableSort === 'song_asc') {
        return (a.idolSong || '').localeCompare(b.idolSong || '');
      } else if (tableSort === 'artist_asc') {
        return (a.idolArtist || '').localeCompare(b.idolArtist || '');
      } else if (tableSort.startsWith('judge_')) {
        if (isDQA && !isDQB) return 1;
        if (!isDQA && isDQB) return -1;
        const judgeKey = tableSort.replace('judge_', '');
        const jScoreA = a.scores?.judgeScores?.[judgeKey]?.total || 0;
        const jScoreB = b.scores?.judgeScores?.[judgeKey]?.total || 0;
        if (jScoreB !== jScoreA) return jScoreB - jScoreA;
        return scoreB - scoreA;
      }

      if (isDQA && !isDQB) return 1;
      if (!isDQA && isDQB) return -1;
      return rankA - rankB;
    });

    return list;
  }, [confirmedParticipants, tableFilter, tableSearch, tableSort, rankMap, judgesList]);

  // Total pages and paginated slice of data (max 10 per page)
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedParticipants.length / ITEMS_PER_PAGE));
  }, [filteredAndSortedParticipants.length]);

  const paginatedParticipants = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedParticipants.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredAndSortedParticipants, currentPage]);

  // WhatsApp Broadcast Template Generator
  const generateBroadcast = () => {
    if (!isWinnersLocked) {
      return `⚠️ *HASIL PENILAIAN MASIH DALAM PROSES PENETAPAN* ⚠️
*RC Birthday Celebration & Virgo Party 2026*
━━━━━━━━━━━━━━━━━━━━
Status: Penilaian oleh ${judgesList.length} Dewan Juri sedang berlangsung/menunggu ketetapan resmi dari Super Administrator.
Informasi Juara 1, 2, dan 3 akan dipublikasikan setelah Super Admin mengunci hasil rekapitulasi.

Total Peserta Dinilai: ${ranked.length} Peserta.`;
    }

    const juara1 = ranked[0];
    const juara2 = ranked[1];
    const juara3 = ranked[2];
    const harapan1 = ranked[3];

    return `👑 *HASIL REKAPITULASI RESMI DEWAN JURI* 👑
*RC Birthday Celebration & Virgo Party 2026*
*Event Nyanyi Mirip Idola (Akumulasi Nilai ${judgesList.length} Dewan Juri)*
━━━━━━━━━━━━━━━━━━━━

🏆 *JUARA 1 (Rp500.000 + Sertifikat)*
ID PopUp: ${juara1?.idpopup ? `#${juara1.idpopup}` : 'not available'}
Nama: ${juara1 ? juara1.fullName : 'not available'}
Family: ${juara1 ? juara1.familyName : 'not available'}
Lagu: ${juara1 ? `"${juara1.idolSong}"` : 'not available'}
Total Skor: *${juara1?.totalScore?.toFixed(1) || 'not available'} Poin*

🥈 *JUARA 2 (Rp300.000 + Sertifikat)*
ID PopUp: ${juara2?.idpopup ? `#${juara2.idpopup}` : 'not available'}
Nama: ${juara2 ? juara2.fullName : 'not available'}
Family: ${juara2 ? juara2.familyName : 'not available'}
Lagu: ${juara2 ? `"${juara2.idolSong}"` : 'not available'}
Total Skor: *${juara2?.totalScore?.toFixed(1) || 'not available'} Poin*

🥉 *JUARA 3 (Rp200.000 + Sertifikat)*
ID PopUp: ${juara3?.idpopup ? `#${juara3.idpopup}` : 'not available'}
Nama: ${juara3 ? juara3.fullName : 'not available'}
Family: ${juara3 ? juara3.familyName : 'not available'}
Lagu: ${juara3 ? `"${juara3.idolSong}"` : 'not available'}
Total Skor: *${juara3?.totalScore?.toFixed(1) || 'not available'} Poin*

${
  harapan1
    ? `🎖️ *JUARA HARAPAN 1*
ID PopUp: ${harapan1.idpopup ? `#${harapan1.idpopup}` : 'not available'}
Nama: ${harapan1.fullName} (${harapan1.familyName})
Skor: ${harapan1.totalScore?.toFixed(1)} Poin
━━━━━━━━━━━━━━━━━━━━\n`
    : ''
}━━━━━━━━━━━━━━━━━━━━
Pilar Penilaian Murni Audio:
1. Teknikalitas Vokal (Pitch, Tempo, Kontrol) : Max 30 Poin
2. Kemiripan Karakter Suara dengan Idola : Max 30 Poin
3. Penjiwaan & Soul Penghayatan Audio : Max 20 Poin
4. Presentasi & Artikulasi Audio : Max 20 Poin
(Total skor merupakan akumulasi penjumlahan nilai murni dari seluruh ${judgesList.length} Dewan Juri yang menilai)

Selamat kepada seluruh pemenang dan terima kasih untuk seluruh keluarga besar RC Collaboration & Komunitas Virgo! ✨`;
  };

  const handleCopyBroadcast = () => {
    navigator.clipboard.writeText(generateBroadcast());
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 3000);
  };

  // Reset table filters
  const handleResetFilters = () => {
    setTableSearch('');
    setTableFilter('all');
    setTableSort('point_desc');
  };

  const isFilterActive = tableSearch !== '' || tableFilter !== 'all' || tableSort !== 'point_desc';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-luxury text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>Laporan & Rekapitulasi {judgesList.length} Dewan Juri</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hasil rekapitulasi penilaian audio dari {judgesList.length} dewan juri mandiri (1 juri = 1 lembar nilai).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Winner Determination / Unlock Controls (Superadmin only) */}
          {isSuperadmin && (
            <>
              {!isWinnersLocked ? (
                <button
                  onClick={handleDetermineWinners}
                  disabled={isDetermining || ranked.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Kunci dan tetapkan Juara 1, 2, dan 3 secara resmi"
                >
                  <Crown className="w-4 h-4 stroke-[2.5]" />
                  <span>{isDetermining ? 'Mengkalkulasi...' : `Tentukan & Kunci Juara (${judgesList.length} Juri)`}</span>
                </button>
              ) : (
                <button
                  onClick={handleUnlockWinners}
                  disabled={isDetermining}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-amber-400/30 shadow-md hover:border-amber-400/60 transition-all flex items-center gap-2 cursor-pointer"
                  title="Buka kunci penetapan juara untuk melakukan perubahan jika diperlukan"
                >
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span>Buka Kunci Juara</span>
                </button>
              )}
            </>
          )}

          {/* Download E-Sertifikat Juara 1, 2, 3 Button */}
          <button
            onClick={() => {
              setSelectedCertRank(1);
              setIsCertModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer border border-amber-400/40"
            title="Download E-Sertifikat Resmi Juara 1, 2, dan 3 (Format PNG Resolusi Tinggi 300 DPI & PDF Siap Cetak)"
          >
            <Award className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Sertifikat Juara (1, 2, 3)</span>
          </button>

          {/* Download Rekap & Catatan Juri (Excel / Spreadsheet) Button */}
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer border border-emerald-500/30"
            title="Download Rekap Hasil Penilaian & Catatan Detail Semua Dewan Juri (Format Excel / Spreadsheet .xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
            <span>Rekap & Catatan Juri (Excel)</span>
          </button>

          {/* Laporan PNG A4 Button */}
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-pink-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            title="Download Laporan Rekapitulasi Nilai & Ranking (Format PNG A4)"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download Laporan (PNG A4)</span>
          </button>
        </div>
      </div>

      {/* Determination Alert Status */}
      {determineMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="font-medium">{determineMessage}</span>
        </div>
      )}

      {/* Top 3 Winners Showcase / Confidential Locked State */}
      {isWinnersLocked ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>
                Ketetapan Juara Resmi Telah Dikunci oleh{' '}
                <strong>{eventSettings.officialWinners?.determinedBy || 'Super Administrator'}</strong>
              </span>
            </div>
            {isSuperadmin && (
              <span className="text-[11px] text-slate-400">
                Tekan tombol &ldquo;Buka Kunci Juara&rdquo; jika ingin mengubah ketetapan.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Juara 1 */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-400/40 shadow-2xl relative overflow-hidden order-1 md:order-2 md:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-400 text-slate-950 shadow-md">
                  👑 JUARA 1
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">Rp500.000</span>
              </div>

              {ranked[0] ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-mono text-amber-400 font-bold">
                      {ranked[0].idpopup !== undefined ? `#${ranked[0].idpopup}` : 'ID: not available'}
                    </div>
                    <h3 className="font-serif-luxury text-xl font-black text-slate-100">
                      {ranked[0].fullName}
                    </h3>
                    <p className="text-xs text-amber-400/90 font-medium">{formatValue(ranked[0].familyName)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <p className="text-xs font-semibold text-slate-200">🎵 {formatValue(ranked[0].idolSong)}</p>
                    <p className="text-[11px] text-slate-400">
                      Idola: {formatValue(ranked[0].idolArtist)}
                    </p>
                  </div>
                  <div className="pt-2 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Total Akumulasi Skor:</span>
                    <span className="text-2xl font-black font-mono text-amber-400">
                      {ranked[0].totalScore?.toFixed(1)} Poin
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCertRank(1);
                      setIsCertModalOpen(true);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Download Sertifikat Juara 1</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center italic">not available</p>
              )}
            </div>

            {/* Juara 2 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl order-2 md:order-1">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-700 text-slate-200">
                  🥈 JUARA 2
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">Rp300.000</span>
              </div>

              {ranked[1] ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 font-bold">
                      {ranked[1].idpopup !== undefined ? `#${ranked[1].idpopup}` : 'ID: not available'}
                    </div>
                    <h3 className="font-serif-luxury text-lg font-bold text-slate-100">
                      {ranked[1].fullName}
                    </h3>
                    <p className="text-xs text-slate-400">{formatValue(ranked[1].familyName)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <p className="text-xs font-semibold text-slate-200">🎵 {formatValue(ranked[1].idolSong)}</p>
                    <p className="text-[11px] text-slate-400">
                      Idola: {formatValue(ranked[1].idolArtist)}
                    </p>
                  </div>
                  <div className="pt-2 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Total Akumulasi Skor:</span>
                    <span className="text-xl font-black font-mono text-amber-400">
                      {ranked[1].totalScore?.toFixed(1)} Poin
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCertRank(2);
                      setIsCertModalOpen(true);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-md hover:border-slate-500 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-slate-300" />
                    <span>Download Sertifikat Juara 2</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center italic">not available</p>
              )}
            </div>

            {/* Juara 3 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl order-3">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-900/30 text-amber-300 border border-amber-800/40">
                  🥉 JUARA 3
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">Rp200.000</span>
              </div>

              {ranked[2] ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-mono text-amber-400/80 font-bold">
                      {ranked[2].idpopup !== undefined ? `#${ranked[2].idpopup}` : 'ID: not available'}
                    </div>
                    <h3 className="font-serif-luxury text-lg font-bold text-slate-100">
                      {ranked[2].fullName}
                    </h3>
                    <p className="text-xs text-slate-400">{formatValue(ranked[2].familyName)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <p className="text-xs font-semibold text-slate-200">🎵 {formatValue(ranked[2].idolSong)}</p>
                    <p className="text-[11px] text-slate-400">
                      Idola: {formatValue(ranked[2].idolArtist)}
                    </p>
                  </div>
                  <div className="pt-2 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Total Akumulasi Skor:</span>
                    <span className="text-xl font-black font-mono text-amber-400">
                      {ranked[2].totalScore?.toFixed(1)} Poin
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCertRank(3);
                      setIsCertModalOpen(true);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 font-bold text-xs shadow-md hover:border-amber-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Download Sertifikat Juara 3</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center italic">not available</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Confidential Locked State Card (Before Superadmin Determines Winners) */
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                  <Lock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-slate-100">
                      Informasi Juara 1, 2, dan 3 Belum Ditetapkan (Terkunci)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-400/20">
                      Konfidensial
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Sesuai ketetapan dewan juri, informasi pemenang Juara 1, 2, dan 3 dirahasiakan sampai <strong>Super Administrator</strong> memeriksa dan mengunci penetapan hasil akhir resmi lomba.
                  </p>
                </div>
              </div>

              {isSuperadmin && (
                <button
                  onClick={handleDetermineWinners}
                  disabled={isDetermining || ranked.length === 0}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Crown className="w-4 h-4 stroke-[2.5]" />
                  <span>{isDetermining ? 'Mengkalkulasi...' : 'Tentukan & Kunci Juara Sekarang'}</span>
                </button>
              )}
            </div>

            {/* 3 Locked Placeholder Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Juara 1 Locked */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-dashed border-amber-500/30 relative flex flex-col items-center justify-center text-center py-8 space-y-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  👑 JUARA 1 (TERKUNCI)
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-600">
                  <Lock className="w-5 h-5 text-amber-400/60" />
                </div>
                <div>
                  <div className="h-3 w-32 bg-slate-800 rounded-full mx-auto mb-1.5 animate-pulse" />
                  <p className="text-[11px] text-slate-500 italic">Menunggu Ketetapan Super Admin</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300/60">Hadiah: Rp500.000</span>
              </div>

              {/* Juara 2 Locked */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-dashed border-slate-700 relative flex flex-col items-center justify-center text-center py-8 space-y-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  🥈 JUARA 2 (TERKUNCI)
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-600">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <div className="h-3 w-28 bg-slate-800 rounded-full mx-auto mb-1.5 animate-pulse" />
                  <p className="text-[11px] text-slate-500 italic">Menunggu Ketetapan Super Admin</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">Hadiah: Rp300.000</span>
              </div>

              {/* Juara 3 Locked */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-dashed border-slate-700 relative flex flex-col items-center justify-center text-center py-8 space-y-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/30 text-amber-400/80 border border-amber-900/40">
                  🥉 JUARA 3 (TERKUNCI)
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-600">
                  <Lock className="w-5 h-5 text-amber-500/40" />
                </div>
                <div>
                  <div className="h-3 w-28 bg-slate-800 rounded-full mx-auto mb-1.5 animate-pulse" />
                  <p className="text-[11px] text-slate-500 italic">Menunggu Ketetapan Super Admin</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400/60">Hadiah: Rp200.000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table with Advanced Search, Filter, Sort & Pagination Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Table Header & Title */}
        <div className="p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90">
          <div>
            <h3 className="font-serif-luxury font-bold text-slate-100 text-base flex items-center gap-2">
              <span>Tabel Rekapitulasi Rincian Nilai {judgesList.length} Dewan Juri</span>
              <span className="text-xs text-amber-400 font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                {confirmedParticipants.length} Peserta Terkonfirmasi
              </span>
              <span className="text-[11px] text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                {ranked.length} Telah Dinilai
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Menampilkan seluruh peserta berstatus Confirmed (Lolos Validasi). Maksimal 10 data per halaman.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              Menampilkan <strong className="text-amber-400">{filteredAndSortedParticipants.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> - <strong className="text-amber-400">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedParticipants.length)}</strong> dari <strong className="text-slate-200">{filteredAndSortedParticipants.length}</strong> peserta
            </span>
          </div>
        </div>

        {/* Filter & Sort Controls Toolbar */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari nama, ID PopUp, lagu, artis..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Scope */}
            <div className="relative">
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors cursor-pointer appearance-none pr-8"
              >
                <option value="all">👥 Semua ({confirmedParticipants.length})</option>
                <option value="scored">✅ Sudah Dinilai ({ranked.length})</option>
                <option value="unscored">⏳ Belum Dinilai ({confirmedParticipants.filter((p) => p.status !== 'disqualificated' && (!p.totalScore || p.totalScore === 0)).length})</option>
                <option value="disqualified">⛔ Diskualifikasi ({confirmedParticipants.filter((p) => p.status === 'disqualificated').length})</option>
                <option value="full_judged">🎯 Dinilai Lengkap ({judgesList.length} Juri)</option>
                <option value="partial_judged">⏱️ Dinilai Sebagian (&lt; {judgesList.length} Juri)</option>
                <option value="top3">👑 Top 3 Poin Tertinggi</option>
                <option value="top10">🌟 Top 10 Poin Tertinggi</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Options */}
            <div className="relative">
              <select
                value={tableSort}
                onChange={(e) => setTableSort(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors cursor-pointer appearance-none pr-8"
              >
                <option value="point_desc">🏆 Point: Tertinggi ➔ Terendah (DESC)</option>
                <option value="point_asc">📉 Point: Terendah ➔ Tertinggi (ASC)</option>
                <option value="order_asc">🔢 Nomor Urut Tampil (1 ➔ Selesai)</option>
                <option value="order_desc">🔢 Nomor Urut Tampil (Terbesar ➔ 1)</option>
                <option value="idpopup_asc">🆔 ID PopUp: Terendah ➔ Tertinggi (ASC)</option>
                <option value="idpopup_desc">🆔 ID PopUp: Tertinggi ➔ Terendah (DESC)</option>
                <option value="name_asc">🔤 Nama Peserta (A ➔ Z)</option>
                <option value="name_desc">🔤 Nama Peserta (Z ➔ A)</option>
                <option value="song_asc">🎵 Judul Lagu (A ➔ Z)</option>
                <option value="artist_asc">🎤 Artis Idola (A ➔ Z)</option>
                {judgesList.map((j) => (
                  <option key={j.id} value={`judge_${j.id}`}>
                    ⭐ Nilai Tertinggi: {j.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset / Clear Filters */}
            <div className="flex items-center gap-2">
              {isFilterActive ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Filter</span>
                </button>
              ) : (
                <div className="w-full py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 text-xs text-center font-mono">
                  Filter Default Aktif
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4 text-center">No. Urut</th>
                <th className="py-3 px-4">ID PopUp</th>
                <th className="py-3 px-4">Nama Peserta & Family</th>
                <th className="py-3 px-4">Lagu Idola</th>
                {judgesList.map((j, idx) => (
                  <th key={j.id} className="py-3 px-3 text-center">
                    {`Juri ${idx + 1}`}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Total Skor Akhir</th>
                <th className="py-3 px-3 text-center">Detail Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedParticipants.length > 0 ? (
                paginatedParticipants.map((p) => {
                  const isDQ = p.status === 'disqualificated';
                  const hasScore = (p.totalScore || 0) > 0;
                  const rankNum = rankMap.get(p.id);

                  return (
                    <tr key={p.id} className={`hover:bg-slate-800/40 transition-colors ${isDQ ? 'bg-red-950/15' : ''}`}>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-mono">
                        {p.orderNumber !== undefined ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-400 font-bold">
                            #{p.orderNumber}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {p.idpopup !== undefined ? `#${p.idpopup}` : 'not available'}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{p.fullName}</span>
                          {isDQ ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                              Diskualifikasi
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {p.status === 'done' ? 'Done' : 'Confirmed'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">{formatValue(p.familyName)}</div>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">
                        <div>{formatValue(p.idolSong)}</div>
                        <div className="text-[10px] text-slate-500">
                          Mirip: {formatValue(p.idolArtist)}
                        </div>
                      </td>
                      {judgesList.map((j) => {
                        const scoreVal =
                          p.scores?.judgeScores?.[j.id]?.total ??
                          p.scores?.judgeScores?.[j.username]?.total;
                        return (
                          <td key={j.id} className="py-3.5 px-3 text-center">
                            {scoreVal !== undefined ? (
                              <span className="text-slate-200 font-bold font-mono">{scoreVal.toFixed(1)}</span>
                            ) : (
                              <span className="text-slate-600 text-[10px] font-mono">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3.5 px-4 text-right font-black">
                        {isDQ ? (
                          <span className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            DISKUALIFIKASI
                          </span>
                        ) : hasScore ? (
                          <span className="text-base text-amber-400 font-mono">{p.totalScore?.toFixed(1)}</span>
                        ) : (
                          <span className="text-[11px] font-mono font-normal text-slate-500 italic">Belum Dinilai</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedParticipant(p)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 text-[11px] font-sans font-semibold transition-all border border-slate-700 flex items-center gap-1 cursor-pointer"
                            title="Lihat rincian point 4 kriteria per juri"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Rincian</span>
                          </button>

                          {rankNum >= 1 && rankNum <= 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCertRank(rankNum as 1 | 2 | 3);
                                setIsCertModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-400 hover:text-slate-950 text-amber-400 text-[11px] font-sans font-semibold transition-all border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                              title={`Download E-Sertifikat Juara ${rankNum}`}
                            >
                              <Award className="w-3 h-3" />
                              <span>Sertifikat</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6 + judgesList.length} className="py-12 text-center text-slate-500 font-sans">
                    {tableSearch || tableFilter !== 'all'
                      ? 'Tidak ada peserta confirmed yang cocok dengan filter atau kata kunci pencarian.'
                      : 'Belum ada data peserta berstatus Confirmed dalam sistem.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer (Limit maks 10 data) */}
        {filteredAndSortedParticipants.length > 0 && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-400 font-mono">
              Halaman <strong className="text-amber-400">{currentPage}</strong> dari <strong className="text-slate-200">{totalPages}</strong> ({filteredAndSortedParticipants.length} Total Data Confirmed)
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pg) => {
                    // Show within range of 2 from current page, or first/last
                    return (
                      pg === 1 ||
                      pg === totalPages ||
                      Math.abs(pg - currentPage) <= 2
                    );
                  })
                  .map((pg, idx, arr) => {
                    const prevPg = arr[idx - 1];
                    const hasGap = prevPg && pg - prevPg > 1;

                    return (
                      <React.Fragment key={pg}>
                        {hasGap && <span className="text-slate-600 px-1 font-mono">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(pg)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                            currentPage === pg
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          {pg}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Point-by-Point Relational Scores Detail Modal */}
      {inspectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono text-amber-400 font-bold">
                  {inspectedParticipant.idpopup ? `#${inspectedParticipant.idpopup}` : 'ID: not available'}
                </div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-serif-luxury">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>Rincian Point Penilaian: {inspectedParticipant.fullName}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {inspectedParticipant.familyName} • Lagu: &quot;{inspectedParticipant.idolSong}&quot; (Mirip: {inspectedParticipant.idolArtist || '-'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedParticipant(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aggregated Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Teknikalitas (30)</span>
                <span className="text-base font-black font-mono text-amber-300">
                  {inspectedParticipant.scores?.teknikalitas?.toFixed(1) || '0.0'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Kemiripan (30)</span>
                <span className="text-base font-black font-mono text-amber-300">
                  {inspectedParticipant.scores?.kemiripan?.toFixed(1) || '0.0'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Penjiwaan (20)</span>
                <span className="text-base font-black font-mono text-amber-300">
                  {inspectedParticipant.scores?.penjiwaan?.toFixed(1) || '0.0'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Presentasi (20)</span>
                <span className="text-base font-black font-mono text-amber-300">
                  {inspectedParticipant.scores?.presentasi?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>

            {/* Individual Judge Sheets (Relational Scores Table Rows) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Lembar Penilaian Individual {judgesList.length} Juri (Table `scores`)</span>
              </h4>

              {judgesList.map((j) => {
                const jScore =
                  inspectedParticipant.scores?.judgeScores?.[j.id] ??
                  inspectedParticipant.scores?.judgeScores?.[j.username];

                return (
                  <div
                    key={j.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-xs font-bold text-slate-200">
                          {jScore?.judgeName || j.name}
                        </span>
                      </div>
                      {jScore ? (
                        <span className="text-sm font-black font-mono text-amber-400">
                          Total: {jScore.total?.toFixed(1)} / 100
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600 italic">Belum Mengisi</span>
                      )}
                    </div>

                    {jScore ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Vokal & Teknik (Max 30)</span>
                            <span className="font-bold text-slate-100">{jScore.teknikalitas} pt</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Kemiripan (Max 30)</span>
                            <span className="font-bold text-slate-100">{jScore.kemiripan} pt</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Penjiwaan (Max 20)</span>
                            <span className="font-bold text-slate-100">{jScore.penjiwaan} pt</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Presentasi (Max 20)</span>
                            <span className="font-bold text-slate-100">{jScore.presentasi} pt</span>
                          </div>
                        </div>

                        {jScore.notes && (
                          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300 italic">
                            &ldquo;{jScore.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedParticipant(null)}
                className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Broadcast Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-luxury font-bold text-slate-100 text-base flex items-center gap-2">
            <Copy className="w-4 h-4 text-amber-400" />
            <span>Format Broadcast Pengumuman WhatsApp</span>
          </h3>

          <button
            onClick={handleCopyBroadcast}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            {copiedBroadcast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBroadcast ? 'Tersalin ke Clipboard!' : 'Salin Pesan WA'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
          {generateBroadcast()}
        </pre>
      </div>

      {/* Download Validation & Sort Configuration Modal (PNG A4) */}
      <ReportDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        participants={participants}
        adminUsers={adminUsers}
        eventTitle={eventSettings.eventName}
      />

      {/* Download Rekap Hasil & Catatan Semua Dewan Juri Modal (Excel / Spreadsheet) */}
      <ReportNotesExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        participants={participants}
        adminUsers={adminUsers}
        eventTitle={eventSettings.eventName}
      />

      {/* Download E-Sertifikat Juara 1, 2, dan 3 Modal (PNG 300 DPI & PDF) */}
      <WinnerCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        participants={confirmedParticipants}
        eventSettings={eventSettings}
        adminUsers={adminUsers}
        eventTitle={eventSettings.eventName}
        initialSelectedRank={selectedCertRank}
      />
    </div>
  );
};


