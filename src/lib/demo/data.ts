/**
 * Mode demo — data contoh untuk mencoba aplikasi TANPA Supabase.
 *
 * Aktif otomatis saat NEXT_PUBLIC_SUPABASE_URL belum diisi (mis. baru deploy
 * ke Vercel tapi project Supabase belum dibuat). Begitu kredensial Supabase
 * diisi, mode ini mati sendiri dan seluruh aplikasi kembali memakai database
 * sungguhan — tidak ada kode lain yang perlu diubah.
 *
 * Semua data di bawah hanya dibaca. Tidak ada yang tersimpan: setiap aksi
 * tulis di mode demo dijawab dengan pesan yang menjelaskan hal itu.
 */

import { DEFAULT_SECTIONS } from '@/lib/utils';
import type {
  AppUser,
  DigitalEnvelopeConfig,
  Guest,
  GuestbookEntry,
  Invitation,
  InvitationMedia,
  Package,
  Rsvp,
  Template,
  Wedding,
} from '@/lib/types/database';

export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === '1' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const DEMO_NOTICE =
  'Mode demo aktif — perubahan tidak disimpan. Isi kredensial Supabase di environment untuk mengaktifkan penyimpanan.';

export const DEMO_WEDDING_ID = 'demo-wedding';
export const DEMO_INVITATION_ID = 'demo-invitation';
export const DEMO_SLUG = 'rizky-ayu';
export const DEMO_GUEST_SLUG = 'k7m2xq9p';

