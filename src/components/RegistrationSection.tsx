import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Users,
  Music,
  Phone,
  Send,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Loader2,
  Hash,
  ShieldCheck,
  X,
  Lock,
  FileCheck,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeConfig } from '../types/theme';
import { RegistrationFormData, Participant } from '../types/participant';
import { registerParticipant, isSupabaseConfigured, formatValue } from '../services/supabaseClient';
import {
  validateRegistrationPayload,
  sanitizeAlphanumeric,
  sanitizeDigitsOnly,
  checkMaliciousPatterns,
} from '../utils/security';
import { CONTACT_PERSON_WA, CONTACT_PERSON_WA_LINK } from '../assets/logo';

// Batas waktu pendaftaran dan pengiriman lagu: Kamis 10 Sept 2026 pukul 23.59 WIB (UTC+7)
export const REGISTRATION_DEADLINE = new Date('2026-09-10T23:59:59+07:00');
export const REGISTRATION_DEADLINE_MS = REGISTRATION_DEADLINE.getTime();

interface RegistrationSectionProps {
  currentTheme: ThemeConfig;
  onRegistrationSuccess?: (participant: Participant) => void;
  onOpenTermsModal?: () => void;
  eventId?: string;
  eventTitle?: string;
  isEventEnded?: boolean;
}

