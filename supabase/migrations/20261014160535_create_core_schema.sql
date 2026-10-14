/*
# Multi-Role B2B E-Commerce Core Schema

## Overview
Creates the complete database schema for a multi-role management system with:
- Stores (toko) with activation workflow
- Staff (sales, field admin, driver) with role-based access
- Products master data
- Orders with delivery tracking
- OTP verification logs for WhatsApp verification

## New Tables

### 1. stores
- `id` (uuid, PK)
- `store_name` (text, not null) — display name of the store
- `email_or_id` (text, unique, not null) — login identifier (email or store ID)
- `password` (text, nullable) — null until first-time activation
- `whatsapp_number` (text, nullable) — null until activation
- `owner_name` (text, nullable) — store owner's name
- `address_text` (text, nullable) — formatted address from Google Maps
- `lat` (double precision, nullable) — latitude coordinate
- `lng` (double precision, nullable) — longitude coordinate
- `is_activated` (boolean, default false) — false until store completes activation
- `created_at` (timestamptz)

### 2. staff
- `id` (uuid, PK)
- `name` (text, not null)
- `email` (text, unique, not null) — login identifier
- `password` (text, not null) — staff must have password set by admin
- `role` (text, not null) — 'sales' | 'field_admin' | 'driver'
- `phone` (text, nullable)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### 3. products
- `id` (uuid, PK)
- `name` (text, not null)
- `price` (integer, not null) — in rupiah
- `image` (text, nullable) — image URL
- `stock` (integer, default 0)
- `category` (text, not null)
- `unit` (text, not null) — e.g. 'karung', 'botol'

### 4. orders
- `id` (uuid, PK)
- `store_id` (uuid, FK → stores)
- `store_name` (text) — denormalized for convenience
- `staff_id` (uuid, nullable, FK → staff) — sales who created the order
- `staff_name` (text, nullable)
- `driver_id` (uuid, nullable, FK → staff) — assigned driver
- `driver_name` (text, nullable)
- `status` (text, default 'menunggu_konfirmasi')
- `total` (integer, not null)
- `items` (jsonb, not null) — array of order items
- `fleet_info` (jsonb, nullable) — { driverName, plateNumber, eta }
- `created_at` (timestamptz)

### 5. otp_logs
- `id` (uuid, PK)
- `target_number` (text, not null) — WhatsApp number
- `otp_code` (text, not null) — 6-digit code
- `purpose` (text, not null) — 'registration' | 'whatsapp_change'
- `is_verified` (boolean, default false)
- `created_at` (timestamptz)

## Security
- RLS enabled on all tables
- This app uses a custom auth flow (not Supabase Auth) — the frontend reads/writes via the anon key
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
  authentication is handled in the application layer, not at the database level
- This is a single-tenant-style app where the anon key client manages all data access

## Important Notes
1. Staff passwords are stored as plaintext for this demo — in production these would be hashed
2. The stores table uses a first-time activation workflow: password starts null,
   store must set password + whatsapp on first login
3. Orders store items as jsonb for flexibility
4. OTP logs track WhatsApp verification attempts
*/

-- ===================== STORES =====================
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL,
  email_or_id text UNIQUE NOT NULL,
  password text,
  whatsapp_number text,
  owner_name text,
  address_text text,
  lat double precision,
  lng double precision,
  is_activated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stores" ON stores;
CREATE POLICY "anon_select_stores" ON stores FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_stores" ON stores;
CREATE POLICY "anon_insert_stores" ON stores FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_stores" ON stores;
CREATE POLICY "anon_update_stores" ON stores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_stores" ON stores;
CREATE POLICY "anon_delete_stores" ON stores FOR DELETE
  TO anon, authenticated USING (true);

-- ===================== STAFF =====================
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('sales', 'field_admin', 'driver')),
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_staff" ON staff;
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_staff" ON staff;
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_staff" ON staff;
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE
  TO anon, authenticated USING (true);

-- ===================== PRODUCTS =====================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price integer NOT NULL,
  image text,
  stock integer NOT NULL DEFAULT 0,
  category text NOT NULL,
  unit text NOT NULL
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- ===================== ORDERS =====================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  store_name text,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  staff_name text,
  driver_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  driver_name text,
  status text NOT NULL DEFAULT 'menunggu_konfirmasi',
  total integer NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  fleet_info jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- ===================== OTP_LOGS =====================
CREATE TABLE IF NOT EXISTS otp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_number text NOT NULL,
  otp_code text NOT NULL,
  purpose text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_otp_logs" ON otp_logs;
CREATE POLICY "anon_select_otp_logs" ON otp_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_otp_logs" ON otp_logs;
CREATE POLICY "anon_insert_otp_logs" ON otp_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_otp_logs" ON otp_logs;
CREATE POLICY "anon_update_otp_logs" ON otp_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_otp_logs" ON otp_logs;
CREATE POLICY "anon_delete_otp_logs" ON otp_logs FOR DELETE
  TO anon, authenticated USING (true);
