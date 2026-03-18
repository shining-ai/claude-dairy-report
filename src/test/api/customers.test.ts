import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getCustomers, POST as createCustomer } from '@/app/api/v1/customers/route';
import { PUT as updateCustomer } from '@/app/api/v1/customers/[id]/route';
import { PATCH as patchStatus } from '@/app/api/v1/customers/[id]/status/route';
import { makeRequest, salesUser, managerUser } from '../helpers';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/auth/session', () => ({ getAuthUser: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';

const mockAuth = getAuthUser as ReturnType<typeof vi.fn>;
const mockDb = prisma as unknown as { customer: Record<string, ReturnType<typeof vi.fn>> };
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockCustomer = {
  id: 1,
  companyName: '株式会社A',
  contactPerson: '佐藤 次郎',
  phone: '03-1234-5678',
  address: '東京都千代田区',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TC-CUSTOMER-01 顧客一覧取得', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 全顧客一覧を取得 — 200', async () => {
    mockAuth.mockResolvedValue(salesUser());
    mockDb.customer.findMany.mockResolvedValue([mockCustomer]);

    const req = makeRequest('GET', 'http://localhost/api/v1/customers');
    const res = await getCustomers(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.customers).toHaveLength(1);
  });

  it('02: 会社名で検索 — 200 / 部分一致', async () => {
    mockAuth.mockResolvedValue(salesUser());
    mockDb.customer.findMany.mockResolvedValue([mockCustomer]);

    const req = makeRequest('GET', 'http://localhost/api/v1/customers?q=株式会社');
    const res = await getCustomers(req);

    expect(res.status).toBe(200);
    expect(mockDb.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyName: { contains: '株式会社' } }),
      })
    );
  });

  it('03: 有効フラグでフィルタ（有効のみ）', async () => {
    mockAuth.mockResolvedValue(salesUser());
    mockDb.customer.findMany.mockResolvedValue([mockCustomer]);

    const req = makeRequest('GET', 'http://localhost/api/v1/customers?is_active=true');
    const res = await getCustomers(req);

    expect(res.status).toBe(200);
    expect(mockDb.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    );
  });

  it('05: 未認証アクセス — 401', async () => {
    mockAuth.mockResolvedValue(null);

    const req = makeRequest('GET', 'http://localhost/api/v1/customers');
    const res = await getCustomers(req);

    expect(res.status).toBe(401);
  });
});

describe('TC-CUSTOMER-02 顧客作成', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 上長が正常に作成 — 201', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.customer.create.mockResolvedValue(mockCustomer);

    const req = makeRequest('POST', 'http://localhost/api/v1/customers', {
      company_name: '株式会社A',
    });
    const res = await createCustomer(req);

    expect(res.status).toBe(201);
  });

  it('03: 会社名未入力 — 422', async () => {
    mockAuth.mockResolvedValue(managerUser());

    const req = makeRequest('POST', 'http://localhost/api/v1/customers', {
      company_name: '',
    });
    const res = await createCustomer(req);

    expect(res.status).toBe(422);
  });

  it('04: 営業が作成しようとする — 403', async () => {
    mockAuth.mockResolvedValue(salesUser());

    const req = makeRequest('POST', 'http://localhost/api/v1/customers', {
      company_name: '株式会社B',
    });
    const res = await createCustomer(req);

    expect(res.status).toBe(403);
  });
});

describe('TC-CUSTOMER-03 顧客更新・ステータス変更', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 上長が顧客情報を更新 — 200', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.customer.findUnique.mockResolvedValue(mockCustomer);
    mockDb.customer.update.mockResolvedValue({ ...mockCustomer, companyName: '株式会社A改' });

    const req = makeRequest('PUT', 'http://localhost/api/v1/customers/1', {
      company_name: '株式会社A改',
    });
    const res = await updateCustomer(req, makeParams('1'));

    expect(res.status).toBe(200);
  });

  it('02: 顧客を無効化 — 200 / is_active=false', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.customer.findUnique.mockResolvedValue(mockCustomer);
    mockDb.customer.update.mockResolvedValue({ ...mockCustomer, isActive: false });

    const req = makeRequest('PATCH', 'http://localhost/api/v1/customers/1/status', {
      is_active: false,
    });
    const res = await patchStatus(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.is_active).toBe(false);
  });

  it('04: 存在しない顧客IDを指定 — 404', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.customer.findUnique.mockResolvedValue(null);

    const req = makeRequest('PUT', 'http://localhost/api/v1/customers/99999', {
      company_name: '存在しない',
    });
    const res = await updateCustomer(req, makeParams('99999'));

    expect(res.status).toBe(404);
  });

  it('05: 営業が更新しようとする — 403', async () => {
    mockAuth.mockResolvedValue(salesUser());

    const req = makeRequest('PUT', 'http://localhost/api/v1/customers/1', {
      company_name: '株式会社A',
    });
    const res = await updateCustomer(req, makeParams('1'));

    expect(res.status).toBe(403);
  });
});
