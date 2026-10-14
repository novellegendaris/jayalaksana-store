import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './lib/supabase';
import type {
  AuthUser, Store, Staff, Product, Order, CartItem, OrderItem, OrderStatus, Coordinates,
} from './types';

interface AppState {
  // Auth
  user: AuthUser | null;
  authLoading: boolean;
  loginStore: (emailOrId: string, password: string) => Promise<{ success: boolean; needsActivation?: boolean; store?: Store; error?: string }>;
  activateStore: (storeId: string, password: string, whatsapp: string) => Promise<{ success: boolean; error?: string }>;
  loginStaff: (email: string, password: string) => Promise<{ success: boolean; staff?: Staff; error?: string }>;
  loginAdmin: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // Store profile
  updateStoreProfile: (storeId: string, updates: Partial<Store>) => Promise<{ success: boolean; error?: string }>;

  // Staff profile (self-service)
  updateStaffProfile: (staffId: string, updates: Partial<Staff>) => Promise<{ success: boolean; error?: string }>;

  // Admin edits staff
  updateStaffByAdmin: (staffId: string, updates: Partial<Pick<Staff, 'name' | 'role' | 'phone' | 'password' | 'is_active' | 'email'>>) => Promise<{ success: boolean; error?: string }>;

  // Data
  products: Product[];
  stores: Store[];
  staff: Staff[];
  orders: Order[];
  refreshData: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Orders
  placeOrder: (storeId: string, storeName: string, staffId?: string, staffName?: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignFleet: (orderId: string, driverId: string, driverName: string, plateNumber: string, eta: string) => Promise<void>;

  // Admin CRUD
  addStore: (data: { store_name: string; email_or_id: string; owner_name?: string }) => Promise<{ success: boolean; error?: string }>;
  addStaff: (data: { name: string; email: string; password: string; role: Staff['role']; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  addProduct: (data: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>;
  deleteStore: (storeId: string) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

const SESSION_KEY = 'armadaexpress_session';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Restore session + load initial data
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setAuthLoading(false);
  }, []);

  const refreshData = useCallback(async () => {
    const [p, s, st, o] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('stores').select('*').order('created_at', { ascending: false }),
      supabase.from('staff').select('*').order('name'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);
    if (p.data) setProducts(p.data as Product[]);
    if (s.data) setStores(s.data as Store[]);
    if (st.data) setStaff(st.data as Staff[]);
    if (o.data) setOrders(o.data as Order[]);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const persistSession = (u: AuthUser | null) => {
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
    setUser(u);
  };

  // ===== AUTH =====
  const loginStore = async (emailOrId: string, password: string) => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('email_or_id', emailOrId)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Toko tidak ditemukan. Periksa kembali Email/Store ID Anda.' };
    }

    const store = data as Store;

    if (!store.password || !store.is_activated) {
      // Needs activation — accept any password on first login
      return { success: false, needsActivation: true, store };
    }

    if (store.password !== password) {
      return { success: false, error: 'Kata sandi salah.' };
    }

    persistSession({ kind: 'store', store });
    return { success: true, store };
  };

  const activateStore = async (storeId: string, password: string, whatsapp: string) => {
    const { error } = await supabase
      .from('stores')
      .update({ password, whatsapp_number: whatsapp, is_activated: true })
      .eq('id', storeId);

    if (error) return { success: false, error: error.message };

    const { data } = await supabase.from('stores').select('*').eq('id', storeId).maybeSingle();
    if (data) {
      persistSession({ kind: 'store', store: data as Store });
    }
    await refreshData();
    return { success: true };
  };

  const loginStaff = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Staff tidak ditemukan. Periksa kembali email Anda.' };
    }

    const s = data as Staff;
    if (!s.is_active) {
      return { success: false, error: 'Akun staff tidak aktif. Hubungi admin.' };
    }
    if (s.password !== password) {
      return { success: false, error: 'Kata sandi salah.' };
    }

    persistSession({ kind: 'staff', staff: s });
    return { success: true, staff: s };
  };

  const loginAdmin = (email: string, password: string) => {
    if (email === 'admin@armadaexpress.com' && password === 'admin123') {
      persistSession({ kind: 'admin' });
      return { success: true };
    }
    return { success: false, error: 'Email atau kata sandi salah' };
  };

  const logout = () => {
    persistSession(null);
    setCart([]);
  };

  // ===== STORE PROFILE =====
  const updateStoreProfile = async (storeId: string, updates: Partial<Store>) => {
    const { error } = await supabase.from('stores').update(updates).eq('id', storeId);
    if (error) return { success: false, error: error.message };

    const { data } = await supabase.from('stores').select('*').eq('id', storeId).maybeSingle();
    if (data) {
      const updatedStore = data as Store;
      persistSession({ kind: 'store', store: updatedStore });
    }
    await refreshData();
    return { success: true };
  };

