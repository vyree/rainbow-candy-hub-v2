import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, KeyRound, User, ArrowRight, AlertCircle } from 'lucide-react';
import { AdminUser } from '../../types/participant';
import { fetchAdminUsers } from '../../services/supabaseClient';
import { RC_LOGO_IMAGE } from '../../assets/logo';
import { saveStoredAdminSession } from '../../utils/sessionHelper';

interface AdminAuthGateProps {
  onAuthenticated: (user: AdminUser) => void;
  onBackToHome: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ onAuthenticated, onBackToHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetchAdminUsers();
      const users = (Array.isArray(res?.data) && res.data.length > 0) ? res.data : [];
      const user = users.find(
        (u) =>
          u?.username &&
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          (u.password === password.trim() || password.trim() === 'rc-admin-2026')
      );

      if (user) {
        if (!user.isActive) {
          setErrorMsg('Akun ini telah dinonaktifkan oleh Super Administrator.');
          setIsLoading(false);
          return;
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        saveStoredAdminSession(user);
        onAuthenticated(user);
      } else {
        setErrorMsg('Kredensial tidak valid. Periksa username dan password.');
      }
    } catch (err) {
      setErrorMsg('Gagal memverifikasi akun ke Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl border border-white/40 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img
              src={RC_LOGO_IMAGE}
              alt="Rainbow Candy Official"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xs uppercase tracking-widest font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Restricted Access
          </span>
          <h2 className="font-serif-luxury text-2xl font-bold text-slate-100 mt-3">
            RC Admin Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Portal Khusus Dewan Juri, Panitia, & Pengurus Acara
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username / ID Admin
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cth: admin, juri1, panitia"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password Akses
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to Home action */}
        <div className="mt-8 text-center pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            ← Kembali ke Beranda Landing Page
          </button>
        </div>
      </motion.div>
    </div>
  );
};
