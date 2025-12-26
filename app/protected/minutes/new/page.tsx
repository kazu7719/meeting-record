import { MinuteForm } from '@/components/minute-form';

export default function NewMinutePage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">議事録新規登録</h1>
        <p className="text-gray-600 dark:text-gray-400">
          会議の議事録を登録します
        </p>
      </div>
      <MinuteForm />
    </div>
  );
}
