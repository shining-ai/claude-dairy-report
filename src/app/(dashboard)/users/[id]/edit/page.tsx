import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUserFromCookie } from '@/lib/auth/getUser';
import { UserForm } from '@/components/users/UserForm';
import { updateUser } from '@/lib/actions/users';

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'manager') redirect('/');

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) notFound();

  const action = updateUser.bind(null, id);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">ユーザー編集</h1>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <UserForm
          defaultValues={{
            name: target.name,
            email: target.email,
            role: target.role,
            department: target.department,
          }}
          isEdit
          action={action}
        />
      </div>
    </div>
  );
}
