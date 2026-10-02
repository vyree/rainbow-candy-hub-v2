import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  Participant,
  RegistrationFormData,
  ParticipantScores,
  JudgeScoreDetail,
  ScoreRecord,
  AdminUser,
  AuditLog,
  EventSettings,
  AdminRole,
  JudgeChatMessage,
} from '../types/participant';
import { RCEvent, EventPrize, INITIAL_EVENTS } from '../types/event';
import { validateRegistrationPayload } from '../utils/security';

// Default Supabase project configuration provided by user
const DEFAULT_SUPABASE_URL = 'https://zlocebfngmaxqisqnfjt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsb2NlYmZuZ21heHFpc3FuZmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjA3NDQsImV4cCI6MjEwMzM5Njc0NH0.GCZdpVQQXYqlMounTWnEmM3N3hjpBeT5DBe0xYWEni0';

// Sanitize URL (strip trailing /rest/v1 or trailing slashes)
function cleanUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = cleanUrl(rawEnvUrl) || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = (rawEnvKey || DEFAULT_SUPABASE_ANON_KEY).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Local cache keys for offline-first resiliency
const LOCAL_STORAGE_KEY = 'rc_virgo_party_participants_v3';
const LOCAL_USERS_KEY = 'rc_virgo_party_admin_users_v3';
const LOCAL_LOGS_KEY = 'rc_virgo_party_audit_logs_v3';
const LOCAL_SETTINGS_KEY = 'rc_virgo_party_settings_v3';
const LOCAL_CHAT_KEY = 'rc_virgo_party_judge_chat_v1';
const LOCAL_EVENTS_KEY = 'rc_fams_events_v2';

/**
 * Format any missing or empty value to default "not available"
 */
export function formatValue<T>(val: T | null | undefined, fallback: string = 'not available'): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  return str === '' ? fallback : str;
}

// 8 Pre-seeded Admin Users with Superadmin, Admin Regis, 4 Dedicated Judges, Stage Coordinator, and Event Viewer
export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-superadmin',
    username: 'admin',
    name: 'Super Administrator',
    email: 'superadmin@rc-collab.id',
    role: 'superadmin',
    roleTitle: 'Super Administrator (Role & Akun)',
    avatar: '👑',
    password: 'rc-admin-2026',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-panitia',
    username: 'registrasi',
    name: 'Admin Registrasi',
    email: 'registrasi@rc-collab.id',
    role: 'panitia',
    roleTitle: 'Admin Pendaftaran & Peserta',
    avatar: '📋',
    password: 'panitia-rc-2026',
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'usr-juri1',
    username: 'juri1',
    name: 'Dewan Juri 1',
    email: 'juri1@rc-collab.id',
    role: 'juri',
    roleTitle: 'Dewan Juri 1 (Vokal & Teknik)',
    avatar: '🎙️',
    password: 'juri1-rc-2026',
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'usr-juri2',
    username: 'juri2',
    name: 'Dewan Juri 2',
    email: 'juri2@rc-collab.id',
    role: 'juri',
    roleTitle: 'Dewan Juri 2 (Kemiripan Idola)',
    avatar: '🎵',
    password: 'juri2-rc-2026',
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'usr-juri3',
    username: 'juri3',
    name: 'Dewan Juri 3',
    email: 'juri3@rc-collab.id',
    role: 'juri',
    roleTitle: 'Dewan Juri 3 (Penjiwaan & Rasa)',
    avatar: '🔥',
    password: 'juri3-rc-2026',
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: 'usr-juri4',
    username: 'juri4',
    name: 'Dewan Juri 4',
    email: 'juri4@rc-collab.id',
    role: 'juri',
    roleTitle: 'Dewan Juri 4 (Presentasi & Flow)',
    avatar: '✨',
    password: 'rc-admin-2026',
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'usr-juri5',
    username: 'juri5',
    name: 'Dewan Juri 5',
    email: 'juri5@rc-collab.id',
    role: 'juri',
    roleTitle: 'Dewan Juri 5 (Artikulasi & Karakter)',
    avatar: '🌟',
    password: 'rc-admin-2026',
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000 * 9).toISOString(),
  },
  {
    id: 'usr-stage',
    username: 'stage',
    name: 'Stage Coordinator',
    email: 'stage@rc-collab.id',
    role: 'stage_mgr',
    roleTitle: 'Stage & Rundown Coordinator',
    avatar: '🎧',
    password: 'stage-rc-2026',
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'usr-viewer',
    username: 'viewer',
    name: 'Event Monitor & Viewer',
    email: 'viewer@rc-collab.id',
    role: 'viewer',
    roleTitle: 'Live Event Monitor & Viewer',
    avatar: '👁️',
    password: 'viewer-rc-2026',
    isActive: true,
    lastLogin: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const INITIAL_EVENT_SETTINGS: EventSettings = {
  eventName: 'RC Birthday Celebration & Virgo Party',
  eventDate: '2026-09-13',
  eventTime: '10:00 WIB',
  venueOrRoom: 'Main Stage & Live Audio Hall',
  isRegistrationOpen: true,
  activeRound: 'audisi_live',
  currentPerformingId: undefined,
  youtubeTeaserUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  broadcastNotice: 'Selamat datang di panggung RC Birthday Celebration! Pastikan audio minus-one siap sebelum giliran tampil.',
};

// ==========================================
// TEST CONNECTION & AUTO-INITIALIZATION
// ==========================================

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; tables: string[] }> {
  try {
    const { data, error } = await supabase.from('participants').select('id').limit(1);
    if (error) {
      return { ok: false, message: error.message, tables: [] };
    }
    return { ok: true, message: 'Connected to Supabase successfully', tables: ['participants', 'admin_users', 'event_settings', 'audit_logs'] };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Connection failed', tables: [] };
  }
}

// Auto-seed admin users if table is empty
let isSeedingAdmin = false;
async function ensureAdminUsersSeeded(): Promise<void> {
  if (isSeedingAdmin) return;
  isSeedingAdmin = true;
  try {
    const { count, error } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
    if (!error && (count === 0 || count === null)) {
      const rows = INITIAL_ADMIN_USERS.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        role_title: u.roleTitle,
        avatar: u.avatar,
        password: u.password,
        pin_code: u.password,
        is_active: u.isActive,
        created_at: new Date().toISOString(),
        last_login: u.lastLogin,
      }));
      await supabase.from('admin_users').upsert(rows, { onConflict: 'username' });
    }
  } catch (e) {
    console.warn('Auto seed admin error:', e);
  } finally {
    isSeedingAdmin = false;
  }
}

// ==========================================
// LOCAL STORAGE CACHE HELPERS
// ==========================================

export function getLocalParticipants(): Participant[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: Participant[] = JSON.parse(saved);
      // Ensure totalScore is calculated as the sum of all judge scores without averaging and eventId is set
      return parsed.map((p) => {
        const enriched: Participant = {
          ...p,
          eventId: p.eventId || 'rc-virgo-party-2026',
        };
        if (enriched.scores?.judgeScores && Object.keys(enriched.scores.judgeScores).length > 0) {
          const judgeEntries = Object.values(enriched.scores.judgeScores);
          const sumTotals = judgeEntries.reduce((acc, j) => acc + (j.total || 0), 0);
          enriched.totalScore = Math.round(sumTotals * 10) / 10;
        }
        return enriched;
      });
    }
  } catch (e) {
    console.warn('Error reading from localStorage', e);
  }
  return [];
}

export function saveLocalParticipants(participants: Participant[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(participants));
    window.dispatchEvent(new CustomEvent('rc_participants_updated', { detail: participants }));
  } catch (e) {
    console.warn('Error saving to localStorage', e);
  }
}

const LOCAL_DELETED_EVENTS_KEY = 'rc_fams_deleted_event_ids_v2';

