import { useState, useEffect } from 'react';
import {
  Truck, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2,
  Package, MapPin, User, Phone, Send, Clock, Hash, Navigation,
  ClipboardList, TrendingUp, Store as StoreIcon, Search, ChevronRight,
  ShoppingCart, Plus, Minus, Trash2, ShoppingBag, X, Settings, Save, KeyRound,
} from 'lucide-react';
import { useApp } from '../context';
import { AppHeader } from '../components/AppHeader';
import { GoogleMapPicker } from '../components/GoogleMapPicker';
import { StatusBadge, statusConfig } from '../components/StatusBadge';
import { formatRupiah, formatDate, cn } from '../utils';
import type { Staff, Order, OrderStatus, Coordinates, StaffRole } from '../types';

type StaffView = 'orders' | 'catalog' | 'deliveries' | 'stores' | 'profile';

export function StaffPortal() {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-emerald-600">Memuat...</div>
      </div>
    );
  }

  if (!user || user.kind !== 'staff') {
    return <StaffLogin />;
  }

  return <StaffDashboard staff={user.staff!} />;
}

// ===== STAFF LOGIN =====
function StaffLogin() {
  const { loginStaff } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await loginStaff(email.trim(), password);
    setLoading(false);
    if (!result.success) setError(result.error ?? 'Login gagal');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Portal Staff ArmadaExpress</h1>
          <p className="mt-1 text-sm text-gray-500">Sales · Admin Lapangan · Driver</p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-4 text-white">
            <h2 className="text-lg font-bold">Login Staff</h2>
            <p className="text-sm text-blue-50">Masuk dengan email dan kata sandi Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@armadaexpress.com" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-50" required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata sandi" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-50" required />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <p className="font-semibold">Demo akun staff:</p>
              <p className="mt-0.5">Sales: sales@armadaexpress.com / sales123</p>
              <p>Admin Lapangan: adminlapangan@armadaexpress.com / admin123</p>
              <p>Driver: driver@armadaexpress.com / driver123</p>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Login Toko? <a href="/" className="text-emerald-600 hover:underline">Portal Toko</a>
          {' · '}
          <a href="/admin" className="text-emerald-600 hover:underline">Admin CMS</a>
        </p>
      </div>
    </div>
  );
}

// ===== STAFF DASHBOARD ROUTER =====
function StaffDashboard({ staff }: { staff: Staff }) {
  const [view, setView] = useState<StaffView>(staff.role === 'driver' ? 'deliveries' : 'orders');

  if (staff.role === 'sales') return <SalesDashboard staff={staff} view={view} setView={setView} />;
  if (staff.role === 'field_admin') return <FieldAdminDashboard staff={staff} view={view} setView={setView} />;
  if (staff.role === 'driver') return <DriverDashboard staff={staff} view={view} setView={setView} />;
  return null;
}

