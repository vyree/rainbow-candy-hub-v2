import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Music,
  Clock,
  Radio,
  Users,
  Shield,
  Gavel,
  Sliders,
  CalendarCheck,
  Sparkles,
  MessageCircle,
  ExternalLink,
  Disc,
} from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { RC_LOGO_IMAGE, CONTACT_PERSON_WA, CONTACT_PERSON_WA_LINK } from '../assets/logo';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeConfig;
  onRegisterClick?: () => void;
}

export const TERMS_AND_CONDITIONS = [
  {
    number: 1,
    title: 'Pendaftaran & Pengiriman Lagu',
    description:
      'Peserta wajib mendaftarkan diri dan mengirimkan pilihan lagu selambat-lambatnya hari Kamis, 10 September 2026 pukul 23.59 WIB.',
    icon: Music,
    highlight: 'Batas: Kamis, 10 Sept 2026, 23.59 WIB',
  },
  {
    number: 2,
    title: 'Kehadiran',
    description:
      'Peserta diharapkan hadir di dalam room selambat-lambatnya 5 menit sebelum acara dimulai dan diwajibkan untuk stay (tetap berada di room) hingga seluruh rangkaian acara selesai.',
    icon: Clock,
    highlight: 'Hadir 5 menit sebelum mulai & stay in room',
  },
  {
    number: 3,
    title: 'Pemilihan Lagu',
    description:
      'Peserta bebas memilih lagu yang akan dibawakan sesuai dengan genre yang telah ditentukan.',
    icon: Radio,
    highlight: 'Bebas sesuai genre lomba',
  },
  {
    number: 4,
    title: 'Pendampingan',
    description:
      'Saat peserta sedang tampil (performance), peserta wajib didampingi oleh kapten atau wakil.',
    icon: Users,
    highlight: 'Wajib didampingi kapten/wakil',
  },
  {
    number: 5,
    title: 'Ketertiban',
    description:
      'Seluruh peserta wajib menjaga kesopanan dan ketertiban selama acara berlangsung.',
    icon: Shield,
    highlight: 'Menjaga etika & kenyamanan bersama',
  },
  {
    number: 6,
    title: 'Keputusan Juri',
    description:
      'Penilaian dan keputusan juri bersifat mutlak dan tidak dapat diganggu gugat.',
    icon: Gavel,
    highlight: 'Bersifat mutlak & final',
  },
  {
    number: 7,
    title: 'Penggunaan Alat Bantu',
    description: 'Diperbolehkan memakai Soundcard, mic, dan alat bantu lain.',
    icon: Sliders,
    highlight: 'Soundcard, mic & alat bantu diperbolehkan',
  },
  {
    number: 8,
    title: 'Teknikal Meeting (TM)',
    description:
      'Wajib mengikuti Teknikal Meeting pada hari Minggu, 6 September 2026 pukul 11.00 WIB untuk mendapatkan nomor urut tampil.',
    icon: CalendarCheck,
    highlight: 'Minggu, 6 Sept 2026, 11.00 WIB',
  },
  {
    number: 9,
    title: 'Song Book Original',
    description: 'Wajib menggunakan Song Book Original.',
    icon: Disc,
    highlight: 'Wajib Song Book Original',
  },
];

