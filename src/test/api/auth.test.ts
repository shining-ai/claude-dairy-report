import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginHandler } from '@/app/api/v1/auth/login/route';
import { POST as logoutHandler } from '@/app/api/v1/auth/logout/route';
import { makeRequest } from '../helpers';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock bcryptjs verify
vi.mock('@/lib/auth/password', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

// Mock JWT sign
vi.mock('@/lib/auth/jwt', () => ({
  signJwt: vi.fn().mockResolvedValue('mock-jwt-token'),
  verifyJwt: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';

const mockPrisma = prisma as ReturnType<typeof vi.fn>;
const mockVerifyPassword = verifyPassword as ReturnType<typeof vi.fn>;

describe('TC-AUTH-01 ログイン', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const activeUser = {
    id: 1,
    name: '山田 太郎',
    email: 'yamada@example.com',
    passwordHash: 'hashed',
    role: 'sales',
    department: '東京営業部',
    isActive: true,
  };

  it('01: 正常ログイン（営業）— 200 + JWT返却', async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(activeUser);
    mockVerifyPassword.mockResolvedValue(true);

    const req = makeRequest('POST', 'http://localhost/api/v1/auth/login', {
      email: 'yamada@example.com',
      password: 'password123',
    });
    const res = await loginHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.token).toBe('mock-jwt-token');
    expect(json.data.user.role).toBe('sales');
  });

  it('02: 正常ログイン（上長）— 200 + JWT返却', async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...activeUser,
      role: 'manager',
    });
    mockVerifyPassword.mockResolvedValue(true);

    const req = makeRequest('POST', 'http://localhost/api/v1/auth/login', {
      email: 'manager@example.com',
      password: 'password123',
    });
    const res = await loginHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.user.role).toBe('manager');
  });

  it('03: パスワード誤り — 401 INVALID_CREDENTIALS', async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(activeUser);
    mockVerifyPassword.mockResolvedValue(false);

    const req = makeRequest('POST', 'http://localhost/api/v1/auth/login', {
      email: 'yamada@example.com',
      password: 'wrong',
    });
    const res = await loginHandler(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('04: メールアドレス誤り — 401 INVALID_CREDENTIALS', async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = makeRequest('POST', 'http://localhost/api/v1/auth/login', {
      email: 'notfound@example.com',
      password: 'password123',
    });
    const res = await loginHandler(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('05: 無効化ユーザーのログイン — 401 ACCOUNT_DISABLED', async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...activeUser,
      isActive: false,
    });

    const req = makeRequest('POST', 'http://localhost/api/v1/auth/login', {
      email: 'inactive@example.com',
      password: 'password123',
    });
    const res = await loginHandler(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe('ACCOUNT_DISABLED');
  });

  it('06: メールアドレス未入力 — 422 バリデーションエラー', async () => {
    const req = makeRequest('POST', 'http://localhost/api/v1/auth/login', {
      email: '',
      password: 'password123',
    });
    const res = await loginHandler(req);

    expect(res.status).toBe(422);
  });

  it('07: パスワード未入力 — 422 バリデーションエラー', async () => {
    const req = makeRequest('POST', 'http://localhost/api/v1/auth/login', {
      email: 'yamada@example.com',
      password: '',
    });
    const res = await loginHandler(req);

    expect(res.status).toBe(422);
  });
});

describe('TC-AUTH-02 ログアウト', () => {
  it('01: 正常ログアウト — 200 + ログアウト成功', async () => {
    const res = await logoutHandler();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.message).toBe('ログアウトしました');
  });
});
