'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';

export async function createReport(formData: FormData) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'sales') redirect('/login');

  const reportDate = formData.get('report_date') as string;
  const problem = (formData.get('problem') as string) || null;
  const plan = (formData.get('plan') as string) || null;

  // Parse visit records from form
  const customerIds = formData.getAll('customer_id[]') as string[];
  const visitedAts = formData.getAll('visited_at[]') as string[];
  const visitContents = formData.getAll('visit_content[]') as string[];

  const visitRecords = customerIds
    .map((cid, i) => ({
      customerId: parseInt(cid, 10),
      visitedAt: visitedAts[i] || null,
      visitContent: visitContents[i] || '',
    }))
    .filter((vr) => vr.customerId && vr.visitContent);

  try {
    const report = await prisma.dailyReport.create({
      data: {
        userId: user.userId,
        reportDate: new Date(reportDate),
        problem,
        plan,
        status: 'draft',
        visitRecords: {
          create: visitRecords,
        },
      },
    });
    revalidatePath('/reports');
    redirect(`/reports/${report.id}`);
  } catch {
    redirect('/reports/new?error=duplicate');
  }
}

export async function updateReport(id: number, formData: FormData) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'sales') redirect('/login');

  const reportDate = formData.get('report_date') as string;
  const problem = (formData.get('problem') as string) || null;
  const plan = (formData.get('plan') as string) || null;

  const customerIds = formData.getAll('customer_id[]') as string[];
  const visitedAts = formData.getAll('visited_at[]') as string[];
  const visitContents = formData.getAll('visit_content[]') as string[];

  const visitRecords = customerIds
    .map((cid, i) => ({
      customerId: parseInt(cid, 10),
      visitedAt: visitedAts[i] || null,
      visitContent: visitContents[i] || '',
    }))
    .filter((vr) => vr.customerId && vr.visitContent);

  await prisma.$transaction(async (tx) => {
    await tx.visitRecord.deleteMany({ where: { dailyReportId: id } });
    await tx.dailyReport.update({
      where: { id },
      data: {
        reportDate: new Date(reportDate),
        problem,
        plan,
        visitRecords: { create: visitRecords },
      },
    });
  });

  revalidatePath(`/reports/${id}`);
  redirect(`/reports/${id}`);
}

export async function submitReport(id: number) {
  const user = await getUserFromCookie();
  if (!user) redirect('/login');

  await prisma.dailyReport.update({
    where: { id },
    data: { status: 'submitted', submittedAt: new Date() },
  });

  revalidatePath(`/reports/${id}`);
  revalidatePath('/reports');
}

export async function postComment(reportId: number, formData: FormData) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/login');

  const content = formData.get('content') as string;
  if (!content?.trim()) return;

  await prisma.comment.create({
    data: { dailyReportId: reportId, userId: user.userId, content: content.trim() },
  });

  revalidatePath(`/reports/${reportId}`);
}
