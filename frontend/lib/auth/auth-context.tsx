'use client';

import React, { createContext, useEffect, useState } from 'react';
import { AuthContextType, UserWithRole } from '@/types/auth';
import {
  loginWithEmail,
  logout as logoutService,
  signupWithEmail,
  getCurrentUser,
  getUserProfile,
  onAuthStateChanged,
} from './auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const E2E_STORAGE_KEY = 'planner-e2e-user';

function isE2EBypassEnabled() {
  return process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true';
}

function loadE2EUser(): UserWithRole | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(E2E_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as UserWithRole;
  } catch {
    return null;
  }
}

function persistE2EUser(user: UserWithRole | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(E2E_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(E2E_STORAGE_KEY, JSON.stringify(user));
}

function buildE2EUser(email: string, fullName?: string): UserWithRole {
  const roleName =
    email === 'admin@example.com'
      ? 'administrador'
      : email.includes('profesor')
        ? 'profesor'
        : 'alumno';

  const roleId = roleName === 'administrador' ? 1 : roleName === 'profesor' ? 2 : 3;

  return {
    id: `e2e-${roleName}`,
    email,
    full_name: fullName ?? 'Usuario E2E',
    role_id: roleId,
    phone: null,
    is_active: true,
    created_at: '2026-06-01T10:00:00.000Z',
    updated_at: '2026-06-01T10:00:00.000Z',
    role: {
      id: roleId,
      name: roleName,
      description: `Usuario ${roleName} para Cypress`,
      created_at: '2026-06-01T10:00:00.000Z',
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const e2eBypassEnabled = isE2EBypassEnabled();
  const [user, setUser] = useState<UserWithRole | null>(() =>
    e2eBypassEnabled ? loadE2EUser() : null
  );
  const [isLoading, setIsLoading] = useState(() => !e2eBypassEnabled);

  // Configurar listener de cambios de autenticación
  useEffect(() => {
    if (e2eBypassEnabled) {
      return;
    }

    // Obtener usuario actual
    const getInitialUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const profile = await getUserProfile(currentUser.id);
        setUser(profile);
      }
      setIsLoading(false);
    };

    getInitialUser();

    // Escuchar cambios de autenticación
    const subscription = onAuthStateChanged(async (authUser) => {
      if (authUser) {
        const profile = await getUserProfile(authUser.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [e2eBypassEnabled]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (isE2EBypassEnabled()) {
        const e2eUser = buildE2EUser(
          email,
          email === 'admin@example.com' ? 'Administrador E2E' : undefined
        );
        persistE2EUser(e2eUser);
        setUser(e2eUser);
        return;
      }

      const response = await loginWithEmail(email, password);
      const profile = await getUserProfile(response.user.id);
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isE2EBypassEnabled()) {
        persistE2EUser(null);
        setUser(null);
        return;
      }

      await logoutService();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    setIsLoading(true);
    try {
      if (isE2EBypassEnabled()) {
        const e2eUser = buildE2EUser(email, fullName);
        persistE2EUser(e2eUser);
        setUser(e2eUser);
        return;
      }

      const response = await signupWithEmail(email, password, fullName);
      if (response.user) {
        const profile = await getUserProfile(response.user.id);
        setUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    signup,
    userRole: user?.role?.name ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
