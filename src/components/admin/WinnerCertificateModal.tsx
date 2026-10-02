import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Award,
  Download,
  X,
  Crown,
  Sparkles,
  CheckCircle2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileDown,
  Check,
  Calendar,
  User,
  Music,
  ShieldCheck,
  Palette,
  QrCode,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Participant, AdminUser, EventSettings } from '../../types/participant';
import { formatValue } from '../../services/supabaseClient';
import { RC_LOGO_IMAGE } from '../../assets/logo';

export type CertificateTheme = 'royal_dark' | 'ivory_classic';

interface WinnerCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  eventSettings?: EventSettings;
  adminUsers?: AdminUser[];
  eventTitle?: string;
  initialSelectedRank?: 1 | 2 | 3 | 'all';
}

interface WinnerData {
  rank: 1 | 2 | 3;
  rankLabel: string;
  rankTitle: string;
  rewardText: string;
  participant: Participant | null;
  themeColor: {
    badgeBg: string;
    badgeText: string;
    border: string;
    accent: string;
    goldGrad: string;
  };
}

export const WinnerCertificateModal: React.FC<WinnerCertificateModalProps> = ({
  isOpen,
  onClose,
  participants,
  eventSettings,
  adminUsers = [],
  eventTitle = 'RC Birthday Celebration & Virgo Party 2026',
  initialSelectedRank = 1,
}) => {
  const [selectedRank, setSelectedRank] = useState<1 | 2 | 3>(
    initialSelectedRank === 'all' ? 1 : initialSelectedRank
  );
  const [theme, setTheme] = useState<CertificateTheme>('royal_dark');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Editable signatures & metadata
  const [committeeHead, setCommitteeHead] = useState('Ketua Panitia RC Collaboration');
  const [chiefJudge, setChiefJudge] = useState('Koordinator Dewan Juri');
  const [certificateDate, setCertificateDate] = useState('13 September 2026');

  useEffect(() => {
    if (initialSelectedRank && initialSelectedRank !== 'all') {
      setSelectedRank(initialSelectedRank);
    }
  }, [initialSelectedRank, isOpen]);

  const certRefs = {
    1: useRef<HTMLDivElement | null>(null),
    2: useRef<HTMLDivElement | null>(null),
    3: useRef<HTMLDivElement | null>(null),
  };

  // Extract Top 3 winners from locked status or rankings
  const winners: WinnerData[] = useMemo(() => {
    // 1. Check if officialWinners exist in eventSettings
    const officialJuara1Id = eventSettings?.officialWinners?.juara1Id;
    const officialJuara2Id = eventSettings?.officialWinners?.juara2Id;
    const officialJuara3Id = eventSettings?.officialWinners?.juara3Id;

    // Filter confirmed & active participants sorted by total score descending
    const rankedActive = [...participants]
      .filter((p) => p.status !== 'disqualificated' && (p.totalScore || 0) > 0)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

    const p1 =
      participants.find((p) => p.winnerTitle === 'Juara 1') ||
      (officialJuara1Id ? participants.find((p) => p.id === officialJuara1Id) : null) ||
      rankedActive[0] ||
      null;

    const p2 =
      participants.find((p) => p.winnerTitle === 'Juara 2') ||
      (officialJuara2Id ? participants.find((p) => p.id === officialJuara2Id) : null) ||
      rankedActive[1] ||
      null;

    const p3 =
      participants.find((p) => p.winnerTitle === 'Juara 3') ||
      (officialJuara3Id ? participants.find((p) => p.id === officialJuara3Id) : null) ||
      rankedActive[2] ||
      null;

    return [
      {
        rank: 1,
        rankLabel: 'JUARA 1',
        rankTitle: 'JUARA I (PERTAMA)',
        rewardText: 'Hadiah: Rp 500.000 + E-Sertifikat Resmi + Trophy Juara',
        participant: p1,
        themeColor: {
          badgeBg: 'bg-amber-400 text-slate-950',
          badgeText: 'text-amber-400',
          border: 'border-amber-400',
          accent: '#F59E0B',
          goldGrad: 'from-amber-300 via-amber-400 to-amber-600',
        },
      },
      {
        rank: 2,
        rankLabel: 'JUARA 2',
        rankTitle: 'JUARA II (KEDUA)',
        rewardText: 'Hadiah: Rp 300.000 + E-Sertifikat Resmi',
        participant: p2,
        themeColor: {
          badgeBg: 'bg-slate-300 text-slate-950',
          badgeText: 'text-slate-300',
          border: 'border-slate-300',
          accent: '#CBD5E1',
          goldGrad: 'from-slate-200 via-slate-300 to-slate-500',
        },
      },
      {
        rank: 3,
        rankLabel: 'JUARA 3',
        rankTitle: 'JUARA III (KETIGA)',
        rewardText: 'Hadiah: Rp 200.000 + E-Sertifikat Resmi',
        participant: p3,
        themeColor: {
          badgeBg: 'bg-amber-700 text-amber-100',
          badgeText: 'text-amber-500',
          border: 'border-amber-600',
          accent: '#D97706',
          goldGrad: 'from-amber-600 via-amber-700 to-amber-900',
        },
      },
    ];
  }, [participants, eventSettings]);

  const activeWinner = winners.find((w) => w.rank === selectedRank) || winners[0];

  if (!isOpen) return null;

  // Generate unique official certificate code
  const getCertificateCode = (winner: WinnerData) => {
    const idStr = winner.participant?.idpopup
      ? String(winner.participant.idpopup).padStart(3, '0')
      : String(winner.rank).padStart(3, '0');
    return `RC-CERT/VIRGO-2026/J${winner.rank}-${idStr}`;
  };

  // Download Single Certificate as PNG (300 DPI Ultra HD)
  const handleDownloadPNG = async (rank: 1 | 2 | 3) => {
    const targetRef = certRefs[rank].current;
    if (!targetRef || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(`Menyiapkan sertifikat Juara ${rank} resolusi tinggi...`);
    setDownloadSuccess(null);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));

      const w = targetRef.offsetWidth || 1123;
      const h = targetRef.offsetHeight || 794;

      const dataUrl = await toPng(targetRef, {
        cacheBust: true,
        pixelRatio: 2.5, // 300 DPI razor-sharp print quality
        quality: 1,
        width: w,
        height: h,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          margin: '0',
        },
      });

      const winner = winners.find((w) => w.rank === rank);
      const nameClean = winner?.participant?.fullName
        ? winner.participant.fullName.replace(/[^a-zA-Z0-9]/g, '_')
        : `Juara_${rank}`;
      const famsClean = winner?.participant?.familyName
        ? winner.participant.familyName.replace(/[^a-zA-Z0-9]/g, '_')
        : 'Fams';

      const fileName = `Sertifikat_Juara_${rank}_${nameClean}_${famsClean}_RC_Virgo_Party_2026.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(`Sertifikat Juara ${rank} (${winner?.participant?.fullName || 'Pemenang'}) berhasil didownload!`);
    } catch (err: any) {
      console.error('Error generating certificate PNG:', err);
      alert('Gagal membuat gambar sertifikat: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  // Download Single Certificate as PDF (A4 Landscape Print-ready)
  const handleDownloadPDF = async (rank: 1 | 2 | 3) => {
    const targetRef = certRefs[rank].current;
    if (!targetRef || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(`Mengonversi sertifikat Juara ${rank} ke PDF Resmi A4...`);
    setDownloadSuccess(null);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));

      const w = targetRef.offsetWidth || 1123;
      const h = targetRef.offsetHeight || 794;

      const dataUrl = await toPng(targetRef, {
        cacheBust: true,
        pixelRatio: 2.5,
        quality: 1,
        width: w,
        height: h,
      });

      // A4 Landscape: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');

      const winner = winners.find((w) => w.rank === rank);
      const nameClean = winner?.participant?.fullName
        ? winner.participant.fullName.replace(/[^a-zA-Z0-9]/g, '_')
        : `Juara_${rank}`;
      const famsClean = winner?.participant?.familyName
        ? winner.participant.familyName.replace(/[^a-zA-Z0-9]/g, '_')
        : 'Fams';

      const fileName = `Sertifikat_Juara_${rank}_${nameClean}_${famsClean}_RC_Virgo_Party_2026.pdf`;
      pdf.save(fileName);

      setDownloadSuccess(`Sertifikat PDF Juara ${rank} berhasil dibuat dan disimpan!`);
    } catch (err: any) {
      console.error('Error generating certificate PDF:', err);
      alert('Gagal membuat sertifikat PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  // Download All 3 Certificates sequentially in 1-Click
  const handleDownloadAll = async (format: 'png' | 'pdf') => {
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(null);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];
        setDownloadProgress(`Memproses Sertifikat Juara ${winner.rank} (${i + 1} dari 3)...`);

        const targetRef = certRefs[winner.rank].current;
        if (!targetRef) continue;

        const w = targetRef.offsetWidth || 1123;
        const h = targetRef.offsetHeight || 794;

        const dataUrl = await toPng(targetRef, {
          cacheBust: true,
          pixelRatio: 2.5,
          quality: 1,
          width: w,
          height: h,
        });

        const nameClean = winner.participant?.fullName
          ? winner.participant.fullName.replace(/[^a-zA-Z0-9]/g, '_')
          : `Juara_${winner.rank}`;
        const famsClean = winner.participant?.familyName
          ? winner.participant.familyName.replace(/[^a-zA-Z0-9]/g, '_')
          : 'Fams';

        if (format === 'png') {
          const fileName = `Sertifikat_Juara_${winner.rank}_${nameClean}_${famsClean}_RC_Virgo_Party_2026.png`;
          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          link.click();
        } else {
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
          });
          pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
          const fileName = `Sertifikat_Juara_${winner.rank}_${nameClean}_${famsClean}_RC_Virgo_Party_2026.pdf`;
          pdf.save(fileName);
        }

        // Small pause between downloads to avoid browser block
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setDownloadSuccess(`Seluruh 3 E-Sertifikat (Juara 1, 2, dan 3) berhasil didownload!`);
    } catch (err: any) {
      console.error('Error downloading all certificates:', err);
      alert('Terjadi kendala saat download batch: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>E-Sertifikat Pemenang Resmi</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-400/20">
                  Juara 1, 2 & 3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sertifikat penghargaan resmi beresolusi tinggi dengan nama pemenang, asal fams, dan perolehan skor.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Rank Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            {winners.map((w) => {
              const isActive = selectedRank === w.rank;
              return (
                <button
                  key={w.rank}
                  onClick={() => setSelectedRank(w.rank)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? w.rank === 1
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                        : w.rank === 2
                        ? 'bg-slate-200 text-slate-950 shadow-md font-black'
                        : 'bg-amber-700 text-amber-100 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{w.rankLabel}</span>
                  {w.participant && (
                    <span className="text-[10px] opacity-75 truncate max-w-[90px]">
                      ({w.participant.fullName.split(' ')[0]})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Theme & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
              <button
                onClick={() => setTheme('royal_dark')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  theme === 'royal_dark'
                    ? 'bg-slate-800 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Royal Midnight
              </button>
              <button
                onClick={() => setTheme('ivory_classic')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  theme === 'ivory_classic'
                    ? 'bg-amber-100 text-slate-900 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Classic Ivory
              </button>
            </div>

            {/* Download Actions */}
            <button
              onClick={() => handleDownloadPNG(selectedRank)}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Sertifikat Pilihan sebagai Gambar PNG (Resolusi Tajam 300 DPI)"
            >
              <Download className="w-4 h-4" />
              <span>PNG (Juara {selectedRank})</span>
            </button>

            <button
              onClick={() => handleDownloadPDF(selectedRank)}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-400/30 shadow-md hover:border-amber-400/60 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Sertifikat Pilihan sebagai Dokumen PDF Siap Cetak"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF (Juara {selectedRank})</span>
            </button>

            <button
              onClick={() => handleDownloadAll('png')}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Semua Sertifikat (Juara 1, 2, dan 3) Sekaligus"
            >
              <Layers className="w-4 h-4" />
              <span>Download Semua (1, 2, 3)</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {downloadProgress && (
          <div className="px-6 py-2.5 bg-amber-500/20 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            <span className="font-semibold">{downloadProgress}</span>
          </div>
        )}

        {downloadSuccess && (
          <div className="px-6 py-2.5 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{downloadSuccess}</span>
            </span>
            <button
              onClick={() => setDownloadSuccess(null)}
              className="text-emerald-400 hover:text-emerald-200 text-[10px]"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Modal Main Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Winner Brief Information */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-black ${activeWinner.themeColor.badgeBg}`}>
                🏆 {activeWinner.rankTitle}
              </span>
              <div>
                <p className="font-bold text-slate-100 text-sm">
                  {activeWinner.participant ? activeWinner.participant.fullName : 'Belum Ditetapkan'}
                </p>
                <p className="text-slate-400">
                  Fams: <strong className="text-amber-300">{formatValue(activeWinner.participant?.familyName)}</strong> • Lagu: &ldquo;{formatValue(activeWinner.participant?.idolSong)}&rdquo; • Idola: {formatValue(activeWinner.participant?.idolArtist)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500">Total Skor: </span>
                <strong className="text-amber-400 font-black">
                  {activeWinner.participant?.totalScore ? activeWinner.participant.totalScore.toFixed(1) : '0.0'} Poin
                </strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500">ID Sertifikat: </span>
                <strong className="text-slate-300 font-bold">{getCertificateCode(activeWinner)}</strong>
              </div>
            </div>
          </div>

          {/* Certificate Preview Stage */}
          <div className="flex justify-center items-center py-2 overflow-x-auto">
            {/* The Actual Rendered Certificate Canvas Node for the currently selected rank */}
            <div
              ref={certRefs[selectedRank]}
              style={{
                width: '1000px',
                height: '707px', // A4 Landscape ratio (1 : 1.414)
              }}
              className={`relative select-none p-10 flex flex-col justify-between shrink-0 shadow-2xl transition-all duration-300 overflow-hidden ${
                theme === 'royal_dark'
                  ? 'bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-950 text-slate-100'
                  : 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFEB] text-slate-900'
              }`}
            >
              {/* Luxury Geometric Border Outer */}
              <div
                className={`absolute inset-4 pointer-events-none border-2 rounded-2xl ${
                  theme === 'royal_dark' ? 'border-amber-400/40' : 'border-amber-700/50'
                }`}
              />
              {/* Luxury Geometric Border Inner with Corner Rosettes */}
              <div
                className={`absolute inset-6 pointer-events-none border border-dashed rounded-xl ${
                  theme === 'royal_dark' ? 'border-amber-400/20' : 'border-amber-700/30'
                }`}
              />

              {/* Corner Ornaments */}
              <div className="absolute top-7 left-7 w-8 h-8 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
              <div className="absolute top-7 right-7 w-8 h-8 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
              <div className="absolute bottom-7 left-7 w-8 h-8 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
              <div className="absolute bottom-7 right-7 w-8 h-8 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

              {/* Watermark Emblem in Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <img
                  src={RC_LOGO_IMAGE}
                  alt="Watermark"
                  className="w-96 h-96 object-contain filter grayscale"
                />
              </div>

              {/* TOP HEADER SECTION */}
              <div className="relative z-10 text-center space-y-2">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <img
                    src={RC_LOGO_IMAGE}
                    alt="Rainbow Candy"
                    className="w-14 h-14 object-contain filter drop-shadow-md"
                  />
                  <div className="text-left">
                    <p className={`font-mono text-[11px] tracking-[0.25em] font-black uppercase ${
                      theme === 'royal_dark' ? 'text-amber-400' : 'text-amber-800'
                    }`}>
                      Rainbow Candy Collaboration
                    </p>
                    <p className={`text-xs font-semibold ${theme === 'royal_dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      Official Event & Family Community
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h1
                    style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
                    className={`text-3xl font-black tracking-wider uppercase ${
                      theme === 'royal_dark' ? 'text-amber-300' : 'text-amber-900'
                    }`}
                  >
                    Sertifikat Penghargaan
                  </h1>
                  <p className={`font-mono text-[11px] tracking-widest uppercase ${
                    theme === 'royal_dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Certificate of Achievement • No: {getCertificateCode(activeWinner)}
                  </p>
                </div>
              </div>

              {/* MIDDLE BODY SECTION */}
              <div className="relative z-10 text-center space-y-4 my-auto px-6">
                <p className={`text-xs font-serif italic ${
                  theme === 'royal_dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Dengan bangga dan apresiasi setinggi-tingginya, piagam ini dianugerahkan kepada:
                </p>

                {/* WINNER NAME */}
                <div className="space-y-1">
                  <h2
                    style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
                    className={`text-3xl sm:text-4xl font-black tracking-wide ${
                      theme === 'royal_dark'
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100'
                        : 'text-amber-950'
                    }`}
                  >
                    {activeWinner.participant ? activeWinner.participant.fullName : 'Nama Pemenang'}
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`text-sm font-semibold tracking-wider ${
                        theme === 'royal_dark' ? 'text-amber-400' : 'text-amber-800'
                      }`}
                    >
                      FAMS:{' '}
                      <strong className="uppercase">
                        {activeWinner.participant ? formatValue(activeWinner.participant.familyName) : 'Rainbow Candy'}
                      </strong>
                    </span>
                    {activeWinner.participant?.idpopup && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        theme === 'royal_dark' ? 'bg-slate-800 text-slate-300' : 'bg-amber-100 text-amber-900'
                      }`}>
                        ID #{activeWinner.participant.idpopup}
                      </span>
                    )}
                  </div>
                </div>

                <p className={`text-xs max-w-xl mx-auto ${
                  theme === 'royal_dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Atas pencapaian vokal dan dedikasi gemilang dalam kompetisi bernyanyi tingkat keluarga besar pada:
                </p>

                {/* EVENT & ACHIEVEMENT BADGE */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl border shadow-lg backdrop-blur-sm">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span
                      className={`font-mono text-base font-black tracking-widest uppercase ${
                        selectedRank === 1
                          ? 'text-amber-400'
                          : selectedRank === 2
                          ? 'text-slate-300'
                          : 'text-amber-600'
                      }`}
                    >
                      {activeWinner.rankTitle}
                    </span>
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>

                  <p className={`text-xs font-bold ${theme === 'royal_dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    {eventTitle} — Lomba Nyanyi Mirip Idola
                  </p>

                  <p className={`text-[11px] font-medium ${theme === 'royal_dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Membawakan Lagu: &ldquo;{activeWinner.participant?.idolSong || '-'}&rdquo; (Idola: {activeWinner.participant?.idolArtist || '-'}) • Akumulasi Skor: {activeWinner.participant?.totalScore?.toFixed(1) || '0.0'} Poin
                  </p>
                </div>
              </div>

              {/* FOOTER & SIGNATURE SECTION */}
              <div className="relative z-10 pt-4 border-t border-amber-400/20 grid grid-cols-3 items-end text-center">
                {/* Signer 1: Ketua Panitia */}
                <div className="space-y-1">
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-base text-amber-400/90 font-bold">
                      {committeeHead}
                    </span>
                  </div>
                  <div className={`w-36 mx-auto border-b ${theme === 'royal_dark' ? 'border-slate-600' : 'border-slate-400'}`} />
                  <p className={`text-[11px] font-bold ${theme === 'royal_dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    Ketua Panitia Pelaksana
                  </p>
                  <p className={`text-[9px] font-mono ${theme === 'royal_dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Rainbow Candy Celebration
                  </p>
                </div>

                {/* Center Seal & QR Code */}
                <div className="space-y-1 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border-2 border-amber-400/60 p-1 flex items-center justify-center shadow-inner">
                    <div className="w-full h-full rounded-full bg-amber-400/10 flex items-center justify-center">
                      <ShieldCheck className="w-7 h-7 text-amber-400" />
                    </div>
                  </div>
                  <p className={`text-[10px] font-mono tracking-widest uppercase font-bold ${
                    theme === 'royal_dark' ? 'text-amber-400' : 'text-amber-800'
                  }`}>
                    VERIFIED OFFICIAL
                  </p>
                  <p className={`text-[9px] font-mono ${theme === 'royal_dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {certificateDate}
                  </p>
                </div>

                {/* Signer 2: Dewan Juri */}
                <div className="space-y-1">
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-base text-amber-400/90 font-bold">
                      {chiefJudge}
                    </span>
                  </div>
                  <div className={`w-36 mx-auto border-b ${theme === 'royal_dark' ? 'border-slate-600' : 'border-slate-400'}`} />
                  <p className={`text-[11px] font-bold ${theme === 'royal_dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    Perwakilan Dewan Juri
                  </p>
                  <p className={`text-[9px] font-mono ${theme === 'royal_dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Tim Juri Independen RC
                  </p>
                </div>
              </div>
            </div>

            {/* Hidden Offscreen Container for other ranks (so batch download can render them in background) */}
            <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none">
              {winners.map((w) => {
                if (w.rank === selectedRank) return null; // Already rendered in visible ref
                return (
                  <div
                    key={w.rank}
                    ref={certRefs[w.rank]}
                    style={{
                      width: '1000px',
                      height: '707px',
                    }}
                    className={`p-10 flex flex-col justify-between shadow-2xl overflow-hidden ${
                      theme === 'royal_dark'
                        ? 'bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-950 text-slate-100'
                        : 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFEB] text-slate-900'
                    }`}
                  >
                    {/* Borders */}
                    <div
                      className={`absolute inset-4 pointer-events-none border-2 rounded-2xl ${
                        theme === 'royal_dark' ? 'border-amber-400/40' : 'border-amber-700/50'
                      }`}
                    />
                    <div
                      className={`absolute inset-6 pointer-events-none border border-dashed rounded-xl ${
                        theme === 'royal_dark' ? 'border-amber-400/20' : 'border-amber-700/30'
                      }`}
                    />

                    {/* TOP HEADER */}
                    <div className="relative z-10 text-center space-y-2">
                      <div className="flex items-center justify-center gap-4 mb-2">
                        <img
                          src={RC_LOGO_IMAGE}
                          alt="Rainbow Candy"
                          className="w-14 h-14 object-contain filter drop-shadow-md"
                        />
                        <div className="text-left">
                          <p className={`font-mono text-[11px] tracking-[0.25em] font-black uppercase ${
                            theme === 'royal_dark' ? 'text-amber-400' : 'text-amber-800'
                          }`}>
                            Rainbow Candy Collaboration
                          </p>
                          <p className={`text-xs font-semibold ${theme === 'royal_dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            Official Event & Family Community
                          </p>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <h1
                          style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
                          className={`text-3xl font-black tracking-wider uppercase ${
                            theme === 'royal_dark' ? 'text-amber-300' : 'text-amber-900'
                          }`}
                        >
                          Sertifikat Penghargaan
                        </h1>
                        <p className={`font-mono text-[11px] tracking-widest uppercase ${
                          theme === 'royal_dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Certificate of Achievement • No: {getCertificateCode(w)}
                        </p>
                      </div>
                    </div>

                    {/* MIDDLE BODY */}
                    <div className="relative z-10 text-center space-y-4 my-auto px-6">
                      <p className={`text-xs font-serif italic ${
                        theme === 'royal_dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        Dengan bangga dan apresiasi setinggi-tingginya, piagam ini dianugerahkan kepada:
                      </p>

                      <div className="space-y-1">
                        <h2
                          style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
                          className={`text-3xl sm:text-4xl font-black tracking-wide ${
                            theme === 'royal_dark'
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100'
                              : 'text-amber-950'
                          }`}
                        >
                          {w.participant ? w.participant.fullName : 'Nama Pemenang'}
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`text-sm font-semibold tracking-wider ${
                              theme === 'royal_dark' ? 'text-amber-400' : 'text-amber-800'
                            }`}
                          >
                            FAMS:{' '}
                            <strong className="uppercase">
                              {w.participant ? formatValue(w.participant.familyName) : 'Rainbow Candy'}
                            </strong>
                          </span>
                          {w.participant?.idpopup && (
                            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                              theme === 'royal_dark' ? 'bg-slate-800 text-slate-300' : 'bg-amber-100 text-amber-900'
                            }`}>
                              ID #{w.participant.idpopup}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className={`text-xs max-w-xl mx-auto ${
                        theme === 'royal_dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Atas pencapaian vokal dan dedikasi gemilang dalam kompetisi bernyanyi tingkat keluarga besar pada:
                      </p>

                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl border shadow-lg backdrop-blur-sm">
                          <Crown className="w-5 h-5 text-amber-400" />
                          <span
                            className={`font-mono text-base font-black tracking-widest uppercase ${
                              w.rank === 1
                                ? 'text-amber-400'
                                : w.rank === 2
                                ? 'text-slate-300'
                                : 'text-amber-600'
                            }`}
                          >
                            {w.rankTitle}
                          </span>
                          <Crown className="w-5 h-5 text-amber-400" />
                        </div>

                        <p className={`text-xs font-bold ${theme === 'royal_dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                          {eventTitle} — Lomba Nyanyi Mirip Idola
                        </p>

                        <p className={`text-[11px] font-medium ${theme === 'royal_dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Membawakan Lagu: &ldquo;{w.participant?.idolSong || '-'}&rdquo; (Idola: {w.participant?.idolArtist || '-'}) • Akumulasi Skor: {w.participant?.totalScore?.toFixed(1) || '0.0'} Poin
                        </p>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="relative z-10 pt-4 border-t border-amber-400/20 grid grid-cols-3 items-end text-center">
                      <div className="space-y-1">
                        <div className="h-12 flex items-center justify-center">
                          <span className="font-serif italic text-base text-amber-400/90 font-bold">
                            {committeeHead}
                          </span>
                        </div>
                        <div className={`w-36 mx-auto border-b ${theme === 'royal_dark' ? 'border-slate-600' : 'border-slate-400'}`} />
                        <p className={`text-[11px] font-bold ${theme === 'royal_dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                          Ketua Panitia Pelaksana
                        </p>
                        <p className={`text-[9px] font-mono ${theme === 'royal_dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Rainbow Candy Celebration
                        </p>
                      </div>

                      <div className="space-y-1 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full border-2 border-amber-400/60 p-1 flex items-center justify-center shadow-inner">
                          <div className="w-full h-full rounded-full bg-amber-400/10 flex items-center justify-center">
                            <ShieldCheck className="w-7 h-7 text-amber-400" />
                          </div>
                        </div>
                        <p className={`text-[10px] font-mono tracking-widest uppercase font-bold ${
                          theme === 'royal_dark' ? 'text-amber-400' : 'text-amber-800'
                        }`}>
                          VERIFIED OFFICIAL
                        </p>
                        <p className={`text-[9px] font-mono ${theme === 'royal_dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                          {certificateDate}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="h-12 flex items-center justify-center">
                          <span className="font-serif italic text-base text-amber-400/90 font-bold">
                            {chiefJudge}
                          </span>
                        </div>
                        <div className={`w-36 mx-auto border-b ${theme === 'royal_dark' ? 'border-slate-600' : 'border-slate-400'}`} />
                        <p className={`text-[11px] font-bold ${theme === 'royal_dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                          Perwakilan Dewan Juri
                        </p>
                        <p className={`text-[9px] font-mono ${theme === 'royal_dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Tim Juri Independen RC
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Customization Collapsible / Metadata Inputs */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Kustomisasi Tanda Tangan & Tanggal Penerbitan Piagam</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Otomatis diaplikasikan ke semua sertifikat Juara 1, 2, dan 3
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Nama / Jabatan Ketua Panitia
                </label>
                <input
                  type="text"
                  value={committeeHead}
                  onChange={(e) => setCommitteeHead(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="Ketua Panitia RC"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Nama / Jabatan Dewan Juri
                </label>
                <input
                  type="text"
                  value={chiefJudge}
                  onChange={(e) => setChiefJudge(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="Koordinator Dewan Juri"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Tanggal Piagam Sertifikat
                </label>
                <input
                  type="text"
                  value={certificateDate}
                  onChange={(e) => setCertificateDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="13 September 2026"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>
              Format gambar PNG menggunakan resolusi cetak A4 300 DPI ultra tajam & PDF format standar A4 landscape.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={() => handleDownloadPNG(selectedRank)}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG (Juara {selectedRank})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
