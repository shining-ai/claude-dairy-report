import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { createCustomer } from '@/lib/actions/customers';

export default async function NewCustomerPage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/customers');

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">顧客登録</h1>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <CustomerForm action={createCustomer} />
      </div>
    </div>
  );
}
