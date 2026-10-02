import React from 'react';
import {
  LogOut,
  Home,
  Shield,
  Activity,
  Users,
  Award,
  FileText,
  Settings,
  Radio,
  Lock,
  UserCheck,
  Calendar,
  Sparkles,
  Archive,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../types/participant';
import { RC_LOGO_IMAGE } from '../../assets/logo';

export type AdminTabId =
  | 'overview'
  | 'events'
  | 'fams'
  | 'participants'
  | 'scoring'
  | 'roles'
  | 'reports'
  | 'history'
  | 'settings'
  | 'account';

interface AdminHeaderProps {
  currentUser: AdminUser;
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  onLogout: () => void;
  onGoToLanding: () => void;
  totalParticipants: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  onGoToLanding,
  totalParticipants,
}) => {
  // Define full list of all navigation tabs
  const allNavItems = [
    { id: 'overview' as const, label: 'Overview', icon: Activity, roles: ['superadmin', 'viewer'] },
    { id: 'events' as const, label: 'CMS Event', icon: Calendar, roles: ['superadmin', 'panitia', 'stage_mgr', 'viewer'] },
    { id: 'fams' as const, label: 'CMS Fams & Member', icon: Sparkles, roles: ['superadmin', 'panitia', 'viewer'] },
    { id: 'participants' as const, label: 'Data Peserta', icon: Users, badge: totalParticipants, roles: ['panitia', 'superadmin', 'stage_mgr', 'viewer'] },
    { id: 'scoring' as const, label: 'Penilaian Juri', icon: Award, roles: ['juri', 'superadmin'] },
    { id: 'roles' as const, label: 'Kelola Akun & Roles', icon: Shield, roles: ['superadmin'] },
    { id: 'reports' as const, label: 'Laporan & Rekap', icon: FileText, roles: ['superadmin', 'viewer', 'juri'] },
    { id: 'history' as const, label: 'Riwayat Event', icon: Archive, roles: ['superadmin', 'viewer', 'panitia'] },
    { id: 'settings' as const, label: 'Pengaturan Event', icon: Settings, roles: ['superadmin'] },
    { id: 'account' as const, label: 'Profil Saya', icon: UserCheck, roles: ['superadmin', 'juri', 'panitia', 'stage_mgr', 'viewer'] },
  ];

  // Filter navigation items strictly based on currentUser.role
  const authorizedNavItems = allNavItems.filter((item) => item.roles.includes(currentUser.role));

  const roleBadges: Record<AdminRole, { title: string; color: string; desc: string }> = {
    superadmin: {
      title: 'SUPERADMIN',
      color: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      desc: 'Kelola Akun & Pengaturan Sistem',
    },
    juri: {
      title: 'DEWAN JURI',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      desc: 'Lembar Penilaian Audio & Rekap Laporan',
    },
    panitia: {
      title: 'REGISTRASI',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      desc: 'Registrasi & Data Peserta',
    },
    stage_mgr: {
      title: 'STAGE MGR',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      desc: 'Panggung & Urutan Tampil',
    },
    viewer: {
      title: 'VIEWER',
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      desc: 'Monitor Live & Hasil Lomba',
    },
  };

  const currentRoleBadge = roleBadges[currentUser.role] || roleBadges.panitia;

  return (
    <header className="bg-slate-950/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl shadow-2xl shadow-black/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2 sm:gap-4">
          {/* Left Brand / Logo & Event Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-white/40 overflow-hidden shrink-0">
              <img
                src={RC_LOGO_IMAGE}
                alt="Rainbow Candy"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif-luxury font-black text-slate-100 text-sm sm:text-base truncate">
                  RC Admin Center
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Radio className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
                  <span className="hidden xs:inline">DB</span> Live
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
                Virgo Party 2026 • Realtime Supabase
              </p>
            </div>
          </div>

          {/* Right Controls: User Profile Badge, Home & Logout Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* User Profile Pill */}
            <button
              type="button"
              onClick={() => onSelectTab('account')}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/40 transition-all text-left cursor-pointer group shrink-0"
              title="Klik untuk Edit Profil & Password Anda"
            >
              <span className="text-base sm:text-lg group-hover:scale-110 transition-transform shrink-0">
                {currentUser.avatar}
              </span>
              <div className="text-left hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors max-w-[85px] sm:max-w-[120px] truncate">
                    {currentUser.name}
                  </p>
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${currentRoleBadge.color}`}
                  >
                    {currentRoleBadge.title}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 truncate max-w-[140px] hidden md:block">
                  {currentRoleBadge.desc}
                </p>
              </div>
            </button>

            {/* Landing Page Link */}
            <button
              type="button"
              onClick={onGoToLanding}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Buka Landing Page Utama"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden md:inline">Landing</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium border border-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Keluar / Logout"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar with Touch-Friendly Scroll */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none -mx-1 px-1">
          {authorizedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono shrink-0 ${
                      isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
