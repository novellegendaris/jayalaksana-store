import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context';
import { StorePortal } from './portals/StorePortal';
import { StaffPortal } from './portals/StaffPortal';
import { AdminPortal } from './portals/AdminPortal';

type Route = 'store' | 'staf' | 'admin';

function getRouteFromHash(): Route {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('admin')) return 'admin';
  if (hash.includes('staf')) return 'staf';
  return 'store';
}

function Router() {
  const { user, authLoading } = useApp();
  const [route, setRoute] = useState<Route>(getRouteFromHash());

  useEffect(() => {
    const onHash = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r: Route) => {
    const hash = r === 'admin' ? '#/admin' : r === 'staf' ? '#/staf' : '#/';
    window.location.hash = hash;
    setRoute(r);
  };

  // If user logs out while on a protected route, stay on the route's login screen
  useEffect(() => {
    if (!authLoading && !user && route === 'admin') {
      localStorage.removeItem('armadaexpress_admin');
    }
  }, [user, authLoading, route]);

  if (route === 'admin') return <AdminPortal />;
  if (route === 'staf') return <StaffPortal />;
  return <StorePortal />;
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
