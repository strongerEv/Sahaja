// Tipe domain Sahaja. Kalau nanti mau di-generate ulang dari Supabase:
//   npx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts
// Tipe di file ini sengaja ditulis manual agar tetap terbaca & stabil.

export type PlatformRole = 'user' | 'platform_admin';
export type WeddingStatus = 'draft' | 'active' | 'archived';
export type WeddingMemberRole = 'owner' | 'partner' | 'family' | 'planner' | 'vendor';
export type MediaType = 'photo' | 'video';
export type InvitationLanguage = 'id' | 'en';
export type ChecklistStatus = 'todo' | 'in_progress' | 'done';
export type VendorStatus = 'shortlist' | 'contacted' | 'booked' | 'paid' | 'cancelled';

export type TemplateCategory =
  | 'elegant'
  | 'floral'
  | 'minimalis'
  | 'islami'
  | 'adat'
  | 'modern';

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role_platform: PlatformRole;
  created_at: string;
}

export interface Wedding {
  id: string;
  owner_user_id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string | null;
  status: WeddingStatus;
  created_at: string;
  updated_at: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: WeddingMemberRole;
  permissions_json: Record<string, unknown>;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  description: string | null;
  thumbnail_url: string | null;
  default_config: { theme_color?: string; font?: string };
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Package {
  id: string;
  code: string;
  name: string;
  price_idr: number;
  features_json: string[];
  max_guests: number | null;
  has_watermark: boolean;
  custom_domain: boolean;
  is_active: boolean;
  created_at: string;
}

/** Section yang bisa di-toggle tampil/sembunyi oleh pengantin. */
export interface SectionsConfig {
  hero: boolean;
  couple: boolean;
  countdown: boolean;
  events: boolean;
  gallery: boolean;
  love_story: boolean;
  rsvp: boolean;
  guestbook: boolean;
  envelope: boolean;
  closing: boolean;
  /** Urutan tampil section pada halaman publik. */
  order: SectionKey[];
}

export type SectionKey =
  | 'hero'
  | 'couple'
  | 'countdown'
  | 'events'
  | 'gallery'
  | 'love_story'
  | 'rsvp'
  | 'guestbook'
  | 'envelope'
  | 'closing';

export interface LoveStoryItem {
  date: string;
  title: string;
  description: string;
}

export interface Invitation {
  id: string;
  wedding_id: string;
  template_id: string | null;
  package_id: string | null;
  slug: string;
  language: InvitationLanguage;

  groom_nickname: string | null;
  groom_full_name: string | null;
  groom_child_order: string | null;
  groom_father: string | null;
  groom_mother: string | null;
  bride_nickname: string | null;
  bride_full_name: string | null;
  bride_child_order: string | null;
  bride_father: string | null;
  bride_mother: string | null;

  theme_color: string;
  font: string;
  sections_config_json: Partial<SectionsConfig>;

  akad_datetime: string | null;
  akad_location: string | null;
  akad_address: string | null;
  akad_maps_url: string | null;
  resepsi_datetime: string | null;
  resepsi_location: string | null;
  resepsi_address: string | null;
  resepsi_maps_url: string | null;

  love_story_json: LoveStoryItem[];
  quote_text: string | null;
  closing_text: string | null;
  music_url: string | null;
  cover_image_url: string | null;

  is_published: boolean;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface InvitationMedia {
  id: string;
  invitation_id: string;
  type: MediaType;
  url: string;
  caption: string | null;
  order_index: number;
  created_at: string;
}

export interface DigitalEnvelopeConfig {
  id: string;
  invitation_id: string;
  is_enabled: boolean;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  bank_name_2: string | null;
  account_number_2: string | null;
  account_holder_2: string | null;
  ewallet_qris_url: string | null;
  gift_address: string | null;
  note: string | null;
  updated_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  unique_slug: string;
  phone: string | null;
  address: string | null;
  is_opened: boolean;
  opened_at: string | null;
  open_count: number;
  created_at: string;
}

export interface Rsvp {
  id: string;
  guest_id: string;
  attending: boolean;
  guest_count: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestbookEntry {
  id: string;
  invitation_id: string;
  guest_id: string | null;
  name: string;
  message: string;
  is_hidden: boolean;
  created_at: string;
}

export interface InvitationVisit {
  id: string;
  invitation_id: string;
  guest_id: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Tabel fase 3 — sudah ada di database, UI menyusul. */
export interface Checklist {
  id: string;
  wedding_id: string;
  task_name: string;
  category: string | null;
  due_date: string | null;
  status: ChecklistStatus;
  assignee_user_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface VendorRow {
  id: string;
  wedding_id: string;
  name: string;
  category: string | null;
  contact: string | null;
  status: VendorStatus;
  price_quote: number | null;
  dp_amount: number | null;
  notes: string | null;
  created_at: string;
}

export interface GuestWithRsvp extends Guest {
  rsvps: Rsvp | Rsvp[] | null;
}
