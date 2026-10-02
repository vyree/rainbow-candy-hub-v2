import { supabase } from './supabaseClient';
import {
  FamsProfileData,
  FamsMember,
  INITIAL_FAMS_PROFILE,
  INITIAL_FAMS_MEMBERS,
} from '../types/fams';

const FAMS_PROFILE_KEY = 'fams_profile_data';
const FAMS_MEMBERS_KEY = 'fams_members_data';
const FAMS_PROFILE_ROW_ID = 'rainbow_candy_official';

const LOCAL_STORAGE_FAMS_PROFILE = 'rc_fams_profile_cache';
const LOCAL_STORAGE_FAMS_MEMBERS = 'rc_fams_members_cache';

/**
 * Fetch Fams Profile data from Supabase
 * Prioritizes structured `fams_profile` table, with seamless migration & fallback to `event_settings`
 */
export async function fetchFamsProfile(): Promise<{
  data: FamsProfileData;
  isRealtime: boolean;
  error: string | null;
}> {
  try {
    // 1. Try fetching from structured `fams_profile` table
    try {
      const { data: profileRow, error: pErr } = await supabase
        .from('fams_profile')
        .select('*')
        .eq('id', FAMS_PROFILE_ROW_ID)
        .maybeSingle();

      if (!pErr && profileRow) {
        const mappedProfile: FamsProfileData = {
          ...INITIAL_FAMS_PROFILE,
          name: profileRow.name || INITIAL_FAMS_PROFILE.name,
          tagline: profileRow.tagline || INITIAL_FAMS_PROFILE.tagline,
          description: profileRow.description || INITIAL_FAMS_PROFILE.description,
          foundedYear: profileRow.founded_year || INITIAL_FAMS_PROFILE.foundedYear,
          history: profileRow.history || INITIAL_FAMS_PROFILE.history,
          philosophy: profileRow.philosophy || INITIAL_FAMS_PROFILE.philosophy,
          vision: profileRow.vision || INITIAL_FAMS_PROFILE.vision,
          mission: Array.isArray(profileRow.mission) ? profileRow.mission : INITIAL_FAMS_PROFILE.mission,
          programs: Array.isArray(profileRow.programs) ? profileRow.programs : INITIAL_FAMS_PROFILE.programs,
          milestones: Array.isArray(profileRow.milestones) ? profileRow.milestones : INITIAL_FAMS_PROFILE.milestones,
          stats: profileRow.stats && typeof profileRow.stats === 'object' ? profileRow.stats : INITIAL_FAMS_PROFILE.stats,
          socialLinks: profileRow.social_links && typeof profileRow.social_links === 'object' ? profileRow.social_links : INITIAL_FAMS_PROFILE.socialLinks,
          contacts: profileRow.contacts && typeof profileRow.contacts === 'object' ? profileRow.contacts : INITIAL_FAMS_PROFILE.contacts,
          updatedAt: profileRow.updated_at || new Date().toISOString(),
        };

        try {
          localStorage.setItem(LOCAL_STORAGE_FAMS_PROFILE, JSON.stringify(mappedProfile));
        } catch (e) {
          // ignore
        }
        return { data: mappedProfile, isRealtime: true, error: null };
      }
    } catch (tblErr) {
      // fams_profile table might not exist yet, fallback to event_settings
    }

    // 2. Fallback to event_settings table and auto-migrate
    const { data, error } = await supabase
      .from('event_settings')
      .select('*')
      .eq('id', FAMS_PROFILE_KEY)
      .maybeSingle();

    if (!error && data && data.official_winners) {
      const profile: FamsProfileData = {
        ...INITIAL_FAMS_PROFILE,
        ...(data.official_winners as Partial<FamsProfileData>),
        updatedAt: data.updated_at || new Date().toISOString(),
      };

      // Auto-migrate to structured `fams_profile` table
      try {
        await supabase.from('fams_profile').upsert({
          id: FAMS_PROFILE_ROW_ID,
          name: profile.name,
          tagline: profile.tagline,
          description: profile.description,
          founded_year: profile.foundedYear,
          history: profile.history,
          philosophy: profile.philosophy,
          vision: profile.vision,
          mission: profile.mission,
          programs: profile.programs,
          milestones: profile.milestones,
          stats: profile.stats,
          social_links: profile.socialLinks,
          contacts: profile.contacts,
          updated_at: profile.updatedAt,
        });
      } catch (migErr) {
        // ignore
      }

      // Cache locally
      try {
        localStorage.setItem(LOCAL_STORAGE_FAMS_PROFILE, JSON.stringify(profile));
      } catch (e) {
        // ignore quota errors
      }
      return { data: profile, isRealtime: true, error: null };
    }

    // If not in database yet, auto-seed to both tables!
    await seedFamsProfile(INITIAL_FAMS_PROFILE);
    return { data: INITIAL_FAMS_PROFILE, isRealtime: true, error: null };
  } catch (err: any) {
    console.warn('fetchFamsProfile falling back to cache:', err);
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_FAMS_PROFILE);
      if (cached) {
        return { data: JSON.parse(cached), isRealtime: false, error: err.message };
      }
    } catch (e) {
      // ignore
    }
    return { data: INITIAL_FAMS_PROFILE, isRealtime: false, error: err.message };
  }
}

