export type EventStatus = 'open' | 'closed' | 'ongoing' | 'ended';

export interface EventWinner {
  rank: 1 | 2 | 3 | 'harapan' | 'favorit';
  title: string; // e.g. "Juara 1", "Juara 2", "Juara 3"
  participantId?: string;
  participantName: string;
  familyName?: string;
  idolSong?: string;
  idolArtist?: string;
  reward?: string;
  notes?: string;
}

export interface EventPrize {
  juara1: string;
  juara2: string;
  juara3: string;
  harapan?: string;
  favorit?: string;
}

export type EventPrizes = EventPrize;

export interface EventJudge {
  id: string;
  name: string;
  roleTitle: string;
  avatar?: string;
}

export interface RCEvent {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  status: EventStatus;
  startDate: string;
  endDate?: string;
  time: string;
  venue: string;
  maxParticipants: number;
  registrationDeadline: string;
  description: string;
  rulesSummary?: string[];
  posterUrl?: string;
  bannerUrl?: string;
  prizes: EventPrize;
  judges?: (EventJudge | string)[];
  winners?: EventWinner[];
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_EVENTS: RCEvent[] = [
  {
    id: 'rc-virgo-party-2026',
    slug: 'virgo-party-2026',
    title: 'RC Birthday Celebration & Virgo Party',
    subtitle: 'Event Nyanyi Mirip Idola • Edisi Spesial Ulang Tahun Rainbow Candy',
    category: 'Lomba Nyanyi Mirip Idola',
    status: 'open',
    startDate: '2026-09-13',
    time: '10:00 WIB',
    registrationDeadline: '2026-09-12 23:59 WIB',
    venue: 'Panggung Utama Live Room Rainbow Candy',
    maxParticipants: 50,
    description:
      'Kompetisi bernyanyi paling bergengsi dalam rangka perayaan ulang tahun Fams Rainbow Candy dan pesta zodiak Virgo. Bawakan lagu idola pilihanmu dengan karakter vokal terbaik!',
    rulesSummary: [
      'Terbuka untuk seluruh member dan perwakilan fams komunitas.',
      'Membawakan 1 lagu idola pilihan dengan audio minus-one berkualitas baik.',
      'Penilaian murni dari 4 dewan juri independen (Vokal, Kemiripan, Penjiwaan, Presentasi).',
      'Pendaftaran gratis tanpa biaya registrasi.',
    ],
    prizes: {
      juara1: 'Rp 1.500.000 + E-Sertifikat + Trophy Emas',
      juara2: 'Rp 1.000.000 + E-Sertifikat + Trophy Perak',
      juara3: 'Rp 500.000 + E-Sertifikat + Trophy Perunggu',
      favorit: 'Rp 250.000 + Merchandise Resmi RC',
    },
    isFeatured: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-09-13T00:00:00.000Z',
  },
  {
    id: 'rc-acoustic-romance-2026',
    slug: 'acoustic-romance-2026',
    title: 'RC Acoustic Romance Night 2026',
    subtitle: 'Harmoni Petikan Gitar & Nada Romantis Fams',
    category: 'Akustik & Slow Pop',
    status: 'ended',
    startDate: '2026-08-17',
    time: '19:30 WIB',
    registrationDeadline: '2026-08-16 20:00 WIB',
    venue: 'Hall Romantika Live Room RC',
    maxParticipants: 30,
    description:
      'Malam perayaan kemerdekaan & harmoni nada romantis yang menampilkan vokalis dan musisi akustik terbaik keluarga Rainbow Candy.',
    prizes: {
      juara1: 'Rp 1.000.000 + E-Sertifikat Juara 1',
      juara2: 'Rp 750.000 + E-Sertifikat Juara 2',
      juara3: 'Rp 500.000 + E-Sertifikat Juara 3',
    },
    winners: [],
    isFeatured: false,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z',
  },
  {
    id: 'rc-battle-karaoke-s1',
    slug: 'battle-karaoke-s1',
    title: 'RC Duo & Battle Karaoke Season 1',
    subtitle: 'Adu Duet Spektakuler Antar Member Pilihan',
    category: 'Duet & Battle Karaoke',
    status: 'ended',
    startDate: '2026-07-20',
    time: '20:00 WIB',
    registrationDeadline: '2026-07-19 23:59 WIB',
    venue: 'Arena Battle Live Room RC',
    maxParticipants: 24,
    description:
      'Turnamen duet karaoke penuh keseruan yang mempertemukan pasangan duet paling harmonis di keluarga besar Rainbow Candy.',
    prizes: {
      juara1: 'Rp 1.200.000 + Trophy Duet Emas',
      juara2: 'Rp 800.000 + Trophy Duet Perak',
      juara3: 'Rp 500.000 + Trophy Duet Perunggu',
    },
    winners: [],
    isFeatured: false,
    createdAt: '2026-06-25T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
  },
];
