export type ThemeId = 'dark-virgo-gold' | 'rose-blush' | 'midnight-violet';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  tagline: string;
  isDark: boolean;
  bgClass: string;
  bgStyle: {
    backgroundColor: string;
    backgroundImage?: string;
  };
  cardBg: string;
  cardBorder: string;
  cardGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentGradient: string;
  accentButton: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  metallicBorder: string;
  shadowGlow: string;
  frameBorder: string;
  inputBg: string;
  inputBorder: string;
  headerBg: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'dark-virgo-gold': {
    id: 'dark-virgo-gold',
    name: 'Dark Virgo Gold',
    subtitle: 'Modern Luxury',
    tagline: 'Exclusive, high-fashion, nocturnal',
    isDark: true,
    bgClass: 'bg-[#0A0F1D] text-[#FDFBF7]',
    bgStyle: {
      backgroundColor: '#0A0F1D',
      backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(224, 169, 109, 0.12), transparent 70%), radial-gradient(circle at 100% 80%, rgba(244, 224, 165, 0.06), transparent 50%)',
    },
    cardBg: 'bg-[#11192E]/80 backdrop-blur-xl',
    cardBorder: 'border-[#F4E0A5]/25 hover:border-[#F4E0A5]/50',
    cardGlow: 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
    textPrimary: 'text-[#FDFBF7]',
    textSecondary: 'text-[#E0A96D]',
    textMuted: 'text-slate-400',
    accentPrimary: '#F4E0A5',
    accentSecondary: '#E0A96D',
    accentGradient: 'from-[#F4E0A5] via-[#E0A96D] to-[#C98A4B]',
    accentButton: 'bg-gradient-to-r from-[#F4E0A5] via-[#E0A96D] to-[#C98A4B] text-[#0A0F1D] font-bold shadow-[0_0_25px_rgba(244,224,165,0.35)] hover:shadow-[0_0_35px_rgba(244,224,165,0.6)]',
    badgeBg: 'bg-[#F4E0A5]/10',
    badgeBorder: 'border-[#F4E0A5]/30',
    badgeText: 'text-[#F4E0A5]',
    metallicBorder: 'border-[#F4E0A5]/35',
    shadowGlow: 'rgba(244, 224, 165, 0.25)',
    frameBorder: 'from-[#F4E0A5] via-[#E0A96D] to-[#996515]',
    inputBg: 'bg-[#0A0F1D]/80',
    inputBorder: 'border-[#F4E0A5]/30 focus:border-[#F4E0A5]',
    headerBg: 'bg-[#0A0F1D]/85 backdrop-blur-md border-b border-[#F4E0A5]/15',
  },
  'rose-blush': {
    id: 'rose-blush',
    name: 'Rose Blush',
    subtitle: 'Soft & Sweet Feminine',
    tagline: 'Sweet, gentle, warm celebration',
    isDark: false,
    bgClass: 'bg-[#FFF5F6] text-[#2D1522]',
    bgStyle: {
      backgroundColor: '#FFF5F6',
      backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(243, 197, 208, 0.45), transparent 70%), radial-gradient(circle at 90% 70%, rgba(224, 82, 117, 0.08), transparent 45%)',
    },
    cardBg: 'bg-white/85 backdrop-blur-xl',
    cardBorder: 'border-[#F3C5D0] hover:border-[#E05275]/50',
    cardGlow: 'shadow-[0_10px_35px_rgba(224,82,117,0.08)]',
    textPrimary: 'text-[#2D1522]',
    textSecondary: 'text-[#E05275]',
    textMuted: 'text-[#8E6C79]',
    accentPrimary: '#E05275',
    accentSecondary: '#D98880',
    accentGradient: 'from-[#E05275] via-[#E7718F] to-[#D98880]',
    accentButton: 'bg-gradient-to-r from-[#E05275] via-[#E7718F] to-[#D98880] text-white font-bold shadow-[0_0_25px_rgba(224,82,117,0.3)] hover:shadow-[0_0_35px_rgba(224,82,117,0.5)]',
    badgeBg: 'bg-[#E05275]/10',
    badgeBorder: 'border-[#F3C5D0]',
    badgeText: 'text-[#E05275]',
    metallicBorder: 'border-[#F3C5D0]',
    shadowGlow: 'rgba(224, 82, 117, 0.2)',
    frameBorder: 'from-[#E05275] via-[#F3C5D0] to-[#D98880]',
    inputBg: 'bg-white/90',
    inputBorder: 'border-[#F3C5D0] focus:border-[#E05275]',
    headerBg: 'bg-[#FFF5F6]/90 backdrop-blur-md border-b border-[#F3C5D0]',
  },
  'midnight-violet': {
    id: 'midnight-violet',
    name: 'Midnight Violet',
    subtitle: 'Glamour Night',
    tagline: 'Festive, magnetic, vibrant party night',
    isDark: true,
    bgClass: 'bg-[#0F0A1C] text-[#F7EEFE]',
    bgStyle: {
      backgroundColor: '#0F0A1C',
      backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255, 83, 145, 0.16), transparent 70%), radial-gradient(circle at 10% 80%, rgba(212, 175, 55, 0.1), transparent 50%)',
    },
    cardBg: 'bg-[#18112D]/80 backdrop-blur-xl',
    cardBorder: 'border-[rgba(235,120,200,0.3)] hover:border-[rgba(235,120,200,0.6)]',
    cardGlow: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    textPrimary: 'text-[#F7EEFE]',
    textSecondary: 'text-[#FF5391]',
    textMuted: 'text-[#B8A7CF]',
    accentPrimary: '#FF5391',
    accentSecondary: '#D4AF37',
    accentGradient: 'from-[#FF5391] via-[#E040FB] to-[#D4AF37]',
    accentButton: 'bg-gradient-to-r from-[#FF5391] via-[#E040FB] to-[#D4AF37] text-white font-bold shadow-[0_0_25px_rgba(255,83,145,0.4)] hover:shadow-[0_0_35px_rgba(255,83,145,0.7)]',
    badgeBg: 'bg-[#FF5391]/15',
    badgeBorder: 'border-[#FF5391]/35',
    badgeText: 'text-[#FF5391]',
    metallicBorder: 'border-[rgba(235,120,200,0.35)]',
    shadowGlow: 'rgba(255, 83, 145, 0.3)',
    frameBorder: 'from-[#FF5391] via-[#D4AF37] to-[#8A2BE2]',
    inputBg: 'bg-[#130C24]/90',
    inputBorder: 'border-[rgba(235,120,200,0.35)] focus:border-[#FF5391]',
    headerBg: 'bg-[#0F0A1C]/90 backdrop-blur-md border-b border-[rgba(235,120,200,0.2)]',
  },
};

