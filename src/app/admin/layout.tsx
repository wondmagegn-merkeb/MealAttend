
import type { ReactNode } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminFooter } from '@/components/layout/AdminFooter';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={true}> {/* Sidebar open by default on desktop */}
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r border-sidebar-border">
          <AdminSidebar />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col min-h-screen">
            <AdminHeader />
            <main className="flex-grow p-6 bg-secondary/50"> {/* Light gray background for content area */}
              {children}
            </main>
            <AdminFooter />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
