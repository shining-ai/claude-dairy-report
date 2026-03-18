import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { UserForm } from '@/components/users/UserForm';
import { createUser } from '@/lib/actions/users';

export default async function NewUserPage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/');

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">ユーザー登録</h1>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <UserForm action={createUser} />
      </div>
    </div>
  );
}
