import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { ReportForm } from '@/components/reports/ReportForm';
import { createReport } from '@/lib/actions/reports';

export default async function NewReportPage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'sales') redirect('/');

  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { companyName: 'asc' },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">日報作成</h1>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <ReportForm customers={customers} action={createReport} />
      </div>
    </div>
  );
}
