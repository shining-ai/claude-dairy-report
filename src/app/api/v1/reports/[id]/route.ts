import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';
import { UpdateReportRequestSchema } from '@/types/schemas/report.schema';
import { formatReportDetail } from '@/lib/api/reports';

type Params = { params: Promise<{ id: string }> };

async function getReport(id: number) {
  return prisma.dailyReport.findUnique({
    where: { id },
    include: {
      user: true,
      visitRecords: { include: { customer: true } },
      comments: { include: { user: true } },
    },
  });
}

// GET /api/v1/reports/:id
export async function GET(req: NextRequest, { params }: Params) {
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

  const report = await getReport(id);
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

  return NextResponse.json({ data: formatReportDetail(report) });
}

// PUT /api/v1/reports/:id
export async function PUT(req: NextRequest, { params }: Params) {
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

  const existing = await prisma.dailyReport.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '日報が見つかりません' } },
      { status: 404 },
    );
  }

  if (user.role === 'sales' && existing.userId !== user.userId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: '権限がありません' } },
      { status: 403 },
    );
  }

  if (existing.status === 'submitted') {
    return NextResponse.json(
      { error: { code: 'REPORT_ALREADY_SUBMITTED', message: '提出済みの日報は編集できません' } },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'リクエストボディが不正です' } },
      { status: 400 },
    );
  }

  const parsed = UpdateReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '入力値が正しくありません' } },
      { status: 422 },
    );
  }

  const { report_date, problem, plan, visit_records } = parsed.data;

  // Validate customer IDs
  if (visit_records.length > 0) {
    const customerIds = visit_records.map((vr) => vr.customer_id);
    const customers = await prisma.customer.findMany({ where: { id: { in: customerIds } } });
    const customerMap = new Map(customers.map((c) => [c.id, c]));
    for (const cid of customerIds) {
      const c = customerMap.get(cid);
      if (!c) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: `顧客ID ${cid} は存在しません` } },
          { status: 422 },
        );
      }
      if (!c.isActive) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: `顧客ID ${cid} は無効化されています` } },
          { status: 422 },
        );
      }
    }
  }

  // Replace visit records: delete all then re-create
  const updated = await prisma.$transaction(async (tx) => {
    await tx.visitRecord.deleteMany({ where: { dailyReportId: id } });
    return tx.dailyReport.update({
      where: { id },
      data: {
        reportDate: new Date(report_date),
        problem: problem ?? null,
        plan: plan ?? null,
        visitRecords: {
          create: visit_records.map((vr) => ({
            customerId: vr.customer_id,
            visitedAt: vr.visited_at ?? null,
            visitContent: vr.visit_content,
          })),
        },
      },
      include: {
        user: true,
        visitRecords: { include: { customer: true } },
        comments: { include: { user: true } },
      },
    });
  });

  return NextResponse.json({ data: formatReportDetail(updated) });
}