// ===== SALES DASHBOARD =====
function SalesDashboard({ staff, view, setView }: { staff: Staff; view: StaffView; setView: (v: StaffView) => void }) {
  const { orders, stores, products, cart, addToCart, updateCartQty, removeFromCart, cartTotal, cartCount, placeOrder } = useApp();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const myOrders = orders.filter((o) => o.staff_id === staff.id);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) && (activeCategory === 'Semua' || p.category === activeCategory));
  const categories = ['Semua', ...new Set(products.map((p) => p.category))];

  const handleCheckout = async () => {
    if (!selectedStoreId) { setToast('Pilih toko terlebih dahulu'); setTimeout(() => setToast(null), 2000); return; }
    const store = stores.find((s) => s.id === selectedStoreId);
    if (!store) return;
    const order = await placeOrder(store.id, store.store_name, staff.id, staff.name);
    if (order) {
      setToast(`Pesanan ${order.id?.slice(0, 8).toUpperCase()} berhasil dibuat!`);
      setTimeout(() => setToast(null), 3000);
      setCartOpen(false);
    }
  };

  const navItems = [
    { label: 'Riwayat Pesanan', active: view === 'orders', onClick: () => setView('orders') },
    { label: 'Katalog & Order', active: view === 'catalog', onClick: () => setView('catalog') },
    { label: 'Profil', active: view === 'profile', onClick: () => setView('profile') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Dashboard Sales" navItems={navItems} onCartClick={() => setCartOpen(true)} />

      {view === 'orders' && (
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="mb-4">
            <h1 className="text-lg font-bold text-gray-900">Riwayat Pesanan Sales</h1>
            <p className="text-sm text-gray-500">Pesanan yang Anda buat untuk toko</p>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <StatCard label="Total Pesanan" value={String(myOrders.length)} icon={ClipboardList} />
            <StatCard label="Omzet" value={formatRupiah(myOrders.reduce((s, o) => s + o.total, 0))} icon={TrendingUp} small />
            <StatCard label="Selesai" value={String(myOrders.filter((o) => o.status === 'selesai').length)} icon={CheckCircle2} />
          </div>
          {myOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <Package className="mb-3 h-12 w-12 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Belum ada pesanan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', statusConfig[order.status].cls)}>
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{order.store_name} · {formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold">{formatRupiah(order.total)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'catalog' && (
        <div className="mx-auto max-w-7xl px-4 py-5">
          {/* Store selector */}
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">Pilih Toko untuk Pesanan:</label>
            <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">-- Pilih Toko --</option>
              {stores.filter((s) => s.is_activated).map((s) => (
                <option key={s.id} value={s.id}>{s.store_name} — {s.email_or_id}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium', activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>{cat}</button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => {
              const cartItem = cart.find((c) => c.product.id === p.id);
              return (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                    {p.image && <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="mt-1 text-base font-bold text-emerald-700">{formatRupiah(p.price)}</p>
                    {cartItem ? (
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateCartQty(p.id, cartItem.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="min-w-8 text-center text-sm font-semibold">{cartItem.quantity}</span>
                          <button onClick={() => updateCartQty(p.id, cartItem.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <button onClick={() => removeFromCart(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(p)} disabled={p.stock === 0} className={cn('mt-3 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold', p.stock === 0 ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700')}>
                        <Plus className="h-4 w-4" /> Tambah
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {cartCount > 0 && (
            <button onClick={() => setCartOpen(true)} className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
              <ShoppingCart className="h-5 w-5" /> Keranjang
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-blue-700">{cartCount}</span>
            </button>
          )}

          {cartOpen && (
            <div className="fixed inset-0 z-40">
              <div className="absolute inset-0 bg-gray-900/50" onClick={() => setCartOpen(false)} />
              <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
                  <div className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold">Keranjang Pesanan Sales</h2></div>
                  <button onClick={() => setCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="mb-3 flex gap-3 rounded-lg border border-gray-100 p-3">
                      {item.product.image && <img src={item.product.image} alt={item.product.name} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />}
                      <div className="flex flex-1 flex-col">
                        <h3 className="text-sm font-medium">{item.product.name}</h3>
                        <p className="text-xs text-gray-500">{formatRupiah(item.product.price)} / {item.product.unit}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateCartQty(item.product.id, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.product.id, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                          <p className="text-sm font-bold text-blue-700">{formatRupiah(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 px-4 py-4">
                  <div className="mb-3 flex items-center justify-between"><span className="text-sm text-gray-500">Total</span><span className="text-lg font-bold">{formatRupiah(cartTotal)}</span></div>
                  <button onClick={handleCheckout} className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">Buat Pesanan untuk Toko</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{toast}</div>
        </div>
      )}

      {view === 'profile' && <StaffProfile staff={staff} />}
    </div>
  );
}

// ===== FIELD ADMIN DASHBOARD =====
function FieldAdminDashboard({ staff, view, setView }: { staff: Staff; view: StaffView; setView: (v: StaffView) => void }) {
  const { orders, stores, updateOrderStatus, assignFleet, staff: allStaff } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [driverId, setDriverId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [eta, setEta] = useState('');

  const drivers = allStaff.filter((s) => s.role === 'driver' && s.is_active);
  const filtered = orders.filter((o) => o.id.toLowerCase().includes(search.toLowerCase()) || (o.store_name ?? '').toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all: orders.length,
    menunggu: orders.filter((o) => o.status === 'menunggu_konfirmasi').length,
    diproses: orders.filter((o) => o.status === 'diproses').length,
    perjalanan: orders.filter((o) => o.status === 'dalam_perjalanan').length,
    selesai: orders.filter((o) => o.status === 'selesai').length,
  };

  const navItems = [
    { label: 'Kelola Pesanan', active: view === 'orders', onClick: () => setView('orders') },
    { label: 'Direktori Toko', active: view === 'stores', onClick: () => setView('stores') },
    { label: 'Profil', active: view === 'profile', onClick: () => setView('profile') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Dashboard Admin Lapangan" navItems={navItems} />

      {view === 'orders' && (
        <>
          <div className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-4">
              <div className="grid grid-cols-5 gap-2">
                <StatBox label="Menunggu" value={counts.menunggu} bg="bg-gray-100" color="text-gray-700" />
                <StatBox label="Diproses" value={counts.diproses} bg="bg-amber-50" color="text-amber-700" />
                <StatBox label="Diantar" value={counts.perjalanan} bg="bg-blue-50" color="text-blue-700" />
                <StatBox label="Tiba" value={counts.selesai} bg="bg-emerald-50" color="text-emerald-700" />
                <StatBox label="Total" value={counts.all} bg="bg-indigo-50" color="text-indigo-700" />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-5">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari pesanan atau toko..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              <div className="space-y-3">
                {filtered.map((order) => (
                  <button key={order.id} onClick={() => setSelected(order)} className={cn('flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-4 text-left shadow-sm hover:shadow-md', selected?.id === order.id ? 'border-blue-400 ring-2 ring-blue-50' : 'border-gray-200')}>
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', statusConfig[order.status].cls)}><Package className="h-5 w-5" /></div>
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
                    <div className="px-4 py-3">
                      <div className="mb-4 space-y-1.5">
                        {selected.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.name} × {item.quantity} {item.unit}</span>
                            <span className="font-medium">{formatRupiah(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold"><span>Total</span><span className="text-blue-700">{formatRupiah(selected.total)}</span></div>
                      </div>

                      {/* Store location map */}
                      {(() => {
                        const store = stores.find((s) => s.id === selected.store_id);
                        if (store?.lat && store?.lng) {
                          return (
                            <div className="mb-4">
                              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500"><MapPin className="h-3.5 w-3.5 text-blue-600" />Lokasi Toko (Google Maps)</p>
                              <GoogleMapPicker coords={{ lat: store.lat, lng: store.lng }} address={store.address_text} onChange={() => {}} height="180px" searchable={false} readOnly />
                              {store.address_text && <p className="mt-1.5 text-xs text-gray-500">{store.address_text}</p>}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {selected.status === 'menunggu_konfirmasi' && (
                        <button onClick={() => { updateOrderStatus(selected.id, 'diproses'); setSelected({ ...selected, status: 'diproses' }); }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                          <Package className="h-4 w-4" /> Konfirmasi & Proses
                        </button>
                      )}

                      {selected.status === 'diproses' && (
                        <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                          <p className="text-sm font-semibold text-blue-900">Penugasan Driver</p>
                          <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm">
                            <option value="">Pilih Driver...</option>
                            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                          <input type="text" placeholder="Plat Nomor (B 1234 ABC)" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm" />
                          <input type="text" placeholder="ETA (30 Menit)" value={eta} onChange={(e) => setEta(e.target.value)} className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm" />
                          <button onClick={() => { const d = drivers.find((x) => x.id === driverId); if (d) { assignFleet(selected.id, d.id, d.name, plateNumber, eta || '30 Menit'); setSelected({ ...selected, status: 'dalam_perjalanan', driver_name: d.name, fleet_info: { driverName: d.name, plateNumber, eta: eta || '30 Menit' } }); } }} disabled={!driverId || !plateNumber} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">
                            <Send className="h-4 w-4" /> Kirim Driver
                          </button>
                        </div>
                      )}

                      {selected.status === 'dalam_perjalanan' && selected.fleet_info && (
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
                    <MapPin className="mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Pilih pesanan untuk mengelola</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'stores' && (
        <div className="mx-auto max-w-7xl px-4 py-5">
          <h1 className="mb-4 text-lg font-bold text-gray-900">Direktori Toko</h1>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <div key={store.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50"><StoreIcon className="h-4 w-4 text-emerald-600" /></div>
                    <div><p className="text-sm font-bold">{store.store_name}</p><p className="text-xs text-gray-400">{store.owner_name}</p></div>
                  </div>
                  <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', store.is_activated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', store.is_activated ? 'bg-emerald-500' : 'bg-amber-500')} />
                    {store.is_activated ? 'Aktif' : 'Pending'}
                  </span>
                </div>
                {store.address_text && <p className="text-xs text-gray-500"><MapPin className="mr-1 inline h-3 w-3" />{store.address_text}</p>}
                {store.whatsapp_number && <p className="mt-1 text-xs text-gray-500"><Phone className="mr-1 inline h-3 w-3" />{store.whatsapp_number}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'profile' && <StaffProfile staff={staff} />}
    </div>
  );
}

// ===== DRIVER DASHBOARD (Mobile-First) =====
function DriverDashboard({ staff, view, setView }: { staff: Staff; view: StaffView; setView: (v: StaffView) => void }) {
  const { orders, stores, updateOrderStatus } = useApp();
  const [selected, setSelected] = useState<Order | null>(null);

  const myDeliveries = orders.filter((o) => o.driver_id === staff.id || o.driver_name === staff.name);
  const active = myDeliveries.filter((o) => o.status === 'dalam_perjalanan');
  const completed = myDeliveries.filter((o) => o.status === 'selesai');

  const navItems = [
    { label: 'Pengiriman Aktif', active: view === 'deliveries', onClick: () => setView('deliveries') },
    { label: 'Riwayat', active: view === 'orders', onClick: () => setView('orders') },
    { label: 'Profil', active: view === 'profile', onClick: () => setView('profile') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Dashboard Driver" navItems={navItems} />

      {view === 'deliveries' && (
        <div className="mx-auto max-w-2xl px-4 py-4">
          {/* Driver card */}
          <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">{staff.name}</p>
                <p className="text-xs text-blue-100">Driver Armada · {staff.phone}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/15 p-2.5 text-center">
                <p className="text-2xl font-bold">{active.length}</p>
                <p className="text-xs text-blue-100">Aktif</p>
              </div>
              <div className="rounded-lg bg-white/15 p-2.5 text-center">
                <p className="text-2xl font-bold">{completed.length}</p>
                <p className="text-xs text-blue-100">Selesai</p>
              </div>
            </div>
          </div>

          {/* Active deliveries */}
          <h2 className="mb-3 text-sm font-bold text-gray-900">Pengiriman Aktif</h2>
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-10 text-center">
              <Package className="mb-2 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Tidak ada pengiriman aktif</p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((order) => {
                const store = stores.find((s) => s.id === order.store_id);
                return (
                  <div key={order.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold">{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{order.store_name}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    {order.fleet_info && (
                      <div className="px-4 py-2 text-xs text-gray-500">
                        <p>Plat: <span className="font-semibold">{order.fleet_info.plateNumber}</span> · ETA: <span className="font-semibold">{order.fleet_info.eta}</span></p>
                      </div>
                    )}
                    {store?.address_text && (
                      <div className="px-4 py-2 text-xs text-gray-500">
                        <MapPin className="mr-1 inline h-3 w-3 text-blue-600" />
                        {store.address_text}
                      </div>
                    )}
                    {store?.lat && store?.lng && (
                      <div className="px-4 pb-3">
                        <GoogleMapPicker coords={{ lat: store.lat, lng: store.lng }} address={store.address_text} onChange={() => {}} height="200px" searchable={false} readOnly />
                      </div>
                    )}
                    <div className="border-t border-gray-100 px-4 py-3">
                      <button onClick={() => { updateOrderStatus(order.id, 'selesai'); }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> Tandai Tiba di Tujuan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick completed */}
          {completed.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-bold text-gray-900">Baru Selesai</h2>
              <div className="space-y-2">
                {completed.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{order.store_name}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'orders' && (
        <div className="mx-auto max-w-2xl px-4 py-4">
          <h1 className="mb-4 text-lg font-bold text-gray-900">Riwayat Pengiriman</h1>
          {myDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center">
              <Package className="mb-2 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada riwayat</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myDeliveries.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{order.store_name} · {formatDate(order.created_at)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'profile' && <StaffProfile staff={staff} />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, small }: { label: string; value: string; icon: typeof TrendingUp; small?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50"><Icon className="h-5 w-5 text-blue-700" /></div>
      <div className="min-w-0"><p className={cn('font-bold text-gray-900', small ? 'text-sm' : 'text-xl')}>{value}</p><p className="truncate text-xs text-gray-500">{label}</p></div>
    </div>
  );
}

function StatBox({ label, value, bg, color }: { label: string; value: number; bg: string; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 p-2">
      <div className={cn('mb-1 flex h-7 w-7 items-center justify-center rounded-md', bg)}><Package className={cn('h-3.5 w-3.5', color)} /></div>
      <p className="text-base font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

// ===== STAFF PROFILE (Self-Service Settings) =====
function StaffProfile({ staff }: { staff: Staff }) {
  const { updateStaffProfile } = useApp();
  const [name, setName] = useState(staff.name);
  const [phone, setPhone] = useState(staff.phone ?? '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const roleLabels: Record<StaffRole, string> = { sales: 'Sales', field_admin: 'Admin Lapangan', driver: 'Driver' };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const updates: Partial<Staff> = {};

    if (name !== staff.name) updates.name = name;
    if ((phone || null) !== staff.phone) updates.phone = phone || null;

    if (newPass.trim()) {
      if (newPass.length < 6) {
        setError('Kata sandi baru minimal 6 karakter');
        return;
      }
      if (newPass !== confirmPass) {
        setError('Konfirmasi kata sandi tidak cocok');
        return;
      }
      if (currentPass !== staff.password) {
        setError('Kata sandi saat ini salah');
        return;
      }
      updates.password = newPass.trim();
    }

    if (Object.keys(updates).length === 0) {
      setError('Tidak ada perubahan untuk disimpan');
      return;
    }

    setSaving(true);
    const result = await updateStaffProfile(staff.id, updates);
    setSaving(false);

    if (result.success) {
      setSuccess('Profil berhasil diperbarui');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error ?? 'Gagal memperbarui profil');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <h1 className="mb-4 text-lg font-bold text-gray-900">Profil & Pengaturan</h1>

      {/* Account info card */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <User className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{staff.name}</p>
            <p className="text-sm text-gray-500">{staff.email}</p>
            <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{roleLabels[staff.role]}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {success}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Nama Lengkap</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-50" required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Email (tidak dapat diubah)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="email" value={staff.email} disabled className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-400" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Nomor HP</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-50" />
          </div>
        </div>

        {/* Password change section */}
        <div className="border-t border-gray-100 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900">Ubah Kata Sandi</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Kata Sandi Saat Ini</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} placeholder="Masukkan kata sandi saat ini" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-50" />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Kata Sandi Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Minimal 6 karakter" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-50" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Konfirmasi Sandi Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Ulangi sandi baru" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-50" />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Kosongkan kolom kata sandi jika tidak ingin mengubahnya.</p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">
          <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}
