'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

export function MinutesListButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Button asChild variant="outline" aria-label="保存された議事録の一覧ページへ移動">
      <Link href={ROUTES.MINUTES_LIST}>議事録一覧を見る</Link>
    </Button>
  );
}
