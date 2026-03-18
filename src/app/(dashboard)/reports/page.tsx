import Link from 'next/link';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';

type SearchParams = { from?: string; to?: string; user_id?: string; status?: string; page?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await getUserFromCookie();
  if (!user) return null;

  const sp = await searchParams;
  const page = parseInt(sp.page ?? '1', 10);
  const perPage = 20;

  const where: Record<string, unknown> = {};
  if (user.role === 'sales') {
    where.userId = user.userId;
  } else if (sp.user_id) {
    where.userId = parseInt(sp.user_id, 10);
  }
  if (sp.from || sp.to) {
    where.reportDate = {
      ...(sp.from ? { gte: new Date(sp.from) } : {}),
      ...(sp.to ? { lte: new Date(sp.to + 'T23:59:59Z') } : {}),
    };
  }
  if (sp.status) where.status = sp.status;

  const [total, reports, salesUsers] = await Promise.all([
    prisma.dailyReport.count({ where }),
    prisma.dailyReport.findMany({
      where,
      include: { user: true, _count: { select: { comments: true, visitRecords: true } } },
      orderBy: { reportDate: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    user.role === 'manager'
      ? prisma.user.findMany({ where: { role: 'sales', isActive: true }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">日報一覧</h1>
        {user.role === 'sales' && (
          <Link href="/reports/new" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            新規作成
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 rounded-lg border bg-white p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">期間</label>
          <input type="date" name="from" defaultValue={sp.from} className="rounded border border-gray-300 px-2 py-1 text-sm" />
          <span className="text-gray-400">〜</span>
          <input type="date" name="to" defaultValue={sp.to} className="rounded border border-gray-300 px-2 py-1 text-sm" />
        </div>
        {user.role === 'manager' && (
          <select name="user_id" defaultValue={sp.user_id ?? ''} className="rounded border border-gray-300 px-2 py-1 text-sm">
            <option value="">全担当者</option>
            {salesUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
        <select name="status" defaultValue={sp.status ?? ''} className="rounded border border-gray-300 px-2 py-1 text-sm">
          <option value="">全ステータス</option>
          <option value="draft">下書き</option>
          <option value="submitted">提出済み</option>
        </select>
        <button type="submit" className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700">絞り込み</button>
      </form>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">日付</th>
              {user.role === 'manager' && <th className="px-4 py-3 text-left">担当者</th>}
              <th className="px-4 py-3 text-left">ステータス</th>
              <th className="px-4 py-3 text-right">訪問</th>
              <th className="px-4 py-3 text-right">コメント</th>
              <th className="px-4 py-3 text-left">更新日時</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">日報がありません</td></tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/reports/${r.id}`} className="text-blue-600 hover:underline font-medium">
                    {r.reportDate.toLocaleDateString('ja-JP')}
                  </Link>
                </td>
                {user.role === 'manager' && <td className="px-4 py-3 text-gray-700">{r.user.name}</td>}
                <td className="px-4 py-3">
                  <Badge variant={r.status === 'submitted' ? 'success' : 'warning'}>
                    {r.status === 'submitted' ? '提出済み' : '下書き'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{r._count.visitRecords}</td>
                <td className="px-4 py-3 text-right text-gray-600">{r._count.comments}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.updatedAt.toLocaleString('ja-JP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/reports?${new URLSearchParams({ ...sp, page: String(p) })}`}
              className={`rounded px-3 py-1 text-sm ${p === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
