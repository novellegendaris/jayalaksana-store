export type StaffRole = 'sales' | 'field_admin' | 'driver';

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: 'masuk' | 'opname' | 'rusak' | 'hilang';
  quantity: number;
  supplier: string | null;
  notes: string | null;
  staff_id: string | null;
  staff_name: string | null;
  created_at: string;
}
export type AppRoute = 'store' | 'staf' | 'admin';
export type OrderStatus =
  | 'menunggu_konfirmasi'
  | 'diproses'
  | 'dalam_perjalanan'
  | 'selesai';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Store {
  id: string;
  store_name: string;
  email_or_id: string;
  password: string | null;
  whatsapp_number: string | null;
  owner_name: string | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  is_activated: boolean;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  category: string;
  unit: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface FleetInfo {
  driverName: string;
  plateNumber: string;
  eta: string;
}

export interface Order {
  id: string;
  store_id: string | null;
  store_name: string | null;
  staff_id: string | null;
  staff_name: string | null;
  driver_id: string | null;
  driver_name: string | null;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  fleet_info: FleetInfo | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AuthUser {
  kind: 'store' | 'staff' | 'admin';
  store?: Store;
  staff?: Staff;
}
