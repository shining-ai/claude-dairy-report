import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getUsers, POST as createUserHandler } from '@/app/api/v1/users/route';
import { PUT as updateUserHandler } from '@/app/api/v1/users/[id]/route';
import { PATCH as patchStatus } from '@/app/api/v1/users/[id]/status/route';
import { makeRequest, salesUser, managerUser } from '../helpers';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/auth/session', () => ({ getAuthUser: vi.fn() }));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed'),
  verifyPassword: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/session';

const mockAuth = getAuthUser as ReturnType<typeof vi.fn>;
const mockDb = prisma as unknown as { user: Record<string, ReturnType<typeof vi.fn>> };
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const mockUser = {
  id: 1,
  name: '山田 太郎',
  email: 'yamada@example.com',
  role: 'sales',
  department: '東京営業部',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TC-USER-01 ユーザー一覧取得', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 上長がユーザー一覧を取得 — 200', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.user.findMany.mockResolvedValue([mockUser]);

    const req = makeRequest('GET', 'http://localhost/api/v1/users');
    const res = await getUsers(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.users).toHaveLength(1);
  });

  it('02: 営業がユーザー一覧を取得しようとする — 403', async () => {
    mockAuth.mockResolvedValue(salesUser());

    const req = makeRequest('GET', 'http://localhost/api/v1/users');
    const res = await getUsers(req);

    expect(res.status).toBe(403);
  });
});

describe('TC-USER-02 ユーザー作成', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: 上長が営業ユーザーを作成 — 201', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue(mockUser);

    const req = makeRequest('POST', 'http://localhost/api/v1/users', {
      name: '山田 太郎',
      email: 'yamada@example.com',
      password: 'password123',
      role: 'sales',
      department: '東京営業部',
    });
    const res = await createUserHandler(req);

    expect(res.status).toBe(201);
  });

  it('03: メールアドレス重複 — 409 DUPLICATE_EMAIL', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.user.findUnique.mockResolvedValue(mockUser);

    const req = makeRequest('POST', 'http://localhost/api/v1/users', {
      name: '田中 二郎',
      email: 'yamada@example.com',
      password: 'password123',
      role: 'sales',
    });
    const res = await createUserHandler(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error.code).toBe('DUPLICATE_EMAIL');
  });

  it('04: メールアドレス未入力 — 422', async () => {
    mockAuth.mockResolvedValue(managerUser());

    const req = makeRequest('POST', 'http://localhost/api/v1/users', {
      name: '山田 太郎',
      email: '',
      password: 'password123',
      role: 'sales',
    });
    const res = await createUserHandler(req);

    expect(res.status).toBe(422);
  });

  it('05: パスワード7文字以下 — 422', async () => {
    mockAuth.mockResolvedValue(managerUser());

    const req = makeRequest('POST', 'http://localhost/api/v1/users', {
      name: '山田 太郎',
      email: 'yamada2@example.com',
      password: 'short7',
      role: 'sales',
    });
    const res = await createUserHandler(req);

    expect(res.status).toBe(422);
  });

  it('07: 営業がユーザーを作成しようとする — 403', async () => {
    mockAuth.mockResolvedValue(salesUser());

    const req = makeRequest('POST', 'http://localhost/api/v1/users', {
      name: '新人',
      email: 'new@example.com',
      password: 'password123',
      role: 'sales',
    });
    const res = await createUserHandler(req);

    expect(res.status).toBe(403);
  });
});

describe('TC-USER-03 ユーザー更新・ステータス変更', () => {
  beforeEach(() => vi.clearAllMocks());

  it('01: ユーザー情報を更新（パスワードなし）— 200', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.user.findUnique.mockResolvedValue(mockUser);
    mockDb.user.update.mockResolvedValue({ ...mockUser, name: '山田 更新' });

    const req = makeRequest('PUT', 'http://localhost/api/v1/users/1', {
      name: '山田 更新',
      email: 'yamada@example.com',
      role: 'sales',
      department: '東京営業部',
    });
    const res = await updateUserHandler(req, makeParams('1'));

    expect(res.status).toBe(200);
  });

  it('03: ユーザーを無効化 — 200', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.user.findUnique.mockResolvedValue(mockUser);
    mockDb.user.update.mockResolvedValue({ ...mockUser, isActive: false });

    const req = makeRequest('PATCH', 'http://localhost/api/v1/users/1/status', {
      is_active: false,
    });
    const res = await patchStatus(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.is_active).toBe(false);
  });

  it('04: 存在しないユーザーIDを指定 — 404', async () => {
    mockAuth.mockResolvedValue(managerUser());
    mockDb.user.findUnique.mockResolvedValue(null);

    const req = makeRequest('PUT', 'http://localhost/api/v1/users/99999', {
      name: '存在しない',
      email: 'notfound@example.com',
      role: 'sales',
    });
    const res = await updateUserHandler(req, makeParams('99999'));

    expect(res.status).toBe(404);
  });

  it('05: 営業が更新しようとする — 403', async () => {
    mockAuth.mockResolvedValue(salesUser());

    const req = makeRequest('PUT', 'http://localhost/api/v1/users/1', {
      name: '山田',
      email: 'yamada@example.com',
      role: 'sales',
    });
    const res = await updateUserHandler(req, makeParams('1'));

    expect(res.status).toBe(403);
  });
});
