import { useState, useEffect } from 'react';
import {
  Truck, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2,
  MessageCircle, MapPin, Store as StoreIcon, Package, ShoppingCart,
  Settings, Search, Plus, Minus, Trash2, ShoppingBag, X, Navigation,
  ShieldCheck, TrendingUp, ClipboardList, Phone, User,
} from 'lucide-react';
import { useApp } from '../context';
import { AppHeader } from '../components/AppHeader';
import { GoogleMapPicker } from '../components/GoogleMapPicker';
import { StatusBadge } from '../components/StatusBadge';
import { sendWhatsAppOTP, verifyWhatsAppOTP } from '../lib/whatsapp';
import { formatRupiah, formatDate, cn } from '../utils';
import type { Store, Coordinates, OrderStatus } from '../types';

type StoreView = 'catalog' | 'orders' | 'profile';

export function StorePortal() {
  const { user, authLoading, loginStore, activateStore } = useApp();
  const [view, setView] = useState<StoreView>('catalog');

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-emerald-600">Memuat...</div>
      </div>
    );
  }

  if (!user || user.kind !== 'store') {
    return <StoreLogin />;
  }

  if (!user.store || !user.store.is_activated) {
    return <StoreActivation store={user.store!} onActivate={activateStore} />;
  }

  const navItems = [
    { label: 'Katalog Produk', active: view === 'catalog', onClick: () => setView('catalog') },
    { label: 'Status Pengiriman', active: view === 'orders', onClick: () => setView('orders') },
    { label: 'Profile & Settings', active: view === 'profile', onClick: () => setView('profile') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        title="Portal Toko"
        navItems={navItems}
        onCartClick={() => {}}
        onNavigateProfile={() => setView('profile')}
      />
      {view === 'catalog' && <StoreCatalog />}
      {view === 'orders' && <StoreOrders />}
      {view === 'profile' && <StoreProfile store={user.store} />}
    </div>
  );
}

// ===== STORE LOGIN =====
function StoreLogin() {
  const { loginStore } = useApp();
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await loginStore(emailOrId.trim(), password);
    setLoading(false);
    if (!result.success && !result.needsActivation) {
      setError(result.error ?? 'Login gagal');
    }
    // needsActivation will be handled by StoreActivation component
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Portal Toko ArmadaExpress</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk dengan Email/Store ID Anda</p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-4 text-white">
            <h2 className="text-lg font-bold">Login Toko</h2>
            <p className="text-sm text-emerald-50">Pemesanan grosir & lacak pengiriman</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Email / Store ID</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  placeholder="toko@email.com atau Store ID"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !emailOrId}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <p className="font-semibold">Demo akun toko:</p>
              <p className="mt-0.5">Aktif: toko@sumberrejeki.com / toko123</p>
              <p>Belum Aktif: toko@berkah.com (kata sandi apa saja)</p>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Bukan toko? <a href="/staf" className="text-emerald-600 hover:underline">Login Staff</a>
          {' · '}
          <a href="/admin" className="text-emerald-600 hover:underline">Admin CMS</a>
        </p>
      </div>
    </div>
  );
}

