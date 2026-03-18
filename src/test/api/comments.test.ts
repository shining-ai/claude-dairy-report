import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getComments, POST as postComment } from '@/app/api/v1/reports/[id]/comments/route';
import { makeRequest, salesUser, managerUser } from '../helpers';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyReport: { findUnique: vi.fn() },
    comment: { findMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('@/lib/auth/session', () => ({ getAuthUser: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';

const mockAuth = getAuthUser as ReturnType<typeof vi.fn>;
const mockDb = prisma as unknown as {
  dailyReport: Record<string, ReturnType<typeof vi.fn>>;
  comment: Record<string, ReturnType<typeof vi.fn>>;
};

const mockReport = (userId = 1) => ({ id: 100, userId });
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('TC-COMMENT-01 コメント一覧取得', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 上長がコメント一覧を取得 — 200', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.dailyReport.findUnique.mockResolvedValue(mockReport(1));
    mockDb.comment.findMany.mockResolvedValue([
      {
        id: 1,
        user: { id: 10, name: '鈴木 部長' },
        content: 'コメントです',
        createdAt: new Date(),
      },
    ]);

    const req = makeRequest('GET', 'http://localhost/api/v1/reports/100/comments');
    const res = await getComments(req, makeParams('100'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.comments).toHaveLength(1);
  });

  it('02: 営業が自分の日報のコメントを取得 — 200', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 1 }));
    mockDb.dailyReport.findUnique.mockResolvedValue(mockReport(1));
    mockDb.comment.findMany.mockResolvedValue([]);

    const req = makeRequest('GET', 'http://localhost/api/v1/reports/100/comments');
    const res = await getComments(req, makeParams('100'));

    expect(res.status).toBe(200);
  });

  it('03: 営業が他者の日報のコメントを取得 — 403', async () => {
    mockAuth.mockResolvedValue(salesUser({ userId: 2 }));
    mockDb.dailyReport.findUnique.mockResolvedValue(mockReport(1));

    const req = makeRequest('GET', 'http://localhost/api/v1/reports/100/comments');
    const res = await getComments(req, makeParams('100'));

    expect(res.status).toBe(403);
  });

  it('04: コメントが0件の場合 — 200 / 空配列', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.dailyReport.findUnique.mockResolvedValue(mockReport(1));
    mockDb.comment.findMany.mockResolvedValue([]);

    const req = makeRequest('GET', 'http://localhost/api/v1/reports/100/comments');
    const res = await getComments(req, makeParams('100'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.comments).toHaveLength(0);
  });
});

describe('TC-COMMENT-02 コメント投稿', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 上長が正常にコメント投稿 — 201', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.dailyReport.findUnique.mockResolvedValue(mockReport(1));
    mockDb.comment.create.mockResolvedValue({
      id: 1,
      user: { id: 10, name: '鈴木 部長' },
      content: 'コメントです',
      createdAt: new Date(),
    });

    const req = makeRequest('POST', 'http://localhost/api/v1/reports/100/comments', {
      content: 'コメントです',
    });
    const res = await postComment(req, makeParams('100'));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.content).toBe('コメントです');
  });

  it('03: 営業がコメント投稿しようとする — 403', async () => {
    mockAuth.mockResolvedValue(salesUser());

    const req = makeRequest('POST', 'http://localhost/api/v1/reports/100/comments', {
      content: 'コメント',
    });
    const res = await postComment(req, makeParams('100'));

    expect(res.status).toBe(403);
  });

  it('04: コメント内容が空 — 422', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.dailyReport.findUnique.mockResolvedValue(mockReport(1));

    const req = makeRequest('POST', 'http://localhost/api/v1/reports/100/comments', {
      content: '',
    });
    const res = await postComment(req, makeParams('100'));

    expect(res.status).toBe(422);
  });

  it('05: 存在しない日報IDにコメント — 404', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.dailyReport.findUnique.mockResolvedValue(null);

    const req = makeRequest('POST', 'http://localhost/api/v1/reports/99999/comments', {
      content: 'コメント',
    });
    const res = await postComment(req, makeParams('99999'));

    expect(res.status).toBe(404);
  });
});
