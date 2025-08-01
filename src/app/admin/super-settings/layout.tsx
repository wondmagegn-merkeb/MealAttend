
import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function SuperSettingsLayout({ children }: { children: ReactNode }) {
  // A simple way to protect a route for a specific role
  return (
    <AuthGuard permission="canManageSiteSettings">
      {children}
    </AuthGuard>
  );
}
