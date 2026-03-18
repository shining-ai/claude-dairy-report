import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';
import {
  GetCustomersQuerySchema,
  CreateCustomerRequestSchema,
} from '@/types/schemas/customer.schema';

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

// GET /api/v1/customers
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = GetCustomersQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '入力値が正しくありません' } },
      { status: 422 },
    );
  }

  const { q, is_active } = parsed.data;

  const where: Record<string, unknown> = {};
  if (q) {
    where.companyName = { contains: q };
  }
  if (is_active !== undefined) {
    where.isActive = is_active;
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { companyName: 'asc' },
  });

  return NextResponse.json({ data: { customers: customers.map(formatCustomer) } });
}

// POST /api/v1/customers
export async function POST(req: NextRequest) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'リクエストボディが不正です' } },
      { status: 400 },
    );
  }

  const parsed = CreateCustomerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '入力値が正しくありません' } },
      { status: 422 },
    );
  }

  const customer = await prisma.customer.create({
    data: {
      companyName: parsed.data.company_name,
      contactPerson: parsed.data.contact_person ?? null,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      isActive: true,
    },
  });

  return NextResponse.json({ data: formatCustomer(customer) }, { status: 201 });
}