// ===== STORE ACTIVATION =====
function StoreActivation({ store, onActivate }: { store: Store; onActivate: (id: string, pw: string, wa: string) => Promise<{ success: boolean; error?: string }> }) {
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<'form' | 'otp' | 'done'>('form');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Kata sandi minimal 6 karakter'); return; }
    if (password !== confirmPass) { setError('Konfirmasi kata sandi tidak cocok'); return; }
    if (!whatsapp.trim()) { setError('Nomor WhatsApp wajib diisi'); return; }

    setLoading(true);
    const result = await sendWhatsAppOTP(whatsapp, 'registration');
    setLoading(false);
    if (result.success && result.otp_code) {
      setGeneratedOtp(result.otp_code);
      setStep('otp');
    } else {
      setError(result.error ?? 'Gagal mengirim OTP');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const verified = await verifyWhatsAppOTP(whatsapp, otp);
    if (!verified) {
      setError('Kode OTP salah');
      setLoading(false);
      return;
    }
    const result = await onActivate(store.id, password, whatsapp);
    setLoading(false);
    if (result.success) {
      setStep('done');
    } else {
      setError(result.error ?? 'Aktivasi gagal');
    }
  };

  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Aktivasi Berhasil!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Toko <strong>{store.store_name}</strong> telah diaktifkan. Anda dapat mulai memesan produk.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Aktivasi Toko Pertama Kali</h1>
          <p className="text-sm text-gray-500">Lengkapi data keamanan toko Anda</p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-amber-500 px-6 py-3 text-white">
            <p className="text-sm font-semibold">Toko: {store.store_name}</p>
            <p className="text-xs text-amber-50">{store.email_or_id}</p>
          </div>

          <div className="flex items-center justify-center gap-2 border-b border-gray-100 px-6 py-3">
            <StepDot active={step === 'form'} done={step !== 'form'} n={1} />
            <div className={cn('h-0.5 w-8', step !== 'form' ? 'bg-emerald-500' : 'bg-gray-200')} />
            <StepDot active={step === 'otp'} done={(step as string) === 'done'} n={2} />
            <div className={cn('h-0.5 w-8', (step as string) === 'done' ? 'bg-emerald-500' : 'bg-gray-200')} />
            <StepDot active={(step as string) === 'done'} done={false} n={3} />
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Buat Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Konfirmasi Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Nomor WhatsApp Aktif</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="081234567890"
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300">
                  <MessageCircle className="h-4 w-4" />
                  {loading ? 'Mengirim...' : 'Verifikasi WhatsApp'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Kode OTP Terkirim ke WhatsApp</p>
                  <p className="mt-1 text-sm font-bold text-green-700">{whatsapp}</p>
                </div>

                <div className="rounded-xl border border-green-200 bg-green-50/50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 rounded-lg bg-white p-3 shadow-sm">
                      <p className="text-xs text-gray-500">Pesan WhatsApp masuk:</p>
                      <p className="mt-1 text-sm text-gray-700">
                        Kode OTP: <span className="font-bold text-lg tracking-wider text-green-700">{generatedOtp}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit kode OTP"
                  className="w-full rounded-lg border border-gray-200 py-3 text-center text-xl font-bold tracking-[0.5em] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50"
                  required
                  maxLength={6}
                  autoFocus
                />

                <button type="submit" disabled={loading || otp.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {loading ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
                </button>
                <button type="button" onClick={() => setStep('form')} className="w-full text-center text-xs text-gray-500">
                  Kembali
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, done, n }: { active: boolean; done: boolean; n: number }) {
  return (
    <div className={cn(
      'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
      done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500' : 'bg-gray-100 text-gray-400'
    )}>
      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
    </div>
  );
}

// ===== STORE CATALOG =====
function StoreCatalog() {
  const { user, products, addToCart, cart, updateCartQty, removeFromCart, cartTotal, cartCount, placeOrder } = useApp();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [toast, setToast] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mc = activeCategory === 'Semua' || p.category === activeCategory;
    return ms && mc;
  });
  const categories = ['Semua', ...new Set(products.map((p) => p.category))];

  const handleCheckout = async () => {
    if (!user?.store) return;
    const order = await placeOrder(user.store.id, user.store.store_name);
    if (order) {
      setToast(`Pesanan ${order.id ?? 'baru'} berhasil dibuat!`);
      setTimeout(() => setToast(null), 3000);
      setCartOpen(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
        <div className="relative mx-auto max-w-7xl px-4 py-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white">Katalog Produk Grosir</h1>
            <p className="mt-2 text-sm text-emerald-50">
              Pesanan sembako, minuman, dan kebutuhan toko Anda — dikirim langsung oleh armada internal kami.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm text-emerald-50">
              <CheckCircle2 className="h-4 w-4" />
              <span>Login sebagai <strong>{user?.store?.store_name}</strong> — Anda dapat membuat pesanan.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Categories */}
      <div className="sticky top-16 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium',
                    activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-5">
        <p className="mb-3 text-sm text-gray-500">{filtered.length} produk tersedia</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => {
            const outOfStock = p.stock === 0;
            const cartItem = cart.find((c) => c.product.id === p.id);
            return (
              <div key={p.id} className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                  {p.image && (
                    <img src={p.image} alt={p.name} className={cn('h-full w-full object-cover transition-transform duration-300 group-hover:scale-105', outOfStock && 'opacity-50 grayscale')} loading="lazy" />
                  )}
                  {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-md bg-gray-900/80 px-3 py-1.5 text-xs font-semibold text-white">Stok Habis</span>
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-600">{p.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">Stok: {p.stock} {p.unit}</p>
                  <p className="mt-2 text-base font-bold text-emerald-700">{formatRupiah(p.price)}</p>
                  {cartItem ? (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateCartQty(p.id, cartItem.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{cartItem.quantity}</span>
                        <button onClick={() => updateCartQty(p.id, cartItem.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(p.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={outOfStock}
                      onClick={() => { addToCart(p); setToast(`${p.name} ditambahkan`); setTimeout(() => setToast(null), 1500); }}
                      className={cn('mt-3 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold', outOfStock ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700')}
                    >
                      <Plus className="h-4 w-4" />
                      Tambah
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700"
        >
          <ShoppingCart className="h-5 w-5" />
          Keranjang
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-emerald-700">{cartCount}</span>
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-bold">Keranjang Pesanan</h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag className="mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">Keranjang masih kosong</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 rounded-lg border border-gray-100 p-3">
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
                          <p className="text-sm font-bold text-emerald-700">{formatRupiah(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Pesanan</span>
                  <span className="text-lg font-bold">{formatRupiah(cartTotal)}</span>
                </div>
                <button onClick={handleCheckout} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                  Buat Pesanan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}
    </>
  );
}

// ===== STORE ORDERS =====
function StoreOrders() {
  const { user, orders } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const myOrders = orders.filter((o) => o.store_id === user?.store?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Status Pengiriman</h1>
        <p className="text-sm text-gray-500">Lacak armada pengiriman pesanan Anda</p>
      </div>

      {myOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Package className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Belum ada pesanan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myOrders.map((order) => {
            const isOpen = expanded === order.id;
            return (
              <div key={order.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                      <Package className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)} · {order.items.length} item</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold">{formatRupiah(order.total)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="mb-3 space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name} × {item.quantity} {item.unit}</span>
                          <span className="font-medium">{formatRupiah(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mb-3 flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                      <span>Total</span>
                      <span className="text-emerald-700">{formatRupiah(order.total)}</span>
                    </div>
                    {order.fleet_info && (
                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-blue-50 p-3 text-xs">
                        <div><p className="text-blue-600">Driver</p><p className="font-semibold">{order.fleet_info.driverName}</p></div>
                        <div><p className="text-blue-600">Plat</p><p className="font-semibold">{order.fleet_info.plateNumber}</p></div>
                        <div><p className="text-blue-600">ETA</p><p className="font-semibold">{order.fleet_info.eta}</p></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== STORE PROFILE =====
function StoreProfile({ store }: { store: Store }) {
  const { updateStoreProfile } = useApp();
  const [storeName, setStoreName] = useState(store.store_name);
  const [ownerName, setOwnerName] = useState(store.owner_name ?? '');
  const [whatsapp, setWhatsapp] = useState(store.whatsapp_number ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(store.lat && store.lng ? { lat: store.lat, lng: store.lng } : null);
  const [address, setAddress] = useState(store.address_text ?? '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  const whatsappChanged = whatsapp !== store.whatsapp_number;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (whatsappChanged) {
      // Need OTP verification for WhatsApp change
      const result = await sendWhatsAppOTP(whatsapp, 'whatsapp_change');
      setSaving(false);
      if (result.success && result.otp_code) {
        setGeneratedOtp(result.otp_code);
        setOtpStep(true);
      } else {
        setToast('Gagal mengirim OTP WhatsApp');
        setTimeout(() => setToast(null), 3000);
      }
      return;
    }

    await doSave();
  };

  const doSave = async () => {
    const updates: Partial<Store> = {
      store_name: storeName,
      owner_name: ownerName,
      whatsapp_number: whatsapp,
      address_text: address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    };
    if (newPassword) updates.password = newPassword;

    const result = await updateStoreProfile(store.id, updates);
    setSaving(false);
    if (result.success) {
      setToast('Profile berhasil disimpan');
      setNewPassword('');
    } else {
      setToast('Gagal menyimpan: ' + result.error);
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const verified = await verifyWhatsAppOTP(whatsapp, otp);
    if (!verified) {
      setOtpError('Kode OTP salah');
      return;
    }
    setOtpStep(false);
    setSaving(true);
    await doSave();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Profile & Pengaturan</h1>
        <p className="text-sm text-gray-500">Kelola data toko dan keamanan akun Anda</p>
      </div>

      {otpStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setOtpStep(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base font-bold">Verifikasi WhatsApp Baru</h3>
              <p className="mt-1 text-xs text-gray-500">Kode OTP dikirim ke {whatsapp}</p>
            </div>
            <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-xs text-gray-500">Kode OTP:</p>
              <p className="text-lg font-bold tracking-wider text-green-700">{generatedOtp}</p>
            </div>
            {otpError && <p className="mb-2 text-sm text-red-600">{otpError}</p>}
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 digit OTP"
              className="mb-3 w-full rounded-lg border border-gray-200 py-3 text-center text-xl font-bold tracking-[0.5em] focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
            <button onClick={handleVerifyOtp} className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
              Verifikasi & Simpan
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Store Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
            <StoreIcon className="h-4 w-4 text-emerald-600" />
            Informasi Toko
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Nama Toko</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Nama Pemilik</label>
              <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Email / Store ID</label>
              <input type="text" value={store.email_or_id} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400" />
            </div>
          </div>
        </div>

        {/* WhatsApp + Password */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Phone className="h-4 w-4 text-emerald-600" />
            WhatsApp & Keamanan
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50" />
              </div>
              {whatsappChanged && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  Nomor berubah — verifikasi OTP WhatsApp diperlukan saat menyimpan
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Kata Sandi Baru (kosongkan jika tidak diganti)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50" />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Address + Map */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
            <MapPin className="h-4 w-4 text-emerald-600" />
            Alamat Toko (Google Maps)
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Detail Alamat</label>
              <p className="mb-2 text-xs text-gray-400">Alamat otomatis dari Google Places Autocomplete:</p>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Cari alamat di peta di bawah..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50"
              />
            </div>
            <div>
              <GoogleMapPicker
                coords={coords}
                address={address}
                onChange={(c, a) => { setCoords(c); setAddress(a); }}
                height="240px"
              />
              {coords && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <Navigation className="h-3 w-3" />
                  Koordinat: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
