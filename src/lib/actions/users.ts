'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { hashPassword } from '@/lib/auth/password';

export async function createUser(formData: FormData) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/login');

  const password = formData.get('password') as string;
  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      passwordHash,
      role: formData.get('role') as string,
      department: (formData.get('department') as string) || '',
      isActive: true,
    },
  });

  revalidatePath('/users');
  redirect('/users');
}

export async function updateUser(id: number, formData: FormData) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/login');

  const password = formData.get('password') as string;
  const updateData: Record<string, unknown> = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    role: formData.get('role') as string,
    department: (formData.get('department') as string) || '',
  };

  if (password) {
    updateData.passwordHash = await hashPassword(password);
  }

  await prisma.user.update({ where: { id }, data: updateData });

  revalidatePath('/users');
  redirect('/users');
}

export async function toggleUserStatus(id: number, isActive: boolean) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/login');

  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath('/users');
}
