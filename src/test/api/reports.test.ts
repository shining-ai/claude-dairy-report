import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getReports, POST as createReport } from '@/app/api/v1/reports/route';
import { GET as getReport, PUT as updateReport } from '@/app/api/v1/reports/[id]/route';
import { POST as submitReport } from '@/app/api/v1/reports/[id]/submit/route';
import { makeRequest, salesUser, managerUser } from '../helpers';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyReport: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customer: { findMany: vi.fn(), findUnique: vi.fn() },
    visitRecord: { deleteMany: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        visitRecord: { deleteMany: vi.fn() },
        dailyReport: { update: vi.fn() },
      })
    ),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getAuthUser: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';

const mockAuth = getAuthUser as ReturnType<typeof vi.fn>;
const mockDb = prisma as unknown as {
  dailyReport: Record<string, ReturnType<typeof vi.fn>>;
  customer: Record<string, ReturnType<typeof vi.fn>>;
};

const makeDraftReport = (userId = 1) => ({
  id: 100,
  userId,
  reportDate: new Date('2026-03-17'),
  problem: null,
  plan: null,
  status: 'draft',
  submittedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: userId, name: '山田 太郎', department: '東京営業部' },
  visitRecords: [],
  comments: [],
});

describe('TC-REPORT-01 日報一覧取得', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 営業が自分の日報一覧を取得 — 200 / 自分の日報のみ', async () => {
    mockAuth.mockResolvedValue(salesUser());
    mockDb.dailyReport.count.mockResolvedValue(1);
    mockDb.dailyReport.findMany.mockResolvedValue([
      {
        ...makeDraftReport(),
        _count: { visitRecords: 0, comments: 0 },
      },
    ]);

    const req = makeRequest('GET', 'http://localhost/api/v1/reports');
    const res = await getReports(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.reports).toHaveLength(1);
    // Prisma was called with userId filter
    expect(mockDb.dailyReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 1 }) })
    );
  });

  it('02: 上長が全員の日報一覧を取得', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.dailyReport.count.mockResolvedValue(2);
    mockDb.dailyReport.findMany.mockResolvedValue([
      { ...makeDraftReport(1), _count: { visitRecords: 0, comments: 0 } },
      { ...makeDraftReport(2), _count: { visitRecords: 0, comments: 0 } },
    ]);

    const req = makeRequest('GET', 'http://localhost/api/v1/reports');
    const res = await getReports(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.reports).toHaveLength(2);
  });

  it('08: 未認証アクセス — 401', async () => {
    mockAuth.mockResolvedValue(null);

    const req = makeRequest('GET', 'http://localhost/api/v1/reports');
    const res = await getReports(req);

    expect(res.status).toBe(401);
  });
});

describe('TC-REPORT-02 日報作成', () => {
  beforeEach(() => vi.clearAllMocks());

  const today = new Date().toISOString().slice(0, 10);

  it('01: 正常作成（訪問記録1件）— 201 / status=draft', async () => {
    mockAuth.mockResolvedValue(salesUser());
    mockDb.dailyReport.findUnique.mockResolvedValue(null); // no duplicate
    mockDb.customer.findMany.mockResolvedValue([
      { id: 1, companyName: '株式会社A', isActive: true },
    ]);
    mockDb.dailyReport.create.mockResolvedValue({
      ...makeDraftReport(),
      visitRecords: [
        {
          id: 1,
          customer: { id: 1, companyName: '株式会社A', contactPerson: null },
          visitedAt: '10:00',
          visitContent: '訪問しました',
        },
      ],
    });

    const req = makeRequest('POST', 'http://localhost/api/v1/reports', {
      report_date: today,
      visit_records: [{ customer_id: 1, visited_at: '10:00', visit_content: '訪問しました' }],
    });
    const res = await createReport(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.status).toBe('draft');
  });

  it('05: 同一日付で2件目を作成 — 409 DUPLICATE_REPORT', async () => {
    mockAuth.mockResolvedValue(salesUser());
    mockDb.dailyReport.findUnique.mockResolvedValue(makeDraftReport());

    const req = makeRequest('POST', 'http://localhost/api/v1/reports', {
      report_date: today,
      visit_records: [],
    });
    const res = await createReport(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error.code).toBe('DUPLICATE_REPORT');
  });

  it('06: report_date未入力 — 422 バリデーションエラー', async () => {
    mockAuth.mockResolvedValue(salesUser());

    const req = makeRequest('POST', 'http://localhost/api/v1/reports', {
      visit_records: [],
    });
    const res = await createReport(req);

    expect(res.status).toBe(422);
  });

  it('09: 未来日付で作成 — 422 バリデーションエラー', async () => {
    mockAuth.mockResolvedValue(salesUser());
    const future = new Date();
    future.setDate(future.getDate() + 1);

    const req = makeRequest('POST', 'http://localhost/api/v1/reports', {
      report_date: future.toISOString().slice(0, 10),
      visit_records: [],
    });
    const res = await createReport(req);

    expect(res.status).toBe(422);
  });

  it('10: 上長が日報を作成しようとする — 403', async () => {
    mockAuth.mockResolvedValue(managerUser());

    const req = makeRequest('POST', 'http://localhost/api/v1/reports', {
      report_date: today,
      visit_records: [],
    });
    const res = await createReport(req);

    expect(res.status).toBe(403);
  });
});

