import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '../utils/storage';
import { redirectToAppRoot } from '../utils/redirect';
import { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  login: (data: { token: string; user: UserProfile }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pb_token'));

  useEffect(() => {
    if (user) {
      localStorage.setItem('pb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pb_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('pb_token', token);
    } else {
      localStorage.removeItem('pb_token');
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      login: ({ token: tk, user: profile }: { token: string; user: UserProfile }) => {
        setUser(profile);
        setToken(tk);
      },
      logout: () => {
        setUser(null);
        setToken(null);
        redirectToAppRoot();
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
