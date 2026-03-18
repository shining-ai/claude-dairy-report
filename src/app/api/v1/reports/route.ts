import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';
import { GetReportsQuerySchema, CreateReportRequestSchema } from '@/types/schemas/report.schema';
import { formatDate, formatReportDetail } from '@/lib/api/reports';

// GET /api/v1/reports
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = GetReportsQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '入力値が正しくありません' } },
      { status: 422 },
    );
  }

  const { from, to, user_id, status, page, per_page } = parsed.data;

  const where: Record<string, unknown> = {};

  // Sales can only see their own reports
  if (user.role === 'sales') {
    where.userId = user.userId;
  } else if (user_id) {
    where.userId = user_id;
  }

  if (from || to) {
    where.reportDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + 'T23:59:59Z') } : {}),
    };
  }

  if (status) {
    where.status = status;
  }

  const [total, reports] = await Promise.all([
    prisma.dailyReport.count({ where }),
    prisma.dailyReport.findMany({
      where,
      include: {
        user: true,
        visitRecords: true,
        comments: true,
      },
      orderBy: { reportDate: 'desc' },
      skip: (page - 1) * per_page,
      take: per_page,
    }),
  ]);

  return NextResponse.json({
    data: {
      reports: reports.map((r) => ({
        id: r.id,
        user: { id: r.user.id, name: r.user.name },
        report_date: formatDate(r.reportDate),
        status: r.status,
        visit_count: r.visitRecords.length,
        comment_count: r.comments.length,
        submitted_at: r.submittedAt?.toISOString() ?? null,
        updated_at: r.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    },
  });
}

// POST /api/v1/reports
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }

  if (user.role !== 'sales') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: '権限がありません' } },
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

  const parsed = CreateReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '入力値が正しくありません' } },
      { status: 422 },
    );
  }

  const { report_date, problem, plan, visit_records } = parsed.data;

  // Validate: no future dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reportDate = new Date(report_date);
  if (reportDate > today) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '未来の日付では日報を作成できません' } },
      { status: 422 },
    );
  }

  // Check for duplicate report on same date
  const existing = await prisma.dailyReport.findUnique({
    where: { userId_reportDate: { userId: user.userId, reportDate: new Date(report_date) } },
  });
  if (existing) {
    return NextResponse.json(
      { error: { code: 'DUPLICATE_REPORT', message: '指定日付の日報は既に存在します' } },
      { status: 409 },
    );
  }

  // Validate customer IDs: must exist and be active
  if (visit_records.length > 0) {
    const customerIds = visit_records.map((vr) => vr.customer_id);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
    });
    const customerMap = new Map(customers.map((c) => [c.id, c]));
    for (const id of customerIds) {
      const c = customerMap.get(id);
      if (!c) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: `顧客ID ${id} は存在しません` } },
          { status: 422 },
        );
      }
      if (!c.isActive) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: `顧客ID ${id} は無効化されています` } },
          { status: 422 },
        );
      }
    }
  }

  const report = await prisma.dailyReport.create({
    data: {
      userId: user.userId,
      reportDate: new Date(report_date),
      problem: problem ?? null,
      plan: plan ?? null,
      status: 'draft',
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

  return NextResponse.json({ data: formatReportDetail(report) }, { status: 201 });
}
