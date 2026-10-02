export interface FamsStatItem {
  id: string;
  number: string;
  label: string;
  detail: string;
  iconName?: string;
}

export interface FamsCoreValue {
  id: string;
  title: string;
  desc: string;
  color?: string;
  iconName?: string;
}

export interface FamsProgram {
  id: string;
  title: string;
  category: string;
  desc: string;
  tag: string;
  highlight?: boolean;
  iconName?: string;
}

export interface FamsMilestone {
  year: string;
  title: string;
  desc: string;
}

export interface FamsProfileData {
  name: string;
  tagline: string;
  headline: string;
  subheadline: string;
  description: string;
  foundedYear: string;
  history: string;
  philosophy: string;
  vision: string;
  mission: string[];
  philosophyTitle: string;
  philosophyDesc: string;
  stats: FamsStatItem[];
  coreValues: FamsCoreValue[];
  programs: FamsProgram[];
  milestones: FamsMilestone[];
  socialLinks: Record<string, string>;
  contacts: Record<string, string>;
  contactWhatsapp: string;
  contactLink: string;
  communityRoomName?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  updatedAt: string;
}

export type MemberDepartment = 'leadership' | 'management' | 'creative' | 'vocalist' | 'hospitality' | 'member';
export type MemberTier = 'founder' | 'captain' | 'core' | 'vip' | 'regular';

export interface FamsMember {
  id: string;
  name: string;
  nickname?: string;
  familyTitle: string;
  division: string;
  role: string;
  department: MemberDepartment;
  tier: MemberTier;
  avatar: string;
  bio?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  joinDate?: string;
  achievements?: string[];
  isActive: boolean;
  orderIndex: number;
}

