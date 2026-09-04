-- =====================================================================
-- SAHAJA — Seed data: template desain & paket harga
-- =====================================================================

insert into public.templates (name, slug, category, description, thumbnail_url, default_config, is_premium)
values
  ('Ivory Elegance', 'ivory-elegance', 'elegant',
   'Nuansa gading dengan tipografi serif klasik. Cocok untuk resepsi formal.',
   'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70',
   '{"theme_color":"#A6753F","font":"display"}'::jsonb, false),

  ('Rose Garden', 'rose-garden', 'floral',
   'Ilustrasi bunga lembut dengan palet dusty rose.',
   'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=70',
   '{"theme_color":"#B87A7A","font":"display"}'::jsonb, false),

  ('Pure Minimal', 'pure-minimal', 'minimalis',
   'Bersih, banyak ruang kosong, fokus ke foto pasangan.',
   'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=70',
   '{"theme_color":"#3F3A36","font":"body"}'::jsonb, false),

  ('Barakah', 'barakah', 'islami',
   'Ornamen geometris islami dengan kaligrafi dan doa pernikahan.',
   'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70',
   '{"theme_color":"#1F6F5C","font":"display"}'::jsonb, false),

  ('Sekar Jawi', 'sekar-jawi', 'adat',
   'Sentuhan batik dan motif adat Jawa untuk prosesi tradisional.',
   'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=70',
   '{"theme_color":"#7B4B2A","font":"display"}'::jsonb, true),

  ('Noir Modern', 'noir-modern', 'modern',
   'Kontras gelap dengan aksen emas, kesan editorial modern.',
   'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=70',
   '{"theme_color":"#1A1A1A","font":"body"}'::jsonb, true)
on conflict (slug) do nothing;

insert into public.packages (code, name, price_idr, features_json, max_guests, has_watermark, custom_domain)
values
  ('free', 'Free Trial', 0,
   '["1 undangan aktif","Sampai 50 tamu","Template dasar","Watermark Sahaja"]'::jsonb,
   50, true, false),
  ('basic', 'Basic', 99000,
   '["1 undangan aktif","Sampai 400 tamu","Semua template dasar","Tanpa watermark","Export daftar tamu"]'::jsonb,
   400, false, false),
  ('premium', 'Premium', 249000,
   '["Tamu tanpa batas","Semua template premium","Tanpa watermark","Custom domain","Prioritas dukungan"]'::jsonb,
   null, false, true)
on conflict (code) do nothing;
