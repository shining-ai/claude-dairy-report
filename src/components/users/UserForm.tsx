'use client';

import { useRouter } from 'next/navigation';

type UserValues = {
  name: string;
  email: string;
  role: string;
  department: string;
};

type Props = {
  defaultValues?: UserValues;
  isEdit?: boolean;
  action: (formData: FormData) => Promise<void>;
};

export function UserForm({ defaultValues, isEdit = false, action }: Props) {
  const router = useRouter();

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          氏名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          required
          maxLength={50}
          defaultValue={defaultValues?.name ?? ''}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          required
          defaultValue={defaultValues?.email ?? ''}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          パスワード {!isEdit && <span className="text-red-500">*</span>}
          {isEdit && <span className="text-xs text-gray-400">（変更する場合のみ入力）</span>}
        </label>
        <input
          type="password"
          name="password"
          required={!isEdit}
          minLength={8}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          ロール <span className="text-red-500">*</span>
        </label>
        <select
          name="role"
          required
          defaultValue={defaultValues?.role ?? 'sales'}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="sales">営業</option>
          <option value="manager">上長</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">部署</label>
        <input
          type="text"
          name="department"
          maxLength={50}
          defaultValue={defaultValues?.department ?? ''}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          保存
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
