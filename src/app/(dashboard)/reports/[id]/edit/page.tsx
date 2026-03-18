import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { ReportForm } from '@/components/reports/ReportForm';
import { updateReport } from '@/lib/actions/reports';

type Props = { params: Promise<{ id: string }> };

export default async function EditReportPage({ params }: Props) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'sales') redirect('/');

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  const [report, customers] = await Promise.all([
    prisma.dailyReport.findUnique({
      where: { id },
      include: { visitRecords: { include: { customer: true } } },
    }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { companyName: 'asc' } }),
  ]);

  if (!report) notFound();
  if (report.userId !== user.userId) redirect('/reports');
  if (report.status === 'submitted') redirect(`/reports/${id}`);

  const action = updateReport.bind(null, id);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">日報編集</h1>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <ReportForm
          customers={customers}
          defaultDate={report.reportDate.toISOString().slice(0, 10)}
          defaultProblem={report.problem ?? ''}
          defaultPlan={report.plan ?? ''}
          defaultVisitRecords={report.visitRecords.map((vr) => ({
            customerId: String(vr.customerId),
            visitedAt: vr.visitedAt ?? '',
            visitContent: vr.visitContent,
          }))}
          action={action}
        />
      </div>
    </div>
  );
}
