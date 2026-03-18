import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { Badge } from '@/components/ui/Badge';
import { toggleUserStatus } from '@/lib/actions/users';

export default async function UsersPage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/');

  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">営業マスタ</h1>
        <Link href="/users/new" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          新規登録
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">氏名</th>
              <th className="px-4 py-3 text-left">メールアドレス</th>
              <th className="px-4 py-3 text-left">ロール</th>
              <th className="px-4 py-3 text-left">部署</th>
              <th className="px-4 py-3 text-left">状態</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'manager' ? 'default' : 'outline'}>
                    {u.role === 'manager' ? '上長' : '営業'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.department || '-'}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.isActive ? 'success' : 'outline'}>
                    {u.isActive ? '有効' : '無効'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/users/${u.id}/edit`} className="text-blue-600 hover:underline text-xs">編集</Link>
                    <form action={toggleUserStatus.bind(null, u.id, !u.isActive)}>
                      <button type="submit" className="text-xs text-gray-500 hover:text-gray-700">
                        {u.isActive ? '無効化' : '有効化'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
