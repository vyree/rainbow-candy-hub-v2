import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Key,
  Shield,
  Smile,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../types/participant';
import { saveAdminUser } from '../../services/supabaseClient';
import { saveStoredAdminSession } from '../../utils/sessionHelper';

interface AdminAccountSettingsTabProps {
  currentUser: AdminUser;
  onUpdateCurrentUser: (user: AdminUser) => void;
}

const AVATAR_OPTIONS = ['👑', '🎙️', '🎵', '🔥', '✨', '🌟', '📋', '🎧', '👁️', '🎤', '🏆', '💎', '🦁', '⭐', '🎸', '🎹'];

export const AdminAccountSettingsTab: React.FC<AdminAccountSettingsTabProps> = ({
  currentUser,
  onUpdateCurrentUser,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '👤');
  const [password, setPassword] = useState(currentUser.password || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const roleLabels: Record<AdminRole, { title: string; color: string; desc: string }> = {
    superadmin: {
      title: 'SUPER ADMINISTRATOR',
      color: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      desc: 'Memiliki kewenangan tertinggi untuk mengelola seluruh sistem, penentuan juara, dan hak akses user.',
    },
    juri: {
      title: 'DEWAN JURI AUDIO',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      desc: 'Bertugas memberikan skor penilaian audio mandiri pada 4 aspek kriteria vokal.',
    },
    panitia: {
      title: 'ADMIN REGISTRASI & PESERTA',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      desc: 'Mengelola validasi pendaftaran peserta, konfirmasi WhatsApp, dan nomor urut tampil.',
    },
    stage_mgr: {
      title: 'STAGE COORDINATOR',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      desc: 'Mengatur rundown panggung langsung, nomor giliran tampil, dan sinkronisasi live performa.',
    },
    viewer: {
      title: 'EVENT MONITOR & VIEWER',
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      desc: 'Akses khusus pemantauan papan peserta, rekapitulasi, dan jalannya acara secara realtime.',
    },
  };

  const currentRoleInfo = roleLabels[currentUser.role] || roleLabels.panitia;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validation
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Nama akun tidak boleh kosong.' });
      return;
    }
    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Username tidak boleh kosong.' });
      return;
    }
    if (newPassword && newPassword.length < 4) {
      setStatusMessage({ type: 'error', text: 'Password baru minimal 4 karakter.' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setIsSaving(true);

    try {
      const finalPassword = newPassword.trim() ? newPassword.trim() : (password || 'rc-admin-2026');

      const updatedUser: AdminUser = {
        ...currentUser,
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        email: email.trim(),
        avatar: avatar,
        password: finalPassword,
      };

      const res = await saveAdminUser(updatedUser, `${currentUser.name} (Self Profile Update)`);

      if (res.success) {
        onUpdateCurrentUser(updatedUser);
        saveStoredAdminSession(updatedUser);
        if (newPassword) {
          setPassword(newPassword);
          setNewPassword('');
          setConfirmPassword('');
        }
        setStatusMessage({
          type: 'success',
          text: 'Profil dan pengaturan akun Anda berhasil disimpan ke database Supabase!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal menyimpan pembaruan profil ke database.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan sistem saat memperbarui profil.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-xl">
        <div>
          <h2 className="font-serif-luxury text-2xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-400" />
            <span>Pengaturan Akun & Profil Pribadi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sesuaikan nama tampilan, username login, password keamanan, dan avatar profil Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <Radio className="w-3 h-3 animate-pulse" />
            Supabase DB Synced
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/40 border-red-500/40 text-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <p className="text-xs font-semibold">{statusMessage.text}</p>
        </motion.div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Non-Sensitive Identifiers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4" />
            <span>Identitas Akun & Tampilan</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar Selector */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-amber-400" />
                <span>Pilih Avatar Profil Emoji</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner mr-2">
                  {avatar}
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                        avatar === emoji
                          ? 'bg-amber-400 text-slate-950 scale-110 shadow-md shadow-amber-400/30 font-bold ring-2 ring-amber-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Nama Tampilan / Penilai <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Dewan Juri 1 (Nama Anda)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                required
              />
              <p className="text-[11px] text-slate-500">
                Nama ini akan muncul pada papan dewan juri, laporan rekapitulasi, dan audit log.
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Username Login <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-xs text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cth: juri1"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Digunakan untuk masuk / login ke dashboard sistem.
              </p>
            </div>

            {/* Email Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Alamat Email Kontak (Opsional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cth: juri1@rc-collab.id"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Security & Password */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
            <Key className="w-4 h-4" />
            <span>Keamanan & Ubah Password</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Password Saat Ini</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password aktif Anda"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Password Baru (Isi jika ingin mengganti)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

            {/* Confirm New Password */}
            {newPassword && (
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Ulangi Password Baru <span className="text-amber-400">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru Anda"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  required={!!newPassword}
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Protected Role & System Permission (Protected - Non Editable by Standard Users) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Hak Akses & Role Akun (Protected)</span>
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
              Terkunci (Sensitif)
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${currentRoleInfo.color}`}>
                {currentRoleInfo.title}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {currentUser.id}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentRoleInfo.desc}
            </p>
            <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-500 italic flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-400/70" />
              <span>Perubahan hak akses / role akun hanya dapat dilakukan oleh Super Administrator melalui menu <strong>Kelola Akun & Roles</strong>.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Menyimpan ke Database...' : 'Simpan Pembaruan Akun'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
