import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromCookie();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen flex-col">
      <Header name={user.name} role={user.role} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