export const TERMS_RAW_TEXT = `Syarat & Ketentuan (S&K) Peserta
Event Nyanyi Mirip Idola • Rainbow Candy Birthday Celebration & Virgo Party

1. Pendaftaran & Pengiriman Lagu: Peserta wajib mendaftarkan diri dan mengirimkan pilihan lagu selambat-lambatnya hari Kamis, 10 September 2026 pukul 23.59 WIB.
2. Kehadiran: Peserta diharapkan hadir di dalam room selambat-lambatnya 5 menit sebelum acara dimulai dan diwajibkan untuk stay (tetap berada di room) hingga seluruh rangkaian acara selesai.
3. Pemilihan Lagu: Peserta bebas memilih lagu yang akan dibawakan sesuai dengan genre yang telah ditentukan.
4. Pendampingan: Saat peserta sedang tampil (performance), peserta wajib didampingi oleh kapten atau wakil.
5. Ketertiban: Seluruh peserta wajib menjaga kesopanan dan ketertiban selama acara berlangsung.
6. Keputusan Juri: Penilaian dan keputusan juri bersifat mutlak dan tidak dapat diganggu gugat.
7. Penggunaan Alat Bantu: Diperbolehkan memakai Soundcard, mic, dan alat bantu lain.
8. Teknikal Meeting (TM): Wajib mengikuti Teknikal Meeting pada hari Minggu, 6 September 2026 pukul 11.00 WIB untuk mendapatkan nomor urut tampil.
9. Song Book Original: Wajib menggunakan Song Book Original.

📌 JADWAL PENTING:
• Teknikal Meeting (TM): Minggu, 6 September 2026 pukul 11.00 WIB
• Batas Pendaftaran & Kirim Lagu: Kamis, 10 September 2026 pukul 23.59 WIB
• Hari H Acara Lomba: Minggu, 13 September 2026 pukul 10.00 WIB – Selesai

CP Admin WhatsApp: ${CONTACT_PERSON_WA}`;

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onRegisterClick,
}) => {
  const [copied, setCopied] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopyText = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(TERMS_RAW_TEXT);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = TERMS_RAW_TEXT;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn('Failed to copy text:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="terms-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto z-10"
            style={{
              boxShadow: `0 0 40px ${currentTheme.accentPrimary}25, 0 25px 50px -12px rgba(0, 0, 0, 0.9)`,
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl shrink-0">
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-white leading-snug">
                      Syarat & Ketentuan (S&K)
                    </h3>
                    <span
                      className="text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full border hidden sm:inline-block"
                      style={{
                        backgroundColor: `${currentTheme.accentPrimary}20`,
                        borderColor: `${currentTheme.accentPrimary}50`,
                        color: currentTheme.accentPrimary,
                      }}
                    >
                      Resmi
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Tata Tertib Peserta Event Nyanyi Mirip Idola
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Salin S&K ke Clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Salin Teks</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors border border-slate-700/60 cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Terms List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 custom-scrollbar text-slate-200">
              {/* Banner Notice */}
              <div
                className="p-4 rounded-2xl border flex items-start gap-3 relative overflow-hidden"
                style={{
                  backgroundColor: `${currentTheme.accentPrimary}10`,
                  borderColor: `${currentTheme.accentPrimary}35`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `${currentTheme.accentPrimary}25`,
                    color: currentTheme.accentPrimary,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm">
                  <p className="font-bold text-white mb-0.5">
                    Harap dibaca dan ditaati oleh seluruh peserta lomba
                  </p>
                  <p className="opacity-80 leading-relaxed text-slate-300">
                    Dengan mendaftar, peserta dianggap telah menyetujui seluruh ketentuan, jadwal teknikal meeting, batas registrasi, dan tata tertib kompetisi berikut.
                  </p>
                </div>
              </div>

              {/* Schedule Highlights: TM & Registration Deadline Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Teknikal Meeting Card */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 block">
                      Jadwal Teknikal Meeting (TM)
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      Minggu, 6 September 2026
                    </h5>
                    <p className="text-[11px] text-amber-200 font-mono font-semibold">
                      Pukul 11.00 WIB (Undian No. Urut)
                    </p>
                  </div>
                </div>

                {/* 2. Registration Deadline Card */}
                <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-400/30 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-400/20 border border-pink-400/40 flex items-center justify-center text-pink-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-300 block">
                      Batas Registrasi & Kirim Lagu
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      Kamis, 10 September 2026
                    </h5>
                    <p className="text-[11px] text-pink-200 font-mono font-semibold">
                      Pukul 23.59 WIB (Tepat Waktu)
                    </p>
                  </div>
                </div>
              </div>

              {/* 8 Rules List */}
              <div className="space-y-3 pt-1">
                {TERMS_AND_CONDITIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.number}
                      className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 transition-colors flex items-start gap-3.5 group"
                    >
                      {/* Number Badge with Icon */}
                      <div
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm shadow-md mt-0.5"
                        style={{
                          backgroundColor: `${currentTheme.accentPrimary}20`,
                          color: currentTheme.accentPrimary,
                          border: `1px solid ${currentTheme.accentPrimary}45`,
                        }}
                      >
                        <span>{item.number}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <h4 className="font-serif-luxury font-bold text-sm sm:text-base text-white group-hover:text-amber-200 transition-colors">
                            {item.title}
                          </h4>
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border"
                            style={{
                              backgroundColor: `${currentTheme.accentPrimary}12`,
                              borderColor: `${currentTheme.accentPrimary}30`,
                              color: currentTheme.accentPrimary,
                            }}
                          >
                            {item.highlight}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contact Person Assistance Callout */}
              <div className="pt-2">
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-200">
                      Ada pertanyaan teknis atau kendala pendaftaran?
                    </span>
                  </div>
                  <a
                    href={CONTACT_PERSON_WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    <span>Hubungi WA ({CONTACT_PERSON_WA})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                Rainbow Candy Birthday Celebration • 13 Sept 2026
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>

                {onRegisterClick && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRegisterClick();
                    }}
                    className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${currentTheme.accentButton}`}
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Saya Mengerti & Daftar</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
