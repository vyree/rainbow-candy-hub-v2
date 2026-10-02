import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Trophy, Music, Users, Menu, X, Star, Image as ImageIcon, Download, FileText, ShieldCheck, ArrowLeft } from 'lucide-react';
import { ThemeConfig, ThemeId, THEMES } from '../types/theme';
import { RC_LOGO_IMAGE } from '../assets/logo';

interface HeaderProps {
  currentTheme: ThemeConfig;
  onSelectTheme: (themeId: ThemeId) => void;
  onOpenRules?: () => void;
  onOpenTermsModal?: () => void;
  onOpenPosterModal?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToEventsList?: () => void;
  eventTitle?: string;
  isEventEnded?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onSelectTheme,
  onOpenRules,
  onOpenTermsModal,
  onOpenPosterModal,
  onNavigateToProfile,
  onNavigateToEventsList,
  eventTitle,
  isEventEnded = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Hadiah', href: '#hadiah', icon: Trophy },
    ...(!isEventEnded ? [{ label: 'Pendaftaran', href: '#daftar', icon: Music }] : []),
    { label: 'Peserta', href: '#peserta', icon: Users },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 ${currentTheme.headerBg} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Title */}
          <div
            onClick={onNavigateToProfile ? onNavigateToProfile : undefined}
            className="flex items-center gap-3 group cursor-pointer"
            title="Klik untuk melihat Profil Fams Rainbow Candy"
          >
            <div
              className="w-12 h-12 rounded-2xl p-1 flex items-center justify-center shadow-md relative overflow-hidden transition-transform duration-300 group-hover:scale-105 bg-white border border-white/40"
              style={{
                boxShadow: `0 0 16px ${currentTheme.accentPrimary}30`,
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-serif-luxury text-lg sm:text-xl font-bold tracking-tight text-current">
                  Rainbow Candy
                </span>
                <span
                  className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border max-w-[130px] sm:max-w-none truncate"
                  style={{
                    backgroundColor: isEventEnded ? '#a855f720' : `${currentTheme.accentPrimary}18`,
                    borderColor: isEventEnded ? '#a855f750' : `${currentTheme.accentPrimary}40`,
                    color: isEventEnded ? '#c084fc' : currentTheme.accentPrimary,
                  }}
                >
                  {eventTitle ? eventTitle : 'Virgo Party'}
                </span>
                {isEventEnded && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    ENDED
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-75 font-medium flex items-center gap-1">
                <Star className="w-2.5 h-2.5 inline" style={{ color: currentTheme.accentPrimary }} />
                RC Birthday Celebration • 13 Sept 2026
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {onNavigateToProfile && (
              <button
                type="button"
                onClick={onNavigateToProfile}
                className="px-3 py-2 rounded-lg text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Halaman Profil Rainbow Candy"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Profil Fams</span>
              </button>
            )}

            {onNavigateToEventsList && (
              <button
                type="button"
                onClick={onNavigateToEventsList}
                className="px-3 py-2 rounded-lg text-xs font-bold text-pink-300 hover:text-pink-200 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Katalog Seluruh Event RC"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Katalog Event</span>
              </button>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-current/80 hover:text-current hover:bg-white/5 transition-colors flex items-center gap-1.5"
                >
                  <Icon className="w-4 h-4 opacity-70" />
                  <span>{link.label}</span>
                </a>
              );
            })}

            {/* Syarat & Ketentuan Button */}
            {onOpenTermsModal && (
              <button
                type="button"
                onClick={onOpenTermsModal}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-current/90 hover:text-current hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer border border-current/20 hover:border-current/40"
                title="Lihat Syarat & Ketentuan Lomba"
              >
                <FileText className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
                <span>Syarat & Ketentuan</span>
              </button>
            )}

            {/* Poster Event Button */}
            {onOpenPosterModal && (
              <button
                type="button"
                onClick={onOpenPosterModal}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-current/90 hover:text-current hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer border border-current/20 hover:border-current/40"
              >
                <ImageIcon className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
                <span>Poster Event</span>
              </button>
            )}

            {/* Quick Theme Selector Dropdown / Inline pills */}
            <div className="ml-2 pl-3 border-l border-current/15 flex items-center gap-1.5">
              {(['dark-virgo-gold', 'rose-blush', 'midnight-violet'] as ThemeId[]).map((tid) => {
                const isSelected = currentTheme.id === tid;
                const t = THEMES[tid];
                return (
                  <button
                    key={tid}
                    onClick={() => onSelectTheme(tid)}
                    title={`Ganti tema: ${t.name}`}
                    className={`w-6 h-6 rounded-full transition-transform duration-200 border ${
                      isSelected ? 'scale-110 ring-2' : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
                      borderColor: isSelected ? t.accentPrimary : 'transparent',
                    }}
                  />
                );
              })}
            </div>

            {/* CTA Button */}
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#daftar"
              className={`ml-3 px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all shadow-md ${currentTheme.accentButton}`}
            >
              Daftar Sekarang
            </motion.a>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-current/20 text-current hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`md:hidden px-4 pt-2 pb-6 border-t border-current/10 ${currentTheme.cardBg} backdrop-blur-2xl`}
        >
          <div className="flex flex-col gap-2 pt-2">
            {onNavigateToProfile && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToProfile();
                }}
                className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-left w-full cursor-pointer mb-1 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>← Kembali ke Profil Fams</span>
              </button>
            )}
            {onNavigateToEventsList && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToEventsList();
                }}
                className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 bg-pink-500/15 border border-pink-500/30 text-pink-300 text-left w-full cursor-pointer mb-1 shadow-sm"
              >
                <Calendar className="w-4 h-4 text-pink-400" />
                <span>Katalog Event Fams</span>
              </button>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5"
                >
                  <Icon className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
                  <span>{link.label}</span>
                </a>
              );
            })}

            {/* Syarat & Ketentuan Mobile Button */}
            {onOpenTermsModal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTermsModal();
                }}
                className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5 text-left w-full cursor-pointer border border-current/15"
              >
                <FileText className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
                <span>Syarat & Ketentuan (S&K)</span>
              </button>
            )}

            {onOpenPosterModal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPosterModal();
                }}
                className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5 text-left w-full cursor-pointer border border-current/15"
              >
                <Download className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
                <span>Download Poster Event (HD)</span>
              </button>
            )}

            <div className="pt-3 border-t border-current/10 mt-2">
              <p className="text-xs uppercase tracking-wider opacity-70 mb-2 font-mono">Pilih Suasana:</p>
              <div className="grid grid-cols-3 gap-2">
                {(['dark-virgo-gold', 'rose-blush', 'midnight-violet'] as ThemeId[]).map((tid) => {
                  const t = THEMES[tid];
                  const isSelected = currentTheme.id === tid;
                  return (
                    <button
                      key={tid}
                      onClick={() => {
                        onSelectTheme(tid);
                        setMobileMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl text-center border text-xs font-bold transition-all ${
                        isSelected ? `${currentTheme.badgeBg} ${currentTheme.badgeBorder}` : 'border-white/10'
                      }`}
                      style={{ color: isSelected ? currentTheme.accentPrimary : 'inherit' }}
                    >
                      {t.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            <a
              href="#daftar"
              onClick={() => setMobileMenuOpen(false)}
              className={`mt-4 w-full py-3 text-center rounded-xl text-sm font-bold uppercase tracking-wider ${currentTheme.accentButton}`}
            >
              Daftar Lomba Sekarang
            </a>
          </div>
        </motion.div>
      )}
    </header>
  );
};