/**
 * Resolves the default theme based on the day of the week:
 * - Senin (Monday / 1) or Kamis (Thursday / 4): 'dark-virgo-gold'
 * - Selasa (Tuesday / 2) or Jumat (Friday / 5): 'rose-blush'
 * - Rabu (Wednesday / 3) or Sabtu (Saturday / 6): 'midnight-violet'
 * - Selain hari di atas (Minggu / Sunday / 0): Random / acak di antara 3 tema
 */
export function getDefaultThemeByDay(): ThemeId {
  const day = new Date().getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday

  // Senin (1) atau Kamis (4) -> Dark Virgo Gold
  if (day === 1 || day === 4) {
    return 'dark-virgo-gold';
  }

  // Selasa (2) atau Jumat (5) -> Rose Blush
  if (day === 2 || day === 5) {
    return 'rose-blush';
  }

  // Rabu (3) atau Sabtu (6) -> Midnight Violet
  if (day === 3 || day === 6) {
    return 'midnight-violet';
  }

  // Selain hari di atas (Minggu / 0) -> Acak / Random
  const allThemes: ThemeId[] = ['dark-virgo-gold', 'rose-blush', 'midnight-violet'];
  const randomIndex = Math.floor(Math.random() * allThemes.length);
  return allThemes[randomIndex];
}

