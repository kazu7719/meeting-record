import { redirect } from "next/navigation";

export default function ProtectedPage() {
  // 認証済みユーザーは議事録一覧ページへリダイレクト
  redirect("/protected/minutes");
}
