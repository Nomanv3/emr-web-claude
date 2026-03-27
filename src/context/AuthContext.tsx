// AUTH DISABLED — auto-authenticated as dev user
// TODO: Re-enable real JWT auth before production deployment

import { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginRequest } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEV_USER: User = {
  userId: 'dev-doctor-001',
  email: 'doctor@emr.dev',
  name: 'Dr. Dev User',
  role: 'doctor',
  organizationId: 'org-001',
  branchId: 'branch-001',
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const login = useCallback(async (_credentials: LoginRequest) => {
    // No-op — already authenticated
  }, []);

  const logout = useCallback(() => {
    // No-op in dev mode
  }, []);

  const value: AuthContextValue = {
    user: DEV_USER,
    token: 'dev-token',
    isAuthenticated: true,
    isLoading: false,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
