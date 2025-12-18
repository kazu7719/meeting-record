export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8">
          Meeting Record
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400">
          会議記録アプリケーションへようこそ
        </p>
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Next.js + React で構築されています
          </p>
        </div>
      </div>
    </main>
  );
}
