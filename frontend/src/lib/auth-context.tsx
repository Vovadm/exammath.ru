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
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api
        .get<User>('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((r) => {
          setUser(r.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string, turnstileToken?: string) => {
    const r = await api.post<{ access_token: string; token_type: string }>(
      '/auth/login',
      { username, password, turnstile_token: turnstileToken || null },
    );
    const token = r.data.access_token;
    localStorage.setItem('token', token);

    const me = await api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(me.data);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    turnstileToken?: string,
  ) => {
    await api.post('/auth/register', {
      username,
      email,
      password,
      turnstile_token: turnstileToken || null,
    });
    await login(username, password, turnstileToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
