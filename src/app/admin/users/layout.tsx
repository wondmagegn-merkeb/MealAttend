
import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function UsersAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRole="Admin">
      {children}
    </AuthGuard>
  );
}
