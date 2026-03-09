'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api, { User } from './api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, turnstileToken?: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<User>('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string, turnstileToken?: string) => {
    const r = await api.post<User>('/auth/login', {
      username,
      password,
      turnstile_token: turnstileToken || null,
    });
    setUser(r.data);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    turnstileToken?: string,
  ) => {
    const r = await api.post<User>('/auth/register', {
      username,
      email,
      password,
      turnstile_token: turnstileToken || null,
    });
    setUser(r.data);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
