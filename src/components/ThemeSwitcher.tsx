import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sparkles, Moon, Sun, Check, ChevronUp } from 'lucide-react';
import { ThemeId, THEMES, ThemeConfig } from '../types/theme';

interface ThemeSwitcherProps {
  currentTheme: ThemeConfig;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onSelectTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const themeList: { id: ThemeId; name: string; subtitle: string; schedule: string; color: string; border: string }[] = [
    {
      id: 'dark-virgo-gold',
      name: 'Dark Virgo Gold',
      subtitle: 'Modern Luxury',
      schedule: 'Senin & Kamis',
      color: 'from-[#F4E0A5] via-[#E0A96D] to-[#0A0F1D]',
      border: 'border-[#F4E0A5]',
    },
    {
      id: 'rose-blush',
      name: 'Rose Blush',
      subtitle: 'Soft & Sweet Feminine',
      schedule: 'Selasa & Jumat',
      color: 'from-[#E05275] via-[#F3C5D0] to-[#FFF5F6]',
      border: 'border-[#E05275]',
    },
    {
      id: 'midnight-violet',
      name: 'Midnight Violet',
      subtitle: 'Glamour Night',
      schedule: 'Rabu & Sabtu',
      color: 'from-[#FF5391] via-[#D4AF37] to-[#0F0A1C]',
      border: 'border-[#FF5391]',
    },
  ];

  return (
    <aside aria-label="Theme Controller" className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-none select-none">
      {/* Popout Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`pointer-events-auto mb-3 p-3.5 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} ${currentTheme.cardGlow} shadow-2xl w-68 sm:w-72 max-w-[calc(100vw-24px)] backdrop-blur-2xl`}
          >
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Pilih Suasana (3 Tema)
                </span>
              </div>
              <span className="text-[10px] font-mono opacity-60">Virgo Mode</span>
            </div>

            <div className="space-y-2">
              {themeList.map((t) => {
                const isActive = currentTheme.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                      isActive
                        ? `${currentTheme.badgeBg} border ${currentTheme.badgeBorder} shadow-sm`
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Theme preview dot with gradient */}
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.color} p-[1px] shadow-sm flex items-center justify-center shrink-0 border ${
                          isActive ? t.border : 'border-white/20'
                        }`}
                      >
                        <div className="w-full h-full rounded-[7px] bg-black/40 flex items-center justify-center">
                          {isActive && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-xs font-semibold ${
                              isActive ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                            }`}
                          >
                            {t.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 opacity-80">
                          {t.subtitle} • <span className="opacity-90">{t.schedule}</span>
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${currentTheme.accentPrimary}22`,
                          color: currentTheme.accentPrimary,
                        }}
                      >
                        Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full ${currentTheme.cardBg} border ${currentTheme.cardBorder} shadow-2xl backdrop-blur-xl group cursor-pointer`}
        style={{
          boxShadow: `0 8px 30px ${currentTheme.shadowGlow}`,
        }}
        title="Ganti Tema Tampilan (3 Pilihan Tema)"
      >
        <div
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.accentPrimary}, ${currentTheme.accentSecondary})`,
          }}
        >
          <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-950 font-bold" />
        </div>
        <div className="text-left pr-0.5 hidden xs:block">
          <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider opacity-70 leading-none">
            Tema
          </p>
          <p className="text-[11px] sm:text-xs font-bold leading-tight mt-0.5 max-w-[90px] sm:max-w-[120px] truncate" style={{ color: currentTheme.accentPrimary }}>
            {currentTheme.name}
          </p>
        </div>
        <ChevronUp
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>
    </aside>
  );
};