export function getLocalDeletedEventIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_EVENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveLocalDeletedEventIds(ids: string[]): void {
  try {
    localStorage.setItem(LOCAL_DELETED_EVENTS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch (e) {
    // ignore
  }
}

export function getLocalEvents(): RCEvent[] {
  const deletedIds = getLocalDeletedEventIds();
  try {
    const saved = localStorage.getItem(LOCAL_EVENTS_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((e) => !deletedIds.includes(e.id));
      }
    }
  } catch (e) {
    console.warn('Error reading events from localStorage', e);
  }
  return INITIAL_EVENTS.filter((e) => !deletedIds.includes(e.id));
}

export function saveLocalEvents(events: RCEvent[]): void {
  try {
    const deletedIds = getLocalDeletedEventIds();
    const cleanList = events.filter((e) => !deletedIds.includes(e.id));
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(cleanList));
    window.dispatchEvent(new CustomEvent('rc_events_updated', { detail: cleanList }));
  } catch (e) {
    console.warn('Error saving events to localStorage', e);
  }
}

export function getLocalAdminUsers(): AdminUser[] {
  try {
    const saved = localStorage.getItem(LOCAL_USERS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading admin users', e);
  }
  return INITIAL_ADMIN_USERS;
}

export function saveLocalAdminUsers(users: AdminUser[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('rc_admin_users_updated', { detail: users }));
  } catch (e) {
    console.warn('Error saving admin users', e);
  }
}

export function getLocalAuditLogs(): AuditLog[] {
  try {
    const saved = localStorage.getItem(LOCAL_LOGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading audit logs', e);
  }
  return [
    {
      id: 'log-01',
      timestamp: new Date().toISOString(),
      actor: 'Supabase DB Sync',
      action: 'INIT_SYSTEM',
      details: 'Sistem terhubung langsung ke database Supabase rc-virgo-party-2026.',
    },
  ];
}

export function getLocalEventSettings(): EventSettings {
  try {
    const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading event settings', e);
  }
  return INITIAL_EVENT_SETTINGS;
}

export function saveLocalEventSettings(settings: EventSettings): void {
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('rc_settings_updated', { detail: settings }));
  } catch (e) {
    console.warn('Error saving event settings', e);
  }
}

// ==========================================
// AUDIT LOGS
// ==========================================

export async function addAuditLog(
  actor: string,
  action: string,
  details: string,
  targetId?: string
): Promise<void> {
  const newLog: AuditLog = {
    id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
    targetId,
  };

  try {
    const logs = getLocalAuditLogs();
    const updated = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving local audit log', e);
  }

  try {
    await supabase.from('audit_logs').insert([
      {
        id: newLog.id,
        timestamp: newLog.timestamp,
        actor_name: newLog.actor,
        action: newLog.action,
        details: newLog.details,
        target_id: newLog.targetId,
      },
    ]);
  } catch (err) {
    console.warn('Supabase audit log insert error:', err);
  }
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        timestamp: item.timestamp || item.created_at || new Date().toISOString(),
        actor: item.actor_name || item.actor || 'System',
        action: item.action || 'ACTIVITY',
        details: item.details || '',
        targetId: item.target_id || item.targetId,
      }));
    }
  } catch (err) {
    console.warn('Supabase fetch audit logs error:', err);
  }
  return getLocalAuditLogs();
}

// ==========================================
// ADMIN USERS (RBAC) FUNCTIONS
// ==========================================

export async function fetchAdminUsers(): Promise<{ data: AdminUser[]; isRealtime: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const mappedUsers: AdminUser[] = data.map((item: any) => ({
        id: item.id || `usr-${item.username}`,
        username: item.username,
        name: item.name,
        email: item.email || `${item.username}@rc-collab.id`,
        role: (item.role || 'panitia') as AdminRole,
        roleTitle: item.role_title || item.roleTitle || item.name,
        avatar: item.avatar || '👤',
        password: item.password || item.pin_code || 'rc-admin-2026',
        isActive: item.is_active !== false,
        lastLogin: item.last_login || item.lastLogin,
      }));

      saveLocalAdminUsers(mappedUsers);
      return { data: mappedUsers, isRealtime: true, error: null };
    }

    // Auto-seed if empty in Supabase
    if (!error && (!data || data.length === 0)) {
      await ensureAdminUsersSeeded();
      return { data: INITIAL_ADMIN_USERS, isRealtime: true, error: null };
    }
  } catch (err: any) {
    console.warn('Supabase fetch admin users exception:', err);
  }

  return { data: getLocalAdminUsers(), isRealtime: false, error: null };
}

export async function saveAdminUser(
  user: AdminUser,
  actorName: string = 'Superadmin'
): Promise<{ success: boolean; data?: AdminUser; error?: string }> {
  const current = getLocalAdminUsers();
  const index = current.findIndex((u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());

  let updatedUsers: AdminUser[];
  if (index >= 0) {
    updatedUsers = current.map((u, i) => (i === index ? user : u));
  } else {
    updatedUsers = [...current, user];
  }

  saveLocalAdminUsers(updatedUsers);

  try {
    const { error } = await supabase.from('admin_users').upsert(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        role_title: user.roleTitle,
        avatar: user.avatar,
        password: user.password,
        pin_code: user.password,
        is_active: user.isActive,
        last_login: user.lastLogin,
      },
      { onConflict: 'username' }
    );

    if (error) {
      console.warn('Supabase save admin user error:', error.message);
    }
  } catch (err: any) {
    console.warn('Supabase save admin user exception:', err);
  }

  addAuditLog(actorName, index >= 0 ? 'UPDATE_ADMIN_USER' : 'CREATE_ADMIN_USER', `Menyimpan akun ${user.name} (@${user.username}) dengan role ${user.role}`);
  return { success: true, data: user };
}

export async function deleteAdminUser(
  userId: string,
  actorName: string = 'Superadmin'
): Promise<{ success: boolean; error?: string }> {
  const current = getLocalAdminUsers();
  const target = current.find((u) => u.id === userId);

  if (!target) {
    return { success: false, error: 'User tidak ditemukan' };
  }

  const filtered = current.filter((u) => u.id !== userId);
  saveLocalAdminUsers(filtered);

  try {
    await supabase.from('admin_users').delete().eq('id', userId);
  } catch (err) {
    console.warn('Supabase delete admin user exception:', err);
  }

  addAuditLog(actorName, 'DELETE_ADMIN_USER', `Menghapus akun ${target.name} (@${target.username})`);
  return { success: true };
}

// ==========================================
// EVENT SETTINGS FUNCTIONS
// ==========================================

export async function fetchEventSettings(): Promise<EventSettings> {
  try {
    const { data, error } = await supabase
      .from('event_settings')
      .select('*')
      .eq('id', 'default_settings')
      .maybeSingle();

    if (!error && data) {
      const mappedSettings: EventSettings = {
        eventName: data.event_title || data.event_name || INITIAL_EVENT_SETTINGS.eventName,
        eventDate: data.event_date || INITIAL_EVENT_SETTINGS.eventDate,
        eventTime: data.event_time || INITIAL_EVENT_SETTINGS.eventTime,
        venueOrRoom: data.venue_or_room || INITIAL_EVENT_SETTINGS.venueOrRoom,
        isRegistrationOpen: data.is_registration_open !== false,
        activeRound: data.active_round || INITIAL_EVENT_SETTINGS.activeRound,
        currentPerformingId: data.current_performing_id || undefined,
        youtubeTeaserUrl: data.youtube_teaser_url || INITIAL_EVENT_SETTINGS.youtubeTeaserUrl,
        broadcastNotice: data.broadcast_notice || INITIAL_EVENT_SETTINGS.broadcastNotice,
        officialWinners: data.official_winners || undefined,
      };

      saveLocalEventSettings(mappedSettings);
      return mappedSettings;
    }
  } catch (err) {
    console.warn('Supabase fetch event settings error:', err);
  }

  return getLocalEventSettings();
}

