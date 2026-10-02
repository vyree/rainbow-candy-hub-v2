import React, { useState, useMemo, useRef } from 'react';
import {
  Download,
  X,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Eye,
  EyeOff,
  Music,
  CheckCircle2,
  Calendar,
  Clock,
  Mic,
  Users,
  Check,
} from 'lucide-react';
import { Participant, AdminUser } from '../../types/participant';
import { toJpeg, toPng } from 'html-to-image';
import { RC_LOGO_IMAGE } from '../../assets/logo';

export type ExportImageFormat = 'png' | 'jpg';

interface BaganAcaraDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUser: AdminUser;
  eventTitle?: string;
}

interface BaganConfig {
  baganNumber: number;
  title: string;
  subtitle: string;
  themeColor: string;
  badgeBg: string;
  borderAccent: string;
  startOrder: number;
  endOrder: number;
}

const BAGAN_CONFIGS: BaganConfig[] = [
  {
    baganNumber: 1,
    title: 'BAGAN 1',
    subtitle: 'Urutan Tampil No. 1 s/d 6',
    themeColor: 'from-rose-500/25 via-pink-500/20 to-rose-600/10',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borderAccent: 'border-rose-500/40',
    startOrder: 1,
    endOrder: 6,
  },
  {
    baganNumber: 2,
    title: 'BAGAN 2',
    subtitle: 'Urutan Tampil No. 7 s/d 12',
    themeColor: 'from-sky-500/25 via-cyan-500/20 to-blue-600/10',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    borderAccent: 'border-sky-500/40',
    startOrder: 7,
    endOrder: 12,
  },
  {
    baganNumber: 3,
    title: 'BAGAN 3',
    subtitle: 'Urutan Tampil No. 13 s/d 18',
    themeColor: 'from-purple-500/25 via-violet-500/20 to-indigo-600/10',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    borderAccent: 'border-purple-500/40',
    startOrder: 13,
    endOrder: 18,
  },
  {
    baganNumber: 4,
    title: 'BAGAN 4',
    subtitle: 'Urutan Tampil No. 19 s/d 24',
    themeColor: 'from-amber-500/25 via-orange-500/20 to-yellow-600/10',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderAccent: 'border-amber-500/40',
    startOrder: 19,
    endOrder: 24,
  },
  {
    baganNumber: 5,
    title: 'BAGAN 5',
    subtitle: 'Urutan Tampil No. 25 s/d 30',
    themeColor: 'from-emerald-500/25 via-teal-500/20 to-green-600/10',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderAccent: 'border-emerald-500/40',
    startOrder: 25,
    endOrder: 30,
  },
];

