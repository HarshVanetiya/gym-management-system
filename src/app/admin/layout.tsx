import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { RequireRole } from '../../components/RequireRole';
import AdminLayout from '../../views/admin/AdminLayout';

export const metadata: Metadata = { title: 'Trainer dashboard', robots: { index: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="admin">
      <AdminLayout>{children}</AdminLayout>
    </RequireRole>
  );
}
