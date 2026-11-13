import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/hooks';
import { Loading } from './components/ui';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import MemberDetail from './pages/admin/MemberDetail';
import Plans from './pages/admin/Plans';
import Programs from './pages/admin/Programs';
import Leads from './pages/admin/Leads';
import SiteEditor from './pages/admin/SiteEditor';
import Payments from './pages/admin/Payments';
import MemberPortal from './pages/member/MemberPortal';
import type { ReactNode } from 'react';
import type { Role } from './lib/types';

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={session.role === 'admin' ? '/admin' : '/me'} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="plans" element={<Plans />} />
        <Route path="programs" element={<Programs />} />
        <Route path="leads" element={<Leads />} />
        <Route path="site" element={<SiteEditor />} />
      </Route>
      <Route path="/me" element={<RequireRole role="member"><MemberPortal /></RequireRole>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
