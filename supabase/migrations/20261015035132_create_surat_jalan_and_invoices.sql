-- Update staff role constraint to include 'finance'
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_role_check CHECK (role IN ('sales', 'field_admin', 'driver', 'finance'));

-- ===================== SURAT JALAN =====================
CREATE TABLE IF NOT EXISTS surat_jalan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_surat_jalan text UNIQUE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  driver_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  driver_name text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai', 'dibatalkan')),
  catatan text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE surat_jalan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_surat_jalan" ON surat_jalan;
CREATE POLICY "anon_select_surat_jalan" ON surat_jalan FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_surat_jalan" ON surat_jalan;
CREATE POLICY "anon_insert_surat_jalan" ON surat_jalan FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_surat_jalan" ON surat_jalan;
CREATE POLICY "anon_update_surat_jalan" ON surat_jalan FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_surat_jalan" ON surat_jalan;
CREATE POLICY "anon_delete_surat_jalan" ON surat_jalan FOR DELETE
  TO anon, authenticated USING (true);

-- ===================== INVOICES =====================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_faktur text UNIQUE NOT NULL,
  surat_jalan_id uuid REFERENCES surat_jalan(id) ON DELETE CASCADE,
  nomor_surat_jalan text NOT NULL,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_asli integer NOT NULL DEFAULT 0,
  total_setelah_penolakan integer NOT NULL DEFAULT 0,
  metode_pembayaran text NOT NULL DEFAULT 'tunai' CHECK (metode_pembayaran IN ('tunai', 'top')),
  top_jangka_waktu integer,
  top_jatuh_tempo date,
  status text NOT NULL DEFAULT 'belum_lunas' CHECK (status IN ('belum_lunas', 'lunas', 'jatuh_tempo')),
  tanggal_pembayaran date,
  catatan text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE
  TO anon, authenticated USING (true);