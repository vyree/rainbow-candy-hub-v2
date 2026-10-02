export interface JudgeScoreDetail {
  judgeId: string;
  judgeName: string;
  teknikalitas?: number; // max 30 (30%)
  kemiripan?: number;    // max 30 (30%)
  penjiwaan?: number;    // max 20 (20%)
  presentasi?: number;   // max 20 (20%)
  total?: number;        // max 100
  notes?: string;
  submittedAt?: string;
  // English aliases (used by Excel export modal)
  vocalTechnique?: number;
  similarity?: number;
  expression?: number;
  presentation?: number;
}

export interface ScoreRecord {
  id: string;
  participantId: string;
  judgeId: string;
  judgeName: string;
  teknikalitas: number; // point 0.0 - 30.0
  kemiripan: number;    // point 0.0 - 30.0
  penjiwaan: number;    // point 0.0 - 20.0
  presentasi: number;   // point 0.0 - 20.0
  total: number;        // total point 0.0 - 100.0
  notes?: string;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParticipantScores {
  eventId?: string; // which event these scores belong to
  teknikalitas?: number; // average of 4 judges
  kemiripan?: number;
  penjiwaan?: number;
  presentasi?: number;
  notes?: string;
  judgedBy?: string;
  // Multi-judge support: 1 sheet per judge (total 4 judges)
  judgeScores?: Record<string, JudgeScoreDetail>;
}

export type ParticipantStatus = 'pending' | 'confirmed' | 'canceled' | 'disqualificated' | 'done';

export type WinnerDesignation =
  | 'Juara 1'
  | 'Juara 2'
  | 'Juara 3'
  | 'Juara Harapan 1'
  | 'Juara Harapan 2'
  | 'Juara Favorit'
  | 'Vokal Terbaik'
  | 'Kemiripan Terbaik'
  | 'not available';

export interface Participant {
  id: string;
  eventId?: string; // Links participant to a specific event (e.g. 'rc-virgo-party-2026')
  idpopup?: number;
  fullName: string;
  familyName: string;
  idolSong: string;
  idolArtist?: string;
  whatsapp: string;
  created_at: string;
  status: ParticipantStatus;
  notes?: string;
  audioLink?: string;
  orderNumber?: number;
  scores?: ParticipantScores;
  totalScore?: number;
  winnerTitle?: string;
}

export interface RegistrationFormData {
  eventId?: string; // Selected event ID
  idpopup?: number | string;
  fullName: string;
  familyName: string;
  idolSong: string;
  idolArtist?: string;
  whatsapp: string;
  notes?: string;
  status?: ParticipantStatus;
  audioLink?: string;
  orderNumber?: number;
  winnerTitle?: string;
}

export interface PrizeItem {
  rank: number;
  title: string;
  subtitle: string;
  prizeAmount: string;
  numericPrize: number;
  certificateText: string;
  benefits: string[];
  badge: string;
  crownColor: string;
  accentColor: string;
}

export type AdminRole = 'superadmin' | 'juri' | 'panitia' | 'stage_mgr' | 'viewer';

export interface JudgeChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: AdminRole | string;
  senderAvatar?: string;
  message: string;
  participantId?: string;
  participantName?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  roleTitle: string;
  avatar: string;
  password?: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  targetId?: string;
}

export interface EventSettings {
  eventName: string;
  eventDate: string;
  eventTime: string;
  venueOrRoom: string;
  isRegistrationOpen: boolean;
  activeRound: 'pre_event' | 'audisi_live' | 'scoring' | 'grand_final' | 'completed';
  currentPerformingId?: string;
  youtubeTeaserUrl: string;
  broadcastNotice: string;
  officialWinners?: {
    juara1Id?: string;
    juara2Id?: string;
    juara3Id?: string;
    harapan1Id?: string;
    favoritId?: string;
    determinedAt?: string;
    determinedBy?: string;
  };
}
