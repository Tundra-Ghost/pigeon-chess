import React, { createContext, useContext, useEffect, useState } from 'react';
import { me, login as apiLogin, register as apiRegister, logout as apiLogout, type User } from '../api';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  async login(){}, async register(){}, async logout(){}, async refresh(){},
});

export function AuthProvider({ children }: { children: React.ReactNode }){
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh(){ setLoading(true); try { const u = await me(); setUser(u); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);

  async function login(email: string, password: string){ const u = await apiLogin(email, password); setUser(u); }
  async function register(email: string, password: string, displayName: string){ const u = await apiRegister(email, password, displayName); setUser(u); }
  async function logout(){ await apiLogout(); setUser(null); }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth(){ return useContext(AuthContext); }

