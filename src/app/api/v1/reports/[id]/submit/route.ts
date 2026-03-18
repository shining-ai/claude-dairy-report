import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';

type Params = { params: Promise<{ id: string }> };

// POST /api/v1/reports/:id/submit
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '日報が見つかりません' } },
      { status: 404 },
    );
  }

  const report = await prisma.dailyReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '日報が見つかりません' } },
      { status: 404 },
    );
  }

  if (user.role === 'sales' && report.userId !== user.userId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: '権限がありません' } },
      { status: 403 },
    );
  }

  if (report.status === 'submitted') {
    return NextResponse.json(
      { error: { code: 'ALREADY_SUBMITTED', message: '既に提出済みです' } },
      { status: 409 },
    );
  }

  const submittedAt = new Date();
  const updated = await prisma.dailyReport.update({
    where: { id },
    data: { status: 'submitted', submittedAt },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      status: updated.status,
      submitted_at: updated.submittedAt!.toISOString(),
    },
  });
}