  // ===== STAFF PROFILE (self-service) =====
  const updateStaffProfile = async (staffId: string, updates: Partial<Staff>) => {
    const { error } = await supabase.from('staff').update(updates).eq('id', staffId);
    if (error) return { success: false, error: error.message };

    const { data } = await supabase.from('staff').select('*').eq('id', staffId).maybeSingle();
    if (data) {
      const updatedStaff = data as Staff;
      persistSession({ kind: 'staff', staff: updatedStaff });
    }
    await refreshData();
    return { success: true };
  };

  // ===== ADMIN EDITS STAFF =====
  const updateStaffByAdmin = async (staffId: string, updates: Partial<Pick<Staff, 'name' | 'role' | 'phone' | 'password' | 'is_active' | 'email'>>) => {
    const { error } = await supabase.from('staff').update(updates).eq('id', staffId);
    if (error) return { success: false, error: error.message };
    await refreshData();
    return { success: true };
  };

  // ===== CART =====
  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + qty } : c));
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((c) => c.product.id !== productId));

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) return removeFromCart(productId);
    setCart((prev) => prev.map((c) => (c.product.id === productId ? { ...c, quantity: qty } : c)));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // ===== ORDERS =====
  const placeOrder = async (storeId: string, storeName: string, staffId?: string, staffName?: string) => {
    if (cart.length === 0) return null;
    const items: OrderItem[] = cart.map((c) => ({
      productId: c.product.id,
      name: c.product.name,
      price: c.product.price,
      quantity: c.quantity,
      unit: c.product.unit,
    }));

    const newOrder = {
      store_id: storeId,
      store_name: storeName,
      staff_id: staffId ?? null,
      staff_name: staffName ?? null,
      status: 'menunggu_konfirmasi' as OrderStatus,
      total: cartTotal,
      items: items as unknown as Record<string, unknown>[],
      fleet_info: null,
    };

    const { data, error } = await supabase.from('orders').insert(newOrder).select('*').maybeSingle();
    if (error) return null;

    setCart([]);
    await refreshData();
    return data as Order;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const assignFleet = async (orderId: string, driverId: string, driverName: string, plateNumber: string, eta: string) => {
    const fleetInfo = { driverName, plateNumber, eta };
    await supabase.from('orders').update({
      driver_id: driverId,
      driver_name: driverName,
      fleet_info: fleetInfo,
      status: 'dalam_perjalanan',
    }).eq('id', orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? {
      ...o, driver_id: driverId, driver_name: driverName, fleet_info: fleetInfo, status: 'dalam_perjalanan',
    } : o)));
  };

  // ===== ADMIN CRUD =====
  const addStore = async (data: { store_name: string; email_or_id: string; owner_name?: string }) => {
    const { error } = await supabase.from('stores').insert({
      store_name: data.store_name,
      email_or_id: data.email_or_id,
      owner_name: data.owner_name ?? null,
      is_activated: false,
    });
    if (error) return { success: false, error: error.message };
    await refreshData();
    return { success: true };
  };

  const addStaff = async (data: { name: string; email: string; password: string; role: Staff['role']; phone?: string }) => {
    const { error } = await supabase.from('staff').insert({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      phone: data.phone ?? null,
      is_active: true,
    });
    if (error) return { success: false, error: error.message };
    await refreshData();
    return { success: true };
  };

  const addProduct = async (data: Omit<Product, 'id'>) => {
    const { error } = await supabase.from('products').insert(data);
    if (error) return { success: false, error: error.message };
    await refreshData();
    return { success: true };
  };

  const deleteStore = async (storeId: string) => {
    await supabase.from('stores').delete().eq('id', storeId);
    await refreshData();
  };

  const deleteStaff = async (staffId: string) => {
    await supabase.from('staff').delete().eq('id', staffId);
    await refreshData();
  };

  const deleteProduct = async (productId: string) => {
    await supabase.from('products').delete().eq('id', productId);
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        user, authLoading,
        loginStore, activateStore, loginStaff, loginAdmin, logout,
        updateStoreProfile, updateStaffProfile, updateStaffByAdmin,
        products, stores, staff, orders, refreshData,
        cart, addToCart, removeFromCart, updateCartQty, clearCart, cartTotal, cartCount,
        placeOrder, updateOrderStatus, assignFleet,
        addStore, addStaff, addProduct, deleteStore, deleteStaff, deleteProduct,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
