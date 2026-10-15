import { useState } from 'react';
import {
  Shield, Store as StoreIcon, User as UserIcon, Package, Plus, X,
  Search, ChevronRight, MapPin, Phone, Calendar, Navigation,
  AlertCircle, CheckCircle2, Trash2, Mail, Lock, ClipboardList,
  TrendingUp, Users, ShoppingBag, LogOut, Edit3, Save, KeyRound,
} from 'lucide-react';
import { useApp } from '../context';
import { AppHeader } from '../components/AppHeader';
import { GoogleMapPicker } from '../components/GoogleMapPicker';
import { StatusBadge } from '../components/StatusBadge';
import { formatRupiah, formatDate, cn } from '../utils';
import type { Store, Staff, Product, StaffRole } from '../types';

type AdminTab = 'overview' | 'stores' | 'staff' | 'products' | 'orders';

export function AdminPortal() {
  const { user, authLoading, loginAdmin } = useApp();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-emerald-600">Memuat...</div>
      </div>
    );
  }

  if (!user || user.kind !== 'admin') {
    return <AdminLogin email={loginEmail} pass={loginPass} setEmail={setLoginEmail} setPass={setLoginPass} error={loginError} setError={setLoginError} onLogin={loginAdmin} />;
  }

  const navItems = [
    { label: 'Overview', active: tab === 'overview', onClick: () => setTab('overview') },
    { label: 'Toko', active: tab === 'stores', onClick: () => setTab('stores') },
    { label: 'Manajemen Staf', active: tab === 'staff', onClick: () => setTab('staff') },
    { label: 'Produk', active: tab === 'products', onClick: () => setTab('products') },
    { label: 'Pesanan', active: tab === 'orders', onClick: () => setTab('orders') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="CMS Admin Dashboard" navItems={navItems} />
      {tab === 'overview' && <OverviewTab setTab={setTab} />}
      {tab === 'stores' && <StoresTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'orders' && <OrdersTab />}
    </div>
  );
}

