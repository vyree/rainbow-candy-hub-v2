/**
 * Content types for event landing sections (migrated from legacy root types.ts).
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Prize {
  id: string;
  rank: number;
  title: string;
  amount: string;
  badge: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  iconName: string;
  description: string;
}

export interface Stage {
  id: string;
  stageNumber: string;
  title: string;
  songType: string;
  participants: string;
  passCount: string;
  description: string;
  bgAccent: string;
}

export interface RundownItem {
  id: string;
  time: string;
  event: string;
  participants: string;
  duration: string;
  notes: string;
  isBreak?: boolean;
  isHighlight?: boolean;
}

export interface Rule {
  id: string;
  category: 'Lagu' | 'Peralatan' | 'Penampilan' | 'Kedisiplinan' | 'Keputusan';
  title: string;
  description: string;
  isImportant?: boolean;
}

export interface Criterion {
  id: string;
  name: string;
  points: number;
  color: string;
  bgLight: string;
  barColor: string;
  description: string;
  aspects: string[];
}

export interface ParticipantRegistration {
  id: string;
  fullName: string;
  stageName: string;
  whatsapp: string;
  songTitle: string;
  originalArtist: string;
  registrationDate: string;
  queueNumber: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface ChallengeSong {
  id: number;
  title: string;
  artistNote?: string;
  youtubeUrl: string;
  youtubeId: string;
  category?: string;
}

export interface Artist {
  id?: string;
  name: string;
  image: string;
  day?: string;
  genre?: string;
}

export enum Section {
  HERO = 'hero',
  PRIZES = 'prizes',
  STAGES = 'stages',
  RUNDOWN = 'rundown',
  RULES = 'rules',
  CRITERIA = 'criteria',
  REGISTRATION = 'registration'
}