describe('TC-REPORT-03 日報詳細取得', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 営業が自分の日報を取得 — 200', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 1 }));
    mockDb.dailyReport.findUnique.mockResolvedValue(makeDraftReport(1));

    const req = makeRequest('GET', 'http://localhost/api/v1/reports/100');
    const res = await getReport(req, { params: Promise.resolve({ id: '100' }) });
    expect(res.status).toBe(200);
  });

  it('03: 営業が他者の日報を取得 — 403', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 2 }));
    mockDb.dailyReport.findUnique.mockResolvedValue(makeDraftReport(1));

    const req = makeRequest('GET', 'http://localhost/api/v1/reports/100');
    const res = await getReport(req, { params: Promise.resolve({ id: '100' }) });
    expect(res.status).toBe(403);
  });

  it('04: 存在しない日報ID — 404', async () => {
    mockAuth.mockResolvedValue(salesUser());
    mockDb.dailyReport.findUnique.mockResolvedValue(null);

    const req = makeRequest('GET', 'http://localhost/api/v1/reports/99999');
    const res = await getReport(req, { params: Promise.resolve({ id: '99999' }) });
    expect(res.status).toBe(404);
  });
});

describe('TC-REPORT-04 日報更新', () => {
  beforeEach(() => vi.clearAllMocks());

  const today = new Date().toISOString().slice(0, 10);

  it('04: 提出済み日報を更新しようとする — 403 REPORT_ALREADY_SUBMITTED', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 1 }));
    mockDb.dailyReport.findUnique.mockResolvedValue({
      ...makeDraftReport(1),
      status: 'submitted',
    });

    const req = makeRequest('PUT', 'http://localhost/api/v1/reports/100', {
      report_date: today,
      visit_records: [],
    });
    const res = await updateReport(req, { params: Promise.resolve({ id: '100' }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe('REPORT_ALREADY_SUBMITTED');
  });

  it('05: 営業が他者の日報を更新しようとする — 403', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 2 }));
    mockDb.dailyReport.findUnique.mockResolvedValue(makeDraftReport(1));

    const req = makeRequest('PUT', 'http://localhost/api/v1/reports/100', {
      report_date: today,
      visit_records: [],
    });
    const res = await updateReport(req, { params: Promise.resolve({ id: '100' }) });
    expect(res.status).toBe(403);
  });
});

describe('TC-REPORT-05 日報提出', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 下書き日報を提出 — 200 / status=submitted', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 1 }));
    mockDb.dailyReport.findUnique.mockResolvedValue(makeDraftReport(1));
    mockDb.dailyReport.update.mockResolvedValue({
      ...makeDraftReport(1),
      status: 'submitted',
      submittedAt: new Date(),
    });

    const req = makeRequest('POST', 'http://localhost/api/v1/reports/100/submit');
    const res = await submitReport(req, { params: Promise.resolve({ id: '100' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('submitted');
  });

  it('02: 提出済み日報を再提出 — 409', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 1 }));
    mockDb.dailyReport.findUnique.mockResolvedValue({ ...makeDraftReport(1), status: 'submitted' });

    const req = makeRequest('POST', 'http://localhost/api/v1/reports/100/submit');
    const res = await submitReport(req, { params: Promise.resolve({ id: '100' }) });

    expect(res.status).toBe(409);
  });

  it('03: 営業が他者の日報を提出しようとする — 403', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 2 }));
    mockDb.dailyReport.findUnique.mockResolvedValue(makeDraftReport(1));

    const req = makeRequest('POST', 'http://localhost/api/v1/reports/100/submit');
    const res = await submitReport(req, { params: Promise.resolve({ id: '100' }) });
    expect(res.status).toBe(403);
  });
});
