import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';
import { CreateCommentRequestSchema } from '@/types/schemas/comment.schema';

type Params = { params: Promise<{ id: string }> };

async function getReport(id: number) {
  return prisma.dailyReport.findUnique({ where: { id } });
}

// GET /api/v1/reports/:id/comments
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

  const comments = await prisma.comment.findMany({
    where: { dailyReportId: id },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    data: {
      comments: comments.map((c) => ({
        id: c.id,
        user: { id: c.user.id, name: c.user.name },
        content: c.content,
        created_at: c.createdAt.toISOString(),
      })),
    },
  });
}

// POST /api/v1/reports/:id/comments
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }

  if (user.role !== 'manager') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'コメント投稿は上長のみ可能です' } },
      { status: 403 },
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'リクエストボディが不正です' } },
      { status: 400 },
    );
  }

  const parsed = CreateCommentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '入力値が正しくありません' } },
      { status: 422 },
    );
  }

  const comment = await prisma.comment.create({
    data: {
      dailyReportId: id,
      userId: user.userId,
      content: parsed.data.content,
    },
    include: { user: true },
  });

  return NextResponse.json(
    {
      data: {
        id: comment.id,
        user: { id: comment.user.id, name: comment.user.name },
        content: comment.content,
        created_at: comment.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
