import React, { useState, useEffect } from 'react';
import {
  Settings,
  Radio,
  Youtube,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Save,
  Volume2,
  Database,
  Copy,
  Check,
  Code2,
  Table,
  Link,
  RefreshCw,
} from 'lucide-react';
import { EventSettings, AdminUser } from '../../types/participant';
import {
  saveEventSettings,
  resetParticipantsToSeed,
  checkDatabaseTables,
} from '../../services/supabaseClient';

interface AdminSettingsTabProps {
  eventSettings: EventSettings;
  currentUser: AdminUser;
  onUpdateSettings: (settings: EventSettings) => void;
  onResetParticipants: () => void;
}

const SUPABASE_RELATIONAL_SCHEMA_SQL = `-- ==============================================================================
-- DATABASE SCHEMA: RAINBOW CANDY - BIRTHDAY CELEBRATION & VIRGO PARTY 2026
-- Supabase PostgreSQL Relational Schema with Scalability & Foreign Key Constraints
-- ==============================================================================

-- 1. TABEL PESERTA (participants)
CREATE TABLE IF NOT EXISTS public.participants (
    id TEXT PRIMARY KEY,
    idpopup INTEGER,
    full_name TEXT NOT NULL,
    family_name TEXT NOT NULL,
    idol_song TEXT NOT NULL,
    idol_artist TEXT,
    whatsapp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'canceled', 'disqualificated')),
    notes TEXT,
    audio_link TEXT,
    order_number INTEGER,
    total_score NUMERIC(5, 2) DEFAULT 0.0,
    winner_title TEXT,
    scores JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABEL PENILAIAN / SCORES (scores) - Terpisah dengan FOREIGN KEY
CREATE TABLE IF NOT EXISTS public.scores (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE ON UPDATE CASCADE,
    judge_id TEXT NOT NULL,
    judge_name TEXT NOT NULL,
    teknikalitas NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (teknikalitas >= 0.0 AND teknikalitas <= 30.0), -- Max 30%
    kemiripan NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (kemiripan >= 0.0 AND kemiripan <= 30.0),       -- Max 30%
    penjiwaan NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (penjiwaan >= 0.0 AND penjiwaan <= 20.0),       -- Max 20%
    presentasi NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (presentasi >= 0.0 AND presentasi <= 20.0),     -- Max 20%
    total NUMERIC(5, 1) NOT NULL DEFAULT 0.0 CHECK (total >= 0.0 AND total <= 100.0),                 -- Total Max 100.0
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_participant_judge UNIQUE (participant_id, judge_id)
);

-- Indexing for relational lookups
CREATE INDEX IF NOT EXISTS idx_scores_participant_id ON public.scores (participant_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON public.scores (judge_id);

-- Enable RLS & Realtime
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Allow public all on participants" ON public.participants FOR ALL USING (true);
CREATE POLICY "Allow public read on scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Allow public all on scores" ON public.scores FOR ALL USING (true);

-- 3. Judge Chat Real-time Messages Table
CREATE TABLE IF NOT EXISTS public.judge_chat_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'juri',
    sender_avatar TEXT DEFAULT '⚖️',
    message TEXT NOT NULL,
    participant_id TEXT,
    participant_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_judge_chat_created_at ON public.judge_chat_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_judge_chat_participant ON public.judge_chat_messages (participant_id);
ALTER TABLE public.judge_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on judge_chat_messages" ON public.judge_chat_messages FOR ALL USING (true);

-- 4. Multi-Event Catalog Table (events)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'ongoing', 'ended', 'upcoming')),
    start_date TEXT NOT NULL,
    end_date TEXT,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    max_participants INTEGER DEFAULT 50,
    registration_deadline TEXT NOT NULL,
    description TEXT NOT NULL,
    rules_summary JSONB DEFAULT '[]'::jsonb,
    poster_url TEXT,
    banner_url TEXT,
    prizes JSONB DEFAULT '{}'::jsonb,
    judges JSONB DEFAULT '[]'::jsonb,
    winners JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on events" ON public.events FOR ALL USING (true);

-- 5. Fams Profile Table (fams_profile)
CREATE TABLE IF NOT EXISTS public.fams_profile (
    id TEXT PRIMARY KEY DEFAULT 'rainbow_candy_official',
    name TEXT NOT NULL DEFAULT 'Rainbow Candy Fams',
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    founded_year INTEGER DEFAULT 2021,
    history TEXT,
    philosophy TEXT,
    vision TEXT,
    mission JSONB DEFAULT '[]'::jsonb,
    programs JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    contacts JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.fams_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on fams_profile" ON public.fams_profile FOR ALL USING (true);

-- 6. Fams Members Table (fams_members)
CREATE TABLE IF NOT EXISTS public.fams_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    family_title TEXT NOT NULL,
    division TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Member',
    avatar TEXT,
    bio TEXT,
    phone TEXT,
    email TEXT,
    instagram TEXT,
    join_date TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.fams_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on fams_members" ON public.fams_members FOR ALL USING (true);`;

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  eventSettings,
  currentUser,
  onUpdateSettings,
  onResetParticipants,
}) => {
  const [formData, setFormData] = useState<EventSettings>(eventSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [tableStatus, setTableStatus] = useState<Record<string, 'online' | 'missing'>>({});
  const [isCheckingTables, setIsCheckingTables] = useState(false);

  const refreshTableStatus = async () => {
    setIsCheckingTables(true);
    try {
      const res = await checkDatabaseTables();
      setTableStatus(res);
    } catch (e) {
      console.warn('Error checking tables:', e);
    } finally {
      setIsCheckingTables(false);
    }
  };

  useEffect(() => {
    refreshTableStatus();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEventSettings(formData, currentUser.name);
    onUpdateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetData = () => {
    resetParticipantsToSeed(currentUser.name);
    onResetParticipants();
    setShowResetConfirm(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_RELATIONAL_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="font-serif-luxury text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-400" />
          <span>Pengaturan Event & Panggung</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Atur jadwal, status pendaftaran publik, video teaser, dan kontrol babak lomba.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Resmi Acara
            </label>
            <input
              type="text"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lokasi / Venue Acara
            </label>
            <input
              type="text"
              value={formData.venueOrRoom}
              onChange={(e) => setFormData({ ...formData, venueOrRoom: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tanggal Pelaksanaan
            </label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Waktu Mulai Acara
            </label>
            <input
              type="text"
              value={formData.eventTime}
              onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
              placeholder="10:00 WIB"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Status Babak Lomba (Active Stage Round)
            </label>
            <select
              value={formData.activeRound}
              onChange={(e) => setFormData({ ...formData, activeRound: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="pre_event">Pre-Event (Pendaftaran Dibuka)</option>
              <option value="audisi_live">Audisi Live / Penampilan Berlangsung</option>
              <option value="scoring">Sesi Penilaian Dewan Juri</option>
              <option value="grand_final">Grand Final & Pengumuman Juara</option>
              <option value="completed">Event Selesai (Completed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Status Pendaftaran Publik (Form Landing Page)
            </label>
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={formData.isRegistrationOpen}
                  onChange={(e) => setFormData({ ...formData, isRegistrationOpen: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 rounded"
                />
                <span>Buka Formulir Pendaftaran Publik</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Youtube className="w-4 h-4 text-red-500" />
            <span>URL Video Teaser YouTube (16:9 Frame)</span>
          </label>
          <input
            type="url"
            value={formData.youtubeTeaserUrl}
            onChange={(e) => setFormData({ ...formData, youtubeTeaserUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Pengumuman Banner Berjalan (Broadcast Announcement)</span>
          </label>
          <textarea
            rows={2}
            value={formData.broadcastNotice}
            onChange={(e) => setFormData({ ...formData, broadcastNotice: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {isSaved ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pengaturan berhasil disimpan!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">Perubahan akan langsung aktif secara global.</span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Supabase Cloud Database Status & Relational Schema Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-emerald-500/20 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Struktur Database Relasional Supabase (Foreign Key)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tabel <strong>participants (Peserta)</strong> & <strong>scores (Penilaian Point-by-Point)</strong> dipisah dan dihubungkan secara relasional dengan <code>FOREIGN KEY (participant_id)</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showSqlPreview ? 'Tutup SQL' : 'Lihat SQL Schema'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySql}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Tersalin!' : 'Salin SQL Schema'}</span>
            </button>
          </div>
        </div>

        {/* Visual Relational Entity Schema Representation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Table 1: participants */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" />
                <span>Table: public.participants</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300">
                PRIMARY TABLE
              </span>
            </div>
            <ul className="text-[11px] font-mono text-slate-300 space-y-1">
              <li className="text-amber-300 font-semibold">🔑 id (TEXT, PRIMARY KEY)</li>
              <li>• idpopup (INTEGER)</li>
              <li>• full_name (TEXT NOT NULL)</li>
              <li>• family_name (TEXT NOT NULL)</li>
              <li>• idol_song (TEXT NOT NULL)</li>
              <li>• idol_artist (TEXT)</li>
              <li>• whatsapp (TEXT NOT NULL)</li>
              <li>• status (TEXT DEFAULT 'pending')</li>
              <li>• total_score (NUMERIC(5,2))</li>
              <li>• order_number (INTEGER)</li>
            </ul>
          </div>

          {/* Table 2: scores */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" />
                <span>Table: public.scores</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                POINT-BY-POINT DETAILS
              </span>
            </div>
            <ul className="text-[11px] font-mono text-slate-300 space-y-1">
              <li className="text-emerald-300 font-semibold">🔑 id (TEXT, PRIMARY KEY)</li>
              <li className="text-cyan-300 font-semibold flex items-center gap-1">
                <Link className="w-3 h-3 text-cyan-400" />
                <span>🔗 participant_id (FK → participants.id)</span>
              </li>
              <li>• judge_id (TEXT, e.g. 'usr-juri1')</li>
              <li>• judge_name (TEXT)</li>
              <li className="text-amber-200">🎯 teknikalitas (NUMERIC 0.0 - 30.0) [Vokal & Teknik]</li>
              <li className="text-amber-200">🎯 kemiripan (NUMERIC 0.0 - 30.0) [Kemiripan Idola]</li>
              <li className="text-amber-200">🎯 penjiwaan (NUMERIC 0.0 - 20.0) [Penghayatan]</li>
              <li className="text-amber-200">🎯 presentasi (NUMERIC 0.0 - 20.0) [Flow & Artikulasi]</li>
              <li className="text-emerald-400 font-bold">⭐ total (NUMERIC 0.0 - 100.0)</li>
              <li>• notes (TEXT, Feedback Juri)</li>
              <li>• submitted_at (TIMESTAMPTZ)</li>
            </ul>
          </div>
        </div>

        {/* SQL Schema Preview Collapsible */}
        {showSqlPreview && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">PostgreSQL Migration Script (Supabase SQL Editor):</span>
              <span className="text-[10px] font-mono text-emerald-400">Ready to execute in Supabase SQL Editor</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-64 overflow-y-auto leading-relaxed">
              {SUPABASE_RELATIONAL_SCHEMA_SQL}
            </pre>
          </div>
        )}

        {/* Live Database Tables Status Indicator */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Status Tabel Database Supabase (Live Check)</span>
            </span>
            <button
              type="button"
              onClick={refreshTableStatus}
              disabled={isCheckingTables}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-amber-300 hover:border-amber-400/40 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingTables ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isCheckingTables ? 'Memeriksa...' : 'Cek Status Sekarang'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { key: 'events', label: 'public.events (Katalog Event)' },
              { key: 'participants', label: 'public.participants (Peserta)' },
              { key: 'scores', label: 'public.scores (Nilai Relasional)' },
              { key: 'fams_profile', label: 'public.fams_profile (Profil Fams)' },
              { key: 'fams_members', label: 'public.fams_members (Member Fams)' },
              { key: 'event_settings', label: 'public.event_settings (Pengaturan)' },
              { key: 'admin_users', label: 'public.admin_users (Akun Admin)' },
              { key: 'audit_logs', label: 'public.audit_logs (Log Aktivitas)' },
              { key: 'judge_chat_messages', label: 'public.judge_chat_messages (Live Chat)' },
            ].map(({ key, label }) => {
              const status = tableStatus[key];
              const isOnline = status === 'online';
              return (
                <div
                  key={key}
                  className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                    isOnline
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="truncate font-mono">{label}</span>
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                      isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {isOnline ? 'TERHUBUNG' : 'FALLBACK ACTIVE'}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            💡 Sistem kami menerapkan <strong>Adaptive Fallback Architecture</strong>: jika tabel dedicated seperti <code>events</code> atau <code>fams_profile</code> belum di-run di Supabase SQL Editor, data tetap tersimpan secara aman & terisolasi per event di tabel <code>event_settings</code> dan tidak akan hilang saat refresh. Jika tabel dedicated sudah dibuat, sistem otomatis bermigrasi dan beralih ke tabel dedicated.
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
          <p><span className="text-slate-500">Project Endpoint:</span> https://zlocebfngmaxqisqnfjt.supabase.co</p>
          <p><span className="text-slate-500">Active Tables:</span> participants, scores (FK), admin_users, event_settings, audit_logs</p>
          <p><span className="text-slate-500">Realtime Sync:</span> PostgreSQL CDC postgres_changes Channel Active (participants + scores)</p>
        </div>
      </div>

      {/* Danger Zone (Superadmin only) */}
      <div className="p-6 rounded-3xl bg-red-950/20 border border-red-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Zona Berbahaya (Danger Zone)</span>
        </h3>
        <p className="text-xs text-slate-400">
          Reset seluruh data peserta kembali ke 5 data awal contoh. Harap gunakan dengan hati-hati.
        </p>

        {showResetConfirm ? (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 space-y-3">
            <p className="text-xs text-red-200 font-semibold">
              Yakin ingin mereset seluruh database peserta ke sampel awal?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Peserta ke Seed Awal</span>
          </button>
        )}
      </div>
    </div>
  );
};
