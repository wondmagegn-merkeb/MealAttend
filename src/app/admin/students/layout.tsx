
import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function StudentsAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard permission="canReadStudents">
      {children}
    </AuthGuard>
  );
}
