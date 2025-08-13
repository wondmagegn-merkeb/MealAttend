
import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function SiteManagementLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRole="Super Admin">
      {children}
    </AuthGuard>
  );
}
