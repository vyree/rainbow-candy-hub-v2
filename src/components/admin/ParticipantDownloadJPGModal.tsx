import React, { useState, useMemo, useRef } from 'react';
import {
  Download,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Eye,
  EyeOff,
  Filter,
  Users,
  Music,
  Check,
} from 'lucide-react';
import { Participant, AdminUser, ParticipantStatus } from '../../types/participant';
import { toJpeg, toPng } from 'html-to-image';
import { RC_LOGO_IMAGE } from '../../assets/logo';

export type ExportLayoutMode = 'single_full' | 'paged_a4';
export type ExportImageFormat = 'png' | 'jpg';

interface ParticipantDownloadJPGModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredParticipants: Participant[];
  totalAllParticipants: number;
  filters: {
    searchTerm: string;
    statusFilter: string;
    familyFilter: string;
  };
  currentUser: AdminUser;
  eventTitle?: string;
}

const ITEMS_PER_A4_PAGE = 14;

export const ParticipantDownloadJPGModal: React.FC<ParticipantDownloadJPGModalProps> = ({
  isOpen,
  onClose,
  filteredParticipants,
  totalAllParticipants,
  filters,
  currentUser,
  eventTitle = 'RC Birthday Celebration & Virgo Party 2026',
}) => {
  const fullRef = useRef<HTMLDivElement | null>(null);
  const pagedRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [layoutMode, setLayoutMode] = useState<ExportLayoutMode>('single_full');
  const [imageFormat, setImageFormat] = useState<ExportImageFormat>('png');
  const [maskPhoneNumber, setMaskPhoneNumber] = useState<boolean>(false);
  const [activePreviewPage, setActivePreviewPage] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Status statistics for the filtered dataset
  const stats = useMemo(() => {
    let confirmed = 0;
    let done = 0;
    let pending = 0;
    let canceled = 0;
    let disqualificated = 0;

    filteredParticipants.forEach((p) => {
      const st = (p.status as ParticipantStatus) || 'pending';
      if (st === 'confirmed') confirmed++;
      else if (st === 'done') done++;
      else if (st === 'canceled') canceled++;
      else if (st === 'disqualificated') disqualificated++;
      else pending++;
    });

    return { confirmed, done, pending, canceled, disqualificated };
  }, [filteredParticipants]);

  // Paginated chunks for A4 mode
  const pagedData = useMemo(() => {
    if (filteredParticipants.length === 0) return [[]];
    const pages: Participant[][] = [];
    for (let i = 0; i < filteredParticipants.length; i += ITEMS_PER_A4_PAGE) {
      pages.push(filteredParticipants.slice(i, i + ITEMS_PER_A4_PAGE));
    }
    return pages;
  }, [filteredParticipants]);

  const totalPages = pagedData.length;
  const safeActivePage = Math.min(Math.max(1, activePreviewPage), totalPages);

  if (!isOpen) return null;

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const currentTimeFormatted = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Human-readable filter label
  const getFilterStatusLabel = (st: string) => {
    switch (st) {
      case 'confirmed':
        return 'Confirmed (Dikonfirmasi)';
      case 'done':
        return 'Done (Selesai Event)';
      case 'pending':
        return 'Pending (Menunggu)';
      case 'canceled':
        return 'Canceled (Batal)';
      case 'disqualificated':
        return 'Disqualificated (Diskualifikasi)';
      case 'all':
      default:
        return 'Semua Status';
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '-';
    if (!maskPhoneNumber) return phone;
    if (phone.length <= 6) return phone;
    const start = phone.slice(0, 5);
    const end = phone.slice(-3);
    return `${start}****${end}`;
  };

  const getStatusBadge = (st: ParticipantStatus | string) => {
    switch (st) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold uppercase tracking-wider">
            <Check className="w-2.5 h-2.5" />
            Done
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
            <Check className="w-2.5 h-2.5" />
            Confirmed
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[10px] font-bold uppercase tracking-wider">
            Canceled
          </span>
        );
      case 'disqualificated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold uppercase tracking-wider">
            Diskualifikasi
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
            Pending
          </span>
        );
    }
  };

  // Handler to export as PNG or JPG
  const handleDownloadImage = async (formatOverride?: ExportImageFormat) => {
    const selectedFormat = formatOverride || imageFormat;
    if (isDownloading || filteredParticipants.length === 0) return;

    setIsDownloading(true);
    setDownloadSuccess(null);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));

      const isPng = selectedFormat === 'png';
      const ext = isPng ? 'png' : 'jpg';
      const generator = isPng ? toPng : toJpeg;
      const formatLabel = isPng ? 'PNG' : 'JPG';

      const dateStr = new Date().toISOString().slice(0, 10);
      const filterPart = filters.statusFilter !== 'all' ? `_${filters.statusFilter}` : '';
      const familyPart = filters.familyFilter !== 'all' ? `_${filters.familyFilter.replace(/\s+/g, '_')}` : '';

      const captureOptions = {
        quality: isPng ? 1 : 0.95,
        backgroundColor: '#070a14',
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          margin: '0',
        },
      };

      if (layoutMode === 'single_full') {
        // Single Full Image
        setDownloadProgress(`Memproses berkas gambar ${formatLabel} resolusi tinggi...`);
        const node = fullRef.current;
        if (!node) throw new Error('Preview element not found');

        const dataUrl = await generator(node, captureOptions);

        const fileName = `Data_Peserta_RC_Virgo${filterPart}${familyPart}_${dateStr}.${ext}`;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadSuccess(
          `Berkas ${formatLabel} Data Peserta (No. 1 s/d ${filteredParticipants.length}) berhasil diunduh!`
        );
      } else {
        // Paged A4 sheets
        for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
          const pageNumber = pageIdx + 1;
          setDownloadProgress(
            totalPages > 1
              ? `Memproses lembar ${pageNumber} dari ${totalPages} (${formatLabel})...`
              : `Memproses gambar A4 (${formatLabel})...`
          );

          const node = pagedRefs.current[pageIdx];
          if (!node) continue;

          const dataUrl = await generator(node, captureOptions);

          const fileName =
            totalPages > 1
              ? `Data_Peserta_RC_Virgo_Lembar_${pageNumber}_dari_${totalPages}${filterPart}${familyPart}_${dateStr}.${ext}`
              : `Data_Peserta_RC_Virgo${filterPart}${familyPart}_${dateStr}.${ext}`;

          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          if (pageIdx < totalPages - 1) {
            await new Promise((res) => setTimeout(res, 400));
          }
        }

        setDownloadSuccess(
          totalPages > 1
            ? `Berhasil mengunduh ${totalPages} berkas ${formatLabel} lembar data peserta!`
            : `Berkas ${formatLabel} berhasil diunduh!`
        );
      }

      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error generating participant image:', err);
      alert('Terjadi kesalahan saat memproses gambar. Silakan coba kembali.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  // Reusable document header
  const renderDocumentHeader = (pageNumber?: number, pageTotal?: number) => (
    <div className="pb-4 mb-4 border-b border-slate-700/60 relative z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 p-[1.5px] shadow-lg shadow-pink-500/10 shrink-0">
            <div className="w-full h-full bg-[#0a0d1f] rounded-[14px] p-1 flex items-center justify-center overflow-hidden">
              <img
                src={RC_LOGO_IMAGE}
                alt="RC Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>Dokumen Resmi Panitia Pelaksana</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide font-serif-luxury leading-tight">
              RC BIRTHDAY CELEBRATION & VIRGO PARTY 2026
            </h1>
            <p className="text-xs text-pink-300 font-medium tracking-wide">
              Laporan Data Peserta Terdaftar • Event Nyanyi Mirip Idola
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="px-4 py-2 rounded-xl bg-[#0d122b]/90 border border-slate-700/70 space-y-0.5 shadow-inner">
            <div className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest">
              Waktu Ekspor Dokumen
            </div>
            <div className="text-xs font-bold text-amber-400">
              {currentDateFormatted} • {currentTimeFormatted} WIB
            </div>
            <div className="text-[9px] font-mono text-slate-300">
              {pageNumber && pageTotal ? `Halaman ${pageNumber} dari ${pageTotal}` : 'Dokumen Lengkap'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Metatags Box */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-[#0c1126] border border-slate-800 flex flex-col">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Status Filter</span>
          <span className="font-bold text-amber-400 text-[11px] truncate">
            {getFilterStatusLabel(filters.statusFilter)}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-[#0c1126] border border-slate-800 flex flex-col">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Family Filter</span>
          <span className="font-bold text-cyan-300 text-[11px] truncate">
            {filters.familyFilter === 'all' ? 'Semua Family' : filters.familyFilter}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-[#0c1126] border border-slate-800 flex flex-col">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Kata Kunci</span>
          <span className="font-bold text-slate-200 text-[11px] truncate">
            {filters.searchTerm ? `"${filters.searchTerm}"` : 'Semua (Tanpa Pencarian)'}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-[#0c1126] border border-slate-800 flex flex-col">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Jumlah Data</span>
          <span className="font-bold text-emerald-400 text-[11px] truncate">
            {filteredParticipants.length} dari {totalAllParticipants} Peserta
          </span>
        </div>
      </div>
    </div>
  );

  // Reusable participant table rows
  const renderParticipantTable = (list: Participant[], startIdx: number = 0) => (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0a0d21]/95 shadow-xl">
      <table className="w-full text-left text-[11px] border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-slate-900 via-[#121633] to-slate-900 border-b border-slate-700/80 text-slate-300 font-mono text-[9.5px] uppercase tracking-wider">
            <th className="py-2.5 px-3 text-center w-10">No</th>
            <th className="py-2.5 px-3 text-center w-20">ID PopUp</th>
            <th className="py-2.5 px-3.5">Nama Peserta</th>
            <th className="py-2.5 px-3">Family</th>
            <th className="py-2.5 px-3.5">Lagu Idola & Penyanyi Asli</th>
            <th className="py-2.5 px-3 text-center w-28">Status</th>
            <th className="py-2.5 px-3 w-32">WhatsApp</th>
            <th className="py-2.5 px-3 text-center w-20">Minus One</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-sans">
          {list.map((p, idx) => {
            const rowNumber = startIdx + idx + 1;
            const isEven = idx % 2 === 0;
            const currentStatus = (p.status as ParticipantStatus) || 'pending';

            return (
              <tr
                key={p.id}
                className={`transition-colors ${isEven ? 'bg-[#0b0e24]/40' : 'bg-[#0f1430]/60'}`}
              >
                {/* No Urut Berurutan dari 1 (Mudah Dihitung) */}
                <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400 text-xs">
                  {rowNumber}
                </td>

                {/* ID PopUp & No Registrasi DB */}
                <td className="py-2 px-3 text-center font-mono">
                  <div className="flex flex-col items-center justify-center">
                    {p.idpopup !== undefined ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                        #{p.idpopup}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[10px]">-</span>
                    )}
                    {p.orderNumber && p.orderNumber !== rowNumber && (
                      <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                        (reg #{p.orderNumber})
                      </span>
                    )}
                  </div>
                </td>

                {/* Nama Peserta */}
                <td className="py-2 px-3.5 font-bold text-slate-100">
                  {p.fullName}
                  {p.notes && (
                    <div className="text-[9.5px] text-slate-400 font-normal italic truncate max-w-xs">
                      Catatan: {p.notes}
                    </div>
                  )}
                </td>

                {/* Family */}
                <td className="py-2 px-3 text-slate-300 font-medium">
                  {p.familyName ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                      {p.familyName}
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>

                {/* Lagu Idola & Penyanyi Asli */}
                <td className="py-2 px-3.5">
                  <div className="font-semibold text-pink-200">
                    {p.idolSong || '-'}
                  </div>
                  <div className="text-[9.5px] text-slate-400 flex items-center gap-1">
                    <Music className="w-2.5 h-2.5 text-pink-400 shrink-0" />
                    <span>{p.idolArtist || 'Penyanyi tidak terisi'}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-2 px-3 text-center">
                  {getStatusBadge(currentStatus)}
                </td>

                {/* Kontak WhatsApp */}
                <td className="py-2 px-3 font-mono text-[10.5px] text-slate-300">
                  {formatPhoneNumber(p.whatsapp)}
                </td>

                {/* Audio Minus One */}
                <td className="py-2 px-3 text-center">
                  {p.audioLink ? (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold">
                      Tersedia
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px]">
                      Belum
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Reusable document footer & signature
  const renderDocumentFooter = () => (
    <div className="pt-4 mt-4 border-t border-slate-800/80 relative z-10 flex items-center justify-between gap-4 text-xs">
      {/* Summary statistics badges */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
        <span className="text-slate-400">Ringkasan Data:</span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
          Confirmed: {stats.confirmed}
        </span>
        {stats.done > 0 && (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
            Done: {stats.done}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
          Pending: {stats.pending}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20 font-bold">
          Canceled: {stats.canceled}
        </span>
        {stats.disqualificated > 0 && (
          <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
            Diskualifikasi: {stats.disqualificated}
          </span>
        )}
      </div>

      {/* Official Signatory text */}
      <div className="text-right text-[9.5px] font-mono text-slate-400">
        <div>Panitia Pelaksana Rainbow Candy Collaboration</div>
        <div className="text-slate-500">Dicetak oleh: {currentUser.name} ({currentUser.role})</div>
      </div>
    </div>
  );

  return (
    <div
      id="participant-jpg-download-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Control Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif-luxury text-lg font-bold text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              <span>Download Data Peserta (PNG / JPG)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ekspor tabel data peserta terfilter ke dalam gambar PNG/JPG bernomor urut 1 sampai {filteredParticipants.length} agar mudah dihitung
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              onClick={() => handleDownloadImage(imageFormat)}
              disabled={isDownloading || filteredParticipants.length === 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{downloadProgress || `Memproses ${imageFormat.toUpperCase()}...`}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {layoutMode === 'single_full'
                      ? `Unduh Gambar ${imageFormat.toUpperCase()} (${filteredParticipants.length} Peserta)`
                      : `Unduh ${totalPages} Lembar ${imageFormat.toUpperCase()}`}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isDownloading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border border-slate-700 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Options & Filter Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Format File Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Format:</span>
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
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      imageFormat === 'png' ? 'bg-black/20 text-slate-950' : 'bg-slate-800 text-amber-400'
                    }`}
                  >
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

            {/* Layout Mode Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Tata Letak:</span>
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLayoutMode('single_full')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    layoutMode === 'single_full'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1 Gambar Panjang (Full Data)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('paged_a4')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    layoutMode === 'paged_a4'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Per Lembar A4 ({totalPages} Hal)
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Toggle: Mask Phone */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMaskPhoneNumber(!maskPhoneNumber)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {maskPhoneNumber ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sensor Nomor WA (Aktif)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tampilkan Nomor WA Lengkap</span>
                </>
              )}
            </button>

            {/* Paging navigation if paged mode */}
            {layoutMode === 'paged_a4' && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeActivePage <= 1}
                  onClick={() => setActivePreviewPage((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-slate-300">
                  Lembar {safeActivePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safeActivePage >= totalPages}
                  onClick={() => setActivePreviewPage((prev) => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="px-4 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Document Live Preview Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto bg-slate-950/70 flex justify-center items-start">
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <Filter className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Tidak ada data peserta yang cocok dengan filter saat ini.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan ubah filter status, family, atau kata kunci pencarian pada menu manajemen peserta.
              </p>
            </div>
          ) : layoutMode === 'single_full' ? (
            /* Mode 1: Single Continuous Full Canvas Target */
            <div className="w-full max-w-[960px] overflow-x-auto shadow-2xl rounded-2xl">
              <div
                ref={fullRef}
                className="w-[960px] bg-gradient-to-br from-[#090d1a] via-[#0d1226] to-[#070a14] border-2 border-amber-400/40 rounded-2xl p-7 text-slate-100 flex flex-col justify-between relative overflow-hidden"
                style={{ boxSizing: 'border-box' }}
              >
                {/* Decorative background gradients */}
                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

                {/* Top Gold Accent Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-amber-400 to-indigo-500 rounded-full mb-4" />

                {/* Document Header */}
                {renderDocumentHeader()}

                {/* All Filtered Rows in One Continuous Sheet */}
                <div className="my-2 relative z-10">
                  {renderParticipantTable(filteredParticipants, 0)}
                </div>

                {/* Document Footer */}
                {renderDocumentFooter()}
              </div>
            </div>
          ) : (
            /* Mode 2: Paginated A4 Sheets Target */
            <div className="w-full max-w-[840px] overflow-x-auto shadow-2xl rounded-2xl">
              {pagedData.map((pageRows, pageIndex) => {
                const isCurrentPreview = pageIndex + 1 === safeActivePage;
                const startIdx = pageIndex * ITEMS_PER_A4_PAGE;

                return (
                  <div
                    key={pageIndex}
                    className={isCurrentPreview ? 'block' : 'hidden'}
                  >
                    <div
                      ref={(el) => { pagedRefs.current[pageIndex] = el; }}
                      className="w-[840px] min-h-[1140px] bg-gradient-to-br from-[#090d1a] via-[#0d1226] to-[#070a14] border-2 border-amber-400/40 rounded-2xl p-7 text-slate-100 flex flex-col justify-between relative overflow-hidden"
                      style={{ boxSizing: 'border-box' }}
                    >
                      {/* Decorative background gradients */}
                      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

                      {/* Top Gold Accent Bar */}
                      <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-amber-400 to-indigo-500 rounded-full mb-4" />

                      {/* Header with Page Number */}
                      {renderDocumentHeader(pageIndex + 1, totalPages)}

                      {/* Paged Table Slice */}
                      <div className="flex-1 my-2 relative z-10">
                        {renderParticipantTable(pageRows, startIdx)}
                      </div>

                      {/* Footer */}
                      {renderDocumentFooter()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Format berkas: <strong className="text-amber-300">{imageFormat.toUpperCase()}</strong> • Nomor Urut:{' '}
              <strong className="text-amber-300">1 s/d {filteredParticipants.length}</strong> (mudah dihitung) • Resolusi Ultra HD
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
              onClick={() => handleDownloadImage('png')}
              disabled={isDownloading || filteredParticipants.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/10"
              title="Download format PNG (Kualitas jernih)"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Unduh PNG</span>
            </button>
            <button
              onClick={() => handleDownloadImage('jpg')}
              disabled={isDownloading || filteredParticipants.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Download format JPG"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Unduh JPG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
