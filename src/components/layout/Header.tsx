'use client';

import { useRouter } from 'next/navigation';
import { AUTH_COOKIE } from '@/lib/auth/constants';

type Props = {
  name: string;
  role: 'sales' | 'manager';
};

const ROLE_LABEL: Record<string, string> = {
  sales: '営業',
  manager: '上長',
};

export function Header({ name, role }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    // Clear cookie and call logout API
    try {
      const res = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
    } catch {
      // Continue logout even if API fails
    }
    // Remove cookie client-side and redirect
    document.cookie = `${AUTH_COOKIE}=; Max-Age=0; path=/`;
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6 shadow-sm">
      <span className="text-lg font-semibold text-gray-800">営業日報システム</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {name}
          <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {ROLE_LABEL[role] ?? role}
          </span>
        </span>
        <button
          onClick={handleLogout}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