/**
 * Save Fams Profile data to Supabase
 * Writes to both `fams_profile` (scalable schema) and `event_settings` (dual-write sync)
 */
export async function saveFamsProfile(
  profile: FamsProfileData,
  actorName: string = 'Superadmin'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updatedProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    // 1. Structured table upsert
    try {
      await supabase.from('fams_profile').upsert({
        id: FAMS_PROFILE_ROW_ID,
        name: updatedProfile.name,
        tagline: updatedProfile.tagline,
        description: updatedProfile.description,
        founded_year: updatedProfile.foundedYear,
        history: updatedProfile.history,
        philosophy: updatedProfile.philosophy,
        vision: updatedProfile.vision,
        mission: updatedProfile.mission,
        programs: updatedProfile.programs,
        milestones: updatedProfile.milestones,
        stats: updatedProfile.stats,
        social_links: updatedProfile.socialLinks,
        contacts: updatedProfile.contacts,
        updated_at: updatedProfile.updatedAt,
      });
    } catch (pErr) {
      console.warn('Upsert to fams_profile table error (falling back to event_settings):', pErr);
    }

    // 2. Dual-write to event_settings for compatibility
    const row = {
      id: FAMS_PROFILE_KEY,
      event_title: profile.name,
      event_sub_title: profile.tagline,
      broadcast_notice: profile.description,
      is_registration_open: true,
      official_winners: updatedProfile,
      updated_at: updatedProfile.updatedAt,
    };

    const { error } = await supabase.from('event_settings').upsert(row);

    if (error) {
      console.error('Supabase error saving fams profile to event_settings:', error);
    }

    // Cache locally
    try {
      localStorage.setItem(LOCAL_STORAGE_FAMS_PROFILE, JSON.stringify(updatedProfile));
    } catch (e) {
      // ignore
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert([
        {
          id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4),
          timestamp: new Date().toISOString(),
          actor_name: actorName,
          action: 'UPDATE_FAMS_PROFILE',
          details: `Memperbarui profil Fams Rainbow Candy (${profile.name})`,
          target_id: FAMS_PROFILE_KEY,
        },
      ]);
    } catch (e) {
      // ignore log failure
    }

    // Broadcast local event
    window.dispatchEvent(new CustomEvent('rc_fams_profile_updated', { detail: updatedProfile }));

    return { success: true, error: null };
  } catch (err: any) {
    // Fallback save to local storage
    try {
      localStorage.setItem(LOCAL_STORAGE_FAMS_PROFILE, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('rc_fams_profile_updated', { detail: profile }));
    } catch (e) {
      // ignore
    }
    return { success: false, error: err.message || 'Gagal menyimpan ke database' };
  }
}

/**
 * Seed initial fams profile to Supabase if not yet present
 */
