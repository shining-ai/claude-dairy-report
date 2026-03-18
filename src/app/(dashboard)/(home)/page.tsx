import Link from 'next/link';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';

export default async function DashboardPage() {
  const user = await getUserFromCookie();
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayReport, recentReports] = await Promise.all([
    prisma.dailyReport.findFirst({
      where: { userId: user.userId, reportDate: today },
    }),
    prisma.dailyReport.findMany({
      where: user.role === 'sales' ? { userId: user.userId } : {},
      include: { user: true, _count: { select: { comments: true, visitRecords: true } } },
      orderBy: { reportDate: 'desc' },
      take: 5,
    }),
  ]);

  const todayStatus = todayReport
    ? todayReport.status === 'submitted'
      ? '提出済み'
      : '下書き'
    : '未作成';
  const todayVariant =
    todayReport?.status === 'submitted' ? 'success' : todayReport ? 'warning' : 'destructive';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>

      {/* Today's report status */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          今日の日報
        </h2>
        <div className="flex items-center gap-4">
          <Badge variant={todayVariant}>{todayStatus}</Badge>
          {!todayReport || todayReport.status === 'draft' ? (
            <Link
              href={todayReport ? `/reports/${todayReport.id}/edit` : '/reports/new'}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              {todayReport ? '下書きを編集' : '今日の日報を作成'}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Recent reports */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold text-gray-700">最近の日報</h2>
          <Link href="/reports" className="text-sm text-blue-600 hover:underline">
            一覧を見る →
          </Link>
        </div>
        <div className="divide-y">
          {recentReports.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400">日報がありません</p>
          )}
          {recentReports.map((r) => (
            <Link key={r.id} href={`/reports/${r.id}`} className="block hover:bg-gray-50">
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">
                    {r.reportDate.toLocaleDateString('ja-JP')}
                  </span>
                  {user.role === 'manager' && (
                    <span className="text-sm text-gray-500">{r.user.name}</span>
                  )}
                  <Badge variant={r.status === 'submitted' ? 'success' : 'warning'}>
                    {r.status === 'submitted' ? '提出済み' : '下書き'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>訪問 {r._count.visitRecords}件</span>
                  <span>コメント {r._count.comments}件</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
