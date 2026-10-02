import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Sparkles,
  Calendar,
  Clock,
  Trophy,
  Mic2,
  Award,
  Crown,
  Medal,
  Music2,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Palette,
  Loader2,
  Star,
  Phone,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { ThemeConfig, ThemeId, THEMES } from '../types/theme';
import { toPng } from 'html-to-image';
import { RC_LOGO_IMAGE, CONTACT_PERSON_WA, CONTACT_PERSON_WA_LINK } from '../assets/logo';

interface EventPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeConfig;
}

export const EventPosterModal: React.FC<EventPosterModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [posterThemeId, setPosterThemeId] = useState<ThemeId>(currentTheme.id);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedInfo, setCopiedInfo] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const selectedTheme = THEMES[posterThemeId] || currentTheme;

  // Handle Download Poster as PNG
  const handleDownloadPoster = async () => {
    if (!posterRef.current || isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      // 1. Ensure fonts are fully ready
      if (document.fonts) {
        await document.fonts.ready;
      }
      // Small pause to allow all styles, images, and fonts to stabilize
      await new Promise((resolve) => setTimeout(resolve, 200));

      const posterNode = posterRef.current;
      const width = posterNode.offsetWidth || 400;
      const height = posterNode.offsetHeight || 660;

      const dataUrl = await toPng(posterNode, {
        cacheBust: true,
        pixelRatio: 2.5, // High resolution for crystal clear print & story sharing
        quality: 1,
        width: width,
        height: height,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          margin: '0',
          boxSizing: 'border-box',
        },
      });

      const link = document.createElement('a');
      link.download = `Poster-RC-Birthday-Celebration-Virgo-Party-2026.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.warn('First render attempt failed, trying fallback render...', err);
      try {
        if (!posterRef.current) return;
        const fallbackDataUrl = await toPng(posterRef.current, {
          pixelRatio: 2,
          quality: 0.95,
          skipFonts: true,
        });
        const link = document.createElement('a');
        link.download = `Poster-RC-Birthday-Celebration-Virgo-Party-2026.png`;
        link.href = fallbackDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } catch (fallbackErr) {
        console.error('Gagal mengunduh poster:', fallbackErr);
        alert('Maaf, terjadi kendala saat mengunduh poster. Silakan coba lagi.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy Broadcast Text for WhatsApp / Social Media
  const handleCopyEventInfo = () => {
    const text = `🎉 *RC BIRTHDAY CELEBRATION & VIRGO PARTY 2026* 🎉
✨ *Rainbow Candy Collaboration • Event Nyanyi Mirip Idola*

📌 *JADWAL PENTING:*
• *Teknikal Meeting (TM):* Minggu, 6 September 2026 (11:00 WIB)
• *Batas Pendaftaran & Lagu:* Kamis, 10 September 2026 (23:59 WIB)
• *Hari H Acara Lomba:* Minggu, 13 September 2026 (10:00 WIB – Selesai)

🏆 *Total Hadiah:* Rp 1.000.000 + E-Sertifikat Resmi
🥇 Juara 1: Rp 500.000 + Sertifikat
🥈 Juara 2: Rp 300.000 + Sertifikat
🥉 Juara 3: Rp 200.000 + Sertifikat

🎼 *Kriteria Penilaian:*
1. Teknikalitas (30%)
2. Kemiripan Karakter Idola (30%)
3. Penjiwaan & Rasa (20%)
4. Presentasi & Flow Audio (20%)

📲 *Contact Person / Pendaftaran (WA):*
👉 ${CONTACT_PERSON_WA}

Pendaftaran terbuka untuk semua talent & family! Ayo daftarkan dirimu dan rayakan pesta spektakuler bersama Rainbow Candy!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedInfo(true);
      setTimeout(() => setCopiedInfo(false), 3000);
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
        {/* Overlay backdrop click */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-4xl bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
        >
          {/* Modal Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl p-1 flex items-center justify-center shadow-md shrink-0 bg-white border border-white/40 overflow-hidden"
                style={{
                  boxShadow: `0 0 12px ${currentTheme.accentPrimary}30`,
                }}
              >
                <img
                  src={RC_LOGO_IMAGE}
                  alt="Rainbow Candy"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-white leading-tight">
                  Download Poster Event Resmi
                </h3>
                <p className="text-xs text-slate-400">
                  Dilengkapi Logo Rainbow Candy & Contact Person WhatsApp Resmi
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Grid Preview & Controls */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
            
            {/* LEFT: Live Poster Canvas Container */}
            <div className="flex-1 w-full max-w-md flex flex-col items-center">
              <div className="w-full shadow-2xl rounded-2xl overflow-hidden border border-slate-700/60 relative group">
                
                {/* THE ACTUAL RENDERABLE POSTER DOM */}
                <div
                  ref={posterRef}
                  id="event-poster-canvas"
                  className={`w-full relative select-none p-5 sm:p-7 flex flex-col justify-between overflow-hidden transition-colors ${
                    posterThemeId === 'rose-blush'
                      ? 'bg-[#1C0F16] text-[#FFF5F7]'
                      : posterThemeId === 'midnight-violet'
                      ? 'bg-[#0F071D] text-[#FAF5FF]'
                      : 'bg-[#080D1A] text-[#FDFBF7]'
                  }`}
                  style={{
                    minHeight: '660px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {/* Decorative Background Elements in Poster */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Radial Ambient Glow */}
                    <div
                      className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-35"
                      style={{ backgroundColor: selectedTheme.accentPrimary }}
                    />
                    <div
                      className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-25"
                      style={{ backgroundColor: selectedTheme.accentSecondary }}
                    />

                    {/* Virgo Constellation Line Drawing */}
                    <svg
                      className="absolute top-12 right-3 w-40 h-40 opacity-25 stroke-current pointer-events-none"
                      viewBox="0 0 200 200"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ color: selectedTheme.accentPrimary }}
                    >
                      <path
                        d="M30 60 L60 85 L95 80 L130 110 L160 95 L175 140 M95 80 L90 135 L120 160 M130 110 L120 160"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <circle cx="30" cy="60" r="3" fill="currentColor" />
                      <circle cx="60" cy="85" r="3.5" fill="currentColor" />
                      <circle cx="95" cy="80" r="4" fill="currentColor" />
                      <circle cx="130" cy="110" r="5" fill="currentColor" />
                      <circle cx="160" cy="95" r="3" fill="currentColor" />
                      <circle cx="175" cy="140" r="3.5" fill="currentColor" />
                      <circle cx="90" cy="135" r="3.5" fill="currentColor" />
                      <circle cx="120" cy="160" r="5.5" fill="currentColor" />
                    </svg>

                    {/* Geometric Golden Frame Lines */}
                    <div
                      className="absolute inset-2.5 sm:inset-3.5 border rounded-2xl pointer-events-none opacity-40"
                      style={{ borderColor: selectedTheme.accentPrimary }}
                    />
                    <div
                      className="absolute inset-3 sm:inset-4 border border-dashed rounded-xl pointer-events-none opacity-20"
                      style={{ borderColor: selectedTheme.accentSecondary }}
                    />

                    {/* Corner Ornaments */}
                    <div
                      className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2"
                      style={{ borderColor: selectedTheme.accentPrimary }}
                    />
                    <div
                      className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2"
                      style={{ borderColor: selectedTheme.accentPrimary }}
                    />
                    <div
                      className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2"
                      style={{ borderColor: selectedTheme.accentPrimary }}
                    />
                    <div
                      className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2"
                      style={{ borderColor: selectedTheme.accentPrimary }}
                    />
                  </div>

                  {/* POSTER HEADER: Official Logo + Title */}
                  <div className="relative z-10 text-center pt-2">
                    {/* Direct Authentic Rainbow Candy Logo (Large & Prominent) */}
                    <div className="flex flex-col items-center justify-center mb-2.5">
                      <div className="relative group">
                        {/* Soft Glow Ambient behind Logo */}
                        <div
                          className="absolute -inset-1.5 rounded-2xl blur-md opacity-30 pointer-events-none"
                          style={{
                            background: `linear-gradient(135deg, ${selectedTheme.accentPrimary}, ${selectedTheme.accentSecondary})`,
                          }}
                        />
                        {/* Clean Logo Container (Full Logo Displayed) */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-1 bg-white shadow-xl border border-white/40 overflow-hidden flex items-center justify-center">
                          <img
                            src={RC_LOGO_IMAGE}
                            alt="Rainbow Candy (RC) Official Logo"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    </div>

                    <p
                      className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.25em] opacity-90 font-cinzel mb-0.5"
                      style={{ color: selectedTheme.accentSecondary }}
                    >
                      Grand Celebration & Virgo Season
                    </p>

                    {/* Main Luxury Title */}
                    <h1 className="font-serif-luxury text-xl sm:text-2xl font-black tracking-tight leading-tight text-white mb-1.5">
                      RC Birthday Celebration{' '}
                      <span
                        className="italic block sm:inline"
                        style={{
                          color: selectedTheme.accentPrimary,
                        }}
                      >
                        & Virgo Party
                      </span>
                    </h1>

                    {/* Activity Pill */}
                    <div
                      className="inline-block px-3.5 py-1 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider text-slate-950 shadow-md font-mono mt-0.5 whitespace-nowrap"
                      style={{
                        background: `linear-gradient(135deg, ${selectedTheme.accentPrimary}, ${selectedTheme.accentSecondary})`,
                      }}
                    >
                      ★ EVENT NYANYI MIRIP IDOLA ★
                    </div>
                  </div>

                  {/* POSTER MIDDLE: Event Schedule & Grand Prizes */}
                  <div className="relative z-10 my-3 space-y-2.5">
                    {/* Date & Time Luxury Badge */}
                    <div
                      className="p-2.5 rounded-xl border bg-black/35 backdrop-blur-md flex items-center justify-around text-center shadow-inner"
                      style={{ borderColor: `${selectedTheme.accentPrimary}35` }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[8.5px] uppercase tracking-wider font-semibold opacity-70 flex items-center gap-1">
                          <Calendar className="w-3 h-3" style={{ color: selectedTheme.accentPrimary }} />
                          Hari & Tanggal
                        </span>
                        <strong className="text-xs font-bold text-white mt-0.5">
                          Minggu, 13 September 2026
                        </strong>
                      </div>
                      <div className="w-[1px] h-6 bg-white/20" />
                      <div className="flex flex-col items-center">
                        <span className="text-[8.5px] uppercase tracking-wider font-semibold opacity-70 flex items-center gap-1">
                          <Clock className="w-3 h-3" style={{ color: selectedTheme.accentPrimary }} />
                          Waktu Acara
                        </span>
                        <strong className="text-xs font-bold text-white mt-0.5">
                          10:00 WIB – Selesai
                        </strong>
                      </div>
                    </div>

                    {/* Prizes Showcase Box */}
                    <div
                      className="p-3 rounded-2xl border bg-black/50 backdrop-blur-md relative overflow-hidden"
                      style={{ borderColor: `${selectedTheme.accentPrimary}60` }}
                    >
                      <div className="text-center mb-2.5">
                        <span
                          className="text-[9.5px] font-extrabold uppercase tracking-widest font-mono flex items-center justify-center gap-1.5 whitespace-nowrap"
                          style={{ color: selectedTheme.accentPrimary }}
                        >
                          <Trophy className="w-3.5 h-3.5 shrink-0" />
                          <span>TOTAL HADIAH: RP 1.000.000 + E-SERTIFIKAT</span>
                        </span>
                      </div>

                      {/* 3 Prize Cards */}
                      <div className="grid grid-cols-3 gap-2 text-center items-stretch">
                        {/* Juara 2 */}
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-between min-h-[78px]">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-300 whitespace-nowrap">
                            <Trophy className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span>Juara 2</span>
                          </div>
                          <div className="text-[13.5px] font-black text-white my-0.5 tracking-tight whitespace-nowrap font-sans">
                            Rp 300.000
                          </div>
                          <span className="text-[8px] text-slate-400 font-medium whitespace-nowrap">+ Sertifikat</span>
                        </div>

                        {/* Juara 1 (Main Winner Badge) */}
                        <div
                          className="p-2 rounded-xl border flex flex-col items-center justify-between min-h-[78px] relative shadow-lg ring-1"
                          style={{
                            background: `linear-gradient(180deg, ${selectedTheme.accentPrimary}30, rgba(0,0,0,0.65))`,
                            borderColor: selectedTheme.accentPrimary,
                            boxShadow: `0 0 16px ${selectedTheme.accentPrimary}35`,
                          }}
                        >
                          <div
                            className="flex items-center justify-center gap-1 text-[11px] font-black tracking-wider uppercase whitespace-nowrap font-sans"
                            style={{ color: selectedTheme.accentPrimary }}
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 stroke-[2.5]" />
                            <span>JUARA 1</span>
                          </div>
                          <div
                            className="text-[15.5px] font-black my-0.5 tracking-tight whitespace-nowrap font-sans leading-none"
                            style={{ color: selectedTheme.accentPrimary }}
                          >
                            Rp 500.000
                          </div>
                          <span className="text-[8px] font-extrabold text-amber-300 whitespace-nowrap font-sans">+ Sertifikat</span>
                        </div>

                        {/* Juara 3 */}
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-between min-h-[78px]">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-600 whitespace-nowrap">
                            <Medal className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Juara 3</span>
                          </div>
                          <div className="text-[13.5px] font-black text-white my-0.5 tracking-tight whitespace-nowrap font-sans">
                            Rp 200.000
                          </div>
                          <span className="text-[8px] text-slate-400 font-medium whitespace-nowrap">+ Sertifikat</span>
                        </div>
                      </div>
                    </div>

                    {/* Criteria Highlight Grid */}
                    <div className="p-2 rounded-xl bg-black/30 border border-white/10 text-center">
                      <div className="text-[8.5px] uppercase tracking-wider font-semibold text-slate-400 mb-1 flex items-center justify-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>Kriteria Penilaian Juri</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center">
                        <div className="p-1 rounded bg-white/5">
                          <p className="text-[8.5px] font-bold text-white">Teknik</p>
                          <p className="text-[8px] text-amber-400 font-mono font-bold">30%</p>
                        </div>
                        <div className="p-1 rounded bg-white/5">
                          <p className="text-[8.5px] font-bold text-white">Kemiripan</p>
                          <p className="text-[8px] text-amber-400 font-mono font-bold">30%</p>
                        </div>
                        <div className="p-1 rounded bg-white/5">
                          <p className="text-[8.5px] font-bold text-white">Penjiwaan</p>
                          <p className="text-[8px] text-amber-400 font-mono font-bold">20%</p>
                        </div>
                        <div className="p-1 rounded bg-white/5">
                          <p className="text-[8.5px] font-bold text-white">Audio Flow</p>
                          <p className="text-[8px] text-amber-400 font-mono font-bold">20%</p>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Contact Person WhatsApp Info Card */}
                    <div
                      className="p-2.5 rounded-xl border bg-emerald-950/40 backdrop-blur-md flex items-center justify-between"
                      style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[8.5px] uppercase tracking-wider text-emerald-300 font-bold">
                            Informasi & Pendaftaran (CP WhatsApp)
                          </p>
                          <p className="text-xs font-mono font-black text-white tracking-wider">
                            {CONTACT_PERSON_WA}
                          </p>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[8px] font-bold text-emerald-300 uppercase">
                        Online
                      </div>
                    </div>
                  </div>

                  {/* POSTER FOOTER */}
                  <div className="relative z-10 pt-1.5 border-t border-white/10 flex items-center justify-between text-left">
                    <div className="space-y-0.5">
                      <p className="text-[9.5px] font-bold text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Pendaftaran Terbuka Online
                      </p>
                      <p className="text-[7.5px] text-slate-400">
                        Rainbow Candy Collaboration • Slot Terbatas
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className="px-2 py-0.5 rounded-md border text-[8px] font-mono font-bold uppercase inline-block"
                        style={{
                          backgroundColor: `${selectedTheme.accentPrimary}20`,
                          borderColor: `${selectedTheme.accentPrimary}50`,
                          color: selectedTheme.accentPrimary,
                        }}
                      >
                        OFFICIAL POSTER
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT: Controls, Theme Palette, Copy & Download Actions */}
            <div className="w-full lg:w-80 flex flex-col justify-between space-y-4">
              {/* Option: Choose Theme for Poster */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Pilih Nuansa Warna Poster:</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dark-virgo-gold', 'rose-blush', 'midnight-violet'] as ThemeId[]).map((tid) => {
                    const t = THEMES[tid];
                    const isSelected = posterThemeId === tid;
                    return (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => setPosterThemeId(tid)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-slate-800 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shadow-inner"
                          style={{
                            background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
                          }}
                        />
                        <span className="text-[9.5px] font-medium text-slate-200 truncate w-full">
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Person Highlight Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Contact Person Resmi:</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-mono">
                    WA Aktif
                  </span>
                </div>
                <p className="text-white font-mono text-sm font-bold pl-1">
                  {CONTACT_PERSON_WA}
                </p>
                <a
                  href={CONTACT_PERSON_WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Chat WhatsApp Sekarang</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Information Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kualitas & Spesifikasi Poster:</span>
                </div>
                <ul className="space-y-1 pl-1 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span>Logo Resmi <strong>Rainbow Candy</strong></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span>Format <strong>Ultra HD PNG (2.5x Pixel Ratio)</strong></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span>Termasuk CP WhatsApp <strong>{CONTACT_PERSON_WA}</strong></span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* Primary Download Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleDownloadPoster}
                  disabled={isDownloading}
                  className={`w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                    isDownloading
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : selectedTheme.accentButton
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Merender Poster...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                      <span>Berhasil Diunduh!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download Poster (PNG)</span>
                    </>
                  )}
                </motion.button>

                {/* Copy Broadcast Text Button */}
                <button
                  type="button"
                  onClick={handleCopyEventInfo}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedInfo ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Teks Broadcast Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salin Teks Broadcast WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
