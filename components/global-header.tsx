import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/logout-button';
import { MobileNav } from '@/components/mobile-nav';
import { ROUTES } from '@/lib/routes';

// Force this component to be dynamic (no caching)
export const dynamic = 'force-dynamic';

export async function GlobalHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href={ROUTES.HOME} className="text-xl font-bold">
              Meeting Record
            </Link>
            <nav className="hidden md:flex gap-4">
              <Link
                href={ROUTES.HOME}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                ホーム
              </Link>
              <Link
                href={ROUTES.MINUTES_LIST}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                議事録一覧
              </Link>
              <Link
                href={ROUTES.TEAMS}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                チーム管理
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* デスクトップ表示 */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={ROUTES.LOGIN}>ログイン</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={ROUTES.SIGNUP}>サインアップ</Link>
                  </Button>
                </>
              )}
            </div>

            {/* モバイルナビゲーション */}
            <MobileNav
              isLoggedIn={!!user}
              userEmail={user?.email}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
