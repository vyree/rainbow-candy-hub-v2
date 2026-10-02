import React from 'react';
import { Sparkles, Calendar, Clock, Trophy, ArrowUp, Download, Image as ImageIcon, Phone, MessageCircle, FileText, Lock } from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { RC_LOGO_IMAGE, CONTACT_PERSON_WA, CONTACT_PERSON_WA_LINK } from '../assets/logo';

interface FooterProps {
  currentTheme: ThemeConfig;
  onOpenPosterModal?: () => void;
  onOpenTermsModal?: () => void;
  onOpenAdmin?: () => void;
  onNavigateToProfile?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ currentTheme, onOpenPosterModal, onOpenTermsModal, onOpenAdmin, onNavigateToProfile }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={`border-t border-current/10 ${currentTheme.cardBg} backdrop-blur-2xl py-12 relative z-10 transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 border-b border-current/10">
          {/* Brand Info */}
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div
              className="w-12 h-12 rounded-2xl p-1 flex items-center justify-center shadow-md shrink-0 bg-white border border-white/40 overflow-hidden"
              style={{
                boxShadow: `0 0 12px ${currentTheme.accentPrimary}25`,
              }}
            >
              <img
                src={RC_LOGO_IMAGE}
                alt="Rainbow Candy Official"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="font-serif-luxury text-lg font-bold text-current">
                Rainbow Candy (RC) • Virgo Party
              </p>
              <p className="text-xs opacity-70">
                Event Nyanyi Mirip Idola • 13 September 2026, 10:00 WIB
              </p>
            </div>
          </div>

          {/* Contact Person & Quick Links */}
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap justify-center">
            {/* WhatsApp Contact Person Badge */}
            <a
              href={CONTACT_PERSON_WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Hubungi Admin CP WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Info & CP: <strong>{CONTACT_PERSON_WA}</strong></span>
            </a>

            <div className="flex items-center gap-3">
              {onNavigateToProfile && (
                <>
                  <button
                    type="button"
                    onClick={onNavigateToProfile}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    Profil Fams RC
                  </button>
                  <span className="opacity-30">•</span>
                </>
              )}
              <a
                href="#hadiah"
                className="text-xs font-semibold opacity-75 hover:opacity-100 transition-opacity"
              >
                Hadiah
              </a>
              <span className="opacity-30">•</span>
              <a
                href="#daftar"
                className="text-xs font-semibold opacity-75 hover:opacity-100 transition-opacity"
              >
                Pendaftaran
              </a>
              <span className="opacity-30">•</span>
              <a
                href="#peserta"
                className="text-xs font-semibold opacity-75 hover:opacity-100 transition-opacity"
              >
                Peserta
              </a>
              {onOpenTermsModal && (
                <>
                  <span className="opacity-30">•</span>
                  <button
                    type="button"
                    onClick={onOpenTermsModal}
                    className="text-xs font-bold text-current opacity-90 hover:opacity-100 flex items-center gap-1 transition-opacity cursor-pointer underline decoration-current/40 underline-offset-4"
                  >
                    <FileText className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                    <span>Syarat & Ketentuan</span>
                  </button>
                </>
              )}
              {onOpenPosterModal && (
                <>
                  <span className="opacity-30">•</span>
                  <button
                    type="button"
                    onClick={onOpenPosterModal}
                    className="text-xs font-bold text-current opacity-90 hover:opacity-100 flex items-center gap-1 transition-opacity cursor-pointer underline decoration-current/40 underline-offset-4"
                  >
                    <Download className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
                    <span>Poster Event</span>
                  </button>
                </>
              )}
              <button
                onClick={scrollToTop}
                className="ml-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-current transition-colors cursor-pointer"
                title="Kembali ke atas"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-65 text-center sm:text-left">
          <p>© 2026 Rainbow Candy (RC Collaboration). All rights reserved.</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-medium tracking-wide">Designed by Noir</span>
            {onOpenAdmin && (
              <button
                id="btn-footer-admin-portal"
                type="button"
                onClick={onOpenAdmin}
                className="opacity-40 hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-current cursor-pointer"
                title="Admin / Juri Portal"
                aria-label="Admin Portal"
              >
                <Lock className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
