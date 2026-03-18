'use server';

import { redirect } from 'next/navigation';
import { AUTH_COOKIE } from '@/lib/auth/getUser';
import { cookies } from 'next/headers';

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect('/login');
}
