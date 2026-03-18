import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { updateCustomer } from '@/lib/actions/customers';

type Props = { params: Promise<{ id: string }> };

export default async function EditCustomerPage({ params }: Props) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/customers');

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const action = updateCustomer.bind(null, id);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">顧客編集</h1>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <CustomerForm defaultValues={customer} action={action} />
      </div>
    </div>
  );
}
