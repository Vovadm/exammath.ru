'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import http from '@/shared/api/http';
import type { User } from '@/entities/user/model/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
  login: (username: string, password: string, turnstileToken?: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refetch: async () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    try {
      const r = await http.get<User>('/auth/me');
      setUser(r.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string, turnstileToken?: string) => {
    const r = await http.post<User>('/auth/login', {
      username,
      password,
      turnstile_token: turnstileToken,
    });
    setUser(r.data);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    turnstileToken?: string,
  ) => {
    const r = await http.post<User>('/auth/register', {
      username,
      email,
      password,
      turnstile_token: turnstileToken,
    });
    setUser(r.data);
  };

  const logout = async () => {
    await http.post('/auth/logout');
    setUser(null);
  };

  useEffect(() => {
    refetch();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