export const RegistrationSection: React.FC<RegistrationSectionProps> = ({
  currentTheme,
  onRegistrationSuccess,
  onOpenTermsModal,
  eventId,
  eventTitle,
  isEventEnded = false,
}) => {
  // State otomatis terkunci sesuai batas waktu (Kamis 10 Sept 2026 pukul 23.59 WIB)
  const [isLocked, setIsLocked] = useState<boolean>(() => isEventEnded || Date.now() > REGISTRATION_DEADLINE_MS);
  const [remainingTimeText, setRemainingTimeText] = useState<string>('');

  useEffect(() => {
    if (isEventEnded) {
      setIsLocked(true);
      setRemainingTimeText('Event Telah Selesai');
      return;
    }
    const checkDeadline = () => {
      const now = Date.now();
      const diff = REGISTRATION_DEADLINE_MS - now;
      if (diff <= 0) {
        setIsLocked(true);
        setRemainingTimeText('Batas Waktu Berakhir');
      } else {
        setIsLocked(false);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        if (days > 0) {
          setRemainingTimeText(`${days} hari ${hours} jam ${minutes} menit`);
        } else {
          setRemainingTimeText(`${hours} jam ${minutes} menit ${seconds} detik`);
        }
      }
    };

    checkDeadline();
    const interval = setInterval(checkDeadline, 1000);
    return () => clearInterval(interval);
  }, [isEventEnded]);

  const [formData, setFormData] = useState<RegistrationFormData>({
    idpopup: '',
    fullName: '',
    familyName: '',
    idolSong: '',
    idolArtist: '',
    whatsapp: '',
    status: 'pending',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation Modal State (Yes / Cancel)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validatedPayload, setValidatedPayload] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredData, setRegisteredData] = useState<Participant | null>(null);

  // Sanitized Input Change Handlers
  const handleAlphanumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const { name, value } = e.target;
    // Allow typing only Alphanumeric (A-Z, a-z, 0-9) and spaces
    // Strip forbidden characters immediately
    const cleanVal = value.replace(/[^a-zA-Z0-9 ]/g, '');

    setFormData((prev) => ({
      ...prev,
      [name]: cleanVal,
    }));

    // Clear specific field error
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (errorMessage) setErrorMessage(null);
  };

  const handleDigitsOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const { name, value } = e.target;
    // Allow typing only numbers (0-9), automatically stripping any '#' sign, commas, periods, or symbols
    const cleanDigits = value.replace(/^#+/, '').replace(/[^0-9]/g, '');

    setFormData((prev) => ({
      ...prev,
      [name]: cleanDigits,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (errorMessage) setErrorMessage(null);
  };

  // Step 1: Validate form before showing confirmation modal
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Cek apakah formulir terkunci secara otomatis karena batas waktu telah lewat
    if (isLocked || Date.now() > REGISTRATION_DEADLINE_MS) {
      setIsLocked(true);
      setErrorMessage('Formulir pendaftaran dan pengiriman lagu telah otomatis terkunci karena batas waktu telah berakhir (Kamis, 10 September 2026 pukul 23:59 WIB).');
      return;
    }

    // Check for any malicious injection patterns in text inputs
    const inputsToCheck = [
      formData.fullName,
      formData.familyName,
      formData.idolSong,
      formData.idolArtist || '',
    ];

    for (const text of inputsToCheck) {
      if (checkMaliciousPatterns(text)) {
        setErrorMessage('Terdeteksi karakter atau pola query yang dilarang demi keamanan sistem.');
        return;
      }
    }

    // Run strict security validation
    const validation = validateRegistrationPayload({
      fullName: formData.fullName,
      familyName: formData.familyName,
      idpopup: formData.idpopup,
      idolSong: formData.idolSong,
      idolArtist: formData.idolArtist,
      whatsapp: formData.whatsapp,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      setErrorMessage(firstError || 'Silakan periksa kembali format isian formulir.');
      return;
    }

    // Save sanitized payload and open confirmation modal
    setValidatedPayload(validation.sanitized);
    setShowConfirmModal(true);
  };

  // Step 2: User confirms "YES" in confirmation modal -> send to database
  const handleConfirmSubmit = async () => {
    if (!validatedPayload) return;

    if (Date.now() > REGISTRATION_DEADLINE_MS) {
      setShowConfirmModal(false);
      setIsLocked(true);
      setErrorMessage('Batas waktu pendaftaran dan pengiriman lagu telah berakhir pada Kamis, 10 September 2026 pukul 23:59 WIB.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await registerParticipant({
        fullName: validatedPayload.fullName,
        familyName: validatedPayload.familyName,
        idpopup: validatedPayload.idpopup,
        idolSong: validatedPayload.idolSong,
        idolArtist: validatedPayload.idolArtist,
        whatsapp: validatedPayload.whatsapp,
        eventId: eventId || 'rc-virgo-party-2026',
        status: 'pending',
      });

      if (result.success && result.data) {
        setShowConfirmModal(false);
        setIsSuccess(true);
        setRegisteredData(result.data);

        // Fire festive celebration confetti
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F4E0A5', '#E0A96D', '#E05275', '#FF5391', '#D4AF37'],
          });
        } catch (e) {
          // ignore if canvas not supported
        }

        if (onRegistrationSuccess) {
          onRegistrationSuccess(result.data);
        }

        // Reset form data for subsequent registration
        setFormData({
          idpopup: '',
          fullName: '',
          familyName: '',
          idolSong: '',
          idolArtist: '',
          whatsapp: '',
          status: 'pending',
        });
        setValidatedPayload(null);
      } else {
        setShowConfirmModal(false);
        setErrorMessage(result.error || 'Terjadi kendala saat mendaftar. Silakan coba kembali.');
      }
    } catch (err: any) {
      setShowConfirmModal(false);
      setErrorMessage(err.message || 'Gagal terhubung ke database. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="daftar" className="py-20 md:py-28 relative">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: currentTheme.accentPrimary }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-4 text-xs font-bold uppercase tracking-widest font-mono"
            style={{
              backgroundColor: `${currentTheme.accentPrimary}15`,
              borderColor: `${currentTheme.accentPrimary}35`,
              color: currentTheme.accentPrimary,
            }}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Formulir Pendaftaran Resmi</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-current mb-4">
            Daftarkan Dirimu di{' '}
            <span
              className="italic bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${currentTheme.accentPrimary}, ${currentTheme.accentSecondary})`,
              }}
            >
              RC Virgo Party
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto opacity-75 font-light mb-4">
            Isi data di bawah ini untuk mengamankan slot panggung perayaan nyanyi mirip idola. Dilengkapi validasi keamanan data pendaftaran.
          </p>

          {/* Quick Schedule Callout */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-xl mx-auto text-xs">
            <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>TM: <strong>Minggu, 6 Sept 2026 (11.00 WIB)</strong></span>
            </span>
            <span
              className={`px-3 py-1 rounded-full border font-medium flex items-center gap-1.5 ${
                isLocked
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-pink-500/15 border-pink-400/30 text-pink-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                Batas Lagu & Daftar: <strong>Kamis, 10 Sept 2026 (23.59 WIB)</strong>
              </span>
            </span>
            {isLocked ? (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-200 font-mono font-bold flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>Formulir Terkunci</span>
              </span>
            ) : (
              remainingTimeText && (
                <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Sisa: <strong>{remainingTimeText}</strong></span>
                </span>
              )
            )}
          </div>
        </div>

        {/* Registration Card Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`rounded-3xl ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} ${currentTheme.cardGlow} p-6 sm:p-10 backdrop-blur-2xl relative shadow-2xl overflow-hidden`}
        >
          {/* Success State Overlay */}
          <AnimatePresence>
            {isSuccess && registeredData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 text-center space-y-6"
              >
                <div
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.accentPrimary}, ${currentTheme.accentSecondary})`,
                  }}
                >
                  <CheckCircle className="w-10 h-10 text-slate-950 stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif-luxury text-3xl font-black text-current">
                    Pendaftaran Berhasil!
                  </h3>
                  <p className="text-sm sm:text-base opacity-80 max-w-md mx-auto">
                    Selamat, <strong className="font-bold text-current">{registeredData.fullName}</strong> dari Family{' '}
                    <strong className="font-bold text-current">{registeredData.familyName}</strong> telah resmi terdaftar!
                  </p>
                </div>

                {/* Registration summary badge */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 max-w-md mx-auto text-left text-xs sm:text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="opacity-70">ID PopUp:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {registeredData.idpopup !== undefined ? `#${registeredData.idpopup}` : 'not available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Lagu Pilihan:</span>
                    <span className="font-bold text-current">{registeredData.idolSong}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Penyanyi Asli:</span>
                    <span className="font-semibold text-current">{formatValue(registeredData.idolArtist)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Kontak WhatsApp:</span>
                    <span className="font-mono font-bold text-current">{registeredData.whatsapp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Jadwal Acara:</span>
                    <span className="font-bold text-amber-400">13 Sept 2026 • 10:00 WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Status Pendaftaran:</span>
                    <span className="font-mono text-amber-300 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Pending (Menunggu Konfirmasi)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <a
                    href="#peserta"
                    onClick={() => setIsSuccess(false)}
                    className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider ${currentTheme.accentButton}`}
                  >
                    Lihat di Daftar Peserta
                  </a>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-current border border-white/10 cursor-pointer"
                  >
                    Daftar Peserta Lain
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Form */}
          {!isSuccess && (
            <form onSubmit={handlePreSubmit} className="space-y-6">
              {/* Alert Error if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Automatic Lockdown Banner when Deadline Reached */}
              {isLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 sm:p-6 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-rose-500/25 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0">
                      <Lock className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif-luxury text-base sm:text-lg font-black text-rose-100">
                          Pendaftaran & Pengiriman Lagu Resmi Ditutup
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/50 text-[10px] font-mono font-bold uppercase">
                          Terkunci Otomatis
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
                        Batas waktu pendaftaran dan pengiriman judul lagu telah berakhir pada{' '}
                        <strong className="text-amber-300 font-bold">Kamis, 10 September 2026 pukul 23:59 WIB</strong>.
                        Seluruh isian formulir dinonaktifkan secara otomatis dan sistem tidak lagi dapat menerima pendaftaran baru.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                        <a
                          href="#peserta"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 font-semibold border border-white/10 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>Lihat Daftar Peserta Terdaftar</span>
                        </a>
                        <a
                          href={CONTACT_PERSON_WA_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/40 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Hubungi Panitia ({CONTACT_PERSON_WA})</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Shield Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">
                    Validasi input aktif: Karakter khusus & script injeksi dilarang secara otomatis.
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/30 shrink-0">
                  Secured
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                      <span>Nama Peserta</span>
                      <span className="text-red-400">*</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-60">A-Z, 0-9 & Spasi</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleAlphanumericChange}
                    disabled={isLocked}
                    placeholder={isLocked ? 'Pendaftaran & kirim lagu telah ditutup' : 'Contoh: Aurelia Stella 23'}
                    className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium ${
                      isLocked ? 'bg-black/30 opacity-60 cursor-not-allowed border-slate-700' : currentTheme.inputBg
                    } border ${
                      fieldErrors.fullName ? 'border-red-500 ring-1 ring-red-500' : currentTheme.inputBorder
                    } text-current placeholder:opacity-40 outline-none transition-all`}
                    required
                  />
                  {fieldErrors.fullName ? (
                    <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{fieldErrors.fullName}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-60">
                      Hanya huruf abjad dan angka (A-Z, a-z, 0-9) tanpa simbol/karakter khusus.
                    </p>
                  )}
                </div>

                {/* Family Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                      <span>Nama Family / Komunitas</span>
                      <span className="text-red-400">*</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-60">A-Z, 0-9 & Spasi</span>
                  </label>
                  <input
                    type="text"
                    name="familyName"
                    value={formData.familyName}
                    onChange={handleAlphanumericChange}
                    disabled={isLocked}
                    placeholder={isLocked ? 'Pendaftaran & kirim lagu telah ditutup' : 'Contoh: RC Royal Blossom'}
                    className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium ${
                      isLocked ? 'bg-black/30 opacity-60 cursor-not-allowed border-slate-700' : currentTheme.inputBg
                    } border ${
                      fieldErrors.familyName ? 'border-red-500 ring-1 ring-red-500' : currentTheme.inputBorder
                    } text-current placeholder:opacity-40 outline-none transition-all`}
                    required
                  />
                  {fieldErrors.familyName ? (
                    <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{fieldErrors.familyName}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-60">
                      Hanya huruf abjad dan angka (A-Z, a-z, 0-9) tanpa simbol khusus.
                    </p>
                  )}
                </div>
              </div>

              {/* ID PopUp (Pure Digits, No Commas) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                    <span>ID PopUp (Hanya Angka Murni)</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-60">Angka Saja (Tanpa Koma/Titik)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="idpopup"
                  value={formData.idpopup !== undefined ? formData.idpopup : ''}
                  onChange={handleDigitsOnlyChange}
                  disabled={isLocked}
                  placeholder={isLocked ? 'Pendaftaran & kirim lagu telah ditutup' : 'Contoh: 53106499'}
                  className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium ${
                    isLocked ? 'bg-black/30 opacity-60 cursor-not-allowed border-slate-700' : currentTheme.inputBg
                  } border ${
                    fieldErrors.idpopup ? 'border-red-500 ring-1 ring-red-500' : currentTheme.inputBorder
                  } text-current placeholder:opacity-40 outline-none transition-all font-mono`}
                />
                {fieldErrors.idpopup ? (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{fieldErrors.idpopup}</span>
                  </p>
                ) : (
                  <p className="text-[11px] opacity-60">
                    Ketik angka nomor ID akun PopUp Anda tanpa tanda baca koma, titik, atau spasi (contoh: 53106499).
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Idol Song */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                      <span>Lagu Idola yang Dibawakan</span>
                      <span className="text-red-400">*</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-60">A-Z, 0-9 & Spasi</span>
                  </label>
                  <input
                    type="text"
                    name="idolSong"
                    value={formData.idolSong}
                    onChange={handleAlphanumericChange}
                    disabled={isLocked}
                    placeholder={isLocked ? 'Pendaftaran & kirim lagu telah ditutup' : 'Contoh: Sang Dewi'}
                    className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium ${
                      isLocked ? 'bg-black/30 opacity-60 cursor-not-allowed border-slate-700' : currentTheme.inputBg
                    } border ${
                      fieldErrors.idolSong ? 'border-red-500 ring-1 ring-red-500' : currentTheme.inputBorder
                    } text-current placeholder:opacity-40 outline-none transition-all`}
                    required
                  />
                  {fieldErrors.idolSong ? (
                    <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{fieldErrors.idolSong}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-60">
                      Hanya huruf abjad dan angka (A-Z, a-z, 0-9) tanpa simbol khusus.
                    </p>
                  )}
                </div>

                {/* Idol Artist */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                      <span>Nama Penyanyi / Idola Asli</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-60">Opsional (A-Z, 0-9)</span>
                  </label>
                  <input
                    type="text"
                    name="idolArtist"
                    value={formData.idolArtist}
                    onChange={handleAlphanumericChange}
                    disabled={isLocked}
                    placeholder={isLocked ? 'Pendaftaran & kirim lagu telah ditutup' : 'Contoh: Lyodra'}
                    className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium ${
                      isLocked ? 'bg-black/30 opacity-60 cursor-not-allowed border-slate-700' : currentTheme.inputBg
                    } border ${
                      fieldErrors.idolArtist ? 'border-red-500 ring-1 ring-red-500' : currentTheme.inputBorder
                    } text-current placeholder:opacity-40 outline-none transition-all`}
                  />
                  {fieldErrors.idolArtist ? (
                    <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{fieldErrors.idolArtist}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-60">
                      Hanya huruf abjad dan angka (A-Z, a-z, 0-9).
                    </p>
                  )}
                </div>
              </div>

              {/* WhatsApp Contact (Digits Only) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                    <span>Kontak WhatsApp</span>
                    <span className="text-red-400">*</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-60">Hanya Angka (0-9)</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleDigitsOnlyChange}
                  disabled={isLocked}
                  placeholder={isLocked ? 'Pendaftaran & kirim lagu telah ditutup' : 'Contoh: 081234567890'}
                  className={`w-full px-4 py-3.5 rounded-xl text-sm font-medium ${
                    isLocked ? 'bg-black/30 opacity-60 cursor-not-allowed border-slate-700' : currentTheme.inputBg
                  } border ${
                    fieldErrors.whatsapp ? 'border-red-500 ring-1 ring-red-500' : currentTheme.inputBorder
                  } text-current placeholder:opacity-40 outline-none transition-all font-mono`}
                  required
                />
                {fieldErrors.whatsapp ? (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{fieldErrors.whatsapp}</span>
                  </p>
                ) : (
                  <p className="text-[11px] opacity-60">
                    Masukkan nomor WhatsApp hanya berupa angka saja (contoh: 081234567890).
                  </p>
                )}
              </div>

              {/* Terms agreement notice */}
              <div className="space-y-2.5">
                {onOpenTermsModal && (
                  <button
                    type="button"
                    onClick={onOpenTermsModal}
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-current/15 text-xs text-left flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 shrink-0" style={{ color: currentTheme.accentPrimary }} />
                      <span>
                        Dengan mendaftar, Anda menyetujui{' '}
                        <strong className="underline group-hover:text-amber-300 transition-colors">
                          Syarat & Ketentuan (S&K) Lomba
                        </strong>
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                      style={{
                        backgroundColor: `${currentTheme.accentPrimary}15`,
                        borderColor: `${currentTheme.accentPrimary}40`,
                        color: currentTheme.accentPrimary,
                      }}
                    >
                      Baca S&K
                    </span>
                  </button>
                )}
              </div>

              {/* Pre-Submit Button / Locked Indicator */}
              {isLocked ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-4 rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 bg-slate-800/90 text-slate-400 border border-slate-700/80 cursor-not-allowed opacity-80 select-none shadow-none"
                >
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Formulir Terkunci (Pendaftaran & Kirim Lagu Telah Ditutup)</span>
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className={`w-full py-4 rounded-2xl text-sm sm:text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer ${currentTheme.accentButton}`}
                >
                  <Send className="w-5 h-5" />
                  <span>Kirim Pendaftaran Sekarang</span>
                </motion.button>
              )}
            </form>
          )}
        </motion.div>
      </div>

      {/* Interactive Validation & Confirmation Modal (Yes / Cancel) */}
      <AnimatePresence>
        {showConfirmModal && validatedPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-100 shadow-2xl relative overflow-hidden my-8"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-pink-500 to-amber-400" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => !isLoading && setShowConfirmModal(false)}
                disabled={isLoading}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="text-center space-y-2 mb-6 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 mx-auto flex items-center justify-center text-amber-400 shadow-inner">
                  <FileCheck className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h3 className="font-serif-luxury text-2xl font-black text-slate-100">
                  Konfirmasi Pendaftaran
                </h3>
                <p className="text-xs text-slate-300">
                  Periksa kembali seluruh data Anda sebelum dikirim ke database event.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Validasi Format: Terverifikasi Bersih & Aman</span>
                </div>
              </div>

              {/* Data Summary Box */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Nama Peserta:</span>
                  <span className="font-bold text-amber-300 text-right">{validatedPayload.fullName}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Nama Family:</span>
                  <span className="font-semibold text-slate-100 text-right">{validatedPayload.familyName}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">ID PopUp:</span>
                  <span className="font-mono font-bold text-amber-400 text-right">
                    {validatedPayload.idpopup !== undefined ? `#${validatedPayload.idpopup}` : 'not available'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Lagu Pilihan:</span>
                  <span className="font-bold text-slate-100 text-right">{validatedPayload.idolSong}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Penyanyi Asli:</span>
                  <span className="font-semibold text-slate-300 text-right">
                    {validatedPayload.idolArtist || 'not available'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Kontak WhatsApp:</span>
                  <span className="font-mono font-bold text-slate-100 text-right">{validatedPayload.whatsapp}</span>
                </div>
              </div>

              {/* Note */}
              <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Dengan menekan tombol <strong>"Ya, Kirim Sekarang"</strong>, data pendaftaran Anda akan langsung disimpan ke database Supabase Cloud dengan status <strong>Pending</strong> untuk verifikasi nomor urut oleh panitia.
                </span>
              </div>

              {/* Action Buttons (Yes vs Cancel) */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isLoading}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Batal (Cancel)</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isLoading}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 stroke-[2.5]" />
                      <span>Ya, Kirim (Yes)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