export async function saveEventSettings(
  settings: EventSettings,
  actorName: string = 'Superadmin'
): Promise<{ success: boolean; error?: string }> {
  saveLocalEventSettings(settings);

  try {
    const { error } = await supabase.from('event_settings').upsert({
      id: 'default_settings',
      event_title: settings.eventName,
      event_date: settings.eventDate,
      event_time: settings.eventTime,
      venue_or_room: settings.venueOrRoom,
      is_registration_open: settings.isRegistrationOpen,
      active_round: settings.activeRound,
      current_performing_id: settings.currentPerformingId,
      youtube_teaser_url: settings.youtubeTeaserUrl,
      broadcast_notice: settings.broadcastNotice,
      official_winners: settings.officialWinners || {},
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase save event settings warning:', error.message);
    }
  } catch (err: any) {
    console.warn('Supabase save event settings exception:', err);
  }

  addAuditLog(actorName, 'UPDATE_EVENT_SETTINGS', 'Memperbarui konfigurasi panggung & event');
  return { success: true };
}

// ==========================================
// PARTICIPANTS CRUD & SCORING FUNCTIONS
// ==========================================

/**
 * Fetch all participants from Supabase, joined with point-by-point individual scores from the scores table
 */
export async function fetchParticipants(): Promise<{ data: Participant[]; isRealtime: boolean; error: string | null }> {
  try {
    const { data: participantsData, error: pError } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError) {
      console.warn('Supabase fetch participants error:', pError.message);
      return { data: getLocalParticipants(), isRealtime: false, error: pError.message };
    }

    // Attempt to fetch detailed point-by-point scores from the dedicated `scores` table
    let scoreRowsMap: Record<string, Record<string, JudgeScoreDetail>> = {};
    try {
      const { data: scoreRecords, error: sError } = await supabase
        .from('scores')
        .select('*');

      if (!sError && scoreRecords && scoreRecords.length > 0) {
        scoreRecords.forEach((s: any) => {
          const pId = s.participant_id;
          const jId = s.judge_id;
          if (!scoreRowsMap[pId]) {
            scoreRowsMap[pId] = {};
          }
          scoreRowsMap[pId][jId] = {
            judgeId: jId,
            judgeName: s.judge_name || 'Dewan Juri',
            teknikalitas: Number(s.teknikalitas) || 0,
            kemiripan: Number(s.kemiripan) || 0,
            penjiwaan: Number(s.penjiwaan) || 0,
            presentasi: Number(s.presentasi) || 0,
            total: Number(s.total) || 0,
            notes: s.notes || '',
            submittedAt: s.submitted_at || s.created_at,
          };
        });
      }
    } catch (scoreQueryErr) {
      console.warn('Dedicated scores table query notice (will fallback to cached json):', scoreQueryErr);
    }

    if (participantsData) {
      const mapped: Participant[] = participantsData.map((item: any) => {
        let cleanIdPopup: number | undefined = undefined;
        const rawPop = item.idpopup !== null && item.idpopup !== undefined ? item.idpopup : item.id_popup;
        if (rawPop !== null && rawPop !== undefined && String(rawPop).trim() !== '') {
          const num = parseInt(String(rawPop).replace(/^#+/, '').replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) cleanIdPopup = num;
        }

        // Merge relational scores from the `scores` table with any cached JSON column
        let resolvedScores: ParticipantScores | undefined = item.scores || {};
        const relationalJudges = scoreRowsMap[item.id];

        if (relationalJudges && Object.keys(relationalJudges).length > 0) {
          const judgeEntries = Object.values(relationalJudges);
          const count = judgeEntries.length;

          const sumTek = judgeEntries.reduce((acc, j) => acc + (j.teknikalitas || 0), 0);
          const sumKem = judgeEntries.reduce((acc, j) => acc + (j.kemiripan || 0), 0);
          const sumPen = judgeEntries.reduce((acc, j) => acc + (j.penjiwaan || 0), 0);
          const sumPres = judgeEntries.reduce((acc, j) => acc + (j.presentasi || 0), 0);
          const sumTotals = judgeEntries.reduce((acc, j) => acc + (j.total || 0), 0);

          resolvedScores = {
            ...resolvedScores,
            judgeScores: relationalJudges,
            teknikalitas: Math.round((sumTek / count) * 10) / 10,
            kemiripan: Math.round((sumKem / count) * 10) / 10,
            penjiwaan: Math.round((sumPen / count) * 10) / 10,
            presentasi: Math.round((sumPres / count) * 10) / 10,
          };
        }

        // Calculate aggregate totalScore as the direct sum of all judges' scores (without averaging)
        let calcTotalScore: number | undefined = item.total_score || item.totalScore;
        if (resolvedScores?.judgeScores && Object.keys(resolvedScores.judgeScores).length > 0) {
          const judgeEntries = Object.values(resolvedScores.judgeScores);
          const sumTotals = judgeEntries.reduce((acc, j) => acc + (j.total || 0), 0);
          calcTotalScore = Math.round(sumTotals * 10) / 10;
        }

        const resolvedEventId =
          item.event_id ||
          item.eventId ||
          item.scores?.eventId ||
          (typeof item.notes === 'string' && item.notes.includes('[Event:')
            ? item.notes.match(/\[Event:\s*([^\]]+)\]/)?.[1]
            : undefined) ||
          'rc-virgo-party-2026';

        return {
          id: item.id || `sub-${Math.random()}`,
          eventId: resolvedEventId,
          idpopup: cleanIdPopup,
          fullName: item.full_name || item.fullName || 'Peserta',
          familyName: item.family_name || item.familyName || 'RC Family',
          idolSong: item.idol_song || item.idolSong || 'Lagu Pilihan',
          idolArtist: item.idol_artist || item.idolArtist,
          whatsapp: item.whatsapp || '',
          created_at: item.created_at || new Date().toISOString(),
          status: item.status || 'pending',
          notes: item.notes,
          audioLink: item.audio_link || item.audioLink,
          orderNumber: item.order_number || item.orderNumber,
          scores: resolvedScores,
          totalScore: calcTotalScore,
          winnerTitle: item.winner_title || item.winnerTitle,
        };
      });

      saveLocalParticipants(mapped);
      return {
        data: mapped,
        isRealtime: true,
        error: null,
      };
    }
  } catch (err: any) {
    console.warn('Supabase fetch participants exception:', err);
  }

  return { data: getLocalParticipants(), isRealtime: false, error: null };
}

/**
 * Register / Create a new participant (Saved directly to Supabase)
 */
export async function registerParticipant(
  formData: RegistrationFormData,
  actorName: string = 'Public Registration'
): Promise<{ success: boolean; data?: Participant; error?: string }> {
  // Validate and sanitize input
  const validation = validateRegistrationPayload({
    fullName: formData.fullName,
    familyName: formData.familyName,
    idpopup: formData.idpopup,
    idolSong: formData.idolSong,
    idolArtist: formData.idolArtist,
    whatsapp: formData.whatsapp,
  });

  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0] || 'Format data pendaftaran tidak valid.';
    return { success: false, error: firstError };
  }

  const existing = getLocalParticipants();
  const nextOrder = existing.length + 1;

  const sanitized = validation.sanitized;
  const targetEventId = formData.eventId || 'rc-virgo-party-2026';

  const newParticipant: Participant = {
    id: `rc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    eventId: targetEventId,
    idpopup: sanitized.idpopup !== undefined && sanitized.idpopup !== null && !isNaN(Number(sanitized.idpopup)) ? Number(sanitized.idpopup) : undefined,
    fullName: sanitized.fullName,
    familyName: sanitized.familyName,
    idolSong: sanitized.idolSong,
    idolArtist: sanitized.idolArtist || undefined,
    whatsapp: sanitized.whatsapp,
    created_at: new Date().toISOString(),
    status: formData.status || 'pending',
    notes: formData.notes?.trim() || undefined,
    audioLink: formData.audioLink?.trim() || undefined,
    orderNumber: formData.orderNumber || nextOrder,
    scores: { eventId: targetEventId },
    winnerTitle: formData.winnerTitle || undefined,
  };

  try {
    const payload: any = {
      id: newParticipant.id,
      idpopup: newParticipant.idpopup !== undefined && newParticipant.idpopup !== null ? Number(newParticipant.idpopup) : null,
      full_name: newParticipant.fullName,
      family_name: newParticipant.familyName,
      idol_song: newParticipant.idolSong,
      idol_artist: newParticipant.idolArtist,
      whatsapp: newParticipant.whatsapp,
      created_at: newParticipant.created_at,
      status: newParticipant.status,
      notes: newParticipant.notes,
      audio_link: newParticipant.audioLink,
      order_number: newParticipant.orderNumber,
      scores: { eventId: targetEventId },
      winner_title: newParticipant.winnerTitle,
    };

    const { data, error } = await supabase
      .from('participants')
      .insert([payload])
      .select();

    if (error) {
      console.warn('Supabase insert error:', error.message);
    } else if (data && data.length > 0) {
      newParticipant.id = data[0].id || newParticipant.id;
    }
  } catch (err: any) {
    console.warn('Supabase insert exception:', err);
  }

  const updated = [newParticipant, ...existing];
  saveLocalParticipants(updated);
  addAuditLog(actorName, 'CREATE_PARTICIPANT', `Menambahkan peserta: ${newParticipant.fullName} (${newParticipant.familyName}) [ID PopUp: ${newParticipant.idpopup !== undefined ? newParticipant.idpopup : 'not available'}]`, newParticipant.id);

  return { success: true, data: newParticipant };
}

/**
 * Edit / Update an existing participant (Updated in Supabase)
 */
export async function updateParticipant(
  id: string,
  updatedFields: Partial<Participant>,
  actorName: string = 'Admin'
): Promise<{ success: boolean; data?: Participant; error?: string }> {
  const existing = getLocalParticipants();
  const index = existing.findIndex((p) => p.id === id);

  if (index === -1) {
    return { success: false, error: 'Peserta tidak ditemukan' };
  }

  const current = existing[index];
  
  let formattedIdPopup: number | undefined = undefined;
  if (updatedFields.idpopup !== undefined && updatedFields.idpopup !== null && String(updatedFields.idpopup).trim() !== '') {
    const cleanNum = String(updatedFields.idpopup).replace(/^#+/, '').replace(/[^0-9]/g, '');
    const num = cleanNum !== '' ? parseInt(cleanNum, 10) : NaN;
    formattedIdPopup = !isNaN(num) ? num : undefined;
  } else if (updatedFields.idpopup === undefined) {
    formattedIdPopup = current.idpopup;
  }

  const updatedParticipant: Participant = {
    ...current,
    ...updatedFields,
    idpopup: formattedIdPopup,
  };

  // Recalculate total score if scores updated
  if (updatedFields.scores) {
    const s = updatedFields.scores;
    if (s.judgeScores && Object.keys(s.judgeScores).length > 0) {
      const judgeEntries = Object.values(s.judgeScores);
      const sumTek = judgeEntries.reduce((acc, j) => acc + (j.teknikalitas || 0), 0);
      const sumKem = judgeEntries.reduce((acc, j) => acc + (j.kemiripan || 0), 0);
      const sumPen = judgeEntries.reduce((acc, j) => acc + (j.penjiwaan || 0), 0);
      const sumPres = judgeEntries.reduce((acc, j) => acc + (j.presentasi || 0), 0);
      const count = judgeEntries.length;

      s.teknikalitas = Math.round((sumTek / count) * 10) / 10;
      s.kemiripan = Math.round((sumKem / count) * 10) / 10;
      s.penjiwaan = Math.round((sumPen / count) * 10) / 10;
      s.presentasi = Math.round((sumPres / count) * 10) / 10;

      const sumTotals = judgeEntries.reduce((acc, j) => acc + (j.total || 0), 0);
      updatedParticipant.totalScore = Math.round(sumTotals * 10) / 10;
    } else {
      const total = (s.teknikalitas || 0) + (s.kemiripan || 0) + (s.penjiwaan || 0) + (s.presentasi || 0);
      updatedParticipant.totalScore = Math.round(total * 10) / 10;
    }
  }

  try {
    const scoresWithEvent = {
      ...(updatedParticipant.scores || {}),
      eventId: updatedParticipant.eventId || 'rc-virgo-party-2026',
    };

    const { error } = await supabase
      .from('participants')
      .update({
        idpopup: updatedParticipant.idpopup !== undefined && updatedParticipant.idpopup !== null ? Number(updatedParticipant.idpopup) : null,
        full_name: updatedParticipant.fullName,
        family_name: updatedParticipant.familyName,
        idol_song: updatedParticipant.idolSong,
        idol_artist: updatedParticipant.idolArtist,
        whatsapp: updatedParticipant.whatsapp,
        status: updatedParticipant.status,
        notes: updatedParticipant.notes,
        audio_link: updatedParticipant.audioLink,
        order_number: updatedParticipant.orderNumber,
        scores: scoresWithEvent,
        total_score: updatedParticipant.totalScore,
        winner_title: updatedParticipant.winnerTitle,
      })
      .eq('id', id);

    if (error) {
      console.warn('Supabase update warning:', error.message);
    }
  } catch (err: any) {
    console.warn('Supabase update exception:', err);
  }

  existing[index] = updatedParticipant;
  saveLocalParticipants(existing);
  addAuditLog(actorName, 'UPDATE_PARTICIPANT', `Memperbarui data peserta: ${updatedParticipant.fullName}`, id);

  return { success: true, data: updatedParticipant };
}

/**
 * Determine and designate official winners based on 4-judge aggregate recap
 */
export async function determineAndLockWinners(
  winnerAssignments: { participantId: string; winnerTitle: string }[],
  actorName: string = 'Super Administrator'
): Promise<{ success: boolean; data: Participant[]; error?: string }> {
  const existing = getLocalParticipants();
  const assignmentMap = new Map(winnerAssignments.map((w) => [w.participantId, w.winnerTitle]));

  const updatedParticipants = existing.map((p) => {
    if (assignmentMap.has(p.id)) {
      return { ...p, winnerTitle: assignmentMap.get(p.id) };
    } else {
      return { ...p, winnerTitle: undefined };
    }
  });

  saveLocalParticipants(updatedParticipants);

  // Sync winner designations to Supabase
  try {
    for (const p of updatedParticipants) {
      await supabase
        .from('participants')
        .update({ winner_title: p.winnerTitle || null })
        .eq('id', p.id);
    }
  } catch (err) {
    console.warn('Supabase update winner titles error:', err);
  }

  // Also update event settings with the determined winners
  const currentSettings = getLocalEventSettings();
  const juara1 = winnerAssignments.find((w) => w.winnerTitle === 'Juara 1')?.participantId;
  const juara2 = winnerAssignments.find((w) => w.winnerTitle === 'Juara 2')?.participantId;
  const juara3 = winnerAssignments.find((w) => w.winnerTitle === 'Juara 3')?.participantId;
  const harapan1 = winnerAssignments.find((w) => w.winnerTitle.includes('Harapan'))?.participantId;
  const favorit = winnerAssignments.find((w) => w.winnerTitle.includes('Favorit'))?.participantId;

  const newSettings: EventSettings = {
    ...currentSettings,
    officialWinners: {
      juara1Id: juara1,
      juara2Id: juara2,
      juara3Id: juara3,
      harapan1Id: harapan1,
      favoritId: favorit,
      determinedAt: new Date().toISOString(),
      determinedBy: actorName,
    },
  };

  await saveEventSettings(newSettings, actorName);

  addAuditLog(
    actorName,
    'DETERMINE_WINNERS',
    `Menetapkan juara resmi lomba dari hasil rekap nilai dewan juri (${winnerAssignments.length} pemenang ditetapkan)`
  );

  return { success: true, data: updatedParticipants };
}

/**
 * Unlock and reset official winners (Allowing superadmin to clear locked decisions)
 */
export async function unlockAndResetWinners(
  actorName: string = 'Super Administrator'
): Promise<{ success: boolean; data: Participant[]; error?: string }> {
  const existing = getLocalParticipants();
  const updatedParticipants = existing.map((p) => ({
    ...p,
    winnerTitle: undefined,
  }));

  saveLocalParticipants(updatedParticipants);

  try {
    for (const p of updatedParticipants) {
      await supabase
        .from('participants')
        .update({ winner_title: null })
        .eq('id', p.id);
    }
  } catch (err) {
    console.warn('Supabase clear winner titles error:', err);
  }

  const currentSettings = getLocalEventSettings();
  const newSettings: EventSettings = {
    ...currentSettings,
    officialWinners: undefined,
  };

  await saveEventSettings(newSettings, actorName);

  addAuditLog(
    actorName,
    'UNLOCK_WINNERS',
    'Membuka kunci penetapan juara dan mengembalikan status ke evaluasi penilaian'
  );

  return { success: true, data: updatedParticipants };
}

/**
 * Save Individual Score from a specific Judge (1 Juri = 1 Row di Tabel 'scores' with Foreign Key to 'participants')
 * Menyimpan seluruh rincian point-by-point (Teknikalitas, Kemiripan, Penjiwaan, Presentasi, Notes, Total)
 */
export async function submitJudgeIndividualScore(
  participantId: string,
  judgeId: string,
  judgeName: string,
  scoreDetails: {
    teknikalitas: number;
    kemiripan: number;
    penjiwaan: number;
    presentasi: number;
    notes?: string;
  }
): Promise<{ success: boolean; data?: Participant; error?: string }> {
  const existing = getLocalParticipants();
  const target = existing.find((p) => p.id === participantId);

  if (!target) {
    return { success: false, error: 'Peserta tidak ditemukan' };
  }

  const existingScores: ParticipantScores = target.scores || {};
  const currentJudgeScores = existingScores.judgeScores || {};

  const total = Math.round(
    (scoreDetails.teknikalitas + scoreDetails.kemiripan + scoreDetails.penjiwaan + scoreDetails.presentasi) * 10
  ) / 10;

  const newJudgeScore: JudgeScoreDetail = {
    judgeId,
    judgeName,
    teknikalitas: scoreDetails.teknikalitas,
    kemiripan: scoreDetails.kemiripan,
    penjiwaan: scoreDetails.penjiwaan,
    presentasi: scoreDetails.presentasi,
    total,
    notes: scoreDetails.notes || '',
    submittedAt: new Date().toISOString(),
  };

  // 1. Save / Upsert to the relational 'scores' table in Supabase
  try {
    const scoreRecordPayload = {
      id: `score-${participantId}-${judgeId}`,
      participant_id: participantId,
      judge_id: judgeId,
      judge_name: judgeName,
      teknikalitas: scoreDetails.teknikalitas,
      kemiripan: scoreDetails.kemiripan,
      penjiwaan: scoreDetails.penjiwaan,
      presentasi: scoreDetails.presentasi,
      total,
      notes: scoreDetails.notes || '',
      submitted_at: newJudgeScore.submittedAt,
      updated_at: new Date().toISOString(),
    };

    const { error: scoreUpsertError } = await supabase
      .from('scores')
      .upsert(scoreRecordPayload, { onConflict: 'participant_id,judge_id' });

    if (scoreUpsertError) {
      console.warn('Supabase dedicated scores table warning (may not be created yet, fallback active):', scoreUpsertError.message);
    }
  } catch (err: any) {
    console.warn('Supabase scores table upsert exception:', err);
  }

  // 2. Update parent participant's aggregate scores
  const updatedJudgeScores = {
    ...currentJudgeScores,
    [judgeId]: newJudgeScore,
  };

  const newScores: ParticipantScores = {
    ...existingScores,
    judgeScores: updatedJudgeScores,
    notes: scoreDetails.notes || existingScores.notes,
    judgedBy: judgeName,
  };

  return updateParticipant(participantId, { scores: newScores }, judgeName);
}

/**
 * Delete a participant and cascade delete all their individual scores
 */
export async function deleteParticipant(
  id: string,
  actorName: string = 'Admin'
): Promise<{ success: boolean; error?: string }> {
  const existing = getLocalParticipants();
  const target = existing.find((p) => p.id === id);

  if (!target) {
    return { success: false, error: 'Peserta tidak ditemukan' };
  }

  try {
    // Delete related score rows first (in case cascade is not set in DB yet)
    await supabase.from('scores').delete().eq('participant_id', id);
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete warning:', error.message);
    }
  } catch (err: any) {
    console.warn('Supabase delete exception:', err);
  }

  const filtered = existing.filter((p) => p.id !== id);
  saveLocalParticipants(filtered);
  addAuditLog(actorName, 'DELETE_PARTICIPANT', `Menghapus peserta: ${target.fullName} (${target.familyName})`, id);

  return { success: true };
}

/**
 * Fetch detailed point-by-point score records for a single participant directly from the 'scores' table
 */
export async function fetchScoresByParticipant(participantId: string): Promise<ScoreRecord[]> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('participant_id', participantId);

    if (!error && data) {
      return data.map((s: any) => ({
        id: s.id,
        participantId: s.participant_id,
        judgeId: s.judge_id,
        judgeName: s.judge_name,
        teknikalitas: Number(s.teknikalitas) || 0,
        kemiripan: Number(s.kemiripan) || 0,
        penjiwaan: Number(s.penjiwaan) || 0,
        presentasi: Number(s.presentasi) || 0,
        total: Number(s.total) || 0,
        notes: s.notes || '',
        submittedAt: s.submitted_at || s.created_at,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));
    }
  } catch (err) {
    console.warn('fetchScoresByParticipant error:', err);
  }
  return [];
}

/**
 * Fetch all point-by-point score records from the 'scores' table
 */
export async function fetchAllScoreRecords(): Promise<ScoreRecord[]> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      return data.map((s: any) => ({
        id: s.id,
        participantId: s.participant_id,
        judgeId: s.judge_id,
        judgeName: s.judge_name,
        teknikalitas: Number(s.teknikalitas) || 0,
        kemiripan: Number(s.kemiripan) || 0,
        penjiwaan: Number(s.penjiwaan) || 0,
        presentasi: Number(s.presentasi) || 0,
        total: Number(s.total) || 0,
        notes: s.notes || '',
        submittedAt: s.submitted_at || s.created_at,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));
    }
  } catch (err) {
    console.warn('fetchAllScoreRecords error:', err);
  }
  return [];
}

/**
 * Save Score from Judge (Dewan Juri)
 */
export async function submitParticipantScore(
  id: string,
  scores: ParticipantScores,
  judgeName: string
): Promise<{ success: boolean; data?: Participant; error?: string }> {
  return updateParticipant(id, { scores }, judgeName);
}

/**
 * Reset participants
 */
export async function resetParticipantsToSeed(actorName: string = 'Super Admin'): Promise<Participant[]> {
  saveLocalParticipants([]);

  try {
    await supabase.from('participants').delete().neq('id', 'placeholder');
  } catch (err) {
    console.warn('Supabase reset exception:', err);
  }

  addAuditLog(actorName, 'RESET_DATABASE', 'Mereset data peserta ke kondisi bersih');
  return [];
}

// ==========================================
// REALTIME SUBSCRIPTION CHANNELS
// ==========================================

/**
 * Subscribe to realtime participants & scores changes directly from Supabase
 */
export function subscribeToParticipants(onUpdate: (participants: Participant[]) => void): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    const channelName = `participants_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        async () => {
          const { data } = await fetchParticipants();
          onUpdate(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        async () => {
          const { data } = await fetchParticipants();
          onUpdate(data);
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Realtime subscription fallback:', err);
  }

  const handleLocalUpdate = (e: Event) => {
    const customEvent = e as CustomEvent<Participant[]>;
    if (customEvent.detail) {
      onUpdate(customEvent.detail);
    } else {
      onUpdate(getLocalParticipants());
    }
  };

  window.addEventListener('rc_participants_updated', handleLocalUpdate);

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
    window.removeEventListener('rc_participants_updated', handleLocalUpdate);
  };
}

/**
 * Subscribe to realtime event settings changes
 */
export function subscribeToEventSettings(onUpdate: (settings: EventSettings) => void): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    const channelName = `event_settings_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_settings' },
        async () => {
          const settings = await fetchEventSettings();
          onUpdate(settings);
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Realtime event_settings subscription fallback:', err);
  }

  const handleLocalUpdate = (e: Event) => {
    const customEvent = e as CustomEvent<EventSettings>;
    if (customEvent.detail) {
      onUpdate(customEvent.detail);
    } else {
      onUpdate(getLocalEventSettings());
    }
  };

  window.addEventListener('rc_settings_updated', handleLocalUpdate);

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
    window.removeEventListener('rc_settings_updated', handleLocalUpdate);
  };
}

/**
 * Subscribe to realtime admin users changes
 */
export function subscribeToAdminUsers(onUpdate: (users: AdminUser[]) => void): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    const channelName = `admin_users_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_users' },
        async () => {
          const { data } = await fetchAdminUsers();
          onUpdate(data);
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Realtime admin_users subscription fallback:', err);
  }

  const handleLocalUpdate = (e: Event) => {
    const customEvent = e as CustomEvent<AdminUser[]>;
    if (customEvent.detail) {
      onUpdate(customEvent.detail);
    } else {
      onUpdate(getLocalAdminUsers());
    }
  };

  window.addEventListener('rc_admin_users_updated', handleLocalUpdate);

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
    window.removeEventListener('rc_admin_users_updated', handleLocalUpdate);
  };
}

