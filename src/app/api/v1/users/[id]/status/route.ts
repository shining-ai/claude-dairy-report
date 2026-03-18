import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';
import { UpdateUserStatusRequestSchema } from '@/types/schemas/user.schema';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/v1/users/:id/status
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }

  if (user.role !== 'manager') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: '権限がありません' } },
      { status: 403 },
    );
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'ユーザーが見つかりません' } },
      { status: 404 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'ユーザーが見つかりません' } },
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

  const parsed = UpdateUserStatusRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '入力値が正しくありません' } },
      { status: 422 },
    );
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: parsed.data.is_active },
  });

  return NextResponse.json({ data: { id, is_active: parsed.data.is_active } });
}