export const INITIAL_FAMS_PROFILE: FamsProfileData = {
  name: 'Rainbow Candy',
  tagline: 'Keluarga, Irama, dan Harmoni Nada',
  headline: 'Komunitas Pecinta Musik & Panggung Talenta Vokal Nusantara',
  subheadline:
    'Wadah persaudaraan audio digital yang menyatukan para penyanyi, musisi, dan penikmat seni vokal dalam satu ikatan hangat tanpa batas.',
  description:
    'Rainbow Candy (RC Fams) adalah wadah persaudaraan musik independen yang berakar pada semangat kekeluargaan, dedikasi seni olah vokal, dan sportivitas kompetisi yang sehat. Lebih dari sekadar komunitas audio, Rainbow Candy adalah rumah kedua bagi setiap insan kreatif untuk menyalurkan bakat vokal, mempererat persahabatan, dan merayakan karya bersama.',
  foundedYear: '2021',
  history: '',
  philosophy: '',
  vision:
    'Menjadi komunitas vokal dan entertainment audio terdepan di Indonesia yang menginspirasi, menjunjung tinggi nilai sportivitas, dan membina talenta musik nusantara dengan kehangatan kekeluargaan.',
  mission: [
    'Menyediakan ekosistem panggung live room yang apresiatif, ramah, dan bebas diskriminasi.',
    'Menyelenggarakan turnamen bernyanyi berkala dengan sistem penjurian transparan dan profesional.',
    'Membina kemampuan vokal, musikalitas, dan mentalitas panggung anggota secara berkelanjutan.',
    'Membangun jejaring kolaborasi harmonis dengan berbagai family dan komunitas musik nusantara.',
  ],
  philosophyTitle: 'Filosofi Rainbow Candy',
  philosophyDesc:
    'Ibarat pelangi (Rainbow) yang merajut warna-warna berbeda menjadi satu keindahan di langit, dan permen (Candy) yang senantiasa menebarkan rasa manis dan keceriaan — keluarga Rainbow Candy merangkul ragam karakter vokal menjadi harmoni yang membahagiakan.',
  stats: [
    {
      id: 'stat-1',
      number: '350+',
      label: 'Anggota Aktif',
      detail: 'Penyanyi & kreator audio di seluruh nusantara',
      iconName: 'Users',
    },
    {
      id: 'stat-2',
      number: '25+',
      label: 'Event Sukses',
      detail: 'Turnamen & perayaan musik bergengsi',
      iconName: 'Trophy',
    },
    {
      id: 'stat-3',
      number: '100%',
      label: 'Solidaritas & Respek',
      detail: 'Komunitas positif tanpa drama & diskriminasi',
      iconName: 'Heart',
    },
    {
      id: 'stat-4',
      number: 'Tier VIP',
      label: 'Reputasi Komunitas',
      detail: 'Family terverifikasi & berprestasi',
      iconName: 'Award',
    },
  ],
  coreValues: [
    {
      id: 'val-1',
      title: 'Kekeluargaan (Family First)',
      desc: 'Lebih dari sekadar wadah bernyanyi, Rainbow Candy adalah rumah kedua tempat saling merangkul, menyapa, dan mendukung satu sama lain dalam setiap suka dan duka.',
      color: '#E05275',
      iconName: 'Heart',
    },
    {
      id: 'val-2',
      title: 'Dedikasi Vokal & Karya',
      desc: 'Kami memberi ruang bagi setiap anggota untuk mengasah potensi vokal, mengeksplorasi berbagai genre musik, dan tampil percaya diri di panggung audio.',
      color: '#F4E0A5',
      iconName: 'Mic',
    },
    {
      id: 'val-3',
      title: 'Sportivitas & Integritas',
      desc: 'Setiap perlombaan dan kompetisi yang diselenggarakan Rainbow Candy menjunjung tinggi transparansi, keadilan penjurian, dan etika berkompetisi yang sehat.',
      color: '#A855F7',
      iconName: 'ShieldCheck',
    },
    {
      id: 'val-4',
      title: 'Keceriaan & Kehangatan',
      desc: 'Sesuai dengan filosofi "Candy", kami menghadirkan suasana room yang manis, ceria, bersahabat, dan selalu menyegarkan hari-hari setiap penikmat musik.',
      color: '#38BDF8',
      iconName: 'Smile',
    },
  ],
  programs: [
    {
      id: 'prog-1',
      title: 'Voice Room & Daily Jamming',
      category: 'Rutin Harian',
      desc: 'Sesi santai bernyanyi bersama, duet spontan, serta uji coba soundcard dan mikrofon bersama para rekan satu family.',
      tag: 'Setiap Hari',
      iconName: 'Headphones',
    },
    {
      id: 'prog-2',
      title: 'Event Nyanyi Mirip Idola',
      category: 'Kompetisi Bergengsi',
      desc: 'Turnamen vokal tahunan dengan penilaian dewan juri ahli, menguji teknik olah vokal, kemiripan karakter, dan penjiwaan panggung.',
      tag: 'Event Utama 2026',
      highlight: true,
      iconName: 'Flame',
    },
    {
      id: 'prog-3',
      title: 'Birthday & Zodiac Parties',
      category: 'Perayaan Khusus',
      desc: 'Pesta syukuran hari lahir anggota dan perayaan zodiak tematik (seperti Virgo Party) yang dimeriahkan dengan games dan doorprize.',
      tag: 'Spesial Bulanan',
      iconName: 'Sparkles',
    },
    {
      id: 'prog-4',
      title: 'Vocal Coaching & Tips Sharing',
      category: 'Edukasi & Sharing',
      desc: 'Ruang diskusi seputar teknik pernapasan, cengkok lagu, pemilihan nada dasar yang tepat, serta tips mixing audio rekaman.',
      tag: 'Sharing Session',
      iconName: 'Radio',
    },
  ],
  contactWhatsapp: '081263858085',
  contactLink: 'https://wa.me/6281263858085?text=Halo%20Admin%20Rainbow%20Candy%2C%20saya%20ingin%20bergabung%20dengan%20Fams%20RC',
  milestones: [],
  socialLinks: {},
  contacts: {},
  communityRoomName: 'Live Room Utama Rainbow Candy',
  instagramUrl: '',
  youtubeUrl: '',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_FAMS_MEMBERS: FamsMember[] = [
  {
    id: 'mem-01',
    name: 'Lord Noir',
    nickname: 'Noir',
    familyTitle: 'Founder',
    division: 'Divisi Leadership',
    role: 'Founder & Captain Fams',
    department: 'leadership',
    tier: 'founder',
    avatar: '👑',
    bio: 'Penggagas utama Rainbow Candy Fams. Mengawal arah visi dan keutuhan keluarga besar RC.',
    joinDate: '2024-01-01',
    achievements: ['Founder RC Fams', 'Penyelenggara Virgo Party', 'Komisariat Penjurian'],
    isActive: true,
    orderIndex: 1,
  },
  {
    id: 'mem-02',
    name: 'Agara',
    nickname: 'Agara',
    familyTitle: 'Kepala Manajemen',
    division: 'Divisi Manajemen',
    role: 'Head of Management & Acara',
    department: 'management',
    tier: 'captain',
    avatar: '🎙️',
    bio: 'Koordinator operasional panggung dan manajemen kompetisi internal Rainbow Candy.',
    joinDate: '2024-02-15',
    achievements: ['Lead Project Officer', 'Vokalis Pop Berkarakter'],
    isActive: true,
    orderIndex: 2,
  },
  {
    id: 'mem-03',
    name: 'Sugar',
    nickname: 'Sugar',
    familyTitle: 'Kurator Kreatif',
    division: 'Divisi Kreatif',
    role: 'Creative Curator & Hospitality',
    department: 'creative',
    tier: 'core',
    avatar: '✨',
    bio: 'Menjaga kehangatan suasana room, kurasi visual event, dan menyambut tamu dari fams sahabat.',
    joinDate: '2024-03-10',
    achievements: ['Best Stage Host', 'Pilar Respek Komunitas'],
    isActive: true,
    orderIndex: 3,
  },
  {
    id: 'mem-04',
    name: 'Chella (Riri)',
    nickname: 'Riri',
    familyTitle: 'Vokalis Inti',
    division: 'Divisi Vokal',
    role: 'Vokalis Inti & Talent Coach',
    department: 'vocalist',
    tier: 'vip',
    avatar: '🌸',
    bio: 'Penyanyi berkarakter kuat dengan spesialisasi penjiwaan dan teknik falsetto tinggi.',
    joinDate: '2024-04-05',
    achievements: ['Finalis Vokal Terbaik', 'Pelatih Vokal Junior'],
    isActive: true,
    orderIndex: 4,
  },
  {
    id: 'mem-05',
    name: 'Michu',
    nickname: 'Michu',
    familyTitle: 'Audio Engineer',
    division: 'Divisi Kreatif',
    role: 'Member VIP & Audio Technics',
    department: 'creative',
    tier: 'vip',
    avatar: '🎧',
    bio: 'Spesialis sound engineering, balancing audio live room, dan pendamping teknis juri.',
    joinDate: '2024-05-12',
    achievements: ['Master Audio Mixer', 'Konsistensi Kehadiran 100%'],
    isActive: true,
    orderIndex: 5,
  },
  {
    id: 'mem-06',
    name: 'Refan',
    nickname: 'Refan',
    familyTitle: 'MC & Vokalis',
    division: 'Divisi Vokal',
    role: 'Vokalis Pop Rock & Stage MC',
    department: 'vocalist',
    tier: 'core',
    avatar: '🔥',
    bio: 'Energi panggung tanpa batas dengan vokal bertenaga di genre pop-rock dan balada.',
    joinDate: '2024-06-01',
    achievements: ['Stage Master of Ceremony', 'Juara Favorit Audisi'],
    isActive: true,
    orderIndex: 6,
  },
];
