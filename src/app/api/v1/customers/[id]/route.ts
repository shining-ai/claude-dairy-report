import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';
import { UpdateCustomerRequestSchema } from '@/types/schemas/customer.schema';

type Params = { params: Promise<{ id: string }> };

function formatCustomer(c: {
  id: number;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    company_name: c.companyName,
    contact_person: c.contactPerson,
    phone: c.phone,
    address: c.address,
    is_active: c.isActive,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  };
}

// GET /api/v1/customers/:id
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
      { error: { code: 'NOT_FOUND', message: '顧客が見つかりません' } },
      { status: 404 },
    );
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '顧客が見つかりません' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: formatCustomer(customer) });
}

// PUT /api/v1/customers/:id
export async function PUT(req: NextRequest, { params }: Params) {
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
      { error: { code: 'NOT_FOUND', message: '顧客が見つかりません' } },
      { status: 404 },
    );
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '顧客が見つかりません' } },
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

  const parsed = UpdateCustomerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '入力値が正しくありません' } },
      { status: 422 },
    );
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      companyName: parsed.data.company_name,
      contactPerson: parsed.data.contact_person ?? null,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
    },
  });

  return NextResponse.json({ data: formatCustomer(updated) });
}
