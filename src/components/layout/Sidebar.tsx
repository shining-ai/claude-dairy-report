'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Building2 } from 'lucide-react';

type Props = {
  role: 'sales' | 'manager';
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  managerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'ダッシュボード', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/reports', label: '日報一覧', icon: <FileText className="h-4 w-4" /> },
  { href: '/customers', label: '顧客マスタ', icon: <Building2 className="h-4 w-4" /> },
  {
    href: '/users',
    label: '営業マスタ',
    icon: <Users className="h-4 w-4" />,
    managerOnly: true,
  },
];

export function Sidebar({ role }: Props) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => !item.managerOnly || role === 'manager');

  return (
    <aside className="flex w-56 flex-col border-r bg-gray-50">
      <nav className="flex flex-col gap-1 p-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
