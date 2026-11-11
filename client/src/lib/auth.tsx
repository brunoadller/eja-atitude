import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { Me } from '../types';
import { api } from './api';

interface AuthCtx {
  me: Me | null;
  loading: boolean;
  login: (type: 'student' | 'admin', username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setMe(await api<Me>('auth/me'));
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // o interceptor do axios dispara isto quando o JWT expira
    const onExpired = () => setMe(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = async (type: 'student' | 'admin', username: string, password: string) => {
    await api('auth/login', { method: 'POST', body: { type, username, password } });
    await refresh();
  };

  const logout = async () => {
    await api('auth/logout', { method: 'POST' });
    setMe(null);
  };

  return <Ctx.Provider value={{ me, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside of AuthProvider');
  return c;
}
