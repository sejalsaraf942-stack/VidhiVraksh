'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageContext';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'citizen' | 'business' | 'lawyer' | 'admin';
  language: string;
  mode: 'normal' | 'professional';
  subscription: string;
  is_pro_entitled?: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signUp: (params: {
    email: string;
    password: string;
    confirm_password?: string;
    name?: string;
    role?: string;
    language?: string;
    remember_me?: boolean;
  }) => Promise<UserProfile>;
  login: (params: {
    email: string;
    password: string;
    remember_me?: boolean;
  }) => Promise<UserProfile>;
  requestOtp: (email: string) => Promise<{ mock_otp: string; message: string }>;
  verifyOtp: (
    email: string,
    code: string,
    name?: string,
    role?: string,
    language?: string,
    remember_me?: boolean
  ) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    language?: string;
    mode?: string;
  }) => Promise<UserProfile>;
  toggleMode: () => Promise<void>;
  setUserProfile: (u: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const TOKEN_KEY = 'vidhivraksh_auth_token';
export const REGISTERED_EMAILS_STORAGE_KEY = 'vidhivraksh_registered_emails_v1';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

export function getCachedRegisteredEmails(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_EMAILS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => typeof e === 'string' && e.trim().length > 0)
      .map((e) => e.trim().toLowerCase());
  } catch {
    return [];
  }
}

export function cacheRegisteredEmail(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) return;
    const existing = getCachedRegisteredEmails();
    if (!existing.includes(normalized)) {
      const updated = [...existing, normalized];
      localStorage.setItem(REGISTERED_EMAILS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Failed to update registered emails cache', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { setLanguage } = useLanguage();

  // Restore authenticated session on mount (from token or remember-me cookie)
  useEffect(() => {
    const savedToken =
      localStorage.getItem(TOKEN_KEY) || localStorage.getItem('libra_auth_token');

    fetch(`${API_URL}/api/v1/auth/me`, {
      headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session invalid');
        return res.json();
      })
      .then((userData: UserProfile) => {
        setUser(userData);
        if (savedToken) {
          setToken(savedToken);
        }
        if (userData.email) {
          cacheRegisteredEmail(userData.email);
        }
        // Preserve explicit local preference over stale database values
        const localPref =
          localStorage.getItem('vidhivraksh_preferred_language') ||
          localStorage.getItem('libra_preferred_language');
        if (!localPref && userData.language) {
          setLanguage(userData.language);
        } else if (localPref && userData.language !== localPref && savedToken) {
          // Sync local user choice back to backend database
          fetch(`${API_URL}/api/v1/auth/profile`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${savedToken}`,
            },
            body: JSON.stringify({ language: localPref }),
          }).catch(() => {});
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('libra_auth_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const signUp = async (params: {
    email: string;
    password: string;
    confirm_password?: string;
    name?: string;
    role?: string;
    language?: string;
    remember_me?: boolean;
  }): Promise<UserProfile> => {
    const res = await fetch(`${API_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Sign up failed');
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.access_token);

    // Cache registered email in localStorage only on successful registration
    cacheRegisteredEmail(params.email);

    if (data.user.language) {
      setLanguage(data.user.language);
    }
    setIsAuthModalOpen(false);
    return data.user;
  };

  const login = async (params: {
    email: string;
    password: string;
    remember_me?: boolean;
  }): Promise<UserProfile> => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Invalid email or password.');
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.access_token);

    // Cache registered email in localStorage on successful login
    cacheRegisteredEmail(params.email);

    if (data.user.language) {
      setLanguage(data.user.language);
    }
    setIsAuthModalOpen(false);
    return data.user;
  };

  const requestOtp = async (email: string) => {
    const res = await fetch(`${API_URL}/api/v1/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to request OTP');
    }
    return res.json();
  };

  const verifyOtp = async (
    email: string,
    code: string,
    name?: string,
    role?: string,
    language?: string,
    remember_me?: boolean
  ): Promise<UserProfile> => {
    const res = await fetch(`${API_URL}/api/v1/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, code, name, role, language, remember_me }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'OTP verification failed');
    }

    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.access_token);

    if (data.user.language) {
      setLanguage(data.user.language);
    }
    setIsAuthModalOpen(false);
    return data.user;
  };

  const signOut = async () => {
    try {
      await fetch(`${API_URL}/api/v1/auth/signout`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
    } catch {
      // Continue client cleanup
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('libra_auth_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: {
    name?: string;
    language?: string;
    mode?: string;
  }): Promise<UserProfile> => {
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/api/v1/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update profile');
    }

    const updatedUser = await res.json();
    setUser(updatedUser);
    if (updates.language) {
      setLanguage(updates.language);
    }
    return updatedUser;
  };

  const toggleMode = async () => {
    if (!user) {
      router.push('/pricing');
      return;
    }
    if (user.mode === 'professional') {
      await updateProfile({ mode: 'normal' });
    } else {
      const isEntitled = Boolean(
        user.is_pro_entitled ||
        user.subscription === 'professional' ||
        user.role === 'lawyer' ||
        user.role === 'admin'
      );
      if (isEntitled) {
        await updateProfile({ mode: 'professional' });
      } else {
        router.push('/pricing');
      }
    }
  };

  const setUserProfile = (u: UserProfile) => {
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        signUp,
        login,
        requestOtp,
        verifyOtp,
        signOut,
        updateProfile,
        toggleMode,
        setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
