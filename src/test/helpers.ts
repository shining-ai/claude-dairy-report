import { NextRequest } from 'next/server';
import type { JwtPayload } from '@/lib/auth/jwt';

export function makeRequest(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  return new NextRequest(new URL(url, 'http://localhost'), init);
}

export function salesUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    userId: 1,
    role: 'sales',
    email: 'sales@example.com',
    name: '山田 太郎',
    ...overrides,
  } as JwtPayload;
}

export function managerUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    userId: 10,
    role: 'manager',
    email: 'manager@example.com',
    name: '鈴木 部長',
    ...overrides,
  } as JwtPayload;
}
