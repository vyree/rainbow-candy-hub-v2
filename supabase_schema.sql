-- ==============================================================================
-- DATABASE SCHEMA: RAINBOW CANDY - BIRTHDAY CELEBRATION & VIRGO PARTY 2026
-- Supabase PostgreSQL Relational Schema with Foreign Key Separation
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABEL PESERTA (participants)
-- ==============================================================================
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
    scores JSONB, -- Fallback / cached JSON object
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for fast participant lookups
CREATE INDEX IF NOT EXISTS idx_participants_order ON public.participants (order_number);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants (status);
CREATE INDEX IF NOT EXISTS idx_participants_total_score ON public.participants (total_score DESC);

-- ==============================================================================
-- 2. TABEL PENILAIAN / SCORES (scores) - Terpisah dengan FOREIGN KEY
-- Menyimpan detail point-by-point penilaian dari masing-masing dewan juri
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.scores (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE ON UPDATE CASCADE,
    judge_id TEXT NOT NULL,
    judge_name TEXT NOT NULL,
    
    -- Pilar Penilaian Audio (Point by Point)
    teknikalitas NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (teknikalitas >= 0.0 AND teknikalitas <= 30.0), -- Max 30% (Vokal & Teknik)
    kemiripan NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (kemiripan >= 0.0 AND kemiripan <= 30.0),       -- Max 30% (Kemiripan Idola)
    penjiwaan NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (penjiwaan >= 0.0 AND penjiwaan <= 20.0),       -- Max 20% (Penjiwaan & Rasa)
    presentasi NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (presentasi >= 0.0 AND presentasi <= 20.0),     -- Max 20% (Presentasi & Flow)
    total NUMERIC(5, 1) NOT NULL DEFAULT 0.0 CHECK (total >= 0.0 AND total <= 100.0),                 -- Total Max 100.0
    
    notes TEXT,                                                                                         -- Catatan / Feedback Juri
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- 1 Juri hanya memiliki 1 lembar nilai resmi per peserta
    CONSTRAINT uq_participant_judge UNIQUE (participant_id, judge_id)
);

-- Indexing for fast relational queries
CREATE INDEX IF NOT EXISTS idx_scores_participant_id ON public.scores (participant_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON public.scores (judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_total ON public.scores (total DESC);

-- ==============================================================================
-- 3. TABEL USER ADMIN & ROLES (admin_users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'panitia',
    role_title TEXT,
    avatar TEXT DEFAULT '👤',
    password TEXT NOT NULL DEFAULT 'rc-admin-2026',
    pin_code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_login TIMESTAMPTZ
);

-- ==============================================================================
-- 4. TABEL PENGATURAN EVENT & PANGGUNG (event_settings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_settings',
    event_title TEXT NOT NULL DEFAULT 'Rainbow Candy: Birthday Celebration & Virgo Party 2026',
    event_date DATE NOT NULL DEFAULT '2026-09-05',
    event_time TEXT NOT NULL DEFAULT '10:00 WIB',
    venue_or_room TEXT NOT NULL DEFAULT 'Ballroom Utama RC & Live Stage',
    is_registration_open BOOLEAN NOT NULL DEFAULT true,
    active_round TEXT NOT NULL DEFAULT 'pre_event',
    current_performing_id TEXT,
    youtube_teaser_url TEXT,
    broadcast_notice TEXT,
    official_winners JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABEL AUDIT LOGS (audit_logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    target_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);

-- ==============================================================================
-- 6. TRIGGER AUTO-UPDATE `updated_at`
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_participants_updated_at ON public.participants;
CREATE TRIGGER tr_participants_updated_at
    BEFORE UPDATE ON public.participants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_scores_updated_at ON public.scores;
CREATE TRIGGER tr_scores_updated_at
    BEFORE UPDATE ON public.scores
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow Full Access via Anon & Authenticated Keys for Application
CREATE POLICY "Allow public read on participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Allow public insert on participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on participants" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on participants" ON public.participants FOR DELETE USING (true);

CREATE POLICY "Allow public read on scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert on scores" ON public.scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on scores" ON public.scores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on scores" ON public.scores FOR DELETE USING (true);

CREATE POLICY "Allow public read on admin_users" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Allow public all on admin_users" ON public.admin_users FOR ALL USING (true);

CREATE POLICY "Allow public read on event_settings" ON public.event_settings FOR SELECT USING (true);
CREATE POLICY "Allow public all on event_settings" ON public.event_settings FOR ALL USING (true);

CREATE POLICY "Allow public read on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 8. REALTIME REPLICATION SETUP
-- ==============================================================================
-- ==============================================================================
-- 6. TABEL EVENT CMS (events) - Mengatur Multi Event Rainbow Candy
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'Lomba Musik & Vokal',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'ongoing', 'ended')),
    start_date TEXT NOT NULL,
    end_date TEXT,
    time TEXT NOT NULL DEFAULT '10:00 WIB',
    venue TEXT NOT NULL DEFAULT 'Panggung Utama Live Room RC',
    max_participants INTEGER NOT NULL DEFAULT 50,
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

-- ==============================================================================
-- 7. TABEL PROFIL FAMS (fams_profile) - Terstruktur & Scalable
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fams_profile (
    id TEXT PRIMARY KEY DEFAULT 'rainbow_candy_official',
    name TEXT NOT NULL DEFAULT 'Rainbow Candy Fams',
    tagline TEXT NOT NULL DEFAULT 'The House of Harmony, Celebration & Timeless Melody',
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

-- ==============================================================================
-- 8. TABEL ANGGOTA FAMS (fams_members) - Terstruktur Roster
-- ==============================================================================
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

CREATE INDEX IF NOT EXISTS idx_fams_members_order ON public.fams_members (order_index);
CREATE INDEX IF NOT EXISTS idx_fams_members_division ON public.fams_members (division);

-- ==============================================================================
-- 9. TABEL PESAN CHAT DEWAN JURI & PANITIA (judge_chat_messages)
-- ==============================================================================
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

-- Enable RLS & Realtime Policies for new tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fams_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fams_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on events" ON public.events FOR ALL USING (true);
CREATE POLICY "Allow public all on fams_profile" ON public.fams_profile FOR ALL USING (true);
CREATE POLICY "Allow public all on fams_members" ON public.fams_members FOR ALL USING (true);
CREATE POLICY "Allow public all on judge_chat_messages" ON public.judge_chat_messages FOR ALL USING (true);

-- Migration: Menambahkan event_id ke participants jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participants' 
        AND column_name = 'event_id'
    ) THEN
        ALTER TABLE public.participants ADD COLUMN event_id TEXT DEFAULT 'rc-virgo-party-2026';
        CREATE INDEX idx_participants_event_id ON public.participants (event_id);
    END IF;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fams_profile;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fams_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