export const BaganAcaraDownloadModal: React.FC<BaganAcaraDownloadModalProps> = ({
  isOpen,
  onClose,
  participants,
  currentUser,
  eventTitle = 'Rainbow Candy: Birthday Celebration & Virgo Party 2026',
}) => {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [activePage, setActivePage] = useState<number>(1); // 1 to 6
  const [imageFormat, setImageFormat] = useState<ExportImageFormat>('png');
  const [maskPhoneNumber, setMaskPhoneNumber] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Group 30 confirmed / done participants by order 1..30
  const confirmedList = useMemo(() => {
    return participants
      .filter((p) => (p.status === 'confirmed' || p.status === 'done') && p.orderNumber !== undefined && p.orderNumber !== null && p.orderNumber >= 1 && p.orderNumber <= 30)
      .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
  }, [participants]);

  // Group into 5 bagan
  const baganMap = useMemo(() => {
    const map: Record<number, Participant[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    confirmedList.forEach((p) => {
      const order = p.orderNumber || 0;
      if (order >= 1 && order <= 6) map[1].push(p);
      else if (order >= 7 && order <= 12) map[2].push(p);
      else if (order >= 13 && order <= 18) map[3].push(p);
      else if (order >= 19 && order <= 24) map[4].push(p);
      else if (order >= 25 && order <= 30) map[5].push(p);
    });

    return map;
  }, [confirmedList]);

  if (!isOpen) return null;

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '-';
    if (!maskPhoneNumber) return phone;
    if (phone.length <= 6) return phone;
    const start = phone.slice(0, 5);
    const end = phone.slice(-3);
    return `${start}****${end}`;
  };

  // Download single page
  const handleDownloadSinglePage = async (pageIdx: number, formatOverride?: ExportImageFormat) => {
    const selectedFormat = formatOverride || imageFormat;
    const isPng = selectedFormat === 'png';
    const ext = isPng ? 'png' : 'jpg';
    const generator = isPng ? toPng : toJpeg;
    const formatLabel = isPng ? 'PNG' : 'JPG';

    const node = pageRefs.current[pageIdx];
    if (!node) return;

    const pageNames = [
      'Hal_1_Rekap_Master_Bagan_1_sd_5',
      'Hal_2_Bagan_1_No_1_sd_6',
      'Hal_3_Bagan_2_No_7_sd_12',
      'Hal_4_Bagan_3_No_13_sd_18',
      'Hal_5_Bagan_4_No_19_sd_24',
      'Hal_6_Bagan_5_No_25_sd_30',
    ];

    const fileName = `Bagan_Susunan_Acara_${pageNames[pageIdx]}_${new Date().toISOString().slice(0, 10)}.${ext}`;

    const captureOptions = {
      quality: isPng ? 1 : 0.96,
      backgroundColor: '#070a14',
      pixelRatio: 2,
      cacheBust: true,
      style: {
        transform: 'none',
        transformOrigin: 'top left',
        margin: '0',
      },
    };

    const dataUrl = await generator(node, captureOptions);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download All 6 Pages
  const handleDownloadAllPages = async (formatOverride?: ExportImageFormat) => {
    if (isDownloading) return;
    const selectedFormat = formatOverride || imageFormat;
    const formatLabel = selectedFormat.toUpperCase();

    setIsDownloading(true);
    setDownloadSuccess(null);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));

      for (let i = 0; i < 6; i++) {
        setDownloadProgress(`Memproses Halaman ${i + 1} dari 6 (${formatLabel})...`);
        await handleDownloadSinglePage(i, selectedFormat);
        if (i < 5) {
          await new Promise((res) => setTimeout(res, 500));
        }
      }

      setDownloadSuccess(`Berhasil mengunduh seluruh 6 Halaman Bagan Susunan Acara (${formatLabel})!`);
      setTimeout(() => setDownloadSuccess(null), 6000);
    } catch (err) {
      console.error('Error downloading bagan pages:', err);
      alert('Terjadi kesalahan saat membuat berkas gambar. Silakan coba kembali.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  // Download only active preview page
  const handleDownloadCurrentPage = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      setDownloadProgress(`Memproses Halaman ${activePage} (${imageFormat.toUpperCase()})...`);
      await handleDownloadSinglePage(activePage - 1, imageFormat);
      setDownloadSuccess(`Halaman ${activePage} berhasil diunduh (${imageFormat.toUpperCase()})!`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh halaman.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  const renderPageContent = (pageIdx: number) => {
    if (pageIdx === 0) {
      return (
        <div
          style={{ width: '800px', minWidth: '800px' }}
          className="bg-[#070a14] border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-slate-100 flex flex-col gap-6 relative overflow-hidden"
        >
          {/* Background ambient accents */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Master Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-0.5 shadow-xl shadow-amber-500/20">
                <div className="w-full h-full bg-[#090d20] rounded-[14px] flex items-center justify-center p-2">
                  <img
                    src={RC_LOGO_IMAGE}
                    alt="Rainbow Candy Logo"
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-[0.25em] text-pink-400 font-bold uppercase block">
                  ★ RAINBOW CANDY EVENT NYANYI 2026 ★
                </span>
                <h1 className="font-serif-luxury text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-amber-200">
                  BAGAN SUSUNAN ACARA
                </h1>
                <p className="text-xs text-slate-300 italic mt-0.5 font-sans">
                  &ldquo;Suara Kecil Bisa Jadi Panggung Besar • Nyanyi Bersama Raih Mimpi&rdquo;
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                30 Confirmed
              </span>
              <div className="text-[10px] text-slate-400 mt-2 font-mono space-y-0.5">
                <div>Panggung: <strong>Live Audio Hall</strong></div>
                <div>Minggu, 13 September 2026 • 10:00 WIB</div>
              </div>
            </div>
          </div>

          {/* Master Grid 5 Bagan */}
          <div className="grid grid-cols-5 gap-2.5">
            {BAGAN_CONFIGS.map((cfg) => {
              const items = baganMap[cfg.baganNumber] || [];
              return (
                <div
                  key={cfg.baganNumber}
                  className={`rounded-2xl p-2.5 border flex flex-col justify-between ${cfg.borderAccent} bg-slate-900/70`}
                >
                  {/* Bagan Header */}
                  <div className="text-center pb-2 mb-2 border-b border-white/10">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.badgeBg}`}>
                      {cfg.title}
                    </span>
                    <div className="text-[9px] text-slate-400 font-mono mt-1">
                      No. {cfg.startOrder} – {cfg.endOrder}
                    </div>
                  </div>

                  {/* Participant List (6 per bagan) */}
                  <div className="space-y-2 flex-1">
                    {items.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[#0b0e24]/80 rounded-xl p-2 border border-white/5 text-[10px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-amber-400 text-[11px]">
                            #{p.orderNumber}
                          </span>
                          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-400/10 text-amber-300">
                            #{p.idpopup}
                          </span>
                        </div>
                        <div className="font-bold text-slate-100 text-[11px] truncate mt-0.5">
                          {p.fullName}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {p.familyName}
                        </div>
                        <div className="text-[9px] text-pink-300/90 truncate italic mt-1">
                          🎵 {p.idolSong}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Master Rekap */}
          <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-pink-400 font-serif-luxury font-bold">❤ Bersama, Musik, Kita Lebih Dekat ❤</span>
              <span>• Event Nyanyi Mirip Idola</span>
            </div>
            <div className="font-mono text-[9px] text-slate-500">
              Dokumen Resmi Panitia RC • Dicetak: {currentDateFormatted}
            </div>
          </div>
        </div>
      );
    }

    // Detail Bagan (Pages 2 to 6)
    const cfg = BAGAN_CONFIGS[pageIdx - 1];
    if (!cfg) return null;
    const pageNumber = pageIdx + 1;
    const items = baganMap[cfg.baganNumber] || [];

    return (
      <div
        style={{ width: '800px', minWidth: '800px' }}
        className="bg-[#070a14] border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-slate-100 flex flex-col gap-6 relative overflow-hidden"
      >
        {/* Decorative corner glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-pink-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* Header Halaman Bagan */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-0.5 shadow-xl shadow-amber-500/20">
              <div className="w-full h-full bg-[#090d20] rounded-[14px] flex items-center justify-center p-2">
                <img
                  src={RC_LOGO_IMAGE}
                  alt="Rainbow Candy Logo"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${cfg.badgeBg}`}>
                  {cfg.title}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  (Urutan Tampil #{cfg.startOrder} s/d #{cfg.endOrder})
                </span>
              </div>
              <h2 className="font-serif-luxury text-xl font-bold text-slate-100 mt-1">
                SUSUNAN ACARA PESERTA • {cfg.title}
              </h2>
              <p className="text-xs text-slate-400 italic">
                Rainbow Candy Birthday Celebration &amp; Virgo Party 2026
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-amber-300 font-bold block">
              HALAMAN {pageNumber} DARI 6
            </span>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Jumlah Peserta: <strong>{items.length} Orang</strong>
            </div>
          </div>
        </div>

        {/* Tabel Peserta Bagan (6 Peserta) */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#090d20]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 text-center w-16">No</th>
                <th className="py-3 px-3 text-center w-24">ID PopUp</th>
                <th className="py-3 px-4">Nama Peserta &amp; Family</th>
                <th className="py-3 px-4">Lagu Idola &amp; Artis</th>
                <th className="py-3 px-3">Kontak WA</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-20">Standby</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {items.map((p, pIdx) => {
                const isEven = pIdx % 2 === 0;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${isEven ? 'bg-[#0b0e24]/60' : 'bg-[#0f1430]/70'}`}
                  >
                    {/* No Urut Tampil */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 font-mono font-black text-sm">
                        #{p.orderNumber}
                      </span>
                    </td>

                    {/* ID PopUp */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      {p.idpopup ? (
                        <span className="inline-block px-2 py-1 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold text-xs">
                          #{p.idpopup}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">-</span>
                      )}
                    </td>

                    {/* Nama Peserta & Family */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <span>{p.fullName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.familyName || 'RC Family'}
                      </div>
                    </td>

                    {/* Lagu Idola & Artis */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-pink-300 text-xs flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <span>{p.idolSong}</span>
                      </div>
                      {p.idolArtist && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Idola: {p.idolArtist}
                        </div>
                      )}
                    </td>

                    {/* WhatsApp */}
                    <td className="py-3.5 px-3 font-mono text-[11px]">
                      {p.whatsapp && p.whatsapp !== '-' ? (
                        <span className="text-emerald-400">
                          {formatPhoneNumber(p.whatsapp)}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">-</span>
                      )}
                    </td>

                    {/* Status Peserta */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Confirmed</span>
                      </span>
                    </td>

                    {/* Standby Round / Turn */}
                    <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-bold">
                        Urut #{pIdx + 1}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Info Petunjuk Panggung */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-850 border border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Estimasi Tampil</div>
              <div className="font-bold text-slate-200">
                {cfg.baganNumber === 1 && '10:00 - 10:45 WIB'}
                {cfg.baganNumber === 2 && '10:45 - 11:30 WIB'}
                {cfg.baganNumber === 3 && '12:30 - 13:15 WIB'}
                {cfg.baganNumber === 4 && '13:15 - 14:00 WIB'}
                {cfg.baganNumber === 5 && '14:00 - 14:45 WIB'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Instruksi Peserta</div>
              <div className="font-semibold text-slate-200 text-[11px]">
                Standby di Stage 15 Menit Sebelum
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col justify-center text-[10px] text-slate-400 font-mono">
            <div>RC Event Official Rundown</div>
            <div>Halaman {pageNumber} / 6</div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-pink-400 font-serif-luxury font-bold">Rainbow Candy Virgo Party 2026</span>
            <span>• Suara Kecil Bisa Jadi Panggung Besar</span>
          </div>
          <div className="font-mono text-[9px] text-slate-500">
            Dicetak otomatis oleh Sistem RC Collab
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl my-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-indigo-600 p-0.5 shadow-lg shadow-pink-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Bagan Susunan Acara (6 Halaman)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  No. 1 – 30
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Format resmi 5 Bagan @ 6 peserta (Total 30) + 1 Cover Rekap Master • Siap cetak / share ke WhatsApp & Media Sosial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              onClick={() => handleDownloadAllPages()}
              disabled={isDownloading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{downloadProgress || 'Memproses Unduhan...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Unduh Semua (6 Hal {imageFormat.toUpperCase()})</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Format & Privacy Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Format File Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Format File:</span>
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setImageFormat('png')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    imageFormat === 'png'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>PNG</span>
                  <span className={`text-[9px] px-1 rounded font-mono ${imageFormat === 'png' ? 'bg-black/20 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                    HD
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageFormat('jpg')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    imageFormat === 'jpg'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>JPG</span>
                </button>
              </div>
            </div>

            {/* Mask Phone Toggle */}
            <button
              type="button"
              onClick={() => setMaskPhoneNumber(!maskPhoneNumber)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                maskPhoneNumber
                  ? 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {maskPhoneNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{maskPhoneNumber ? 'Nomor WA Disamarkan' : 'Tampilkan Nomor WA'}</span>
            </button>
          </div>

          {/* Quick Page Navigator Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <button
              type="button"
              onClick={() => setActivePage(1)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                activePage === 1 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Hal 1: Rekap Master
            </button>
            {BAGAN_CONFIGS.map((cfg) => {
              const pNum = cfg.baganNumber + 1;
              return (
                <button
                  key={cfg.baganNumber}
                  type="button"
                  onClick={() => setActivePage(pNum)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                    activePage === pNum ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Hal {pNum}: Bagan {cfg.baganNumber} (#{cfg.startOrder}-{cfg.endOrder})
                </button>
              );
            })}
          </div>
        </div>

        {/* NOTIFICATION FEEDBACK */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{downloadSuccess}</span>
            </div>
            <button onClick={() => setDownloadSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PREVIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center">
          
          {/* Active Page Preview Controls */}
          <div className="w-full max-w-[820px] mb-4 flex items-center justify-between text-xs bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
                disabled={activePage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-200">
                Halaman {activePage} dari 6:{' '}
                <strong className="text-amber-400">
                  {activePage === 1 ? 'Cover & Rekap Master Bagan 1–5' : `Bagan ${activePage - 1} (No. ${BAGAN_CONFIGS[activePage - 2].startOrder} s/d ${BAGAN_CONFIGS[activePage - 2].endOrder})`}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setActivePage((prev) => Math.min(6, prev + 1))}
                disabled={activePage === 6}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadCurrentPage}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Unduh Halaman {activePage} ({imageFormat.toUpperCase()})</span>
            </button>
          </div>

          {/* Visible Active Page Preview */}
          <div className="w-full flex justify-center overflow-x-auto pb-4">
            {renderPageContent(activePage - 1)}
          </div>

          {/* Offscreen Always-Mounted Capture Nodes (width: 800px, display: flex for html-to-image) */}
          <div
            style={{
              position: 'fixed',
              left: '-99999px',
              top: '0',
              pointerEvents: 'none',
              zIndex: -9999,
            }}
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                ref={(el) => {
                  pageRefs.current[idx] = el;
                }}
                style={{ width: '800px' }}
              >
                {renderPageContent(idx)}
              </div>
            ))}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Format berkas: <strong className="text-amber-300">{imageFormat.toUpperCase()}</strong> • Total{' '}
              <strong className="text-amber-300">6 Halaman</strong> (1 Cover Rekap Master + 5 Halaman Bagan @ 6 Peserta)
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
            >
              Tutup
            </button>

            <button
              onClick={handleDownloadCurrentPage}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Unduh Hal {activePage} ({imageFormat.toUpperCase()})</span>
            </button>

            <button
              onClick={() => handleDownloadAllPages()}
              disabled={isDownloading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-slate-950 font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Unduh Semua (6 Hal {imageFormat.toUpperCase()})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
