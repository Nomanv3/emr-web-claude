// AUTH DISABLED — all routes are accessible without login
// TODO: Re-enable ProtectedRoute before production deployment

import type { ReactNode } from 'react';

// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  // Bypass auth — always render children
  return <>{children}</>;
}