// ===== ADMIN LOGIN =====
function AdminLogin({ email, pass, setEmail, setPass, error, setError, onLogin }: {
  email: string; pass: string; setEmail: (v: string) => void; setPass: (v: string) => void;
  error: string | null; setError: (v: string | null) => void;
  onLogin: (email: string, password: string) => { success: boolean; error?: string };
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onLogin(email.trim(), pass);
    if (!result.success) {
      setError(result.error ?? 'Email atau kata sandi salah');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white">CMS Admin ArmadaExpress</h1>
          <p className="mt-1 text-sm text-gray-400">Super Admin Dashboard</p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 py-4 text-white">
            <h2 className="text-lg font-bold">Login Admin</h2>
            <p className="text-sm text-gray-300">Akses penuh ke seluruh sistem</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Email Admin</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@armadaexpress.com" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50" required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Kata sandi" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50" required />
              </div>
            </div>
            <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              Masuk sebagai Admin
            </button>
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              <p className="font-semibold">Demo: admin@armadaexpress.com / admin123</p>
            </div>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          <a href="/" className="hover:text-emerald-400">Portal Toko</a>
          {' · '}
          <a href="/staf" className="hover:text-emerald-400">Portal Staff</a>
        </p>
      </div>
    </div>
  );
}

// ===== OVERVIEW =====
function OverviewTab({ setTab }: { setTab: (t: AdminTab) => void }) {
  const { stores, staff, orders, products } = useApp();

  const stats = [
    { label: 'Total Toko', value: stores.length, sub: `${stores.filter((s) => s.is_activated).length} aktif`, icon: StoreIcon, bg: 'bg-emerald-50', color: 'text-emerald-700' },
    { label: 'Total Staff', value: staff.length, sub: `${staff.filter((s) => s.role === 'driver').length} driver`, icon: Users, bg: 'bg-blue-50', color: 'text-blue-700' },
    { label: 'Total Produk', value: products.length, sub: `${products.filter((p) => p.stock > 0).length} tersedia`, icon: Package, bg: 'bg-amber-50', color: 'text-amber-700' },
    { label: 'Total Pesanan', value: orders.length, sub: `${orders.filter((o) => o.status === 'dalam_perjalanan').length} aktif`, icon: ClipboardList, bg: 'bg-indigo-50', color: 'text-indigo-700' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <h1 className="mb-4 text-lg font-bold text-gray-900">Overview Sistem</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.bg)}>
                  <Icon className={cn('h-5 w-5', s.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-[10px] text-gray-400">{s.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Toko Terbaru</h3>
            <button onClick={() => setTab('stores')} className="text-xs font-medium text-emerald-600">Lihat semua</button>
          </div>
          <div className="space-y-2">
            {stores.slice(0, 5).map((store) => (
              <div key={store.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <StoreIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{store.store_name}</p>
                    <p className="text-xs text-gray-400">{store.email_or_id}</p>
                  </div>
                </div>
                <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', store.is_activated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', store.is_activated ? 'bg-emerald-500' : 'bg-amber-500')} />
                  {store.is_activated ? 'Aktif' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Pesanan Terbaru</h3>
            <button onClick={() => setTab('orders')} className="text-xs font-medium text-emerald-600">Lihat semua</button>
          </div>
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{order.store_name} · {formatRupiah(order.total)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== STORES TAB =====
function StoresTab() {
  const { stores, orders, addStore, deleteStore } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Store | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOwner, setNewOwner] = useState('');

  const filtered = stores.filter((s) => s.store_name.toLowerCase().includes(search.toLowerCase()) || s.email_or_id.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addStore({ store_name: newName, email_or_id: newEmail, owner_name: newOwner });
    if (result.success) {
      setShowAdd(false);
      setNewName(''); setNewEmail(''); setNewOwner('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Manajemen Toko</h1>
          <p className="text-sm text-gray-500">{stores.length} toko terdaftar · {stores.filter((s) => s.is_activated).length} aktif</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Tambah Toko
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setShowAdd(false)} />
          <form onSubmit={handleAdd} className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Tambah Toko Baru</h3>
              <button type="button" onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nama Toko" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
              <input type="email" placeholder="Email/Store ID" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
              <input type="text" placeholder="Nama Pemilik (opsional)" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
              <p className="text-xs text-gray-400">Toko akan dibuat dengan status "Pending Aktivasi". Pemilik toko akan melakukan aktivasi sendiri saat login pertama.</p>
            </div>
            <button type="submit" className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Simpan</button>
          </form>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari toko..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="space-y-3">
          {filtered.map((store) => (
            <button key={store.id} onClick={() => setSelected(store)} className={cn('flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-4 text-left shadow-sm hover:shadow-md', selected?.id === store.id ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-gray-200')}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><StoreIcon className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-sm font-bold">{store.store_name}</p>
                  <p className="text-xs text-gray-500">{store.owner_name ?? '—'} · {store.email_or_id}</p>
                  {store.address_text && <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400"><MapPin className="h-3 w-3" />{store.address_text}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', store.is_activated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', store.is_activated ? 'bg-emerald-500' : 'bg-amber-500')} />
                  {store.is_activated ? 'Aktif' : 'Pending'}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </button>
          ))}
        </div>

        <div className="lg:sticky lg:top-24">
          {selected ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">{selected.store_name}</h3>
                  <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', selected.is_activated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                    {selected.is_activated ? 'Aktif' : 'Pending Aktivasi'}
                  </span>
                </div>
              </div>
              <div className="space-y-3 px-4 py-3">
                <Row icon={UserIcon} label="Pemilik" value={selected.owner_name ?? '—'} />
                <Row icon={Mail} label="Email/ID" value={selected.email_or_id} />
                <Row icon={Phone} label="WhatsApp" value={selected.whatsapp_number ?? '—'} />
                <Row icon={Calendar} label="Terdaftar" value={formatDate(selected.created_at)} />
                {selected.address_text && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-500">Detail Alamat</p>
                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{selected.address_text}</p>
                  </div>
                )}
                {selected.lat && selected.lng && (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500"><MapPin className="h-3.5 w-3.5 text-emerald-600" />Lokasi Terpaku (Google Maps)</p>
                    <GoogleMapPicker coords={{ lat: selected.lat, lng: selected.lng }} address={selected.address_text} onChange={() => {}} height="220px" searchable={false} readOnly />
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500"><Navigation className="h-3 w-3" />{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</p>
                  </div>
                )}
                {/* Orders from store */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-500">Pesanan dari Toko Ini</p>
                  <div className="space-y-2">
                    {orders.filter((o) => o.store_id === selected.id).map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5">
                        <div><p className="text-xs font-bold">{o.id.slice(0, 8).toUpperCase()}</p><p className="text-[10px] text-gray-400">{formatRupiah(o.total)}</p></div>
                        <StatusBadge status={o.status} />
                      </div>
                    ))}
                    {orders.filter((o) => o.store_id === selected.id).length === 0 && <p className="text-xs text-gray-400">Belum ada pesanan</p>}
                  </div>
                </div>
                <button onClick={() => { if (confirm('Hapus toko ini?')) deleteStore(selected.id); }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Hapus Toko
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center">
              <MapPin className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Pilih toko untuk verifikasi lokasi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== STAFF TAB (Manajemen Staf) =====
function StaffTab() {
  const { staff, addStaff, deleteStaff, updateStaffByAdmin } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('sales');
  const [newPhone, setNewPhone] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addStaff({ name: newName, email: newEmail, password: newPass, role: newRole, phone: newPhone });
    if (result.success) {
      setShowAdd(false);
      setNewName(''); setNewEmail(''); setNewPass(''); setNewPhone(''); setNewRole('sales');
    }
  };

  const roleLabels: Record<StaffRole, string> = { sales: 'Sales', field_admin: 'Admin Lapangan', driver: 'Driver', finance: 'Admin Keuangan' };
  const roleColors: Record<StaffRole, string> = { sales: 'bg-blue-50 text-blue-700', field_admin: 'bg-amber-50 text-amber-700', driver: 'bg-emerald-50 text-emerald-700', finance: 'bg-purple-50 text-purple-700' };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Manajemen Staf</h1>
          <p className="text-sm text-gray-500">{staff.length} staf terdaftar</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Tambah Staf
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setShowAdd(false)} />
          <form onSubmit={handleAdd} className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Tambah Staff Baru</h3>
              <button type="button" onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nama Lengkap" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
              <input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
              <input type="password" placeholder="Kata Sandi" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as StaffRole)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="sales">Sales</option>
                <option value="field_admin">Admin Lapangan</option>
                <option value="driver">Driver</option>
                <option value="finance">Admin Keuangan</option>
              </select>
              <input type="tel" placeholder="Nomor HP (opsional)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <button type="submit" className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Simpan</button>
          </form>
        </div>
      )}

      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSave={async (updates) => {
            const result = await updateStaffByAdmin(editingStaff.id, updates);
            if (result.success) {
              setEditingStaff(null);
            } else {
              alert(result.error ?? 'Gagal memperbarui staf');
            }
          }}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Telepon</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><UserIcon className="h-4 w-4 text-gray-500" /></div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.email}</td>
                <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', roleColors[s.role])}>{roleLabels[s.role]}</span></td>
                <td className="px-4 py-3 text-gray-500">{s.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn('flex items-center gap-1 text-xs', s.is_active ? 'text-emerald-600' : 'text-gray-400')}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', s.is_active ? 'bg-emerald-500' : 'bg-gray-300')} />
                    {s.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditingStaff(s)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => { if (confirm('Hapus staf ini?')) deleteStaff(s.id); }} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== EDIT STAFF MODAL =====
function EditStaffModal({ staff, onClose, onSave }: {
  staff: Staff;
  onClose: () => void;
  onSave: (updates: Partial<Pick<Staff, 'name' | 'role' | 'phone' | 'password' | 'is_active' | 'email'>>) => Promise<void>;
}) {
  const [name, setName] = useState(staff.name);
  const [email, setEmail] = useState(staff.email);
  const [role, setRole] = useState<StaffRole>(staff.role);
  const [phone, setPhone] = useState(staff.phone ?? '');
  const [isActive, setIsActive] = useState(staff.is_active);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const updates: Partial<Pick<Staff, 'name' | 'role' | 'phone' | 'password' | 'is_active' | 'email'>> = {
      name, email, role, phone: phone || null, is_active: isActive,
    };
    if (newPassword.trim()) {
      updates.password = newPassword.trim();
    }
    await onSave(updates);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <form onSubmit={handleSave} className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold">Edit Staf: {staff.name}</h3>
          </div>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Nama Lengkap</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
              <option value="sales">Sales</option>
              <option value="field_admin">Admin Lapangan</option>
              <option value="driver">Driver</option>
              <option value="finance">Admin Keuangan</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Nomor HP</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Reset Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Kosongkan jika tidak diubah" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Status Akun</label>
            <button type="button" onClick={() => setIsActive(!isActive)} className={cn('flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm', isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500')}>
              {isActive ? 'Aktif' : 'Nonaktif'}
              <span className={cn('flex h-5 w-9 items-center rounded-full p-0.5 transition', isActive ? 'bg-emerald-500' : 'bg-gray-300')}>
                <span className={cn('h-4 w-4 rounded-full bg-white transition', isActive ? 'translate-x-4' : '')} />
              </span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300">
            <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ===== PRODUCTS TAB =====
function ProductsTab() {
  const { products, addProduct, deleteProduct } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newImage, setNewImage] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addProduct({
      name: newName,
      price: parseInt(newPrice) || 0,
      stock: parseInt(newStock) || 0,
      category: newCategory,
      unit: newUnit,
      image: newImage || null,
    });
    if (result.success) {
      setShowAdd(false);
      setNewName(''); setNewPrice(''); setNewStock(''); setNewCategory(''); setNewUnit(''); setNewImage('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Master Data Produk</h1>
          <p className="text-sm text-gray-500">{products.length} produk</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Tambah Produk
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setShowAdd(false)} />
          <form onSubmit={handleAdd} className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Tambah Produk</h3>
              <button type="button" onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nama Produk" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Harga (Rp)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
                <input type="number" placeholder="Stok" value={newStock} onChange={(e) => setNewStock(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Kategori" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
                <input type="text" placeholder="Satuan (karung, botol)" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" required />
              </div>
              <input type="text" placeholder="URL Gambar (opsional)" value={newImage} onChange={(e) => setNewImage(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <button type="submit" className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Simpan</button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.image && <img src={p.image} alt={p.name} className="h-8 w-8 rounded object-cover" />}
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.category}</td>
                <td className="px-4 py-3 font-medium">{formatRupiah(p.price)}</td>
                <td className="px-4 py-3">
                  <span className={cn('font-medium', p.stock === 0 ? 'text-red-500' : p.stock < 50 ? 'text-amber-600' : 'text-emerald-600')}>
                    {p.stock} {p.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { if (confirm('Hapus produk?')) deleteProduct(p.id); }} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== ORDERS TAB =====
function OrdersTab() {
  const { orders, stores } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof orders[0] | null>(null);

  const filtered = orders.filter((o) => o.id.toLowerCase().includes(search.toLowerCase()) || (o.store_name ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <h1 className="mb-4 text-lg font-bold text-gray-900">Semua Pesanan</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari pesanan atau toko..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="space-y-3">
          {filtered.map((order) => (
            <button key={order.id} onClick={() => setSelected(order)} className={cn('flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-4 text-left shadow-sm hover:shadow-md', selected?.id === order.id ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-gray-200')}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><Package className="h-5 w-5 text-gray-500" /></div>
                <div>
                  <p className="text-sm font-bold">{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{order.store_name}</p>
                  <p className="text-xs text-gray-400">{order.items.length} item · {formatRupiah(order.total)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2"><StatusBadge status={order.status} /><ChevronRight className="h-4 w-4 text-gray-300" /></div>
            </button>
          ))}
        </div>

        <div className="lg:sticky lg:top-24">
          {selected ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">{selected.id.slice(0, 8).toUpperCase()}</h3>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="mt-1 text-sm text-gray-500">{selected.store_name}</p>
              </div>
              <div className="space-y-3 px-4 py-3">
                <div className="space-y-1.5">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} × {item.quantity} {item.unit}</span>
                      <span className="font-medium">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold"><span>Total</span><span className="text-emerald-700">{formatRupiah(selected.total)}</span></div>
                </div>
                {(() => {
                  const store = stores.find((s) => s.id === selected.store_id);
                  if (store?.lat && store?.lng) {
                    return (
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500"><MapPin className="h-3.5 w-3.5 text-emerald-600" />Lokasi Pengiriman (Google Maps)</p>
                        <GoogleMapPicker coords={{ lat: store.lat, lng: store.lng }} address={store.address_text} onChange={() => {}} height="200px" searchable={false} readOnly />
                        {store.address_text && <p className="mt-1.5 text-xs text-gray-500">{store.address_text}</p>}
                      </div>
                    );
                  }
                  return null;
                })()}
                {selected.fleet_info && (
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-blue-50 p-3 text-xs">
                    <div><p className="text-blue-600">Driver</p><p className="font-semibold">{selected.fleet_info.driverName}</p></div>
                    <div><p className="text-blue-600">Plat</p><p className="font-semibold">{selected.fleet_info.plateNumber}</p></div>
                    <div><p className="text-blue-600">ETA</p><p className="font-semibold">{selected.fleet_info.eta}</p></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center">
              <Package className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Pilih pesanan untuk detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
