import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { Badge } from '@/components/ui/Badge';
import { toggleCustomerStatus } from '@/lib/actions/customers';

type SearchParams = { q?: string; is_active?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await getUserFromCookie();
  if (!user) return null;

  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.q) where.companyName = { contains: sp.q };
  if (sp.is_active === 'true') where.isActive = true;
  else if (sp.is_active === 'false') where.isActive = false;

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { companyName: 'asc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">顧客マスタ</h1>
        {user.role === 'manager' && (
          <Link href="/customers/new" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            新規登録
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 rounded-lg border bg-white p-4">
        <input
          type="text"
          name="q"
          defaultValue={sp.q}
          placeholder="会社名で検索"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <select name="is_active" defaultValue={sp.is_active ?? ''} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">すべて</option>
          <option value="true">有効のみ</option>
          <option value="false">無効のみ</option>
        </select>
        <button type="submit" className="rounded bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700">絞り込み</button>
      </form>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">会社名</th>
              <th className="px-4 py-3 text-left">担当者名</th>
              <th className="px-4 py-3 text-left">電話番号</th>
              <th className="px-4 py-3 text-left">住所</th>
              <th className="px-4 py-3 text-left">状態</th>
              {user.role === 'manager' && <th className="px-4 py-3 text-left">操作</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">顧客がありません</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.companyName}</td>
                <td className="px-4 py-3 text-gray-600">{c.contactPerson ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.address ?? '-'}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.isActive ? 'success' : 'outline'}>
                    {c.isActive ? '有効' : '無効'}
                  </Badge>
                </td>
                {user.role === 'manager' && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/customers/${c.id}/edit`} className="text-blue-600 hover:underline text-xs">編集</Link>
                      <form action={toggleCustomerStatus.bind(null, c.id, !c.isActive)}>
                        <button type="submit" className="text-xs text-gray-500 hover:text-gray-700">
                          {c.isActive ? '無効化' : '有効化'}
                        </button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
