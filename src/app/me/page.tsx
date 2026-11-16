import type { Metadata } from 'next';
import { RequireRole } from '../../components/RequireRole';
import MemberPortal from '../../views/member/MemberPortal';

export const metadata: Metadata = { title: 'My membership', robots: { index: false } };

export default function Page() {
  return (
    <RequireRole role="member">
      <MemberPortal />
    </RequireRole>
  );
}
