'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';

export async function createCustomer(formData: FormData) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/login');

  await prisma.customer.create({
    data: {
      companyName: formData.get('company_name') as string,
      contactPerson: (formData.get('contact_person') as string) || null,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
      isActive: true,
    },
  });

  revalidatePath('/customers');
  redirect('/customers');
}

export async function updateCustomer(id: number, formData: FormData) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/login');

  await prisma.customer.update({
    where: { id },
    data: {
      companyName: formData.get('company_name') as string,
      contactPerson: (formData.get('contact_person') as string) || null,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
    },
  });

  revalidatePath('/customers');
  redirect('/customers');
}

export async function toggleCustomerStatus(id: number, isActive: boolean) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/login');

  await prisma.customer.update({ where: { id }, data: { isActive } });
  revalidatePath('/customers');
}
