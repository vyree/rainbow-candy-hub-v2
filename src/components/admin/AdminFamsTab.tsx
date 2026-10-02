import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Sparkles,
  Heart,
  Award,
  Trophy,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Phone,
  Link,
  ShieldCheck,
  Music,
  Smile,
  Zap,
  Calendar,
  Layers,
  Check,
  X,
  ExternalLink,
  Radio,
  Headphones,
  Flame,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  FamsProfileData,
  FamsMember,
  MemberDepartment,
  MemberTier,
  INITIAL_FAMS_PROFILE,
  INITIAL_FAMS_MEMBERS,
} from '../../types/fams';
import {
  fetchFamsProfile,
  saveFamsProfile,
  fetchFamsMembers,
  saveFamsMembers,
} from '../../services/famsService';
import { AdminUser } from '../../types/participant';

interface AdminFamsTabProps {
  currentUser: AdminUser;
}

type FamsSubTab = 'profile' | 'values_programs' | 'members';

const EMOJI_AVATARS = ['👑', '🎙️', '✨', '🌸', '🎧', '🔥', '💎', '⭐', '🌟', '🎸', '🎤', '🌈'];

export const AdminFamsTab: React.FC<AdminFamsTabProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<FamsSubTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fams Profile State
  const [profile, setProfile] = useState<FamsProfileData>(INITIAL_FAMS_PROFILE);

  // Fams Members State
  const [members, setMembers] = useState<FamsMember[]>(INITIAL_FAMS_MEMBERS);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  // Modal Member Edit / Create
  const [editingMember, setEditingMember] = useState<FamsMember | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<Partial<FamsMember>>({
    name: '',
    nickname: '',
    role: '',
    department: 'vocalist',
    tier: 'vip',
    avatar: '🎙️',
    bio: '',
    joinDate: new Date().toISOString().split('T')[0],
    achievements: [],
    isActive: true,
  });
  const [achievementInput, setAchievementInput] = useState('');

  // Load from Supabase on mount
  const loadFamsData = async () => {
    setLoading(true);
    try {
      const [resProfile, resMembers] = await Promise.all([
        fetchFamsProfile(),
        fetchFamsMembers(),
      ]);
      setProfile(resProfile.data);
      setMembers(resMembers.data);
    } catch (err: any) {
      console.warn('Error loading fams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamsData();
  }, []);

  const showNotification = (msg: string, isError: boolean = false) => {
    if (isError) {
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 4000);
    } else {
      setSaveSuccess(msg);
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  // Profile Save
  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await saveFamsProfile(profile, currentUser.name || currentUser.username);
      if (res.success) {
        showNotification('Profil Fams berhasil disimpan ke database Supabase!');
      } else {
        showNotification(res.error || 'Gagal menyimpan profil', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Terjadi kesalahan sistem', true);
    } finally {
      setSaving(false);
    }
  };

  // Add / Edit Member
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      nickname: '',
      role: '',
      department: 'vocalist',
      tier: 'vip',
      avatar: '🎙️',
      bio: '',
      joinDate: new Date().toISOString().split('T')[0],
      achievements: [],
      isActive: true,
      orderIndex: members.length + 1,
    });
    setAchievementInput('');
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: FamsMember) => {
    setEditingMember(member);
    setMemberForm({ ...member });
    setAchievementInput('');
    setIsMemberModalOpen(true);
  };

  const handleSaveMemberModal = async () => {
    if (!memberForm.name?.trim() || !memberForm.role?.trim()) {
      showNotification('Nama anggota dan peran/jabatan wajib diisi!', true);
      return;
    }

    setSaving(true);
    try {
      let updatedMembers: FamsMember[];
      if (editingMember) {
        updatedMembers = members.map((m) =>
          m.id === editingMember.id
            ? ({
                ...m,
                ...memberForm,
                name: memberForm.name!.trim(),
                role: memberForm.role!.trim(),
              } as FamsMember)
            : m
        );
      } else {
        const newMember: FamsMember = {
          id: 'mem-' + Date.now().toString(36),
          name: memberForm.name!.trim(),
          nickname: memberForm.nickname?.trim() || undefined,
          familyTitle: memberForm.familyTitle?.trim() || 'Anggota',
          division: memberForm.division?.trim() || 'Divisi Kreatif',
          role: memberForm.role!.trim(),
          department: (memberForm.department as MemberDepartment) || 'vocalist',
          tier: (memberForm.tier as MemberTier) || 'vip',
          avatar: memberForm.avatar || '🎙️',
          bio: memberForm.bio?.trim() || undefined,
          joinDate: memberForm.joinDate || new Date().toISOString().split('T')[0],
          achievements: memberForm.achievements || [],
          isActive: memberForm.isActive ?? true,
          orderIndex: members.length + 1,
        };
        updatedMembers = [...members, newMember];
      }

      setMembers(updatedMembers);
      setIsMemberModalOpen(false);

      const res = await saveFamsMembers(updatedMembers, currentUser.name || currentUser.username);
      if (res.success) {
        showNotification(
          editingMember
            ? `Data ${memberForm.name} berhasil diperbarui!`
            : `Anggota ${memberForm.name} berhasil ditambahkan!`
        );
      } else {
        showNotification(res.error || 'Gagal menyimpan anggota ke database', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal memproses data anggota', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (member: FamsMember) => {
    if (!window.confirm(`Yakin ingin menghapus ${member.name} dari daftar anggota Fams?`)) {
      return;
    }

    const updated = members.filter((m) => m.id !== member.id);
    setMembers(updated);
    setSaving(true);
    try {
      const res = await saveFamsMembers(updated, currentUser.name || currentUser.username);
      if (res.success) {
        showNotification(`Anggota ${member.name} berhasil dihapus.`);
      } else {
        showNotification(res.error || 'Gagal menghapus anggota', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menghapus', true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: FamsMember) => {
    const updated = members.map((m) =>
      m.id === member.id ? { ...m, isActive: !m.isActive } : m
    );
    setMembers(updated);
    await saveFamsMembers(updated, currentUser.name || currentUser.username);
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const copy = [...members];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // reindex
    const reindexed = copy.map((m, i) => ({ ...m, orderIndex: i + 1 }));
    setMembers(reindexed);
    await saveFamsMembers(reindexed, currentUser.name || currentUser.username);
  };

  // Mission list handlers
  const handleAddMission = () => {
    setProfile((prev) => ({
      ...prev,
      mission: [...prev.mission, 'Poin misi baru komunitas...'],
    }));
  };

  const handleUpdateMission = (index: number, val: string) => {
    const copy = [...profile.mission];
    copy[index] = val;
    setProfile((prev) => ({ ...prev, mission: copy }));
  };

  const handleDeleteMission = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      mission: prev.mission.filter((_, i) => i !== index),
    }));
  };

  // Program list handlers
  const handleAddProgram = () => {
    const newProg = {
      id: 'prog-' + Date.now().toString(36),
      title: 'Program Acara Baru',
      category: 'Kategori Acara',
      desc: 'Deskripsi singkat tentang kegiatan...',
      tag: 'Jadwal',
      iconName: 'Sparkles',
    };
    setProfile((prev) => ({
      ...prev,
      programs: [...prev.programs, newProg],
    }));
  };

  const handleUpdateProgram = (index: number, key: string, val: any) => {
    const copy = [...profile.programs];
    copy[index] = { ...copy[index], [key]: val };
    setProfile((prev) => ({ ...prev, programs: copy }));
  };

  const handleDeleteProgram = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      programs: prev.programs.filter((_, i) => i !== index),
    }));
  };

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const matchSearch =
      !memberSearch.trim() ||
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.nickname && m.nickname.toLowerCase().includes(memberSearch.toLowerCase())) ||
      m.role.toLowerCase().includes(memberSearch.toLowerCase());

    const matchDept = selectedDepartment === 'all' || m.department === selectedDepartment;
    const matchTier = selectedTier === 'all' || m.tier === selectedTier;

    return matchSearch && matchDept && matchTier;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-serif-luxury">
                  CMS Fams Profile & Anggota
                </h2>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola profil resmi Rainbow Candy, visi misi, aktivitas komunitas, dan data anggota terdaftar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadFamsData}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors border border-slate-700/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Muat Ulang
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{saveSuccess}</span>
            </motion.div>
          )}
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{saveError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800/80 pt-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            1. Profil & Visi Misi
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('values_programs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'values_programs'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            2. Statistik, Pilar & Aktivitas
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('members')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'members'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            3. Manajemen Anggota & Struktur ({members.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: PROFIL FAMS & VISI MISI */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Identitas Utama */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Identitas & Headline Profil
            </h3>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Nama Komunitas / Family
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                placeholder="cth: Rainbow Candy"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                placeholder="cth: Keluarga, Irama, dan Harmoni Nada"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Judul Utama Headline (Hero)
              </label>
              <textarea
                rows={2}
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                placeholder="cth: Komunitas Pecinta Musik & Panggung Talenta Vokal Nusantara"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Subheadline
              </label>
              <textarea
                rows={2}
                value={profile.subheadline}
                onChange={(e) => setProfile({ ...profile, subheadline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Deskripsi Lengkap Komunitas
              </label>
              <textarea
                rows={4}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Tahun Berdiri
                </label>
                <input
                  type="text"
                  value={profile.foundedYear || ''}
                  onChange={(e) => setProfile({ ...profile, foundedYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                  placeholder="cth: 2021"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Judul Filosofi
                </label>
                <input
                  type="text"
                  value={profile.philosophyTitle || ''}
                  onChange={(e) => setProfile({ ...profile, philosophyTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="cth: Filosofi Rainbow Candy"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Sejarah Komunitas
              </label>
              <textarea
                rows={3}
                value={profile.history || ''}
                onChange={(e) => setProfile({ ...profile, history: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                placeholder="Ceritakan sejarah berdirinya komunitas..."
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Filosofi Lengkap
              </label>
              <textarea
                rows={3}
                value={profile.philosophy || ''}
                onChange={(e) => setProfile({ ...profile, philosophy: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                placeholder="Makna filosofi komunitas secara lengkap..."
              />
            </div>
          </div>

          {/* Visi, Misi & Kontak */}
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Visi & Misi Komunitas
              </h3>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Visi Utama
                </label>
                <textarea
                  rows={3}
                  value={profile.vision}
                  onChange={(e) => setProfile({ ...profile, vision: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Poin-Poin Misi
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMission}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Poin
                  </button>
                </div>
                <div className="space-y-2">
                  {profile.mission.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-300 shrink-0 mt-1">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={m}
                        onChange={(e) => handleUpdateMission(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteMission(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kontak & Filosofi */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
                <Phone className="w-4 h-4 text-emerald-400" />
                Kontak & Komunikasi Family
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Nomor WhatsApp Admin
                  </label>
                  <input
                    type="text"
                    value={profile.contactWhatsapp}
                    onChange={(e) => setProfile({ ...profile, contactWhatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    placeholder="081263858085"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Nama Live Room
                  </label>
                  <input
                    type="text"
                    value={profile.communityRoomName || ''}
                    onChange={(e) => setProfile({ ...profile, communityRoomName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    placeholder="Live Room Utama Rainbow Candy"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Direct Link WhatsApp
                </label>
                <input
                  type="text"
                  value={profile.contactLink}
                  onChange={(e) => setProfile({ ...profile, contactLink: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                  placeholder="https://wa.me/6281263858085?text=..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={profile.instagramUrl || ''}
                    onChange={(e) => setProfile({ ...profile, instagramUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    YouTube URL
                  </label>
                  <input
                    type="text"
                    value={profile.youtubeUrl || ''}
                    onChange={(e) => setProfile({ ...profile, youtubeUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Milestones (JSON — daftar: year, title, desc)
                </label>
                <textarea
                  rows={4}
                  value={JSON.stringify(profile.milestones || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (Array.isArray(parsed)) setProfile({ ...profile, milestones: parsed });
                    } catch { /* ignore invalid JSON while typing */ }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                  placeholder='[{"year":"2021","title":"Berdiri","desc":"..."}]'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Social Links (JSON)
                  </label>
                  <textarea
                    rows={3}
                    value={JSON.stringify(profile.socialLinks || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (parsed && typeof parsed === 'object') setProfile({ ...profile, socialLinks: parsed });
                      } catch { /* ignore invalid JSON while typing */ }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    placeholder='{"tiktok":"https://..."}'
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Kontak Lain (JSON)
                  </label>
                  <textarea
                    rows={3}
                    value={JSON.stringify(profile.contacts || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (parsed && typeof parsed === 'object') setProfile({ ...profile, contacts: parsed });
                      } catch { /* ignore invalid JSON while typing */ }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    placeholder='{"email":"hello@..."}'
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Filosofi Candy & Makna Komunitas
                </label>
                <textarea
                  rows={3}
                  value={profile.philosophyDesc}
                  onChange={(e) => setProfile({ ...profile, philosophyDesc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: STATISTIK, PILAR & AKTIVITAS */}
      {activeSubTab === 'values_programs' && (
        <div className="space-y-6">
          {/* Statistik Counter */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Trophy className="w-4 h-4 text-amber-400" />
              Statistik Utama Fams
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {profile.stats.map((st, i) => (
                <div key={st.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Stat #{i + 1}</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Angka / Counter</label>
                    <input
                      type="text"
                      value={st.number}
                      onChange={(e) => {
                        const copy = [...profile.stats];
                        copy[i].number = e.target.value;
                        setProfile({ ...profile, stats: copy });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-amber-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Label</label>
                    <input
                      type="text"
                      value={st.label}
                      onChange={(e) => {
                        const copy = [...profile.stats];
                        copy[i].label = e.target.value;
                        setProfile({ ...profile, stats: copy });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Detail Keterangan</label>
                    <input
                      type="text"
                      value={st.detail}
                      onChange={(e) => {
                        const copy = [...profile.stats];
                        copy[i].detail = e.target.value;
                        setProfile({ ...profile, stats: copy });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Pilar Nilai Inti */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Heart className="w-4 h-4 text-rose-400" />
              Pilar Nilai Inti Komunitas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.coreValues.map((val, i) => (
                <div key={val.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">Pilar #{i + 1}</span>
                    <input
                      type="color"
                      value={val.color || '#E05275'}
                      onChange={(e) => {
                        const copy = [...profile.coreValues];
                        copy[i].color = e.target.value;
                        setProfile({ ...profile, coreValues: copy });
                      }}
                      className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Judul Pilar</label>
                    <input
                      type="text"
                      value={val.title}
                      onChange={(e) => {
                        const copy = [...profile.coreValues];
                        copy[i].title = e.target.value;
                        setProfile({ ...profile, coreValues: copy });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Penjelasan Nilai</label>
                    <textarea
                      rows={3}
                      value={val.desc}
                      onChange={(e) => {
                        const copy = [...profile.coreValues];
                        copy[i].desc = e.target.value;
                        setProfile({ ...profile, coreValues: copy });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Program & Aktivitas */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                Program & Kegiatan Komunitas ({profile.programs.length})
              </h3>
              <button
                type="button"
                onClick={handleAddProgram}
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Program
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.programs.map((prog, i) => (
                <div key={prog.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      Program #{i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-amber-400 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(prog.highlight)}
                          onChange={(e) => handleUpdateProgram(i, 'highlight', e.target.checked)}
                          className="rounded text-amber-400 focus:ring-0"
                        />
                        Highlight
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteProgram(i)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Judul Program</label>
                      <input
                        type="text"
                        value={prog.title}
                        onChange={(e) => handleUpdateProgram(i, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Kategori</label>
                      <input
                        type="text"
                        value={prog.category}
                        onChange={(e) => handleUpdateProgram(i, 'category', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Tag / Jadwal</label>
                      <input
                        type="text"
                        value={prog.tag}
                        onChange={(e) => handleUpdateProgram(i, 'tag', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                        placeholder="cth: Setiap Hari / Spesial"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Icon Style</label>
                      <select
                        value={prog.iconName || 'Music'}
                        onChange={(e) => handleUpdateProgram(i, 'iconName', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="Music">Music</option>
                        <option value="Headphones">Headphones</option>
                        <option value="Flame">Flame</option>
                        <option value="Sparkles">Sparkles</option>
                        <option value="Radio">Radio</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Deskripsi Kegiatan</label>
                    <textarea
                      rows={2}
                      value={prog.desc}
                      onChange={(e) => handleUpdateProgram(i, 'desc', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: MANAJEMEN MEMBER & STRUKTUR */}
      {activeSubTab === 'members' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Cari nama atau jabatan..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">Semua Departemen</option>
                <option value="leadership">Leadership & Founder</option>
                <option value="management">Management & Acara</option>
                <option value="creative">Creative & Audio</option>
                <option value="vocalist">Vokalis & Talent</option>
                <option value="member">Member Resmi</option>
              </select>

              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">Semua Tier</option>
                <option value="founder">Founder</option>
                <option value="captain">Captain</option>
                <option value="core">Core</option>
                <option value="vip">VIP</option>
                <option value="regular">Regular</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddMember}
              className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Anggota Baru
            </button>
          </div>

          {/* Members Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">Belum ada anggota yang cocok dengan filter</p>
                <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau tambah anggota baru</p>
              </div>
            ) : (
              filteredMembers.map((mem, idx) => (
                <div
                  key={mem.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    mem.isActive
                      ? 'bg-slate-900/70 border-slate-800 hover:border-amber-400/40'
                      : 'bg-slate-950/50 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {mem.avatar.startsWith('http') ? (
                          <img
                            src={mem.avatar}
                            alt={mem.name}
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          mem.avatar || '🎙️'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-100">{mem.name}</h4>
                          {mem.nickname && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({mem.nickname})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-400 font-semibold">{mem.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMember(mem)}
                        className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Edit Member"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(mem)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {mem.bio && (
                    <p className="text-xs text-slate-300/80 mt-2.5 line-clamp-2 leading-relaxed">
                      {mem.bio}
                    </p>
                  )}

                  {mem.achievements && mem.achievements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {mem.achievements.map((ach, aIdx) => (
                        <span
                          key={aIdx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20"
                        >
                          {ach}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          mem.tier === 'founder'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : mem.tier === 'captain'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : mem.tier === 'vip'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {mem.tier}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(mem)}
                        className={`text-[10px] font-semibold cursor-pointer ${
                          mem.isActive ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {mem.isActive ? '● Aktif' : '○ Non-aktif'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                        title="Geser ke Atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === filteredMembers.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                        title="Geser ke Bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT / TAMBAH MEMBER */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-serif-luxury">
                  <Users className="w-4 h-4 text-amber-400" />
                  {editingMember ? 'Edit Anggota Fams' : 'Tambah Anggota Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pilih Avatar / Emoji
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setMemberForm({ ...memberForm, avatar: emoji })}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer ${
                        memberForm.avatar === emoji
                          ? 'bg-amber-400/20 border-amber-400 scale-110'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={memberForm.avatar || ''}
                  onChange={(e) => setMemberForm({ ...memberForm, avatar: e.target.value })}
                  placeholder="Atau masukkan emoji / URL foto..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={memberForm.name || ''}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    placeholder="cth: Lord Noir"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Nama Panggilan / Nickname
                  </label>
                  <input
                    type="text"
                    value={memberForm.nickname || ''}
                    onChange={(e) => setMemberForm({ ...memberForm, nickname: e.target.value })}
                    placeholder="cth: Noir"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Jabatan / Peran di Fams *
                  </label>
                  <input
                    type="text"
                    value={memberForm.role || ''}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    placeholder="cth: Founder & Captain Fams"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Tier / Tingkatan
                  </label>
                  <select
                    value={memberForm.tier || 'vip'}
                    onChange={(e) => setMemberForm({ ...memberForm, tier: e.target.value as MemberTier })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="founder">Founder (Pendiri)</option>
                    <option value="captain">Captain (Pimpinan)</option>
                    <option value="core">Core (Pengurus Inti)</option>
                    <option value="vip">VIP (Member Spesial)</option>
                    <option value="regular">Regular (Anggota)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Departemen
                  </label>
                  <select
                    value={memberForm.department || 'vocalist'}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, department: e.target.value as MemberDepartment })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="leadership">Leadership</option>
                    <option value="management">Management & Acara</option>
                    <option value="creative">Creative & Audio</option>
                    <option value="vocalist">Vokalis & Panggung</option>
                    <option value="hospitality">Humas & Hospitality</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={memberForm.joinDate || ''}
                    onChange={(e) => setMemberForm({ ...memberForm, joinDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Bio Singkat
                </label>
                <textarea
                  rows={2}
                  value={memberForm.bio || ''}
                  onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                  placeholder="Karakter vokal, spesialisasi, atau peran dalam komunitas..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Achievements tags */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Prestasi / Tag Penghargaan
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={achievementInput}
                    onChange={(e) => setAchievementInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (achievementInput.trim()) {
                          setMemberForm({
                            ...memberForm,
                            achievements: [...(memberForm.achievements || []), achievementInput.trim()],
                          });
                          setAchievementInput('');
                        }
                      }
                    }}
                    placeholder="Ketik prestasi dan tekan Enter / Tambah..."
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (achievementInput.trim()) {
                        setMemberForm({
                          ...memberForm,
                          achievements: [...(memberForm.achievements || []), achievementInput.trim()],
                        });
                        setAchievementInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(memberForm.achievements || []).map((ach, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1"
                    >
                      {ach}
                      <button
                        type="button"
                        onClick={() =>
                          setMemberForm({
                            ...memberForm,
                            achievements: memberForm.achievements?.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-amber-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Aktif */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={memberForm.isActive ?? true}
                    onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.checked })}
                    className="rounded text-amber-400 focus:ring-0"
                  />
                  Status Anggota Aktif
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMemberModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMemberModal}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Anggota'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