/** Tanggal acara dihitung relatif terhadap hari ini supaya countdown hidup. */
function daysFromNow(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  // Jam acara ditetapkan dalam WIB (+07:00).
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mi = String(minute).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00+07:00`).toISOString();
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const PHOTO = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=70`;

export const demoTemplates: Template[] = [
  {
    id: 'tpl-ivory',
    name: 'Ivory Elegance',
    slug: 'ivory-elegance',
    category: 'elegant',
    description: 'Nuansa gading dengan tipografi serif klasik. Cocok untuk resepsi formal.',
    thumbnail_url: PHOTO('photo-1519741497674-611481863552'),
    default_config: { theme_color: '#A6753F', font: 'display' },
    is_premium: false,
    is_active: true,
    created_at: daysAgo(120),
  },
  {
    id: 'tpl-rose',
    name: 'Rose Garden',
    slug: 'rose-garden',
    category: 'floral',
    description: 'Ilustrasi bunga lembut dengan palet dusty rose.',
    thumbnail_url: PHOTO('photo-1522673607200-164d1b6ce486'),
    default_config: { theme_color: '#B87A7A', font: 'display' },
    is_premium: false,
    is_active: true,
    created_at: daysAgo(115),
  },
  {
    id: 'tpl-minimal',
    name: 'Pure Minimal',
    slug: 'pure-minimal',
    category: 'minimalis',
    description: 'Bersih, banyak ruang kosong, fokus ke foto pasangan.',
    thumbnail_url: PHOTO('photo-1511285560929-80b456fea0bc'),
    default_config: { theme_color: '#3F3A36', font: 'body' },
    is_premium: false,
    is_active: true,
    created_at: daysAgo(110),
  },
  {
    id: 'tpl-barakah',
    name: 'Barakah',
    slug: 'barakah',
    category: 'islami',
    description: 'Ornamen geometris islami dengan kaligrafi dan doa pernikahan.',
    thumbnail_url: PHOTO('photo-1584535886647-b2d4b0a1a6b1'),
    default_config: { theme_color: '#1F6F5C', font: 'display' },
    is_premium: false,
    is_active: true,
    created_at: daysAgo(105),
  },
  {
    id: 'tpl-sekar',
    name: 'Sekar Jawi',
    slug: 'sekar-jawi',
    category: 'adat',
    description: 'Sentuhan batik dan motif adat Jawa untuk prosesi tradisional.',
    thumbnail_url: PHOTO('photo-1583939003579-730e3918a45a'),
    default_config: { theme_color: '#7B4B2A', font: 'display' },
    is_premium: true,
    is_active: true,
    created_at: daysAgo(100),
  },
  {
    id: 'tpl-noir',
    name: 'Noir Modern',
    slug: 'noir-modern',
    category: 'modern',
    description: 'Kontras gelap dengan aksen emas, kesan editorial modern.',
    thumbnail_url: PHOTO('photo-1465495976277-4387d4b0b4c6'),
    default_config: { theme_color: '#1A1A1A', font: 'body' },
    is_premium: true,
    is_active: true,
    created_at: daysAgo(95),
  },
];

export const demoPackages: Package[] = [
  {
    id: 'pkg-free',
    code: 'free',
    name: 'Free Trial',
    price_idr: 0,
    features_json: ['1 undangan aktif', 'Sampai 50 tamu', 'Template dasar', 'Watermark Sahaja'],
    max_guests: 50,
    has_watermark: true,
    custom_domain: false,
    is_active: true,
    created_at: daysAgo(120),
  },
  {
    id: 'pkg-basic',
    code: 'basic',
    name: 'Basic',
    price_idr: 99000,
    features_json: [
      '1 undangan aktif',
      'Sampai 400 tamu',
      'Semua template dasar',
      'Tanpa watermark',
      'Export daftar tamu',
    ],
    max_guests: 400,
    has_watermark: false,
    custom_domain: false,
    is_active: true,
    created_at: daysAgo(120),
  },
  {
    id: 'pkg-premium',
    code: 'premium',
    name: 'Premium',
    price_idr: 249000,
    features_json: [
      'Tamu tanpa batas',
      'Semua template premium',
      'Tanpa watermark',
      'Custom domain',
      'Prioritas dukungan',
    ],
    max_guests: null,
    has_watermark: false,
    custom_domain: true,
    is_active: true,
    created_at: daysAgo(120),
  },
];

export const demoUser: AppUser = {
  id: 'demo-user',
  name: 'Ayu Lestari',
  email: 'demo@sahaja.id',
  phone: null,
  role_platform: 'platform_admin',
  created_at: daysAgo(60),
};

export const demoWedding: Wedding = {
  id: DEMO_WEDDING_ID,
  owner_user_id: demoUser.id,
  groom_name: 'Rizky',
  bride_name: 'Ayu',
  wedding_date: daysFromNow(45, 8).slice(0, 10),
  status: 'active',
  created_at: daysAgo(60),
  updated_at: daysAgo(2),
};

export const demoInvitation: Invitation = {
  id: DEMO_INVITATION_ID,
  wedding_id: DEMO_WEDDING_ID,
  template_id: 'tpl-ivory',
  package_id: 'pkg-basic',
  slug: DEMO_SLUG,
  language: 'id',

  groom_nickname: 'Rizky',
  groom_full_name: 'Rizky Pratama, S.T.',
  groom_child_order: 'Putra pertama',
  groom_father: 'Bapak Suryanto',
  groom_mother: 'Ibu Suryani',
  bride_nickname: 'Ayu',
  bride_full_name: 'Ayu Lestari, S.Pd.',
  bride_child_order: 'Putri kedua',
  bride_father: 'Bapak Hartono',
  bride_mother: 'Ibu Marlina',

  theme_color: '#A6753F',
  font: 'display',
  sections_config_json: DEFAULT_SECTIONS,

  akad_datetime: daysFromNow(45, 8),
  akad_location: 'Masjid Agung Al-Azhar',
  akad_address: 'Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan',
  akad_maps_url: 'https://maps.google.com/?q=Masjid+Agung+Al-Azhar+Jakarta',
  resepsi_datetime: daysFromNow(45, 11),
  resepsi_location: 'Balai Kartini — Nusa Indah Hall',
  resepsi_address: 'Jl. Jend. Gatot Subroto Kav. 37, Jakarta Selatan',
  resepsi_maps_url: 'https://maps.google.com/?q=Balai+Kartini+Jakarta',

  love_story_json: [
    {
      date: daysAgo(1500).slice(0, 10),
      title: 'Pertama bertemu',
      description:
        'Dikenalkan teman kuliah di sebuah acara komunitas. Obrolan pertama soal kopi, dan ternyata sama-sama tidak bisa tidur setelah jam empat sore.',
    },
    {
      date: daysAgo(1100).slice(0, 10),
      title: 'Mulai berpacaran',
      description:
        'Setelah setahun jadi teman diskusi, akhirnya sepakat menjalani semuanya bersama.',
    },
    {
      date: daysAgo(200).slice(0, 10),
      title: 'Lamaran',
      description:
        'Di hadapan kedua keluarga, di ruang tamu yang sama tempat kami dulu pertama kali diperkenalkan secara resmi.',
    },
  ],
  quote_text:
    'Dan di antara tanda-tanda kekuasaan-Nya diciptakan-Nya untukmu pasangan hidup dari jenismu sendiri, supaya kamu mendapat ketenangan hati.',
  closing_text:
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
  music_url: null,
  cover_image_url: PHOTO('photo-1519741497674-611481863552'),

  is_published: true,
  published_at: daysAgo(20),
  view_count: 342,
  created_at: daysAgo(60),
  updated_at: daysAgo(2),
};

export const demoMedia: InvitationMedia[] = [
  'photo-1519741497674-611481863552',
  'photo-1511285560929-80b456fea0bc',
  'photo-1522673607200-164d1b6ce486',
  'photo-1465495976277-4387d4b0b4c6',
  'photo-1591604466107-ec97de577aff',
  'photo-1507504031003-b417219a0fde',
].map((id, index) => ({
  id: `media-${index}`,
  invitation_id: DEMO_INVITATION_ID,
  type: 'photo' as const,
  url: PHOTO(id),
  caption: null,
  order_index: index,
  created_at: daysAgo(30 - index),
}));

export const demoEnvelope: DigitalEnvelopeConfig = {
  id: 'demo-envelope',
  invitation_id: DEMO_INVITATION_ID,
  is_enabled: true,
  bank_name: 'BCA',
  account_number: '1234567890',
  account_holder: 'Rizky Pratama',
  bank_name_2: 'Mandiri',
  account_number_2: '9876543210',
  account_holder_2: 'Ayu Lestari',
  ewallet_qris_url: null,
  gift_address: 'Jl. Melati No. 12, Bintaro, Tangerang Selatan 15229',
  note: 'Doa restu Anda sudah lebih dari cukup. Bila berkenan memberi tanda kasih, berikut informasinya.',
  updated_at: daysAgo(10),
};

type DemoGuestSeed = {
  name: string;
  category: string;
  opened: boolean;
  rsvp?: { attending: boolean; count: number; note?: string };
};

const GUEST_SEED: DemoGuestSeed[] = [
  { name: 'Budi Santoso', category: 'kantor', opened: true, rsvp: { attending: true, count: 2, note: 'Alergi seafood' } },
  { name: 'Siti Rahmawati', category: 'keluarga', opened: true, rsvp: { attending: true, count: 4 } },
  { name: 'Andi Wijaya', category: 'teman', opened: true, rsvp: { attending: true, count: 1 } },
  { name: 'Dewi Anggraini', category: 'kantor', opened: true, rsvp: { attending: false, count: 0, note: 'Sedang tugas ke luar kota' } },
  { name: 'Hendra Gunawan', category: 'teman', opened: true, rsvp: { attending: true, count: 2 } },
  { name: 'Maya Puspita', category: 'keluarga', opened: true, rsvp: { attending: true, count: 3 } },
  { name: 'Rudi Hartanto', category: 'kantor', opened: true, rsvp: { attending: false, count: 0 } },
  { name: 'Lestari Ningsih', category: 'teman', opened: true },
  { name: 'Bambang Sutrisno', category: 'keluarga', opened: true },
  { name: 'Nur Aisyah', category: 'teman', opened: true, rsvp: { attending: true, count: 2, note: 'Bawa anak balita' } },
  { name: 'Agus Setiawan', category: 'kantor', opened: false },
  { name: 'Rina Marlina', category: 'keluarga', opened: false },
  { name: 'Fajar Nugroho', category: 'teman', opened: false },
  { name: 'Indah Permatasari', category: 'kantor', opened: false },
  { name: 'Yusuf Maulana', category: 'teman', opened: false },
];

const GUEST_SLUGS = [
  DEMO_GUEST_SLUG, 'r4t8wn2c', 'p9hd3ks7', 'm2vq6xz8', 'b5nc7yt3',
  'w8kp2mr4', 'j3xd9qh6', 'z7bt4nv2', 'c6mw8ps5', 'v2hq7kd9',
  'n4rt6xb8', 'k9pm3wc7', 't5vz8nh2', 'd7cq4mr6', 'x3wb9kt5',
];

export const demoGuests: Guest[] = GUEST_SEED.map((seed, index) => ({
  id: `guest-${index}`,
  wedding_id: DEMO_WEDDING_ID,
  name: seed.name,
  category: seed.category,
  unique_slug: GUEST_SLUGS[index],
  phone: null,
  address: null,
  is_opened: seed.opened,
  opened_at: seed.opened ? daysAgo(18 - (index % 14)) : null,
  open_count: seed.opened ? 1 + (index % 3) : 0,
  created_at: daysAgo(25),
}));

export const demoRsvps: Array<Rsvp & { guest_id: string }> = GUEST_SEED.flatMap((seed, index) =>
  seed.rsvp
    ? [
        {
          id: `rsvp-${index}`,
          guest_id: `guest-${index}`,
          attending: seed.rsvp.attending,
          guest_count: seed.rsvp.count,
          note: seed.rsvp.note ?? null,
          created_at: daysAgo(16 - (index % 12)),
          updated_at: daysAgo(16 - (index % 12)),
        },
      ]
    : [],
);

/** Tamu digabung dengan RSVP-nya, sesuai bentuk hasil query PostgREST. */
export const demoGuestsWithRsvp = demoGuests.map((guest) => ({
  ...guest,
  rsvps: demoRsvps.find((rsvp) => rsvp.guest_id === guest.id) ?? null,
}));

export const demoGuestbook: GuestbookEntry[] = [
  {
    id: 'gb-1',
    invitation_id: DEMO_INVITATION_ID,
    guest_id: 'guest-0',
    name: 'Budi Santoso',
    message:
      'Selamat menempuh hidup baru, Rizky & Ayu! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.',
    is_hidden: false,
    created_at: daysAgo(14),
  },
  {
    id: 'gb-2',
    invitation_id: DEMO_INVITATION_ID,
    guest_id: 'guest-1',
    name: 'Siti Rahmawati',
    message: 'Turut berbahagia! Sampai jumpa di hari-H ya. Doa terbaik dari kami sekeluarga.',
    is_hidden: false,
    created_at: daysAgo(12),
  },
  {
    id: 'gb-3',
    invitation_id: DEMO_INVITATION_ID,
    guest_id: 'guest-2',
    name: 'Andi Wijaya',
    message:
      'Akhirnya! Selamat ya kalian berdua. Semoga langgeng sampai kakek-nenek dan selalu diberi kemudahan.',
    is_hidden: false,
    created_at: daysAgo(9),
  },
  {
    id: 'gb-4',
    invitation_id: DEMO_INVITATION_ID,
    guest_id: null,
    name: 'Keluarga Besar Hartono',
    message: 'Barakallahu lakuma wa baraka alaikuma wa jama’a bainakuma fii khair.',
    is_hidden: false,
    created_at: daysAgo(6),
  },
  {
    id: 'gb-5',
    invitation_id: DEMO_INVITATION_ID,
    guest_id: null,
    name: 'Promo Katering Murah',
    message: 'Hubungi kami untuk paket katering termurah se-Jabodetabek! WA 08xx-xxxx-xxxx',
    is_hidden: true,
    created_at: daysAgo(4),
  },
];

/** Kunjungan 7 hari terakhir untuk grafik statistik. */
export const demoVisits = Array.from({ length: 7 }).flatMap((_, dayOffset) => {
  const perDay = [4, 9, 15, 7, 22, 13, 6][dayOffset];
  return Array.from({ length: perDay }, (_, i) => ({
    id: `visit-${dayOffset}-${i}`,
    invitation_id: DEMO_INVITATION_ID,
    guest_id: i % 3 === 0 ? null : `guest-${(dayOffset + i) % demoGuests.length}`,
    created_at: daysAgo(6 - dayOffset),
  }));
});

export const demoMembers = [
  {
    id: 'member-1',
    role: 'owner' as const,
    user_id: demoUser.id,
    users: { name: demoUser.name, email: demoUser.email },
  },
];

export const demoWeddings = [
  {
    ...demoWedding,
    invitations: [
      {
        slug: demoInvitation.slug,
        is_published: demoInvitation.is_published,
        view_count: demoInvitation.view_count,
      },
    ],
  },
];

export const demoPlatformUsers = [
  { ...demoUser, weddings: [{ id: DEMO_WEDDING_ID }] },
  {
    id: 'demo-user-2',
    name: 'Cakra Dinata',
    email: 'cakra@example.com',
    phone: null,
    role_platform: 'user' as const,
    created_at: daysAgo(30),
    weddings: [{ id: 'demo-wedding-2' }],
  },
  {
    id: 'demo-user-3',
    name: 'Dinda Ayu',
    email: 'dinda@example.com',
    phone: null,
    role_platform: 'user' as const,
    created_at: daysAgo(12),
    weddings: [],
  },
];

export const demoPlatformStats = {
  users: demoPlatformUsers.length,
  weddings: 2,
  invitations: 2,
  published: 1,
  guests: demoGuests.length,
  templates: demoTemplates.length,
};
