
import type { ReactNode } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminFooter } from '@/components/layout/AdminFooter';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppSettingsProvider } from '@/hooks/useAppSettings';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppSettingsProvider>
        <SidebarProvider defaultOpen={true}> {/* Sidebar open by default on desktop */}
          <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r border-sidebar-border">
            <AdminSidebar />
          </Sidebar>
          <SidebarInset>
            <div className="flex flex-col h-screen">
              <AdminHeader />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
              <AdminFooter />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AppSettingsProvider>
    </AuthGuard>
  );
}
