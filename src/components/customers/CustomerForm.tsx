'use client';

import { useRouter } from 'next/navigation';

type Customer = {
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
};

type Props = {
  defaultValues?: Customer;
  action: (formData: FormData) => Promise<void>;
};

export function CustomerForm({ defaultValues, action }: Props) {
  const router = useRouter();

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          会社名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="company_name"
          required
          maxLength={100}
          defaultValue={defaultValues?.companyName ?? ''}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">担当者名</label>
        <input
          type="text"
          name="contact_person"
          maxLength={50}
          defaultValue={defaultValues?.contactPerson ?? ''}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">電話番号</label>
        <input
          type="text"
          name="phone"
          pattern="[\d-]+"
          defaultValue={defaultValues?.phone ?? ''}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">住所</label>
        <input
          type="text"
          name="address"
          maxLength={200}
          defaultValue={defaultValues?.address ?? ''}
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
