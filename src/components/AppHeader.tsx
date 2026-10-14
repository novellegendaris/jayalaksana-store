import { useState } from 'react';
import { Truck, LogOut, User as UserIcon, ChevronDown, ShoppingCart, Settings } from 'lucide-react';
import { useApp } from '../context';
import { cn } from '../utils';

interface Props {
  title?: string;
  onCartClick?: () => void;
  onNavigateProfile?: () => void;
  navItems?: { label: string; active: boolean; onClick: () => void }[];
}

export function AppHeader({ title, onCartClick, onNavigateProfile, navItems }: Props) {
  const { user, logout, cartCount } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.kind === 'store' ? user.store?.store_name : user?.kind === 'admin' ? 'Super Admin' : user?.staff?.name ?? '';
  const roleLabel = user?.kind === 'store'
    ? (user.store?.is_activated ? 'Toko Terdaftar' : 'Toko Belum Aktif')
    : user?.kind === 'admin' ? 'Admin CMS'
    : user?.staff?.role === 'sales' ? 'Internal Sales'
    : user?.staff?.role === 'field_admin' ? 'Admin Lapangan'
    : user?.staff?.role === 'driver' ? 'Driver Armada'
    : '';

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Truck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900">{title ?? 'ArmadaExpress'}</p>
            <p className="hidden text-xs text-gray-500 sm:block">B2B Distributor · Armada Sendiri</p>
          </div>
        </div>

        {navItems && navItems.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  item.active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {onCartClick && (user?.kind === 'store' || (user?.staff?.role === 'sales')) && (
            <button
              onClick={onCartClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Keranjang"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                <UserIcon className="h-4 w-4 text-emerald-600" />
                <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    <div className="border-b border-gray-100 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                      <p className="text-xs text-emerald-600">{roleLabel}</p>
                    </div>
                    {navItems && navItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => { item.onClick(); setMenuOpen(false); }}
                        className={cn(
                          'w-full rounded-lg px-3 py-2 text-left text-sm md:hidden',
                          item.active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                    {onNavigateProfile && (
                      <button
                        onClick={() => { onNavigateProfile(); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Profile & Pengaturan
                      </button>
                    )}
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
