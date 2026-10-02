import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Trophy,
  Music,
  Users,
  Heart,
  Star,
  Mic,
  Radio,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  Flame,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Headphones,
  Compass,
  Smile,
  Zap,
  Layers,
  ChevronRight,
  Lock,
  ArrowUp,
  Share2,
} from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { RC_LOGO_IMAGE, CONTACT_PERSON_WA, CONTACT_PERSON_WA_LINK } from '../assets/logo';
import {
  FamsProfileData,
  FamsMember,
  INITIAL_FAMS_PROFILE,
  INITIAL_FAMS_MEMBERS,
} from '../types/fams';
import { RCEvent } from '../types/event';
import {
  fetchFamsProfile,
  fetchFamsMembers,
  subscribeToFams,
} from '../services/famsService';

interface RainbowProfilePageProps {
  currentTheme: ThemeConfig;
  onNavigateToEvent: (options?: { scrollTo?: string }) => void;
  onOpenAdmin?: () => void;
  onSelectTheme?: (themeId: any) => void;
  events?: RCEvent[];
}

export const RainbowProfilePage: React.FC<RainbowProfilePageProps> = ({
  currentTheme,
  onNavigateToEvent,
  onOpenAdmin,
  events = [],
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<FamsProfileData>(INITIAL_FAMS_PROFILE);
  const [members, setMembers] = useState<FamsMember[]>(INITIAL_FAMS_MEMBERS);

  // Spotlight event: featured flag first, then open registration, then latest
  const spotlightEvent: RCEvent | undefined =
    events.find((e) => e.isFeatured) ||
    events.find((e) => e.status === 'open') ||
    events[0];

  useEffect(() => {
    fetchFamsProfile().then((res) => {
      if (res.data) setProfile(res.data);
    });
    fetchFamsMembers().then((res) => {
      if (res.data) setMembers(res.data);
    });

    const unsub = subscribeToFams({
      onProfileUpdate: (p) => setProfile(p),
      onMembersUpdate: (m) => setMembers(m),
    });

    return () => unsub();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Dynamic Profile stats
  const stats = (profile.stats && profile.stats.length > 0)
    ? profile.stats.map((st, idx) => ({
        number: st.number,
        label: st.label,
        detail: st.detail,
        icon: [Users, Trophy, Heart, Award][idx % 4] || Users,
      }))
    : [
        {
          number: '350+',
          label: 'Anggota Aktif',
          detail: 'Penyanyi & kreator audio di seluruh nusantara',
          icon: Users,
        },
        {
          number: '25+',
          label: 'Event Sukses',
          detail: 'Turnamen & perayaan musik bergengsi',
          icon: Trophy,
        },
        {
          number: '100%',
          label: 'Solidaritas & Respek',
          detail: 'Komunitas positif tanpa drama & diskriminasi',
          icon: Heart,
        },
        {
          number: 'Tier VIP',
          label: 'Reputasi Komunitas',
          detail: 'Family terverifikasi & berprestasi',
          icon: Award,
        },
      ];

  // Dynamic Core values
  const coreValues = (profile.coreValues && profile.coreValues.length > 0)
    ? profile.coreValues.map((val, idx) => ({
        icon: [Heart, Mic, ShieldCheck, Smile][idx % 4] || Heart,
        title: val.title,
        desc: val.desc,
        color: val.color || '#E05275',
      }))
    : [
        {
          icon: Heart,
          title: 'Kekeluargaan (Family First)',
          desc: 'Lebih dari sekadar wadah bernyanyi, Rainbow Candy adalah rumah kedua tempat saling merangkul, menyapa, dan mendukung satu sama lain dalam setiap suka dan duka.',
          color: '#E05275',
        },
        {
          icon: Mic,
          title: 'Dedikasi Vokal & Karya',
          desc: 'Kami memberi ruang bagi setiap anggota untuk mengasah potensi vokal, mengeksplorasi berbagai genre musik, dan tampil percaya diri di panggung audio.',
          color: '#F4E0A5',
        },
        {
          icon: ShieldCheck,
          title: 'Sportivitas & Integritas',
          desc: 'Setiap perlombaan dan kompetisi yang diselenggarakan Rainbow Candy menjunjung tinggi transparansi, keadilan penjurian, dan etika berkompetisi yang sehat.',
          color: '#A855F7',
        },
        {
          icon: Smile,
          title: 'Keceriaan & Kehangatan',
          desc: 'Sesuai dengan filosofi "Candy", kami menghadirkan suasana room yang manis, ceria, bersahabat, dan selalu menyegarkan hari-hari setiap penikmat musik.',
          color: '#38BDF8',
        },
      ];

  // Dynamic Activities & Programs
  const iconLookup: Record<string, any> = {
    Headphones,
    Flame,
    Sparkles,
    Radio,
    Music,
  };

  const programs = (profile.programs && profile.programs.length > 0)
    ? profile.programs.map((p) => ({
        title: p.title,
        category: p.category,
        desc: p.desc,
        icon: (p.iconName && iconLookup[p.iconName]) || Music,
        tag: p.tag,
        highlight: Boolean(p.highlight),
      }))
    : [
        {
          title: 'Voice Room & Daily Jamming',
          category: 'Rutin Harian',
          desc: 'Sesi santai bernyanyi bersama, duet spontan, serta uji coba soundcard dan mikrofon bersama para rekan satu family.',
          icon: Headphones,
          tag: 'Setiap Hari',
        },
        {
          title: 'Event Nyanyi Mirip Idola',
          category: 'Kompetisi Bergengsi',
          desc: 'Turnamen vokal tahunan dengan penilaian dewan juri ahli, menguji teknik olah vokal, kemiripan karakter, dan penjiwaan panggung.',
          icon: Flame,
          tag: 'Event Utama 2026',
          highlight: true,
        },
        {
          title: 'Birthday & Zodiac Parties',
          category: 'Perayaan Khusus',
          desc: 'Pesta syukuran hari lahir anggota dan perayaan zodiak tematik (seperti Virgo Party) yang dimeriahkan dengan games dan doorprize.',
          icon: Sparkles,
          tag: 'Spesial Bulanan',
        },
        {
          title: 'Vocal Coaching & Tips Sharing',
          category: 'Edukasi & Sharing',
          desc: 'Ruang diskusi seputar teknik pernapasan, cengkok lagu, pemilihan nada dasar yang tepat, serta tips mixing audio rekaman.',
          icon: Radio,
          tag: 'Sharing Session',
        },
      ];

  // Management / Structure
  const teamRoles = [
    {
      role: 'Founder & Captain Fams',
      title: 'Pemimpin & Pengarah Utama',
      desc: 'Menjaga arah visi, marwah keluarga, serta membina solidaritas seluruh anggota Rainbow Candy.',
      icon: Award,
    },
    {
      role: 'Management & Event Organizer',
      title: 'Operasional & Acara',
      desc: 'Merancang konsep perlombaan, menyusun jadwal panggung, serta memastikan kelancaran setiap kegiatan resmi.',
      icon: Calendar,
    },
    {
      role: 'Creative & Audio Curator',
      title: 'Kreatif & Penjurian',
      desc: 'Menyiapkan materi visual, kurasi audio, serta merumuskan standar penilaian kompetisi yang objektif.',
      icon: Music,
    },
    {
      role: 'Relations & Family Hospitality',
      title: 'Humas & Penyambutan',
      desc: 'Menyambut tamu dari family sahabat, menjalin kolaborasi antar-komunitas, dan merawat keakraban internal.',
      icon: Users,
    },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-500 selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden ${currentTheme.bgClass}`}
      style={currentTheme.bgStyle}
    >
      {/* 1. Header Navigation for Rainbow Candy Profile */}
      <header className={`fixed top-0 left-0 right-0 z-40 ${currentTheme.headerBg} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Identity */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => scrollToSection('beranda')}>
              <div
                className="w-12 h-12 rounded-2xl p-1 flex items-center justify-center shadow-md relative overflow-hidden transition-transform duration-300 group-hover:scale-105 bg-white border border-white/40 shrink-0"
                style={{
                  boxShadow: `0 0 16px ${currentTheme.accentPrimary}35`,
                }}
              >
                <img
                  src={RC_LOGO_IMAGE}
                  alt="Rainbow Candy Official Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-luxury text-lg sm:text-xl font-bold tracking-tight text-current">
                    Rainbow Candy
                  </span>
                  <span
                    className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${currentTheme.accentPrimary}18`,
                      borderColor: `${currentTheme.accentPrimary}40`,
                      color: currentTheme.accentPrimary,
                    }}
                  >
                    Official Profile
                  </span>
                </div>
                <p className="text-[11px] opacity-75 font-medium flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 inline fill-current text-rose-400" />
                  Fams Community
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                type="button"
                onClick={() => scrollToSection('tentang')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-current/80 hover:text-current hover:bg-white/5 transition-colors cursor-pointer"
              >
                Tentang Fams
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('visi-misi')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-current/80 hover:text-current hover:bg-white/5 transition-colors cursor-pointer"
              >
                Visi & Nilai
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('program')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-current/80 hover:text-current hover:bg-white/5 transition-colors cursor-pointer"
              >
                Aktivitas
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('struktur')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-current/80 hover:text-current hover:bg-white/5 transition-colors cursor-pointer"
              >
                Struktur
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('kontak')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-current/80 hover:text-current hover:bg-white/5 transition-colors cursor-pointer"
              >
                Gabung Fams
              </button>
            </nav>

            {/* Action Buttons: Go to Event Landing Page */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateToEvent()}
                className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg hover:scale-105 cursor-pointer overflow-hidden border"
                style={{
                  backgroundColor: `${currentTheme.accentPrimary}25`,
                  borderColor: `${currentTheme.accentPrimary}60`,
                  color: currentTheme.textPrimary,
                  boxShadow: `0 0 20px ${currentTheme.accentPrimary}30`,
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Lihat Event RC</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-white/5 border border-current/15 text-current"
                aria-label="Buka Menu"
              >
                <Layers className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 border-b border-current/10 bg-slate-950/95 backdrop-blur-2xl space-y-2">
            <button
              type="button"
              onClick={() => scrollToSection('tentang')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Tentang Fams
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('visi-misi')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Visi & Nilai Komunitas
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('program')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Program & Aktivitas
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('struktur')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Struktur Kepengurusan
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('kontak')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Hubungi / Gabung Fams
            </button>
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToEvent();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buka Landing Page Event & Pendaftaran</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-28 sm:pt-32">
        {/* ============================================================ */}
        {/* 2. HERO SECTION: COMPANY PROFILE BRANDING */}
        {/* ============================================================ */}
        <section id="beranda" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Top Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider font-mono shadow-sm"
              style={{
                backgroundColor: `${currentTheme.accentPrimary}15`,
                borderColor: `${currentTheme.accentPrimary}35`,
                color: currentTheme.accentPrimary,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Community & Creative Singing Family</span>
            </motion.div>

            {/* Logo Emblem Big Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex justify-center"
            >
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-2.5 bg-white shadow-2xl border-2 border-white/60 relative group"
                style={{
                  boxShadow: `0 0 45px ${currentTheme.accentPrimary}40`,
                }}
              >
                <img
                  src={RC_LOGO_IMAGE}
                  alt="Rainbow Candy Family Official Emblem"
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Title & Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-current">
                Harmoni Suara,{' '}
                <span
                  className="italic bg-gradient-to-r bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${currentTheme.accentPrimary}, ${currentTheme.accentSecondary})`,
                  }}
                >
                  Kehangatan Keluarga
                </span>
                , & Panggung Prestasi.
              </h1>

              <p className="text-base sm:text-lg opacity-85 leading-relaxed font-light max-w-3xl mx-auto">
                Selamat datang di beranda resmi <strong>Rainbow Candy (RC)</strong>. Kami adalah komunitas keluarga virtual, wadah apresiasi vokal, dan kolaborator panggung musik yang berkomitmen menyajikan karya penuh warna, menjunjung tinggi sportivitas, dan merajut persaudaraan tanpa batas.
              </p>
            </motion.div>

            {/* EVENT HIGHLIGHT CARD (Direct Link to Event Landing Page) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`p-6 sm:p-8 rounded-3xl ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} ${currentTheme.cardGlow} backdrop-blur-2xl shadow-2xl relative overflow-hidden text-left max-w-3xl mx-auto`}
            >
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-amber-400 text-slate-950">
                      EVENT RESMI KAMI
                    </span>
                    <span className="text-xs font-semibold opacity-75 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      13 September 2026 • 10:00 WIB
                    </span>
                  </div>

                  <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-current">
                    RC Birthday Celebration & Virgo Party 2026
                  </h2>

                  <p className="text-xs sm:text-sm opacity-80 font-normal">
                    Kompetisi Nyanyi Mirip Idola dengan total hadiah lebih dari <strong>Rp 1.500.000</strong>, sertifikat kehormatan, dan piala digital dewan juri.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigateToEvent()}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Masuk ke Halaman Event</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToEvent({ scrollTo: 'daftar' })}
                    className="px-4 py-3 rounded-2xl border border-current/20 hover:border-current/40 hover:bg-white/5 text-current font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Music className="w-4 h-4" />
                    <span>Daftar Peserta</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Quick Explore Anchor Links */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold opacity-75">
              <span>Jelajahi Profil:</span>
              <button
                type="button"
                onClick={() => scrollToSection('tentang')}
                className="hover:opacity-100 underline decoration-current/30 underline-offset-4 cursor-pointer"
              >
                Tentang Kami
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => scrollToSection('visi-misi')}
                className="hover:opacity-100 underline decoration-current/30 underline-offset-4 cursor-pointer"
              >
                Filosofi & Nilai
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => scrollToSection('program')}
                className="hover:opacity-100 underline decoration-current/30 underline-offset-4 cursor-pointer"
              >
                Program Komunitas
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => scrollToSection('kontak')}
                className="hover:opacity-100 underline decoration-current/30 underline-offset-4 cursor-pointer text-amber-400"
              >
                Gabung Fams Rainbow
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. KEY STATS & METRICS */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} backdrop-blur-xl shadow-lg flex flex-col items-center text-center space-y-2 relative overflow-hidden`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border mb-1"
                    style={{
                      backgroundColor: `${currentTheme.accentPrimary}15`,
                      borderColor: `${currentTheme.accentPrimary}30`,
                      color: currentTheme.accentPrimary,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-serif-luxury text-2xl sm:text-3xl font-black text-current tracking-tight">
                    {stat.number}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-current opacity-90">
                    {stat.label}
                  </div>
                  <div className="text-[11px] opacity-65 leading-tight">
                    {stat.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. ABOUT SECTION: PROFILE STORY & PHILOSOPHY */}
        {/* ============================================================ */}
        <section id="tentang" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Visual Emblem & Branding Card */}
            <div className="lg:col-span-5 space-y-6">
              <div
                className={`p-8 rounded-3xl ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} backdrop-blur-2xl shadow-2xl text-center relative overflow-hidden`}
              >
                <div className="w-32 h-32 mx-auto rounded-3xl p-3 bg-white shadow-xl border border-white/60 mb-6 flex items-center justify-center">
                  <img
                    src={RC_LOGO_IMAGE}
                    alt="Rainbow Candy Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="font-serif-luxury text-2xl font-bold text-current">
                  Rainbow Candy (RC)
                </h3>
                <p className="text-xs font-mono tracking-widest uppercase opacity-70 mt-1 mb-4">
                  Collaboration & Creative Family
                </p>

                <div className="p-4 rounded-2xl bg-white/5 border border-current/10 text-left space-y-3 text-xs leading-relaxed opacity-85">
                  <p>
                    <strong className="text-current">🌈 Rainbow (Pelangi):</strong> Simbol keberagaman warna vokal, spektrum genre musik, dan keunikan tiap kepribadian yang dipadukan menjadi keindahan utuh.
                  </p>
                  <p>
                    <strong className="text-current">🍬 Candy (Permen):</strong> Lambang keramahan, kebersamaan yang manis, serta atmosfer hangat yang selalu memberikan kebahagiaan dan tawa bagi setiap member.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-current/10 flex items-center justify-between text-[11px] opacity-75">
                  <span>Berdiri & Berkreasi</span>
                  <span className="font-bold text-current">Komunitas Musik Resmi</span>
                </div>
              </div>
            </div>

            {/* Right: Narrative Story */}
            <div className="lg:col-span-7 space-y-6">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider font-mono"
                style={{
                  backgroundColor: `${currentTheme.accentPrimary}15`,
                  borderColor: `${currentTheme.accentPrimary}35`,
                  color: currentTheme.accentPrimary,
                }}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Mengenal Fams Rainbow Candy</span>
              </div>

              <h2 className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-current leading-tight">
                Membangun Komunitas Musik yang Hangat, Inklusif, dan Berprestasi.
              </h2>

              <p className="text-sm sm:text-base opacity-85 leading-relaxed font-light">
                <strong>Rainbow Candy (RC)</strong> didirikan atas dasar kecintaan yang sama terhadap seni tarik suara, ekspresi musikalitas, dan kerinduan akan ruang berkarya yang sehat. Di tengah dinamika panggung virtual dan platform karaoke streaming, Rainbow Candy hadir sebagai oasis kekeluargaan yang mengedepankan etika, kenyamanan, dan apresiasi tulus.
              </p>

              <p className="text-sm sm:text-base opacity-85 leading-relaxed font-light">
                Bagi kami, bernyanyi bukan sekadar memproduksi nada, melainkan jembatan untuk menyatukan hati, mengekspresikan cerita, dan menyebarkan getaran positif. Setiap anggota keluarga kami—baik pemula yang baru belajar maupun vokalis berpengalaman—diberikan panggung dan dukungan yang setara untuk bersinar.
              </p>

              {/* Bullet Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-3.5 rounded-xl bg-white/5 border border-current/10 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <strong className="block text-current font-bold">Wadah Eksplorasi Vokal</strong>
                    <span className="opacity-75">Mendukung segala genre: Pop, Dangdut, Rock, Jazz, hingga Balada.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-current/10 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <strong className="block text-current font-bold">Manajemen Event Profesional</strong>
                    <span className="opacity-75">Sistem kompetisi, dewan juri transparan, dan rekapitulasi nilai digital.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-current/10 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <strong className="block text-current font-bold">Suasana Tanpa Toxic</strong>
                    <span className="opacity-75">Komitmen teguh pada rasa hormat, bebas drama, dan kehangatan persahabatan.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-current/10 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <strong className="block text-current font-bold">Jaringan Kolaborasi Luas</strong>
                    <span className="opacity-75">Menjalin hubungan persaudaraan erat dengan berbagai family dan komunitas lain.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. VISI, MISI & NILAI UTAMA (CORE VALUES) */}
        {/* ============================================================ */}
        <section id="visi-misi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider font-mono"
              style={{
                backgroundColor: `${currentTheme.accentPrimary}15`,
                borderColor: `${currentTheme.accentPrimary}35`,
                color: currentTheme.accentPrimary,
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Prinsip & Nilai Fundamental</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-black text-current">
              Visi, Misi & Nilai Komunitas
            </h2>
            <p className="text-sm opacity-80 max-w-xl mx-auto">
              Komitmen kami dalam merawat keluarga besar Rainbow Candy dan menyuguhkan wadah bermusik berkelas.
            </p>
          </div>

          {/* Visi & Misi Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Visi */}
            <div
              className={`p-8 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} backdrop-blur-xl shadow-xl space-y-4 relative overflow-hidden`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-serif-luxury text-2xl font-bold text-current">
                Visi Rainbow Candy
              </h3>
              <p className="text-sm opacity-85 leading-relaxed">
                Menjadi komunitas keluarga musik dan wadah kolaborasi vokal virtual nomor satu yang inspiratif, bermartabat, dan terpercaya dalam menumbuhkan potensi anggota serta melahirkan karya-karya vokal berkesan.
              </p>
            </div>

            {/* Misi */}
            <div
              className={`p-8 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} backdrop-blur-xl shadow-xl space-y-4 relative overflow-hidden`}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-serif-luxury text-2xl font-bold text-current">
                Misi Rainbow Candy
              </h3>
              <ul className="text-sm opacity-85 space-y-2.5 leading-relaxed list-disc list-inside">
                <li>Memfasilitasi ruang belajar, jamming, dan apresiasi vokal yang santun dan suportif.</li>
                <li>Menyelenggarakan kompetisi musik yang adil, transparan, dan menjunjung standar etika.</li>
                <li>Menjaga ikatan persaudaraan internal dan memperluas sinergi persahabatan antar-fams.</li>
              </ul>
            </div>
          </div>

          {/* 4 Core Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} backdrop-blur-xl shadow-lg space-y-3 relative hover:translate-y-[-4px] transition-transform duration-300`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: `${val.color}18`,
                      borderColor: `${val.color}40`,
                      color: val.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif-luxury text-lg font-bold text-current">
                    {val.title}
                  </h4>
                  <p className="text-xs opacity-80 leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. PROGRAMS & ACTIVITIES */}
        {/* ============================================================ */}
        <section id="program" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider font-mono"
              style={{
                backgroundColor: `${currentTheme.accentPrimary}15`,
                borderColor: `${currentTheme.accentPrimary}35`,
                color: currentTheme.accentPrimary,
              }}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Dinamika & Kegiatan Komunitas</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-black text-current">
              Program & Aktivitas Unggulan
            </h2>
            <p className="text-sm opacity-80 max-w-xl mx-auto">
              Dari sesi santai harian hingga panggung kejuaraan akbar, Rainbow Candy selalu menghadirkan ruang ekspresi terbaik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`p-7 rounded-3xl ${currentTheme.cardBg} border-2 ${
                    item.highlight ? currentTheme.cardBorder : 'border-current/10'
                  } backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center border"
                        style={{
                          backgroundColor: `${currentTheme.accentPrimary}18`,
                          borderColor: `${currentTheme.accentPrimary}35`,
                          color: currentTheme.accentPrimary,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border"
                        style={{
                          backgroundColor: item.highlight ? '#F59E0B20' : `${currentTheme.accentPrimary}10`,
                          borderColor: item.highlight ? '#F59E0B60' : `${currentTheme.accentPrimary}25`,
                          color: item.highlight ? '#F59E0B' : 'inherit',
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider opacity-60">
                        {item.category}
                      </span>
                      <h3 className="font-serif-luxury text-xl font-bold text-current mt-0.5">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm opacity-80 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>

                  {item.highlight ? (
                    <div className="pt-3 border-t border-current/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-400">
                        Pendaftaran Dibuka Sekarang
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateToEvent()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold hover:scale-105 transition-transform cursor-pointer shadow-md"
                      >
                        <span>Lihat Informasi Event</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. EVENT SPOTLIGHT (DEDICATED CTA SECTION) — dynamic from CMS */}
        {/* ============================================================ */}
        {spotlightEvent && (
        <section id="event-highlight" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            className={`p-8 sm:p-12 rounded-3xl ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} ${currentTheme.cardGlow} backdrop-blur-2xl shadow-2xl relative overflow-hidden`}
          >
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider font-mono mx-auto"
                style={{
                  backgroundColor: `${currentTheme.accentPrimary}15`,
                  borderColor: `${currentTheme.accentPrimary}35`,
                  color: currentTheme.accentPrimary,
                }}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Panggung Utama Rainbow Candy</span>
              </div>

              <h2 className="font-serif-luxury text-3xl sm:text-5xl font-black text-current">
                {spotlightEvent.title}
              </h2>

              {spotlightEvent.subtitle && (
                <p className="text-sm sm:text-base opacity-70 font-medium max-w-2xl mx-auto">
                  {spotlightEvent.subtitle}
                </p>
              )}

              <p className="text-sm sm:text-base opacity-85 leading-relaxed font-light max-w-2xl mx-auto">
                {spotlightEvent.description}
              </p>

              {/* Podium Prize Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-current/10">
                  <div className="text-amber-400 font-bold text-xs">🥇 Juara 1</div>
                  <div className="font-mono font-black text-lg text-current">{spotlightEvent.prizes.juara1}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-current/10">
                  <div className="text-slate-300 font-bold text-xs">🥈 Juara 2</div>
                  <div className="font-mono font-black text-lg text-current">{spotlightEvent.prizes.juara2}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-current/10">
                  <div className="text-amber-700 font-bold text-xs">🥉 Juara 3</div>
                  <div className="font-mono font-black text-lg text-current">{spotlightEvent.prizes.juara3}</div>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  type="button"
                  onClick={() => onNavigateToEvent()}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-400/30 hover:shadow-amber-400/50 hover:scale-105 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Buka Landing Page Event & Informasi Lengkap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {spotlightEvent.status === 'open' && (
                <button
                  type="button"
                  onClick={() => onNavigateToEvent({ scrollTo: 'daftar' })}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-current/25 hover:border-current/50 hover:bg-white/5 text-current font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Music className="w-4 h-4" />
                  <span>Daftar Sekarang ({spotlightEvent.maxParticipants} Peserta)</span>
                </button>
                )}
              </div>
            </div>
          </div>
        </section>
        )}

        {/* ============================================================ */}
        {/* 8. STRUCTURE & LEADERSHIP */}
        {/* ============================================================ */}
        <section id="struktur" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider font-mono"
              style={{
                backgroundColor: `${currentTheme.accentPrimary}15`,
                borderColor: `${currentTheme.accentPrimary}35`,
                color: currentTheme.accentPrimary,
              }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Struktur & Divisi Komunitas</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-black text-current">
              Kepengurusan Rainbow Candy
            </h2>
            <p className="text-sm opacity-80 max-w-xl mx-auto">
              Dikelola secara terstruktur dan profesional demi kenyamanan, transparansi, serta keberlanjutan seluruh anggota keluarga.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {teamRoles.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} backdrop-blur-xl shadow-lg space-y-3 text-center flex flex-col items-center`}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border mb-1"
                    style={{
                      backgroundColor: `${currentTheme.accentPrimary}15`,
                      borderColor: `${currentTheme.accentPrimary}30`,
                      color: currentTheme.accentPrimary,
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif-luxury text-base font-bold text-current">
                    {item.role}
                  </h4>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    {item.title}
                  </div>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Dynamic Members & Talents Showcase from Database */}
          <div className="pt-8 border-t border-current/10">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: `${currentTheme.accentPrimary}15`,
                  borderColor: `${currentTheme.accentPrimary}30`,
                  color: currentTheme.accentPrimary,
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>Direktori Member Resmi ({members.filter((m) => m.isActive).length} Anggota)</span>
              </div>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-current">
                Keluarga & Talenta Rainbow Candy
              </h3>
              <p className="text-xs sm:text-sm opacity-75">
                Para penyanyi, pengurus, dan talenta vokal yang terdaftar resmi dalam naungan Rainbow Candy Fams.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members
                .filter((m) => m.isActive)
                .map((member) => {
                  const tierColors: Record<string, string> = {
                    founder: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
                    captain: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                    core: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                    vip: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    regular: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                  };
                  const tierBadge = tierColors[member.tier] || tierColors.regular;

                  return (
                    <div
                      key={member.id}
                      className={`p-4 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} backdrop-blur-xl shadow-md flex items-start gap-3.5 transition-all hover:scale-[1.02]`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-current/20 shadow-sm bg-slate-800">
                        {member.avatar && (member.avatar.startsWith('http') || member.avatar.startsWith('/')) ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-amber-400 text-xl">
                            {member.avatar && !member.avatar.startsWith('http') && !member.avatar.startsWith('/')
                              ? member.avatar
                              : member.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-semibold text-sm text-current truncate">
                            {member.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border shrink-0 ${tierBadge}`}>
                            {member.tier}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
                          <span>@{member.nickname}</span>
                          {member.familyTitle && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className="text-current/75 truncate text-[11px]">{member.familyTitle}</span>
                            </>
                          )}
                        </div>

                        {member.bio && (
                          <p className="text-[11px] opacity-70 line-clamp-2 leading-relaxed">
                            {member.bio}
                          </p>
                        )}

                        {member.achievements && member.achievements.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {member.achievements.slice(0, 2).map((ach, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-current/80 border border-current/10 truncate max-w-[130px]"
                              >
                                🏆 {ach}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 9. JOIN & CONTACT SECTION */}
        {/* ============================================================ */}
        <section id="kontak" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            className={`p-8 sm:p-12 rounded-3xl ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} backdrop-blur-2xl shadow-2xl relative overflow-hidden`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider font-mono"
                  style={{
                    backgroundColor: `${currentTheme.accentPrimary}15`,
                    borderColor: `${currentTheme.accentPrimary}35`,
                    color: currentTheme.accentPrimary,
                  }}
                >
                  <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
                  <span>Jadilah Bagian dari Kami</span>
                </div>

                <h2 className="font-serif-luxury text-3xl sm:text-4xl font-black text-current">
                  Tertarik Bergabung Menjadi Anggota Rainbow Candy?
                </h2>

                <p className="text-sm opacity-85 leading-relaxed font-light">
                  Pintu keluarga Rainbow Candy selalu terbuka lebar untuk kamu yang memiliki kecintaan pada musik, ingin mengasah kemampuan olah suara, dan mencari lingkungan pertemanan virtual yang positif, suportif, serta saling menghargai.
                </p>

                <div className="space-y-2 pt-2 text-xs opacity-85">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Menjaga sopan santun, adab ruang suara, dan saling menghormati.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Aktif meramaikan room kebersamaan dan kegiatan berkala fams.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Terbuka untuk semua genre vokal tanpa membedakan latar belakang.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-current/10 space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="font-serif-luxury text-lg font-bold text-current">
                    Hubungi Admin & Official CP
                  </h4>
                  <p className="text-xs opacity-70 mt-0.5">
                    Konsultasi pendaftaran anggota & informasi event
                  </p>
                </div>

                <a
                  href={CONTACT_PERSON_WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-emerald-600/30"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp: {CONTACT_PERSON_WA}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <p className="text-[11px] opacity-60">
                  Respon cepat & ramah via WhatsApp Resmi Rainbow Candy
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================ */}
      {/* 10. PROFILE FOOTER */}
      {/* ============================================================ */}
      <footer className={`border-t border-current/10 ${currentTheme.cardBg} backdrop-blur-2xl py-12 relative z-10 transition-colors mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 border-b border-current/10">
            {/* Brand emblem */}
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div
                className="w-12 h-12 rounded-2xl p-1 flex items-center justify-center shadow-md shrink-0 bg-white border border-white/40 overflow-hidden"
                style={{
                  boxShadow: `0 0 12px ${currentTheme.accentPrimary}25`,
                }}
              >
                <img
                  src={RC_LOGO_IMAGE}
                  alt="Rainbow Candy Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <p className="font-serif-luxury text-lg font-bold text-current">
                  Rainbow Candy (RC) Family
                </p>
                <p className="text-xs opacity-70">
                  Official Community & Collaboration Portal
                </p>
              </div>
            </div>

            {/* Links & CTA */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onNavigateToEvent()}
                className="px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold hover:bg-amber-400/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Masuk ke Halaman Event 2026</span>
              </button>

              <a
                href={CONTACT_PERSON_WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>CP: {CONTACT_PERSON_WA}</span>
              </a>

              {onOpenAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 cursor-pointer transition-opacity"
                  title="RC Management Portal"
                >
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Portal Internal</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-65 text-center sm:text-left">
            <p>
              © 2026 Rainbow Candy (RC) Collaboration. Hak cipta dilindungi undang-undang.
            </p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <span>Kembali ke Atas</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
