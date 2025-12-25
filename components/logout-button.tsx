'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ROUTES } from '@/lib/routes';

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      router.push(ROUTES.HOME);
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      setError('ログアウトに失敗しました。もう一度お試しください。');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isLoading}
        aria-label="ログアウト"
      >
        {isLoading ? 'ログアウト中...' : 'ログアウト'}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