/**
 * ============================================================================
 * REAL-TIME JUDGE CHAT SERVICE (Supabase Table + Realtime Broadcast Fallback)
 * ============================================================================
 */

export function getLocalJudgeChat(): JudgeChatMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHAT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalJudgeChat(messages: JudgeChatMessage[]): void {
  try {
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(messages));
  } catch (err) {
    console.warn('Failed to save judge chat to local storage:', err);
  }
}

/**
 * Fetch chat messages with graceful fallback to localStorage
 */
export async function fetchJudgeChatMessages(
  limit: number = 80
): Promise<{ data: JudgeChatMessage[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('judge_chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error || !data) {
      return { data: getLocalJudgeChat(), error: error ? error.message : null };
    }

    const mapped: JudgeChatMessage[] = data.map((item: any) => ({
      id: String(item.id),
      senderId: item.sender_id || item.senderId || 'unknown',
      senderName: item.sender_name || item.senderName || 'Juri',
      senderRole: item.sender_role || item.senderRole || 'juri',
      senderAvatar: item.sender_avatar || item.senderAvatar || '⚖️',
      message: item.message || '',
      participantId: item.participant_id || item.participantId || undefined,
      participantName: item.participant_name || item.participantName || undefined,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));

    // Merge with local storage to ensure offline messages are kept
    const local = getLocalJudgeChat();
    const map = new Map<string, JudgeChatMessage>();
    local.forEach((m) => map.set(m.id, m));
    mapped.forEach((m) => map.set(m.id, m));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    saveLocalJudgeChat(merged);
    return { data: merged, error: null };
  } catch (err: any) {
    return { data: getLocalJudgeChat(), error: err?.message || 'Network error' };
  }
}

// Global broadcast channel for judge chat
let judgeChatBroadcastChannel: RealtimeChannel | null = null;
const judgeChatListeners = new Set<(msg: JudgeChatMessage) => void>();

function getOrCreateJudgeChatChannel(): RealtimeChannel {
  if (!judgeChatBroadcastChannel) {
    judgeChatBroadcastChannel = supabase.channel('realtime:judge_chat', {
      config: {
        broadcast: { ack: true },
      },
    });

    judgeChatBroadcastChannel.on('broadcast', { event: 'new_chat_message' }, (eventPayload) => {
      if (eventPayload.payload) {
        const msg = eventPayload.payload as JudgeChatMessage;
        const current = getLocalJudgeChat();
        if (!current.some((m) => m.id === msg.id)) {
          saveLocalJudgeChat([...current, msg]);
        }
        judgeChatListeners.forEach((fn) => {
          try {
            fn(msg);
          } catch (err) {
            console.error('Judge chat listener error:', err);
          }
        });
      }
    });

    try {
      judgeChatBroadcastChannel.subscribe();
    } catch (e) {
      console.warn('Judge chat channel subscribe error:', e);
    }
  }
  return judgeChatBroadcastChannel;
}

/**
 * Send a chat message from a judge or admin
 */
export async function sendJudgeChatMessage(
  payload: Omit<JudgeChatMessage, 'id' | 'createdAt'>
): Promise<{ data: JudgeChatMessage | null; error: string | null }> {
  const newMsg: JudgeChatMessage = {
    id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };

  // 1. Store to local cache immediately
  const local = getLocalJudgeChat();
  const updated = [...local, newMsg];
  saveLocalJudgeChat(updated);

  // 2. Dispatch local window event so open components update instantly
  window.dispatchEvent(
    new CustomEvent<JudgeChatMessage>('rc_judge_chat_new_message', { detail: newMsg })
  );

  // 3. Broadcast across Supabase Realtime channel
  try {
    const channel = getOrCreateJudgeChatChannel();
    channel.send({
      type: 'broadcast',
      event: 'new_chat_message',
      payload: newMsg,
    });
  } catch (err) {
    console.warn('Realtime chat broadcast failed:', err);
  }

  // 4. Persist to Supabase table if it exists
  try {
    const { error } = await supabase.from('judge_chat_messages').insert([
      {
        id: newMsg.id,
        sender_id: newMsg.senderId,
        sender_name: newMsg.senderName,
        sender_role: newMsg.senderRole,
        sender_avatar: newMsg.senderAvatar || '⚖️',
        message: newMsg.message,
        participant_id: newMsg.participantId || null,
        participant_name: newMsg.participantName || null,
        created_at: newMsg.createdAt,
      },
    ]);

    if (error) {
      console.warn(
        'Database insert for judge_chat_messages failed (falling back to Realtime Broadcast + Local):',
        error.message
      );
    }
  } catch {
    // Graceful fallback
  }

  return { data: newMsg, error: null };
}

/**
 * Subscribe to realtime judge chat messages
 */
export function subscribeToJudgeChat(
  onNewMessage: (msg: JudgeChatMessage) => void
): () => void {
  getOrCreateJudgeChatChannel();
  judgeChatListeners.add(onNewMessage);

  // Listen to Postgres changes if table exists
  let pgChannel: RealtimeChannel | null = null;
  try {
    const pgChannelName = `judge_chat_pg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    pgChannel = supabase
      .channel(pgChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'judge_chat_messages' },
        (payload) => {
          if (payload.new) {
            const item = payload.new as any;
            const msg: JudgeChatMessage = {
              id: String(item.id),
              senderId: item.sender_id || item.senderId || 'unknown',
              senderName: item.sender_name || item.senderName || 'Juri',
              senderRole: item.sender_role || item.senderRole || 'juri',
              senderAvatar: item.sender_avatar || item.senderAvatar || '⚖️',
              message: item.message || '',
              participantId: item.participant_id || item.participantId || undefined,
              participantName: item.participant_name || item.participantName || undefined,
              createdAt: item.created_at || item.createdAt || new Date().toISOString(),
            };
            const current = getLocalJudgeChat();
            if (!current.some((m) => m.id === msg.id)) {
              saveLocalJudgeChat([...current, msg]);
              onNewMessage(msg);
            }
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Postgres changes for judge_chat_messages not available:', err);
  }

  // Listen to local tab event
  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<JudgeChatMessage>;
    if (custom.detail) {
      onNewMessage(custom.detail);
    }
  };
  window.addEventListener('rc_judge_chat_new_message', handleLocal);

  return () => {
    judgeChatListeners.delete(onNewMessage);
    window.removeEventListener('rc_judge_chat_new_message', handleLocal);
    if (pgChannel) {
      supabase.removeChannel(pgChannel);
    }
  };
}

/**
 * Superadmin reset chat messages
 */
export async function clearJudgeChatMessages(): Promise<{ success: boolean; error: string | null }> {
  try {
    localStorage.removeItem(LOCAL_CHAT_KEY);
    await supabase.from('judge_chat_messages').delete().neq('id', 'placeholder');
    window.dispatchEvent(new CustomEvent('rc_judge_chat_cleared'));
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error clearing chat' };
  }
}

// ==========================================
// EVENTS CMS & MULTI-EVENT MANAGEMENT
// ==========================================

async function getSupabaseDeletedEventIds(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('event_settings')
      .select('official_winners')
      .eq('id', 'meta:deleted_events')
      .maybeSingle();

    if (data?.official_winners && typeof data.official_winners === 'object') {
      const ids = (data.official_winners as any).deletedIds;
      if (Array.isArray(ids)) {
        return ids.map(String);
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export async function fetchEvents(): Promise<{ data: RCEvent[]; isRealtime: boolean; error: string | null }> {
  try {
    // 0. Load deleted event IDs from both local and database metadata
    const localDeleted = getLocalDeletedEventIds();
    const remoteDeleted = await getSupabaseDeletedEventIds();
    const allDeletedIds = new Set<string>([...localDeleted, ...remoteDeleted]);
    if (remoteDeleted.length > 0) {
      saveLocalDeletedEventIds(Array.from(allDeletedIds));
    }

    // 1. Try Supabase dedicated relational 'events' table
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // If table exists but is empty and no event was ever deleted, seed initial events
        if (data.length === 0 && allDeletedIds.size === 0) {
          try {
            const seedRows = INITIAL_EVENTS.map((ev) => ({
              id: ev.id,
              slug: ev.slug,
              title: ev.title,
              subtitle: ev.subtitle || '',
              category: ev.category,
              status: ev.status,
              start_date: ev.startDate,
              end_date: ev.endDate || null,
              time: ev.time,
              venue: ev.venue,
              max_participants: ev.maxParticipants,
              registration_deadline: ev.registrationDeadline,
              description: ev.description,
              rules_summary: ev.rulesSummary || [],
              poster_url: ev.posterUrl || '',
              banner_url: ev.bannerUrl || '',
              prizes: ev.prizes,
              judges: ev.judges || [],
              winners: ev.winners || [],
              is_featured: Boolean(ev.isFeatured),
              created_at: ev.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));
            await supabase.from('events').upsert(seedRows);
            saveLocalEvents(INITIAL_EVENTS);
            return { data: INITIAL_EVENTS, isRealtime: true, error: null };
          } catch (seedErr) {
            console.warn('Failed to seed events table:', seedErr);
          }
        }

        const filtered = data.filter((item: any) => !allDeletedIds.has(item.id));
        const mapped: RCEvent[] = filtered.map((item: any) => ({
          id: item.id,
          slug: item.slug || item.id,
          title: item.title || item.name || 'Event RC',
          subtitle: item.subtitle || '',
          category: item.category || 'Lomba Musik & Vokal',
          status: (item.status || 'open') as any,
          startDate: item.start_date || item.startDate || '2026-09-13',
          endDate: item.end_date || item.endDate || undefined,
          time: item.time || '10:00 WIB',
          venue: item.venue || 'Live Room RC',
          maxParticipants: item.max_participants || item.maxParticipants || 50,
          registrationDeadline: item.registration_deadline || item.registrationDeadline || '2026-09-12 23:59 WIB',
          description: item.description || '',
          rulesSummary: item.rules_summary || item.rulesSummary || [],
          posterUrl: item.poster_url || item.posterUrl || '',
          bannerUrl: item.banner_url || item.bannerUrl || '',
          prizes: item.prizes || {
            juara1: 'Rp 1.500.000 + E-Sertifikat + Trophy',
            juara2: 'Rp 1.000.000 + E-Sertifikat',
            juara3: 'Rp 500.000 + E-Sertifikat',
          },
          judges: item.judges || [],
          winners: item.winners || [],
          isFeatured: item.is_featured ?? item.isFeatured ?? false,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
        }));

        saveLocalEvents(mapped);
        return { data: mapped, isRealtime: true, error: null };
      }
    } catch (e) {
      // events table doesn't exist yet, continue to fallback
    }

    // 2. Query Supabase database event_settings table where id LIKE 'event:%'
    const { data: settingsEvents, error: errSettings } = await supabase
      .from('event_settings')
      .select('*')
      .like('id', 'event:%')
      .order('updated_at', { ascending: false });

    if (!errSettings && Array.isArray(settingsEvents)) {
      // If no event rows found at all in DB and nothing has been deleted, seed initial events
      if (settingsEvents.length === 0 && allDeletedIds.size === 0) {
        for (const ev of INITIAL_EVENTS) {
          try {
            await supabase.from('event_settings').upsert({
              id: 'event:' + ev.id,
              event_title: ev.title,
              event_sub_title: ev.subtitle || '',
              event_date: ev.startDate,
              venue_or_room: ev.venue,
              is_registration_open: ev.status === 'open',
              active_round: ev.category,
              broadcast_notice: ev.description,
              official_winners: ev,
              updated_at: new Date().toISOString(),
            });
          } catch (e) {}
        }
        saveLocalEvents(INITIAL_EVENTS);
        return { data: INITIAL_EVENTS, isRealtime: true, error: null };
      }

      const mappedFromDb: RCEvent[] = settingsEvents
        .filter((row: any) => {
          const raw = (row.official_winners && typeof row.official_winners === 'object' ? row.official_winners : {}) as Partial<RCEvent>;
          const rawId = raw.id || row.id.replace(/^event:/, '');
          return !allDeletedIds.has(rawId);
        })
        .map((row: any) => {
          const raw = (row.official_winners && typeof row.official_winners === 'object' ? row.official_winners : {}) as Partial<RCEvent>;

          // Safely normalize judges into string array
          let normalizedJudges: string[] = [];
          if (Array.isArray(raw.judges)) {
            normalizedJudges = raw.judges
              .map((j: any) => (typeof j === 'string' ? j : j?.name || ''))
              .filter(Boolean);
          } else if (typeof raw.judges === 'string') {
            normalizedJudges = (raw.judges as string).split(',').map((s) => s.trim()).filter(Boolean);
          } else {
            normalizedJudges = ['Bunda Corla', 'Kak David', 'Mbak Tiara', 'Bang Jono'];
          }

          // Safely normalize rules
          let normalizedRules: string[] = [];
          if (Array.isArray(raw.rulesSummary)) {
            normalizedRules = raw.rulesSummary.map(String).filter(Boolean);
          } else if (typeof raw.rulesSummary === 'string') {
            normalizedRules = (raw.rulesSummary as string).split('\n').map((s) => s.trim()).filter(Boolean);
          } else {
            normalizedRules = [
              'Terbuka untuk seluruh member keluarga Fams & umum.',
              'Lagu idola bebas dengan audio minus-one berkualitas baik.',
              'Keputusan dewan juri bersifat mutlak dan tidak dapat diganggu gugat.',
            ];
          }

          // Safely normalize winners
          const normalizedWinners: any[] = Array.isArray(raw.winners) ? raw.winners : [];

          // Safely normalize prizes
          const rawPrizes: Partial<EventPrize> = raw.prizes || {};
          const normalizedPrizes = {
            juara1: rawPrizes.juara1 || 'Rp 1.500.000 + E-Sertifikat + Trophy Emas',
            juara2: rawPrizes.juara2 || 'Rp 1.000.000 + E-Sertifikat + Trophy Perak',
            juara3: rawPrizes.juara3 || 'Rp 500.000 + E-Sertifikat + Trophy Perunggu',
            harapan: rawPrizes.harapan,
            favorit: rawPrizes.favorit,
          };

          const eventId = raw.id || row.id.replace(/^event:/, '');
          const isDefaultEvent = eventId === 'rc-virgo-party-2026' || eventId === 'default_settings';

          return {
            id: isDefaultEvent ? 'rc-virgo-party-2026' : eventId,
            slug: raw.slug || (isDefaultEvent ? 'virgo-party-2026' : eventId),
            title: raw.title || row.event_title || (isDefaultEvent ? 'RC Birthday Celebration & Virgo Party' : 'Event RC'),
            subtitle: raw.subtitle || row.event_sub_title || (isDefaultEvent ? 'Event Nyanyi Mirip Idola • Edisi Spesial Ulang Tahun Rainbow Candy' : ''),
            category: raw.category || row.active_round || 'Lomba Nyanyi Mirip Idola',
            status: (raw.status || (row.is_registration_open ? 'open' : 'ended')) as any,
            startDate: raw.startDate || row.event_date || '2026-09-13',
            endDate: raw.endDate || undefined,
            time: raw.time || '10:00 WIB',
            venue: raw.venue || row.venue_or_room || 'Panggung Utama Live Room Rainbow Candy',
            maxParticipants: Number(raw.maxParticipants) || 50,
            registrationDeadline: raw.registrationDeadline || '2026-09-12 23:59 WIB',
            description: raw.description || row.broadcast_notice || 'Kompetisi bernyanyi dalam rangka perayaan Rainbow Candy.',
            rulesSummary: normalizedRules,
            posterUrl: raw.posterUrl || '',
            bannerUrl: raw.bannerUrl || '',
            prizes: normalizedPrizes,
            judges: normalizedJudges,
            winners: normalizedWinners,
            isFeatured: isDefaultEvent ? true : Boolean(raw.isFeatured),
            createdAt: raw.createdAt || row.updated_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          };
        });

      saveLocalEvents(mappedFromDb);
      return { data: mappedFromDb, isRealtime: true, error: null };
    }
  } catch (err) {
    console.warn('Supabase fetch events error (fallback to local):', err);
  }

  return { data: getLocalEvents(), isRealtime: false, error: null };
}

export async function saveEvent(
  event: RCEvent,
  actorName: string = 'Superadmin'
): Promise<{ success: boolean; data?: RCEvent; error?: string }> {
  // Normalize judges and rules before saving
  const normalizedJudges = Array.isArray(event.judges)
    ? event.judges.map((j: any) => (typeof j === 'string' ? j : j?.name || '')).filter(Boolean)
    : typeof event.judges === 'string'
    ? (event.judges as string).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const normalizedRules = Array.isArray(event.rulesSummary)
    ? event.rulesSummary.map(String).filter(Boolean)
    : typeof event.rulesSummary === 'string'
    ? (event.rulesSummary as string).split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  const cleanEvent: RCEvent = {
    ...event,
    judges: normalizedJudges,
    rulesSummary: normalizedRules,
    winners: Array.isArray(event.winners) ? event.winners : [],
    updatedAt: new Date().toISOString(),
  };

  // If this event was previously marked deleted, un-delete it
  const localDeleted = getLocalDeletedEventIds();
  if (localDeleted.includes(cleanEvent.id)) {
    const nextDeleted = localDeleted.filter((id) => id !== cleanEvent.id);
    saveLocalDeletedEventIds(nextDeleted);
    try {
      await supabase.from('event_settings').upsert({
        id: 'meta:deleted_events',
        official_winners: { deletedIds: nextDeleted },
        updated_at: new Date().toISOString(),
      });
    } catch (e) {}
  }

  const current = getLocalEvents();
  const index = current.findIndex((e) => e.id === cleanEvent.id);

  let updatedList: RCEvent[];
  if (index >= 0) {
    updatedList = current.map((e, i) => (i === index ? cleanEvent : e));
  } else {
    updatedList = [cleanEvent, ...current];
  }

  saveLocalEvents(updatedList);

  try {
    // 1. Save into Supabase database event_settings table with full schema
    const dbRow = {
      id: 'event:' + cleanEvent.id,
      event_title: cleanEvent.title,
      event_sub_title: cleanEvent.subtitle || '',
      event_date: cleanEvent.startDate,
      venue_or_room: cleanEvent.venue,
      is_registration_open: cleanEvent.status === 'open',
      active_round: cleanEvent.category,
      broadcast_notice: cleanEvent.description,
      official_winners: cleanEvent,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('event_settings').upsert(dbRow);

    // If this is the main RC Birthday Celebration & Virgo Party or featured event, sync with default_settings
    if (cleanEvent.id === 'rc-virgo-party-2026' || cleanEvent.isFeatured) {
      await supabase.from('event_settings').upsert({
        id: 'default_settings',
        event_title: cleanEvent.title,
        event_sub_title: cleanEvent.subtitle || '',
        event_date: cleanEvent.startDate,
        venue_or_room: cleanEvent.venue,
        is_registration_open: cleanEvent.status === 'open',
        active_round: cleanEvent.category,
        broadcast_notice: cleanEvent.description,
        official_winners: cleanEvent,
        updated_at: new Date().toISOString(),
      });
    }

    // 2. Also attempt saving into dedicated events table if created
    try {
      await supabase.from('events').upsert({
        id: cleanEvent.id,
        slug: cleanEvent.slug || cleanEvent.id,
        title: cleanEvent.title,
        subtitle: cleanEvent.subtitle || '',
        category: cleanEvent.category,
        status: cleanEvent.status,
        start_date: cleanEvent.startDate,
        end_date: cleanEvent.endDate || null,
        time: cleanEvent.time,
        venue: cleanEvent.venue,
        max_participants: cleanEvent.maxParticipants,
        registration_deadline: cleanEvent.registrationDeadline,
        description: cleanEvent.description,
        rules_summary: cleanEvent.rulesSummary || [],
        poster_url: cleanEvent.posterUrl || '',
        banner_url: cleanEvent.bannerUrl || '',
        prizes: cleanEvent.prizes,
        judges: cleanEvent.judges || [],
        winners: cleanEvent.winners || [],
        is_featured: Boolean(cleanEvent.isFeatured),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      // ignore if table not created yet
    }
  } catch (err: any) {
    console.warn('Supabase save event exception:', err);
  }

  addAuditLog(
    actorName,
    index >= 0 ? 'UPDATE_EVENT' : 'CREATE_EVENT',
    `Menyimpan data event: ${cleanEvent.title} [Status: ${cleanEvent.status}]`,
    cleanEvent.id
  );
  return { success: true, data: cleanEvent };
}

export async function deleteEvent(
  eventId: string,
  actorName: string = 'Superadmin'
): Promise<{ success: boolean; error?: string }> {
  // 1. Immediately record in deleted event IDs locally
  const currentDeleted = getLocalDeletedEventIds();
  const updatedDeleted = Array.from(new Set([...currentDeleted, eventId]));
  saveLocalDeletedEventIds(updatedDeleted);

  // 2. Remove from local memory and cache
  const current = getLocalEvents();
  const target = current.find((e) => e.id === eventId);
  const updatedList = current.filter((e) => e.id !== eventId);
  saveLocalEvents(updatedList);

  // 3. Persist deletion in Supabase
  try {
    // Save to deleted metadata table so it NEVER resurrects
    const remoteDeleted = await getSupabaseDeletedEventIds();
    const mergedDeleted = Array.from(new Set([...remoteDeleted, ...updatedDeleted]));
    await supabase.from('event_settings').upsert({
      id: 'meta:deleted_events',
      official_winners: { deletedIds: mergedDeleted },
      updated_at: new Date().toISOString(),
    });

    // Delete from event_settings table
    await supabase.from('event_settings').delete().eq('id', 'event:' + eventId);

    // Also delete from dedicated events table if created
    try {
      await supabase.from('events').delete().eq('id', eventId);
    } catch (e) {
      // ignore
    }
  } catch (err: any) {
    console.warn('Supabase delete event exception:', err);
  }

  addAuditLog(actorName, 'DELETE_EVENT', `Menghapus event: ${target?.title || eventId}`, eventId);
  return { success: true };
}

export function subscribeToEvents(callback: (events: RCEvent[]) => void): () => void {
  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<RCEvent[]>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  window.addEventListener('rc_events_updated', handleLocal);

  // Supabase real-time channel for event_settings with unique channel name
  let channelSettings: RealtimeChannel | null = null;
  let channelEvents: RealtimeChannel | null = null;
  try {
    const chName1 = `events_set_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    channelSettings = supabase
      .channel(chName1)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_settings' },
        () => {
          fetchEvents().then((res) => {
            if (res.data) {
              callback(res.data);
            }
          });
        }
      )
      .subscribe();

    const chName2 = `events_tbl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    channelEvents = supabase
      .channel(chName2)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchEvents().then((res) => {
            if (res.data) {
              callback(res.data);
            }
          });
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Realtime events subscription fallback:', err);
  }

  return () => {
    window.removeEventListener('rc_events_updated', handleLocal);
    if (channelSettings) {
      supabase.removeChannel(channelSettings);
    }
    if (channelEvents) {
      supabase.removeChannel(channelEvents);
    }
  };
}

/**
 * Diagnostic utility: Probes all database tables in Supabase
 * Returns real-time status of each table
 */
export async function checkDatabaseTables(): Promise<Record<string, 'online' | 'missing'>> {
  const tables = [
    'events',
    'fams_profile',
    'fams_members',
    'participants',
    'scores',
    'admin_users',
    'event_settings',
    'audit_logs',
    'judge_chat_messages',
  ];
  const results: Record<string, 'online' | 'missing'> = {};

  await Promise.all(
    tables.map(async (tableName) => {
      try {
        const { error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
        results[tableName] = error ? 'missing' : 'online';
      } catch (e) {
        results[tableName] = 'missing';
      }
    })
  );

  return results;
}
