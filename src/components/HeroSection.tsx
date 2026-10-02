import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Clock, Mic2, Star, Play, ChevronRight, Gift, Award, Music2, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { RC_LOGO_IMAGE } from '../assets/logo';
import { RCEvent } from '../types/event';

interface HeroSectionProps {
  currentTheme: ThemeConfig;
  event?: RCEvent;
  onRegisterClick?: () => void;
  onOpenPosterModal?: () => void;
  onOpenTermsModal?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentTheme,
  event,
  onRegisterClick,
  onOpenPosterModal,
  onOpenTermsModal,
}) => {
  // Target Event Date derived from database event or fallback to 13 September 2026
  const targetTimestamp = useMemo(() => {
    if (event?.startDate) {
      // If event.startDate is YYYY-MM-DD
      const dateStr = event.startDate.includes('T')
        ? event.startDate
        : `${event.startDate}T${event.time?.match(/\d{2}:\d{2}/)?.[0] || '10:00'}:00+07:00`;
      const parsed = new Date(dateStr).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return new Date('2026-09-13T10:00:00+07:00').getTime();
  }, [event?.startDate, event?.time]);

  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date().getTime();
    const difference = targetTimestamp - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTimestamp]);

  const eventTitle = event?.title || 'RC Birthday Celebration & Virgo Party';
  const eventSubtitle = event?.subtitle || 'The Grand Celebration & Virgo Season';
  const eventCategory = event?.category || 'Event Nyanyi Mirip Idola';
  const eventDate = event?.startDate || 'Minggu, 13 September 2026';
  const eventTime = event?.time || '10:00 WIB – Selesai';
  const eventVenue = event?.venue || 'Ballroom & Live Room Stage RC';
  const eventDesc =
    event?.description ||
    'Panggung eksklusif untuk menampilkan bakat vokal terbaikmu dengan membawakan lagu idola tercinta. Rayakan ulang tahun RC dengan kemewahan dan persahabatan sejati!';

  // Format total prize display
  const prizeDisplay = useMemo(() => {
    if (event?.prizes) {
      const p = event.prizes;
      if (p.juara1 && p.juara2 && p.juara3) {
        return `${p.juara1} + ${p.juara2} + ${p.juara3}`;
      }
      if (p.juara1) return `Hingga ${p.juara1}`;
    }
    return 'Rp1.000.000 + Sertifikat';
  }, [event?.prizes]);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Subtle Background Glows & Constellation Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated ambient circular gradients */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.28, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${currentTheme.accentPrimary}40 0%, ${currentTheme.accentSecondary}20 50%, transparent 75%)`,
          }}
        />

        {/* Virgo Constellation SVG backdrop */}
        <svg
          className="absolute top-12 right-6 md:right-24 w-72 h-72 md:w-96 md:h-96 opacity-20 pointer-events-none stroke-current"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: currentTheme.accentPrimary }}
        >
          {/* Constellation Lines for Virgo */}
          <path
            d="M30 60 L60 85 L95 80 L130 110 L160 95 L175 140 M95 80 L90 135 L120 160 M130 110 L120 160"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          {/* Main Stars (Spica & Virgo nodes) */}
          <circle cx="30" cy="60" r="3" fill="currentColor" />
          <circle cx="60" cy="85" r="3.5" fill="currentColor" />
          <circle cx="95" cy="80" r="4" fill="currentColor" />
          <circle cx="130" cy="110" r="5" fill="currentColor" />
          <circle cx="160" cy="95" r="3" fill="currentColor" />
          <circle cx="175" cy="140" r="3.5" fill="currentColor" />
          <circle cx="90" cy="135" r="3.5" fill="currentColor" />
          <circle cx="120" cy="160" r="6" fill="currentColor" className="animate-pulse" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Official Rainbow Candy Brand Logo Presentation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center mb-5"
        >
          <div className="relative group">
            <div
              className="absolute -inset-2 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.accentPrimary}, ${currentTheme.accentSecondary})`,
              }}
            />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl p-2 bg-white shadow-2xl border border-white/60 overflow-hidden flex items-center justify-center">
              <img
                src={RC_LOGO_IMAGE}
                alt="Rainbow Candy (RC) Official Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </motion.div>

        {/* Pill Badge for Core Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md mb-6 shadow-sm"
          style={{
            backgroundColor: `${currentTheme.accentPrimary}15`,
            borderColor: `${currentTheme.accentPrimary}40`,
            color: currentTheme.accentPrimary,
          }}
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">
            {eventCategory}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
          <span className="text-xs font-mono font-semibold opacity-90">Rainbow Candy Collaboration</span>
        </motion.div>

        {/* Main Title with Elegant Serif Typography */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6 space-y-2"
        >
          <p
            className="text-xs sm:text-sm md:text-base font-cinzel font-semibold tracking-[0.25em] uppercase opacity-90"
            style={{ color: currentTheme.accentSecondary }}
          >
            {eventSubtitle}
          </p>

          <h1 className="font-serif-luxury text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] max-w-5xl mx-auto text-current">
            {eventTitle}
          </h1>
        </motion.div>

        {/* Event Sub-headline & Details */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto opacity-80 leading-relaxed font-light mb-10"
        >
          {eventDesc}
        </motion.p>

        {/* Date, Time & Collaboration Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12 text-sm sm:text-base font-medium"
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder}`}
          >
            <Calendar className="w-5 h-5" style={{ color: currentTheme.accentPrimary }} />
            <span>
              <strong className="font-bold">{eventDate}</strong>
            </span>
          </div>

          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder}`}
          >
            <Clock className="w-5 h-5" style={{ color: currentTheme.accentPrimary }} />
            <span>
              <strong className="font-bold">{eventTime}</strong>
            </span>
          </div>

          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder}`}
          >
            <Award className="w-5 h-5" style={{ color: currentTheme.accentPrimary }} />
            <span>
              Total Hadiah: <strong className="font-bold">{prizeDisplay}</strong>
            </span>
          </div>
        </motion.div>

        {/* Interactive Live Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div
            className={`p-6 sm:p-8 rounded-3xl ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} ${currentTheme.cardGlow} relative overflow-hidden backdrop-blur-2xl`}
          >
            {/* Top decorative accent */}
            <div className="flex items-center justify-between mb-5 border-b border-current/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
                <span className="text-xs uppercase font-bold tracking-widest font-mono opacity-80">
                  Hitung Mundur Panggung Akbar
                </span>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${currentTheme.accentPrimary}20`,
                  color: currentTheme.accentPrimary,
                }}
              >
                13 Sept 2026 • 10:00 WIB
              </span>
            </div>

            {/* Countdown Grid (Days, Hours, Minutes, Seconds) */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
              {[
                { label: 'Hari', value: timeLeft.days },
                { label: 'Jam', value: timeLeft.hours },
                { label: 'Menit', value: timeLeft.minutes },
                { label: 'Detik', value: timeLeft.seconds },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-black/20 border border-white/5 relative group"
                >
                  <motion.span
                    key={item.value}
                    initial={{ y: -5, opacity: 0.8 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="font-serif-luxury text-2xl sm:text-4xl md:text-5xl font-black tracking-tight"
                    style={{ color: currentTheme.accentPrimary }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </motion.span>
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold opacity-70 mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 flex-wrap"
        >
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            href="#daftar"
            onClick={onRegisterClick}
            className={`w-full sm:w-auto px-7 py-4 rounded-full text-sm sm:text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all ${currentTheme.accentButton}`}
          >
            <Mic2 className="w-5 h-5 stroke-[2.5]" />
            <span>Daftar Lomba Sekarang</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </motion.a>

          {onOpenTermsModal && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onOpenTermsModal}
              className={`w-full sm:w-auto px-6 py-4 rounded-full text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 ${currentTheme.cardBg} border ${currentTheme.cardBorder} hover:bg-white/10 transition-all cursor-pointer shadow-sm`}
            >
              <FileText className="w-4 h-4 stroke-[2.5]" style={{ color: currentTheme.accentPrimary }} />
              <span>Syarat & Ketentuan</span>
            </motion.button>
          )}

          {onOpenPosterModal && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onOpenPosterModal}
              className={`w-full sm:w-auto px-6 py-4 rounded-full text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 ${currentTheme.cardBg} border ${currentTheme.cardBorder} hover:bg-white/10 transition-all cursor-pointer shadow-sm`}
            >
              <Download className="w-4 h-4 stroke-[2.5]" style={{ color: currentTheme.accentPrimary }} />
              <span>Download Poster Event</span>
            </motion.button>
          )}
        </motion.div>
      </div>
    </section>
  );
};
