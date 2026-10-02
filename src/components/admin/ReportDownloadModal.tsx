import React, { useState, useMemo, useRef } from 'react';
import {
  Download,
  X,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Sparkles,
  Trophy,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Participant, AdminUser } from '../../types/participant';
import { toPng } from 'html-to-image';
import { RC_LOGO_IMAGE } from '../../assets/logo';

export type SortField =
  | 'rank_asc'
  | 'rank_desc'
  | 'name_asc'
  | 'name_desc'
  | 'song_asc'
  | 'artist_asc'
  | 'order_asc'
  | string;

export type FilterScope = 'all' | 'scored_only' | 'top3' | 'top10';

interface ReportDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  adminUsers?: AdminUser[];
  eventTitle?: string;
}

const ITEMS_PER_PAGE = 10;

export const ReportDownloadModal: React.FC<ReportDownloadModalProps> = ({
  isOpen,
  onClose,
  participants,
  adminUsers = [],
  eventTitle = 'RC Birthday Celebration & Virgo Party 2026',
}) => {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [sortField, setSortField] = useState<SortField>('rank_asc');
  const [filterScope, setFilterScope] = useState<FilterScope>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePreviewPage, setActivePreviewPage] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

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
        label: u.name || `Juri ${idx + 1}`,
        fullName: u.name || `Dewan Juri ${idx + 1}`,
      }));
    }

    return [
      { id: 'usr-juri1', username: 'juri1', code: 'J1', label: 'Juri 1', fullName: 'Dewan Juri 1' },
      { id: 'usr-juri2', username: 'juri2', code: 'J2', label: 'Juri 2', fullName: 'Dewan Juri 2' },
      { id: 'usr-juri3', username: 'juri3', code: 'J3', label: 'Juri 3', fullName: 'Dewan Juri 3' },
      { id: 'usr-juri4', username: 'juri4', code: 'J4', label: 'Juri 4', fullName: 'Dewan Juri 4' },
      { id: 'usr-juri5', username: 'juri5', code: 'J5', label: 'Juri 5', fullName: 'Dewan Juri 5' },
    ];
  }, [adminUsers]);

  // Dynamic judge names derived from database
  const judgeNames = useMemo(() => {
    const defaultJudges: Record<string, string> = {
      'usr-juri1': 'Juri 1',
      'usr-juri2': 'Juri 2',
      'usr-juri3': 'Juri 3',
      'usr-juri4': 'Juri 4',
      'usr-juri5': 'Juri 5',
    };

    if (!adminUsers || adminUsers.length === 0) return defaultJudges;

    const jUsers = adminUsers.filter((u) => u.role === 'juri' || u.username.startsWith('juri'));
    const map: Record<string, string> = { ...defaultJudges };

    jUsers.forEach((u, idx) => {
      const key = u.id || `usr-juri${idx + 1}`;
      map[key] = u.name || `Juri ${idx + 1}`;
      if (u.username) {
        map[u.username] = u.name || `Juri ${idx + 1}`;
      }
    });

    return map;
  }, [adminUsers]);

  // Filter only participants with status 'confirmed', 'done', or 'disqualificated' (exclude pending & canceled)
  const eligibleParticipants = useMemo(() => {
    return (participants || []).filter(
      (p) => p.status === 'confirmed' || p.status === 'done' || p.status === 'disqualificated'
    );
  }, [participants]);

  // Ranked baseline list based on overall total score (active non-disqualified ranked first, followed by disqualified)
  const baselineRanked = useMemo(() => {
    const active = eligibleParticipants.filter((p) => p.status !== 'disqualificated');
    const dq = eligibleParticipants.filter((p) => p.status === 'disqualificated');
    active.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    dq.sort((a, b) => (a.orderNumber ?? 999) - (b.orderNumber ?? 999));
    return [...active, ...dq];
  }, [eligibleParticipants]);

  // Overall Rank Lookup Map (Only active non-disqualified participants get a numeric rank)
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 1;
    baselineRanked.forEach((p) => {
      if (p.status !== 'disqualificated') {
        map.set(p.id, counter++);
      }
    });
    return map;
  }, [baselineRanked]);

  // Top 3 Podium Winners (To be displayed prominently in header on all sheets - active only!)
  const topPodium = useMemo(() => {
    return baselineRanked
      .filter((p) => p.status !== 'disqualificated' && (p.totalScore || 0) > 0)
      .slice(0, 3);
  }, [baselineRanked]);

  // Processed Data based on validation sort and filter
  const processedData = useMemo(() => {
    let list = [...eligibleParticipants];

    // Filter Scope
    if (filterScope === 'scored_only') {
      list = list.filter((p) => p.status === 'disqualificated' || (p.totalScore || 0) > 0);
    } else if (filterScope === 'top3') {
      list = baselineRanked.filter((p) => p.status !== 'disqualificated').slice(0, 3);
    } else if (filterScope === 'top10') {
      list = baselineRanked.filter((p) => p.status !== 'disqualificated').slice(0, 10);
    }

    // Live Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(q) ||
          p.idolSong?.toLowerCase().includes(q) ||
          p.idolArtist?.toLowerCase().includes(q) ||
          p.familyName?.toLowerCase().includes(q)
      );
    }

    // Sort Validation
    list.sort((a, b) => {
      const isDQA = a.status === 'disqualificated';
      const isDQB = b.status === 'disqualificated';
      const rankA = rankMap.get(a.id) || 9999;
      const rankB = rankMap.get(b.id) || 9999;
      const totalA = a.totalScore || 0;
      const totalB = b.totalScore || 0;

      const jScore = (p: Participant, key: string, altKey?: string) =>
        p.scores?.judgeScores?.[key]?.total ?? (altKey ? p.scores?.judgeScores?.[altKey]?.total : 0) ?? 0;

      if (sortField.startsWith('judge_')) {
        const judgeId = sortField.replace('judge_', '').replace('_desc', '');
        const targetJudge = judgesList.find((j) => j.id === judgeId || j.username === judgeId);
        return jScore(b, judgeId, targetJudge?.username) - jScore(a, judgeId, targetJudge?.username);
      }

      switch (sortField) {
        case 'rank_asc':
          if (isDQA && !isDQB) return 1;
          if (!isDQA && isDQB) return -1;
          return totalB - totalA || rankA - rankB;
        case 'rank_desc':
          if (isDQA && !isDQB) return 1;
          if (!isDQA && isDQB) return -1;
          return totalA - totalB || rankB - rankA;
        case 'name_asc':
          return (a.fullName || '').localeCompare(b.fullName || '');
        case 'name_desc':
          return (b.fullName || '').localeCompare(a.fullName || '');
        case 'song_asc':
          return (a.idolSong || '').localeCompare(b.idolSong || '');
        case 'artist_asc':
          return (a.idolArtist || '').localeCompare(b.idolArtist || '');
        case 'order_asc':
          return (a.orderNumber ?? 999) - (b.orderNumber ?? 999);
        default:
          if (isDQA && !isDQB) return 1;
          if (!isDQA && isDQB) return -1;
          if (sortField.includes('juri')) {
            const num = sortField.replace(/[^0-9]/g, '');
            const jIndex = parseInt(num, 10) - 1;
            const targetJ = judgesList[jIndex];
            if (targetJ) {
              return jScore(b, targetJ.id, targetJ.username) - jScore(a, targetJ.id, targetJ.username);
            }
          }
          return rankA - rankB;
      }
    });

    return list;
  }, [eligibleParticipants, baselineRanked, rankMap, filterScope, searchQuery, sortField, judgesList]);

  // Chunk data into pages of max 10 participants per page
  const pagedData = useMemo(() => {
    if (processedData.length === 0) return [[]];
    const pages: Participant[][] = [];
    for (let i = 0; i < processedData.length; i += ITEMS_PER_PAGE) {
      pages.push(processedData.slice(i, i + ITEMS_PER_PAGE));
    }
    return pages;
  }, [processedData]);

  const totalPages = pagedData.length;

  // Keep activePreviewPage within range
  const safeActivePage = Math.min(Math.max(1, activePreviewPage), totalPages);

  if (!isOpen) return null;

  // Single Action: Download all pages as A4 PNGs (or single page if only 1 page)
  const handleDownloadA4PNG = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(null);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));

      const dateStr = new Date().toISOString().slice(0, 10);

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageNumber = pageIdx + 1;
        setDownloadProgress(
          totalPages > 1
            ? `Memproses lembar ${pageNumber} dari ${totalPages}...`
            : 'Memproses gambar A4...'
        );

        const node = pageRefs.current[pageIdx];
        if (!node) continue;

        const width = node.offsetWidth || 794;
        const height = node.offsetHeight || 1123;

        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2.5, // Razor sharp ultra HD A4 print resolution (300 DPI equivalent)
          quality: 1,
          width,
          height,
          style: {
            transform: 'none',
            transformOrigin: 'top left',
            margin: '0',
            boxSizing: 'border-box',
          },
        });

        const fileName =
          totalPages > 1
            ? `Laporan_Rekapitulasi_Nilai_A4_RC_Virgo_Lembar_${pageNumber}_dari_${totalPages}_${dateStr}.png`
            : `Laporan_Rekapitulasi_Nilai_A4_RC_Virgo_${sortField}_${dateStr}.png`;

        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay between multiple downloads to avoid browser throttle
        if (pageIdx < totalPages - 1) {
          await new Promise((res) => setTimeout(res, 400));
        }
      }

      setDownloadSuccess(
        totalPages > 1
          ? `Berhasil mengunduh ${totalPages} lembar laporan A4 (PNG) secara berurutan!`
          : 'Laporan A4 (PNG) berhasil diunduh dalam resolusi tinggi!'
      );
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err) {
      console.error('Error generating A4 PNG:', err);
      alert('Terjadi kesalahan saat memproses gambar PNG. Silakan coba sesaat lagi.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-serif-luxury">
                <span>Download Laporan Rekapitulasi & Ranking</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-black uppercase">
                  Format PNG A4
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Maksimal 10 peserta per lembar A4. Header selalu menampilkan Juara 1, 2, dan 3.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar (Sortir & Filter Validasi + Lembar Selector) */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 shrink-0 space-y-3">
          {/* Notification Banner */}
          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{downloadSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Sort Dropdown */}
            <div className="md:col-span-5 flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sortir:</span>
              </span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                <option value="rank_asc">🏆 Peringkat / Skor Tertinggi ➔ Terendah (Juara 1 ke bawah)</option>
                <option value="rank_desc">📈 Total Skor Terendah ➔ Tertinggi</option>
                <option value="name_asc">🔤 Nama Penyanyi (A ➔ Z)</option>
                <option value="name_desc">🔤 Nama Penyanyi (Z ➔ A)</option>
                <option value="song_asc">🎵 Judul Lagu (A ➔ Z)</option>
                <option value="artist_asc">🎤 Artist Idola (A ➔ Z)</option>
                <option value="order_asc">🔢 Nomor Urut Tampil (1 ➔ Selesai)</option>
                {judgesList.map((j) => (
                  <option key={j.id} value={`judge_${j.id}_desc`}>
                    🌟 Nilai Tertinggi {j.fullName || j.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Scope Buttons */}
            <div className="md:col-span-4 flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterScope === 'all'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua ({eligibleParticipants.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('scored_only')}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterScope === 'scored_only'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Sudah Dinilai
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('top3')}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterScope === 'top3'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Top 3
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('top10')}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterScope === 'top10'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Top 10
              </button>
            </div>

            {/* Live Search input */}
            <div className="md:col-span-3 relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama/lagu..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Multi-Page Navigation Bar if > 1 page */}
          {totalPages > 1 && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>
                  Total Data: <strong className="text-white">{processedData.length}</strong> peserta ({totalPages} lembar A4 • 10 peserta/lembar)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeActivePage <= 1}
                  onClick={() => setActivePreviewPage((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setActivePreviewPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        safeActivePage === pNum
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={safeActivePage >= totalPages}
                  onClick={() => setActivePreviewPage((prev) => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/50 flex flex-col items-center gap-6">
          {/* Render all pages: the active preview page is visible, and all other pages are rendered in DOM for toPng capture */}
          {pagedData.map((pageParticipants, pageIndex) => {
            const pageNumber = pageIndex + 1;
            const isCurrentPreview = safeActivePage === pageNumber;
            const startNumber = pageIndex * ITEMS_PER_PAGE + 1;
            const endNumber = Math.min((pageIndex + 1) * ITEMS_PER_PAGE, processedData.length);

            return (
              <div
                key={pageIndex}
                className={isCurrentPreview ? 'block' : 'hidden'}
              >
                {/* A4 Canvas Container Target for toPng (Standard A4 ratio ~ 794px x 1123px) */}
                <div
                  ref={(el) => { pageRefs.current[pageIndex] = el; }}
                  className="w-[794px] min-h-[1123px] bg-gradient-to-br from-[#0c0818] via-[#101426] to-[#090d1a] border-2 border-amber-400/40 rounded-2xl p-7 shadow-2xl text-slate-100 flex flex-col justify-between relative overflow-hidden"
                  style={{ boxSizing: 'border-box' }}
                >
                  {/* Background Decorative Ambient Accents */}
                  <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

                  {/* Top Gold Accent Bar */}
                  <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-amber-400 to-indigo-500 rounded-full mb-4" />

                  {/* Document Header */}
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-700/60 relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Properly sized and balanced logo badge matching reference */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 p-[1.5px] shadow-md shadow-pink-500/10 shrink-0">
                        <div className="w-full h-full bg-[#0a0d1f] rounded-[10px] p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={RC_LOGO_IMAGE}
                            alt="RC Logo"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono text-[8.5px] font-bold uppercase tracking-wider mb-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          <span>Dokumen Rekapitulasi Resmi Dewan Juri</span>
                        </div>
                        <h1 className="text-lg font-bold text-white tracking-wide font-serif-luxury leading-tight">
                          RC BIRTHDAY CELEBRATION & VIRGO PARTY 2026
                        </h1>
                        <p className="text-[10px] text-pink-300 font-medium tracking-wide">
                          Event Lomba Nyanyi Mirip Idola • Rainbow Candy Collaboration
                        </p>
                      </div>
                    </div>

                    {/* Event Meta Badges */}
                    <div className="text-right shrink-0">
                      <div className="px-3.5 py-1.5 rounded-xl bg-[#0d122b]/90 border border-slate-700/70 text-right space-y-0.5 shadow-inner">
                        <div className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                          Pelaksanaan Lomba
                        </div>
                        <div className="text-xs font-bold text-amber-400">
                          Minggu, 13 September 2026
                        </div>
                        <div className="text-[8.5px] font-mono text-slate-300">
                          {judgesList.length} Dewan Juri Independen
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Header Top 3 Podium Highlights Section (Always displayed on every sheet: Juara 1, 2, 3) */}
                  <div className="my-3 p-2.5 rounded-xl bg-[#090e24]/90 border border-slate-800 grid grid-cols-3 gap-2.5 relative z-10 shadow-lg">
                    {topPodium.length > 0 ? (
                      topPodium.map((winner, idx) => {
                        const medal = idx === 0 ? '👑 Juara 1' : idx === 1 ? '🥈 Juara 2' : '🥉 Juara 3';
                        const badgeColor =
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-950 font-bold'
                            : 'bg-amber-600 text-white font-bold';

                        return (
                          <div
                            key={winner.id}
                            className="p-2.5 rounded-lg bg-[#0d122d]/80 border border-slate-800/80 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono uppercase ${badgeColor}`}>
                                {medal}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                {winner.totalScore !== undefined && winner.totalScore > 0
                                  ? `${winner.totalScore.toFixed(1)} pt`
                                  : '-'}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white truncate">
                                {winner.fullName}
                              </div>
                              <div className="text-[9.5px] text-slate-400 truncate">
                                🎵 {winner.idolSong || '-'} ({winner.idolArtist || '-'})
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-3 text-center py-2 text-xs text-slate-400 font-mono">
                        Podium Juara 1, 2, dan 3 akan otomatis terkunci setelah seluruh penilaian masuk.
                      </div>
                    )}
                  </div>

                  {/* Main Scores & Ranking Table (Max 10 rows per sheet) */}
                  <div className="flex-1 my-1 relative z-10 flex flex-col justify-start">
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0a0d21]/95 shadow-xl">
                      <table className="w-full text-left text-[10px] text-slate-200">
                        <thead className="bg-[#0f1430] border-b border-slate-800 text-slate-400 font-mono uppercase text-[8.5px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-14">Rank</th>
                            <th className="py-2.5 px-2.5 text-center w-16">No Urut</th>
                            <th className="py-2.5 px-3">Nama Penyanyi</th>
                            <th className="py-2.5 px-3">Lagu Idola</th>
                            <th className="py-2.5 px-2.5">Artis Idola</th>
                            <th className="py-2.5 px-3 text-right w-28">
                              <div>Total Nilai</div>
                              <div className="text-[7px] text-amber-400 font-normal normal-case">Total Semua Juri</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 font-mono">
                          {pageParticipants.length > 0 ? (
                            pageParticipants.map((p) => {
                              const isDQ = p.status === 'disqualificated';
                              const rank = rankMap.get(p.id);
                              const isPodium = !isDQ && (rank === 1 || rank === 2 || rank === 3);
                              const rankDisplay = isDQ ? (
                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[8.5px] font-bold">
                                  DQ
                                </span>
                              ) : rank === 1 ? (
                                '🥇 #1'
                              ) : rank === 2 ? (
                                '🥈 #2'
                              ) : rank === 3 ? (
                                '🥉 #3'
                              ) : rank !== undefined ? (
                                `#${rank}`
                              ) : (
                                '-'
                              );

                              return (
                                <tr
                                  key={p.id}
                                  className={`hover:bg-slate-900/50 ${
                                    isDQ
                                      ? 'bg-red-950/15'
                                      : isPodium
                                      ? 'bg-amber-400/5 font-medium'
                                      : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                                    {rankDisplay}
                                  </td>
                                  <td className="py-2.5 px-2.5 text-center font-mono">
                                    <div className="font-bold text-slate-200 text-[10px]">
                                      {p.orderNumber !== undefined && p.orderNumber !== null ? `#${p.orderNumber}` : '-'}
                                    </div>
                                    {typeof p.orderNumber === 'number' && p.orderNumber >= 1 && p.orderNumber <= 30 && (
                                      <div className="text-[7.5px] text-pink-400 font-sans">
                                        Bagan {Math.ceil(p.orderNumber / 6)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-sans">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-white text-[10.5px] truncate max-w-[150px]">
                                        {p.fullName}
                                      </span>
                                      {isDQ && (
                                        <span className="px-1 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[7.5px] font-mono uppercase font-bold shrink-0">
                                          Diskualifikasi
                                        </span>
                                      )}
                                    </div>
                                    {p.familyName && (
                                      <div className="text-[8.5px] text-slate-400 font-normal truncate max-w-[200px]">
                                        Family: {p.familyName}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-sans text-slate-200 truncate max-w-[170px]">
                                    {p.idolSong || '-'}
                                  </td>
                                  <td className="py-2.5 px-2.5 font-sans text-slate-300 truncate max-w-[120px]">
                                    {p.idolArtist || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    {isDQ ? (
                                      <span className="inline-flex items-center justify-end px-2 py-0.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-bold font-mono text-[9px] shadow-sm">
                                        DISKUALIFIKASI
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-end px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-black font-mono text-[11px] shadow-sm">
                                        {p.totalScore !== undefined && p.totalScore > 0
                                          ? `${p.totalScore.toFixed(1)} pt`
                                          : '-'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                                Tidak ada data peserta untuk filter saat ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Caption Note & Page Info */}
                    <div className="mt-2 flex items-center justify-between text-[8px] text-slate-400 font-mono px-1">
                      <span>
                        * Total Nilai merupakan akumulasi poin resmi dari seluruh ({judgesList.length}) Dewan Juri independen.
                      </span>
                      <span className="font-semibold text-slate-400">
                        {totalPages > 1
                          ? `Lembar ${pageNumber} dari ${totalPages} (Total: ${processedData.length} Peserta)`
                          : `Total Data: ${processedData.length} Peserta`}
                      </span>
                    </div>
                  </div>

                  {/* Document Footer: Signatures & Verification Seal */}
                  <div className="pt-3.5 border-t border-slate-700/60 mt-2 relative z-10">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {/* Sign-off 1 */}
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-slate-400">Koordinator Dewan Juri</div>
                        <div className="h-9 flex items-center justify-center">
                          <span className="text-[10px] font-serif-luxury italic text-amber-300 font-bold opacity-80">
                            [Tervalidasi Resmi]
                          </span>
                        </div>
                        <div className="text-[9px] font-bold text-slate-200 pt-1 border-t border-slate-700 w-32 mx-auto">
                          {judgesList.length > 1 ? `Dewan Juri 1 - ${judgesList.length}` : 'Dewan Juri'}
                        </div>
                      </div>

                      {/* Sign-off 2 */}
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-slate-400">Ketua Panitia Pelaksana</div>
                        <div className="h-9 flex items-center justify-center">
                          <span className="text-[10px] font-serif-luxury italic text-pink-300 font-bold opacity-80">
                            [Rainbow Candy Collab]
                          </span>
                        </div>
                        <div className="text-[9px] font-bold text-slate-200 pt-1 border-t border-slate-700 w-32 mx-auto">
                          Admin RC Virgo Party
                        </div>
                      </div>

                      {/* Sign-off 3: Stamp & Date */}
                      <div className="space-y-1 text-right sm:text-center">
                        <div className="text-[9px] font-mono text-slate-400">Tanggal Cetak Dokumen</div>
                        <div className="h-9 flex items-center justify-center">
                          <div className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[8px] font-mono font-bold">
                            VERIFIED SYSTEM
                          </div>
                        </div>
                        <div className="text-[9px] font-mono text-slate-300 pt-1 border-t border-slate-700 w-32 mx-auto">
                          {currentDateFormatted}
                        </div>
                      </div>
                    </div>

                    {/* Footer Stamp & Page Counter Indicator */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[8px] text-slate-500">
                      <span>© 2026 Rainbow Candy (RC Collaboration) • Rekapitulasi Penilaian Nyanyi Mirip Idola</span>
                      <span className="font-mono text-amber-400/90 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        Lembar {pageNumber} dari {totalPages}
                      </span>
                      <span className="font-semibold text-slate-400">Designed by Noir</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer: The One and Only Prominent Download Button */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Format: <strong>PNG A4 Ultra HD (300 DPI)</strong> • Maks. 10 peserta per lembar{' '}
              {totalPages > 1 && `(${totalPages} Lembar)`}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {/* The single required download button */}
            <button
              type="button"
              onClick={handleDownloadA4PNG}
              disabled={isDownloading || processedData.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-pink-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{downloadProgress || 'Memproses Gambar A4...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {totalPages > 1
                      ? `Download Laporan (${totalPages} Lembar PNG A4)`
                      : 'Download Laporan (PNG A4)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
