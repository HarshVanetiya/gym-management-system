import type { Metadata } from 'next';
import Login from '../../views/Login';

export const metadata: Metadata = { title: 'Log in', robots: { index: false } };

export default function Page() {
  return <Login />;
}
