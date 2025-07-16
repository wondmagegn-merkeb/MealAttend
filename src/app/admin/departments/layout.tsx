
import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DepartmentsAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard permission="canReadDepartments">
      {children}
    </AuthGuard>
  );
}
