import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context';
import { StorePortal } from './portals/StorePortal';
import { StaffPortal } from './portals/StaffPortal';
import { AdminPortal } from './portals/AdminPortal';

type Route = 'store' | 'staf' | 'admin';

function getRouteFromPath(): Route {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const combined = path + ' ' + hash;
  if (combined.includes('admin')) return 'admin';
  if (combined.includes('staf')) return 'staf';
  return 'store';
}

function Router() {
  const { user, authLoading } = useApp();
  const [route, setRoute] = useState<Route>(getRouteFromPath());

  useEffect(() => {
    const onPop = () => setRoute(getRouteFromPath());
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  const navigate = (r: Route) => {
    const path = r === 'admin' ? '/admin' : r === 'staf' ? '/staf' : '/';
    window.history.pushState({}, '', path);
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
