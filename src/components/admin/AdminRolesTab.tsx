import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  UserCheck,
  UserX,
  Plus,
  KeyRound,
  Lock,
  CheckCircle,
  X,
  Sparkles,
  Award,
  Users,
  Settings,
  Edit3,
  Trash2,
  AlertTriangle,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Check,
  Eye,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../types/participant';
import {
  fetchAdminUsers,
  saveAdminUser,
  deleteAdminUser,
  subscribeToAdminUsers,
  getLocalAdminUsers,
  addAuditLog,
} from '../../services/supabaseClient';
import { saveStoredAdminSession } from '../../utils/sessionHelper';

interface AdminRolesTabProps {
  currentUser: AdminUser;
  onUpdateCurrentUser?: (user: AdminUser) => void;
}

export const AdminRolesTab: React.FC<AdminRolesTabProps> = ({
  currentUser,
  onUpdateCurrentUser,
}) => {
  const [users, setUsers] = useState<AdminUser[]>(getLocalAdminUsers());
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminUser | null>(null);

  // Load and subscribe to admin users from Supabase
  useEffect(() => {
    fetchAdminUsers().then((res) => setUsers(res.data));
    const unsubscribe = subscribeToAdminUsers((updated) => setUsers(updated));
    return () => unsubscribe();
  }, []);

  // Form states for Add / Edit
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('panitia');
  const [roleTitle, setRoleTitle] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [isActive, setIsActive] = useState(true);

  const emojiOptions = ['👑', '📋', '🎙️', '🎵', '🔥', '✨', '⚡', '👤', '🎧', '🎸', '🎹', '🌟', '👁️'];

  const roleConfigs: Record<
    AdminRole,
    { title: string; color: string; desc: string; permissions: string[] }
  > = {
    superadmin: {
      title: 'Super Administrator',
      color: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      desc: 'Akses penuh ke kelola akun & roles, pengaturan panggung/event, reset database, dan rekap nilai.',
      permissions: [
        'Kelola Akun & Roles (RBAC)',
        'Pengaturan Panggung & Event',
        'Rekap & Export Nilai',
        'Tinjau Lembar Dewan Juri',
        'Audit Log Aktivitas',
      ],
    },
    juri: {
      title: 'Dewan Juri Vokal',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      desc: 'Akses lembar penilaian audio (Teknikalitas, Kemiripan Idola, Penjiwaan, Presentasi Audio) dan Rekapitulasi Laporan.',
      permissions: [
        'Input & Edit Lembar Nilai Audio',
        'Akses Link Audio Minus-One',
        'Lihat Status Nilai Mandiri',
        'Catatan Teknis Vokal',
        'Akses Menu Laporan & Rekapitulasi',
      ],
    },
    panitia: {
      title: 'Admin Registrasi',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      desc: 'Akses khusus data peserta lomba, validasi WhatsApp, verifikasi judul lagu/idola, dan nomor urut tampil.',
      permissions: [
        'CRUD Data Peserta',
        'Verifikasi Kontak WhatsApp',
        'Atur Nomor Urut Tampil',
        'Filter & Search Peserta',
      ],
    },
    stage_mgr: {
      title: 'Stage Coordinator',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      desc: 'Pengaturan rundown panggung, status peserta tampil, dan kelancaran alur performa.',
      permissions: [
        'Lihat Antrean Peserta',
        'Kontrol Status Live Panggung',
        'Urutkan Rundown Tampil',
      ],
    },
    viewer: {
      title: 'Event Monitor & Viewer',
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      desc: 'Akses monitor hasil lomba, papan peserta, dan jalannya acara secara realtime.',
      permissions: [
        'Lihat Live Board Peserta',
        'Lihat Status Panggung',
        'Lihat Hasil Penilaian (Read-only)',
      ],
    },
  };

  const handleToggleActive = async (target: AdminUser) => {
    if (target.id === currentUser.id) {
      alert('Anda tidak dapat menonaktifkan akun yang sedang aktif digunakan.');
      return;
    }
    const updatedUser = { ...target, isActive: !target.isActive };
    await saveAdminUser(updatedUser, currentUser.name);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setEmail('');
    setRole('panitia');
    setRoleTitle(roleConfigs.panitia.title);
    setPassword('rc-2026');
    setAvatar('👤');
    setIsActive(true);
    setIsAddUserOpen(true);
  };

  const handleOpenEdit = (target: AdminUser) => {
    setEditingUser(target);
    setUsername(target.username);
    setName(target.name);
    setEmail(target.email || '');
    setRole(target.role);
    setRoleTitle(target.roleTitle || roleConfigs[target.role].title);
    setPassword(''); // leave blank if unchanged
    setAvatar(target.avatar || '👤');
    setIsActive(target.isActive !== false);
    setIsAddUserOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
      alert('Mohon lengkapi username dan nama.');
      return;
    }

    if (!editingUser && !password.trim()) {
      alert('Mohon masukkan password untuk akun baru.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check username uniqueness if creating new or changed username
    const usernameTaken = users.some(
      (u) => u.username.toLowerCase() === cleanUsername && (!editingUser || u.id !== editingUser.id)
    );

    if (usernameTaken) {
      alert(`Username @${cleanUsername} sudah digunakan. Silakan gunakan username lain.`);
      return;
    }

    if (editingUser) {
      // Update existing user
      const updatedUser: AdminUser = {
        ...editingUser,
        username: cleanUsername,
        name: name.trim(),
        email: email.trim() || `${cleanUsername}@rc-collab.id`,
        role,
        roleTitle: roleTitle.trim() || roleConfigs[role].title,
        avatar: avatar || '👤',
        isActive,
        ...(password.trim() ? { password: password.trim() } : {}),
      };

      await saveAdminUser(updatedUser, currentUser.name);

      // If user edited their own profile, update session
      if (editingUser.id === currentUser.id) {
        saveStoredAdminSession(updatedUser);
        if (onUpdateCurrentUser) {
          onUpdateCurrentUser(updatedUser);
        }
      }
    } else {
      // Create new user
      const newUser: AdminUser = {
        id: `usr-${Date.now().toString(36)}`,
        username: cleanUsername,
        name: name.trim(),
        email: email.trim() || `${cleanUsername}@rc-collab.id`,
        role,
        roleTitle: roleTitle.trim() || roleConfigs[role].title,
        avatar: avatar || '👤',
        password: password.trim(),
        isActive,
        lastLogin: undefined,
      };

      await saveAdminUser(newUser, currentUser.name);
    }

    setIsAddUserOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteCandidate) return;
    if (deleteCandidate.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      setDeleteCandidate(null);
      return;
    }

    await deleteAdminUser(deleteCandidate.id, currentUser.name);
    setDeleteCandidate(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-luxury text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <span>Manajemen Akun & Hak Akses (Roles & RBAC)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Superadmin dapat mengedit akun, mengubah roles, mengatur kata sandi, dan membatasi izin akses setiap divisi.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Role Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(roleConfigs) as AdminRole[]).map((rKey) => {
          const cfg = roleConfigs[rKey];
          const count = users.filter((u) => u.role === rKey).length;
          return (
            <div
              key={rKey}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${cfg.color}`}>
                    {cfg.title}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">{count} akun</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-light">{cfg.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-mono font-bold">
                  Hak Akses Terbuka:
                </p>
                <div className="flex flex-wrap gap-1">
                  {cfg.permissions.map((p, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 font-mono"
                    >
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Accounts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif-luxury font-bold text-slate-100 text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Daftar Akun Pengguna Panel & Roles</span>
            </h3>
            <p className="text-xs text-slate-400">
              Klik tombol <strong>Edit</strong> untuk mengganti peran, status akses, atau memperbarui kata sandi petugas.
            </p>
          </div>
          <span className="text-xs text-amber-300 font-mono px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
            {users.length} Akun Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Username & Email</th>
                <th className="py-3.5 px-4">Role & Hak Akses</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Login Terakhir</th>
                <th className="py-3.5 px-4 text-right">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                const roleCfg = roleConfigs[u.role] || roleConfigs.panitia;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1 rounded-xl bg-slate-950 border border-slate-800">
                          {u.avatar || '👤'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.2 rounded border border-amber-400/20">
                                (Akun Anda)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">{u.roleTitle || roleCfg.title}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <p className="text-slate-200 font-semibold">@{u.username}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${roleCfg.color}`}>
                        {roleCfg.title}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                          u.isActive !== false
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {u.isActive !== false ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit Akun & Roles"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Roles</span>
                        </button>

                        {/* Toggle Active */}
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              u.isActive !== false
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                            }`}
                            title={u.isActive !== false ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            {u.isActive !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Delete Button */}
                        {!isSelf && (
                          <button
                            onClick={() => setDeleteCandidate(u)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition-colors cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT ADMIN USER */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div>
                  <h3 className="font-serif-luxury font-bold text-lg text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span>{editingUser ? 'Edit Akun & Hak Akses (Roles)' : 'Tambah Akun Petugas / Juri'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingUser
                      ? `Ubah peran dan perizinan akses untuk @${editingUser.username}`
                      : 'Buat kredensial login dan tetapkan hak akses role.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Lengkap Petugas / Juri *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="cth: Dewan Juri 1 (Vokal & Teknik)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Username & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Username Login *
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="cth: juri1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Petugas
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="petugas@rc-collab.id"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tingkat Peran & Akses (Role Level) *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value as AdminRole;
                      setRole(newRole);
                      setRoleTitle(roleConfigs[newRole].title);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-semibold"
                  >
                    <option value="panitia">Admin Registrasi (Hanya Akses Data Peserta)</option>
                    <option value="juri">Dewan Juri Vokal (Penilaian Audio & Rekap Laporan)</option>
                    <option value="superadmin">Super Administrator (Akses Penuh Kelola Akun & Event)</option>
                    <option value="stage_mgr">Stage Coordinator (Akses Rundown & Panggung)</option>
                    <option value="viewer">Event Monitor & Viewer (Akses Live Board & Monitor)</option>
                  </select>
                </div>

                {/* Role Description & Permissions Preview Box */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">
                      Hak Akses untuk Role: {roleConfigs[role].title}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full border ${roleConfigs[role].color}`}>
                      {role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{roleConfigs[role].desc}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {roleConfigs[role].permissions.map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                      >
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Custom Role Title & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Label Jabatan Kustom
                    </label>
                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="cth: Dewan Juri 1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status Akun
                    </label>
                    <select
                      value={isActive ? 'active' : 'inactive'}
                      onChange={(e) => setIsActive(e.target.value === 'active')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="active">Aktif (Dapat Login)</option>
                      <option value="inactive">Nonaktif (Diblokir)</option>
                    </select>
                  </div>
                </div>

                {/* Avatar Emoji Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pilih Emoji Avatar
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {emojiOptions.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setAvatar(em)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          avatar === em
                            ? 'bg-amber-400 text-slate-950 scale-110 shadow-md shadow-amber-400/20'
                            : 'bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {editingUser ? 'Ganti Kata Sandi (Kosongkan jika tidak diubah)' : 'Password Akses *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? '•••••••• (Biarkan kosong untuk password lama)' : '••••••••'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {/* Submit buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    {editingUser ? 'Simpan Perubahan Akun & Role' : 'Buat Akun Sekarang'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-base text-slate-100">
                    Hapus Akun Pengguna?
                  </h3>
                  <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <p className="text-slate-200 font-bold">
                  {deleteCandidate.name} (@{deleteCandidate.username})
                </p>
                <p className="text-slate-400 font-mono text-[11px]">Role: {deleteCandidate.roleTitle || deleteCandidate.role}</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-500/20"
                >
                  Ya, Hapus Akun
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
