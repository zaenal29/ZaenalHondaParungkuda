-- =====================================================================
-- DATABASE SCHEMA: ZAENAL ABIDIN HONDA PARUNGKUDA
-- PT Selamat Lestari Mandiri - Cabang Parungkuda
-- Database Engine: PostgreSQL 15+
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  sales_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  whatsapp_number VARCHAR(32) NOT NULL,
  whatsapp_default_message TEXT NOT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  hero_image TEXT NOT NULL,
  hero_primary_btn_text VARCHAR(100) NOT NULL,
  hero_primary_btn_link VARCHAR(255) NOT NULL,
  hero_secondary_btn_text VARCHAR(100) NOT NULL,
  hero_secondary_btn_link VARCHAR(255) NOT NULL,
  about_description TEXT NOT NULL,
  dealer_photo_url TEXT,
  showroom_photo_url TEXT,
  team_photo_url TEXT,
  vision TEXT NOT NULL,
  missions JSONB NOT NULL DEFAULT '[]'::jsonb,
  operational_hours VARCHAR(255),
  google_maps_address TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  seo_title VARCHAR(255) NOT NULL,
  seo_description TEXT NOT NULL,
  theme_primary_color VARCHAR(32) NOT NULL DEFAULT '#DC2626',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenors (
  id VARCHAR(64) PRIMARY KEY,
  months INTEGER UNIQUE NOT NULL,
  label VARCHAR(64) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS motor_models (
  id VARCHAR(64) PRIMARY KEY,
  brand VARCHAR(64) NOT NULL DEFAULT 'Honda',
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'Matic',
  tagline TEXT,
  description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS motor_variants (
  id VARCHAR(64) PRIMARY KEY,
  model_id VARCHAR(64) NOT NULL REFERENCES motor_models(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(64),
  otr_price BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'INDENT')),
  promo_badge VARCHAR(150),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS motor_colors (
  id VARCHAR(64) PRIMARY KEY,
  variant_id VARCHAR(64) NOT NULL REFERENCES motor_variants(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  hex_code VARCHAR(32) NOT NULL DEFAULT '#DC2626',
  secondary_hex_code VARCHAR(32) DEFAULT '#18181B',
  image_url TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS motor_images (
  id VARCHAR(64) PRIMARY KEY,
  variant_id VARCHAR(64) NOT NULL REFERENCES motor_variants(id) ON DELETE CASCADE,
  color_id VARCHAR(64) REFERENCES motor_colors(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS motor_specs (
  id VARCHAR(64) PRIMARY KEY,
  variant_id VARCHAR(64) UNIQUE NOT NULL REFERENCES motor_variants(id) ON DELETE CASCADE,
  engine_type TEXT,
  displacement VARCHAR(100),
  transmission VARCHAR(100),
  max_power VARCHAR(100),
  max_torque VARCHAR(100),
  dimension VARCHAR(150),
  weight VARCHAR(100),
  tank_capacity VARCHAR(100),
  frame_type VARCHAR(150),
  brake_system TEXT,
  tire_size TEXT,
  battery_type VARCHAR(150),
  features TEXT,
  extra_notes TEXT
);

CREATE TABLE IF NOT EXISTS credit_simulations (
  id VARCHAR(64) PRIMARY KEY,
  model_id VARCHAR(64) NOT NULL REFERENCES motor_models(id) ON DELETE CASCADE,
  variant_id VARCHAR(64) NOT NULL REFERENCES motor_variants(id) ON DELETE CASCADE,
  color_id VARCHAR(64) NOT NULL DEFAULT 'ALL',
  color_name VARCHAR(120) NOT NULL DEFAULT 'Semua Warna',
  dp BIGINT NOT NULL,
  otr BIGINT NOT NULL,
  installments JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_lookup
  ON credit_simulations(model_id, variant_id, color_id, dp);

CREATE TABLE IF NOT EXISTS promos (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  period VARCHAR(120) NOT NULL,
  highlight_text VARCHAR(150),
  image_url TEXT NOT NULL,
  whatsapp_text TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT NOT NULL,
  published_date VARCHAR(32) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS testimonials (
  id VARCHAR(64) PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  customer_location VARCHAR(150),
  motor_name VARCHAR(150) NOT NULL,
  handover_date VARCHAR(32) NOT NULL,
  caption TEXT NOT NULL,
  customer_photo_url TEXT,
  handover_photo_url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);
