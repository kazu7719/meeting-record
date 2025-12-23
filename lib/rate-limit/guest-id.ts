import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * guest_id cookie管理
 * Issue 7, 8, 9: ゲストユーザーの識別・レート制限
 *
 * 初回アクセス時にguest_idを発行し、cookieに保存
 */

const GUEST_ID_COOKIE_NAME = 'guest_id';
const GUEST_ID_MAX_AGE = 60 * 60 * 24 * 365; // 1年

/**
 * guest_idを取得または生成
 * @returns guest_id
 */
export async function getOrCreateGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const existingGuestId = cookieStore.get(GUEST_ID_COOKIE_NAME);

  if (existingGuestId?.value) {
    return existingGuestId.value;
  }

  // 新規発行
  const newGuestId = crypto.randomUUID();
  cookieStore.set(GUEST_ID_COOKIE_NAME, newGuestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: GUEST_ID_MAX_AGE,
  });

  return newGuestId;
}
