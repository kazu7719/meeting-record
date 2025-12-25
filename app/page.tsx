import { GuestTop } from '@/components/guest-top';
import { MinutesListButton } from '@/components/minutes-list-button';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-center">
              Meeting Record
            </h1>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mt-4">
              会議記録アプリケーション - AI議事録管理
            </p>
          </div>
          <div className="ml-4">
            <MinutesListButton />
          </div>
        </div>
        <GuestTop />
      </div>
    </main>
  );
}
