import { GuestTop } from '@/components/guest-top';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Meeting Record
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
          会議記録アプリケーション - AI議事録管理
        </p>
        <GuestTop />
      </div>
    </main>
  );
}
