import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { Badge } from '@/components/ui/Badge';
import { submitReport, postComment } from '@/lib/actions/reports';

type Props = { params: Promise<{ id: string }> };

export default async function ReportDetailPage({ params }: Props) {
  const user = await getUserFromCookie();
  if (!user) redirect('/login');

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      user: true,
      visitRecords: { include: { customer: true }, orderBy: { visitedAt: 'asc' } },
      comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!report) notFound();
  if (user.role === 'sales' && report.userId !== user.userId) redirect('/reports');

  const submitAction = submitReport.bind(null, id);
  const commentAction = postComment.bind(null, id);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          日報詳細 — {report.reportDate.toLocaleDateString('ja-JP')}
        </h1>
        <Link href="/reports" className="text-sm text-gray-500 hover:underline">
          ← 一覧へ戻る
        </Link>
      </div>

      {/* Basic info */}
      <div className="rounded-lg border bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">担当者:</span>
          <span className="text-sm font-medium">{report.user.name}</span>
          <Badge variant={report.status === 'submitted' ? 'success' : 'warning'}>
            {report.status === 'submitted' ? '提出済み' : '下書き'}
          </Badge>
        </div>
        {report.submittedAt && (
          <p className="text-xs text-gray-400">
            提出日時: {report.submittedAt.toLocaleString('ja-JP')}
          </p>
        )}
        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {user.role === 'sales' && report.status === 'draft' && report.userId === user.userId && (
            <>
              <Link
                href={`/reports/${id}/edit`}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                編集
              </Link>
              <form action={submitAction}>
                <button
                  type="submit"
                  className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                >
                  提出する
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Visit records */}
      <div className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-5 py-4 font-semibold text-gray-700">訪問記録</h2>
        {report.visitRecords.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">訪問記録がありません</p>
        ) : (
          <div className="divide-y">
            {report.visitRecords.map((vr) => (
              <div key={vr.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium text-sm">{vr.customer.companyName}</span>
                  {vr.customer.contactPerson && (
                    <span className="text-xs text-gray-500">{vr.customer.contactPerson}</span>
                  )}
                  {vr.visitedAt && (
                    <span className="text-xs text-gray-400">{vr.visitedAt}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{vr.visitContent}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Problem & Plan */}
      {(report.problem || report.plan) && (
        <div className="rounded-lg border bg-white p-5 shadow-sm space-y-4">
          {report.problem && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-gray-600">今の課題・相談</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.problem}</p>
            </div>
          )}
          {report.plan && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-gray-600">明日やること</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.plan}</p>
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-5 py-4 font-semibold text-gray-700">
          コメント ({report.comments.length})
        </h2>
        <div className="divide-y">
          {report.comments.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400">コメントはありません</p>
          )}
          {report.comments.map((c) => (
            <div key={c.id} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{c.user.name}</span>
                <span className="text-xs text-gray-400">{c.createdAt.toLocaleString('ja-JP')}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>

        {user.role === 'manager' && (
          <div className="border-t p-5">
            <form action={commentAction} className="space-y-2">
              <textarea
                name="content"
                rows={3}
                required
                placeholder="コメントを入力してください"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                投稿する
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
