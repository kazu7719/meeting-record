"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ensureProfileExists } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("パスワードが一致しません");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;

      // Email確認が無効な場合、セッションが確立されるまで少し待つ
      if (data.session) {
        // セッションが確立されている場合のみprofilesを作成
        try {
          await ensureProfileExists();
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          // プロフィール作成に失敗してもサインアップは成功としてリダイレクト
          // ログイン時に再度作成される
        }
      }

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      // Supabaseのエラーメッセージを日本語化
      const errorMessage = error instanceof Error ? error.message : "エラーが発生しました";
      if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
        setError("このメールアドレスは既に登録されています");
      } else if (errorMessage.includes("password")) {
        setError("パスワードは6文字以上である必要があります");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">新規登録</CardTitle>
          <CardDescription>
            アカウントを作成してすぐに利用開始
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 デモ用途のため、ダミーのメールアドレス（例: test@example.com）でも登録可能です。メール確認は不要です。
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="test@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">パスワード</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">パスワード（確認）</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登録中..." : "アカウント作成"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              すでにアカウントをお持ちですか？{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                ログイン
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
