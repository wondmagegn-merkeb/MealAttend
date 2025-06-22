
import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DepartmentsAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRole="Admin">
      {children}
    </AuthGuard>
  );
}