async function seedFamsProfile(profile: FamsProfileData) {
  try {
    try {
      await supabase.from('fams_profile').upsert({
        id: FAMS_PROFILE_ROW_ID,
        name: profile.name,
        tagline: profile.tagline,
        description: profile.description,
        founded_year: profile.foundedYear,
        history: profile.history,
        philosophy: profile.philosophy,
        vision: profile.vision,
        mission: profile.mission,
        programs: profile.programs,
        milestones: profile.milestones,
        stats: profile.stats,
        social_links: profile.socialLinks,
        contacts: profile.contacts,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      // ignore
    }

    const row = {
      id: FAMS_PROFILE_KEY,
      event_title: profile.name,
      event_sub_title: profile.tagline,
      broadcast_notice: profile.description,
      is_registration_open: true,
      official_winners: profile,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('event_settings').upsert(row);
  } catch (e) {
    console.warn('seedFamsProfile error:', e);
  }
}

/**
 * Fetch Fams Members from Supabase
 * Prioritizes relational `fams_members` table, with auto-migration from `event_settings`
 */
export async function fetchFamsMembers(): Promise<{
  data: FamsMember[];
  isRealtime: boolean;
  error: string | null;
}> {
  try {
    // 1. Try fetching from dedicated relational `fams_members` table
    try {
      const { data: memberRows, error: mErr } = await supabase
        .from('fams_members')
        .select('*')
        .order('order_index', { ascending: true });

      if (!mErr && memberRows && memberRows.length > 0) {
        const mappedMembers: FamsMember[] = memberRows.map((r: any) => ({
          id: r.id,
          name: r.name,
          familyTitle: r.family_title || r.familyTitle || 'Anggota',
          division: r.division || 'Divisi Kreatif',
          role: r.role || 'Member',
          department: r.department || 'member',
          tier: r.tier || 'regular',
          avatar: r.avatar || '👤',
          bio: r.bio || '',
          phone: r.phone || '',
          email: r.email || '',
          instagram: r.instagram || '',
          joinDate: r.join_date || r.joinDate || '2021',
          orderIndex: typeof r.order_index === 'number' ? r.order_index : r.orderIndex || 0,
          isActive: r.is_active !== undefined ? r.is_active : r.isActive !== false,
        }));

        try {
          localStorage.setItem(LOCAL_STORAGE_FAMS_MEMBERS, JSON.stringify(mappedMembers));
        } catch (e) {
          // ignore
        }
        return { data: mappedMembers, isRealtime: true, error: null };
      }
    } catch (tblErr) {
      // fams_members table might not exist yet, fallback to event_settings
    }

    // 2. Query fallback from event_settings
    const { data, error } = await supabase
      .from('event_settings')
      .select('*')
      .eq('id', FAMS_MEMBERS_KEY)
      .maybeSingle();

    if (!error && data && data.official_winners && Array.isArray((data.official_winners as any).members)) {
      const members = (data.official_winners as any).members as FamsMember[];
      
      // Auto-migrate to structured `fams_members` table
      try {
        const rows = members.map((m) => ({
          id: m.id,
          name: m.name,
          family_title: m.familyTitle,
          division: m.division,
          role: m.role,
          avatar: m.avatar || '👤',
          bio: m.bio || '',
          phone: m.phone || '',
          email: m.email || '',
          instagram: m.instagram || '',
          join_date: m.joinDate || '',
          order_index: m.orderIndex || 0,
          is_active: m.isActive !== false,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('fams_members').upsert(rows);
      } catch (migErr) {
        // ignore
      }

      try {
        localStorage.setItem(LOCAL_STORAGE_FAMS_MEMBERS, JSON.stringify(members));
      } catch (e) {
        // ignore
      }
      return { data: members, isRealtime: true, error: null };
    }

    // Seed default members if none in DB
    await seedFamsMembers(INITIAL_FAMS_MEMBERS);
    return { data: INITIAL_FAMS_MEMBERS, isRealtime: true, error: null };
  } catch (err: any) {
    console.warn('fetchFamsMembers falling back to cache:', err);
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_FAMS_MEMBERS);
      if (cached) {
        return { data: JSON.parse(cached), isRealtime: false, error: err.message };
      }
    } catch (e) {
      // ignore
    }
    return { data: INITIAL_FAMS_MEMBERS, isRealtime: false, error: err.message };
  }
}

/**
 * Save Fams Members to Supabase
 * Writes directly to `fams_members` relational table and dual-writes to `event_settings`
 */
export async function saveFamsMembers(
  members: FamsMember[],
  actorName: string = 'Superadmin'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const sortedMembers = [...members].sort((a, b) => a.orderIndex - b.orderIndex);

    // 1. Relational table upsert
    try {
      const memberRows = sortedMembers.map((m) => ({
        id: m.id,
        name: m.name,
        family_title: m.familyTitle,
        division: m.division,
        role: m.role,
        avatar: m.avatar || '👤',
        bio: m.bio || '',
        phone: m.phone || '',
        email: m.email || '',
        instagram: m.instagram || '',
        join_date: m.joinDate || '',
        order_index: m.orderIndex || 0,
        is_active: m.isActive !== false,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('fams_members').upsert(memberRows);
    } catch (mErr) {
      console.warn('Upsert to fams_members table error (falling back to event_settings):', mErr);
    }

    // 2. Dual-write to event_settings
    const row = {
      id: FAMS_MEMBERS_KEY,
      event_title: 'Daftar Anggota Rainbow Candy Fams',
      event_sub_title: `Total ${members.length} Anggota`,
      is_registration_open: true,
      official_winners: {
        members: sortedMembers,
        updatedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('event_settings').upsert(row);

    if (error) {
      console.error('Supabase error saving fams members:', error);
    }

    // Cache locally
    try {
      localStorage.setItem(LOCAL_STORAGE_FAMS_MEMBERS, JSON.stringify(sortedMembers));
    } catch (e) {
      // ignore
    }

    // Log audit
    try {
      await supabase.from('audit_logs').insert([
        {
          id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4),
          timestamp: new Date().toISOString(),
          actor_name: actorName,
          action: 'UPDATE_FAMS_MEMBERS',
          details: `Memperbarui daftar anggota Fams (${members.length} anggota)`,
          target_id: FAMS_MEMBERS_KEY,
        },
      ]);
    } catch (e) {
      // ignore
    }

    // Broadcast local event
    window.dispatchEvent(new CustomEvent('rc_fams_members_updated', { detail: sortedMembers }));

    return { success: true, error: null };
  } catch (err: any) {
    try {
      localStorage.setItem(LOCAL_STORAGE_FAMS_MEMBERS, JSON.stringify(members));
      window.dispatchEvent(new CustomEvent('rc_fams_members_updated', { detail: members }));
    } catch (e) {
      // ignore
    }
    return { success: false, error: err.message || 'Gagal menyimpan ke database' };
  }
}

/**
 * Seed initial fams members to Supabase if not yet present
 */
async function seedFamsMembers(members: FamsMember[]) {
  try {
    try {
      const memberRows = members.map((m) => ({
        id: m.id,
        name: m.name,
        family_title: m.familyTitle,
        division: m.division,
        role: m.role,
        avatar: m.avatar || '👤',
        bio: m.bio || '',
        phone: m.phone || '',
        email: m.email || '',
        instagram: m.instagram || '',
        join_date: m.joinDate || '',
        order_index: m.orderIndex || 0,
        is_active: m.isActive !== false,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('fams_members').upsert(memberRows);
    } catch (e) {
      // ignore
    }

    const row = {
      id: FAMS_MEMBERS_KEY,
      event_title: 'Daftar Anggota Rainbow Candy Fams',
      event_sub_title: `Total ${members.length} Anggota`,
      is_registration_open: true,
      official_winners: {
        members,
        updatedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };
    await supabase.from('event_settings').upsert(row);
  } catch (e) {
    console.warn('seedFamsMembers error:', e);
  }
}

/**
 * Subscribe to realtime changes on Fams profile & members
 */
export function subscribeToFamsData(
  onProfileChange: (profile: FamsProfileData) => void,
  onMembersChange: (members: FamsMember[]) => void
): () => void {
  // Listen for local custom events (instant reactivity across components)
  const handleProfileEvent = (e: any) => {
    if (e.detail) onProfileChange(e.detail);
  };
  const handleMembersEvent = (e: any) => {
    if (e.detail) onMembersChange(e.detail);
  };

  window.addEventListener('rc_fams_profile_updated', handleProfileEvent);
  window.addEventListener('rc_fams_members_updated', handleMembersEvent);

  // Supabase real-time channels with unique channel names
  let channelSettings: any = null;
  let channelProfile: any = null;
  let channelMembers: any = null;

  try {
    // 1. Channel for event_settings fallback
    const channelNameSettings = `fams_settings_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    channelSettings = supabase
      .channel(channelNameSettings)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_settings' },
        (payload) => {
          const row = payload.new as any;
          if (row && row.id === FAMS_PROFILE_KEY && row.official_winners) {
            onProfileChange({
              ...INITIAL_FAMS_PROFILE,
              ...row.official_winners,
              updatedAt: row.updated_at || new Date().toISOString(),
            });
          } else if (
            row &&
            row.id === FAMS_MEMBERS_KEY &&
            row.official_winners &&
            Array.isArray(row.official_winners.members)
          ) {
            onMembersChange(row.official_winners.members);
          }
        }
      )
      .subscribe();

    // 2. Channel for structured fams_profile table
    const channelNameProfile = `fams_profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    channelProfile = supabase
      .channel(channelNameProfile)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fams_profile' },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            fetchFamsProfile().then((res) => {
              if (res.data) onProfileChange(res.data);
            });
          }
        }
      )
      .subscribe();

    // 3. Channel for structured fams_members table
    const channelNameMembers = `fams_members_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    channelMembers = supabase
      .channel(channelNameMembers)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fams_members' },
        () => {
          fetchFamsMembers().then((res) => {
            if (res.data) onMembersChange(res.data);
          });
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Realtime Fams subscription fallback:', err);
  }

  return () => {
    window.removeEventListener('rc_fams_profile_updated', handleProfileEvent);
    window.removeEventListener('rc_fams_members_updated', handleMembersEvent);
    if (channelSettings) supabase.removeChannel(channelSettings);
    if (channelProfile) supabase.removeChannel(channelProfile);
    if (channelMembers) supabase.removeChannel(channelMembers);
  };
}

/**
 * Convenience wrapper for subscribing to Fams data
 */
export function subscribeToFams(options: {
  onProfileUpdate?: (profile: FamsProfileData) => void;
  onMembersUpdate?: (members: FamsMember[]) => void;
}): () => void {
  return subscribeToFamsData(
    (p) => options.onProfileUpdate?.(p),
    (m) => options.onMembersUpdate?.(m)
  );
}

