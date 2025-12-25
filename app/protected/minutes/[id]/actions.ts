'use server';

import { createClient } from '@/lib/supabase/server';
import { AUDIO_UPLOAD } from '@/lib/constants/audio';
import OpenAI from 'openai';
import crypto from 'crypto';

export async function uploadAudio(formData: FormData) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'ログインが必要です',
      };
    }

    // Get user's profile to retrieve department_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('department_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'プロフィール情報が取得できませんでした',
      };
    }

    // Extract form data
    const file = formData.get('file') as File;
    const minuteId = formData.get('minuteId') as string;

    if (!file || !minuteId) {
      return {
        success: false,
        error: 'ファイルまたは議事録IDが指定されていません',
      };
    }

    // Validate MIME type
    if (file.type !== AUDIO_UPLOAD.ALLOWED_MIME_TYPE) {
      return {
        success: false,
        error: `${AUDIO_UPLOAD.ALLOWED_MIME_TYPE}形式のファイルのみアップロード可能です`,
      };
    }

    // Validate file size
    if (file.size > AUDIO_UPLOAD.MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'ファイルサイズは20MB以下にしてください',
      };
    }

    // Verify minute ownership (RLS will also check, but doing it here for better error messages)
    const { data: minute, error: minuteError } = await supabase
      .from('minutes')
      .select('id, owner_id')
      .eq('id', minuteId)
      .eq('owner_id', user.id)
      .single();

    if (minuteError || !minute) {
      return {
        success: false,
        error: '議事録が見つからないか、アクセス権限がありません',
      };
    }

    // Generate unique file path: {department_id}/{minute_id}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${profile.department_id}/${minuteId}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return {
        success: false,
        error: 'ファイルのアップロードに失敗しました',
      };
    }

    // Save metadata to audio_files table
    const { error: dbError } = await supabase.from('audio_files').insert({
      minute_id: minuteId,
      file_path: filePath,
      mime_type: file.type,
      duration: null, // Duration is optional
    });

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Cleanup: delete uploaded file if DB insert fails
      await supabase.storage.from('audio').remove([filePath]);
      return {
        success: false,
        error: 'データベースへの保存に失敗しました',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error in uploadAudio:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

// レート制限設定（環境変数から取得）
const AI_RATE_LIMIT_PER_DAY = parseInt(
  process.env.AI_RATE_LIMIT_PER_DAY || '10',
  10
);
const AI_DEBOUNCE_SECONDS = parseInt(
  process.env.AI_DEBOUNCE_SECONDS || '30',
  10
);

// キャッシュ用のMap（本番環境ではRedis等を推奨）
const transcriptionCache = new Map<
  string,
  { transcript: string; timestamp: number }
>();
const rateLimitMap = new Map<
  string,
  { count: number; lastReset: number; lastExecution: number }
>();

/**
 * レート制限チェック
 */
async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const userLimit = rateLimitMap.get(userId);

  if (!userLimit) {
    rateLimitMap.set(userId, {
      count: 1,
      lastReset: now,
      lastExecution: now,
    });
    return { allowed: true };
  }

  // 連打防止チェック
  const timeSinceLastExecution = (now - userLimit.lastExecution) / 1000;
  if (timeSinceLastExecution < AI_DEBOUNCE_SECONDS) {
    return {
      allowed: false,
      error: `連続実行は${AI_DEBOUNCE_SECONDS}秒以上間隔を空けてください`,
    };
  }

  // 日次リセット
  if (now - userLimit.lastReset > oneDayMs) {
    rateLimitMap.set(userId, {
      count: 1,
      lastReset: now,
      lastExecution: now,
    });
    return { allowed: true };
  }

  // 回数制限チェック
  if (userLimit.count >= AI_RATE_LIMIT_PER_DAY) {
    return {
      allowed: false,
      error: `1日の文字起こし回数上限（${AI_RATE_LIMIT_PER_DAY}回）に達しました。明日再度お試しください`,
    };
  }

  // カウント増加
  userLimit.count++;
  userLimit.lastExecution = now;
  return { allowed: true };
}

export async function transcribeAudio(formData: FormData) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'ログインが必要です',
      };
    }

    // レート制限チェック
    const rateLimitResult = await checkRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error || 'レート制限に達しました',
      };
    }

    // Extract form data
    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        error: 'ファイルが指定されていません',
      };
    }

    // Validate MIME type
    if (file.type !== AUDIO_UPLOAD.ALLOWED_MIME_TYPE) {
      return {
        success: false,
        error: `${AUDIO_UPLOAD.ALLOWED_MIME_TYPE}形式のファイルのみ対応しています`,
      };
    }

    // Validate file size
    if (file.size > AUDIO_UPLOAD.MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'ファイルサイズは20MB以下にしてください',
      };
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not configured');
      return {
        success: false,
        error: '文字起こし機能が設定されていません',
      };
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey,
    });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // キャッシュキー生成（ファイル内容のハッシュ）
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // キャッシュチェック
    const cached = transcriptionCache.get(fileHash);
    const cacheTTL =
      parseInt(process.env.AI_CACHE_TTL_SECONDS || '86400', 10) * 1000;

    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return {
        success: true,
        transcript: cached.transcript,
        fromCache: true,
      };
    }

    // Create a File-like object for OpenAI API
    const audioFile = new File([buffer], file.name, { type: file.type });

    // Call Whisper API for transcription
    // response_format: 'text' を指定した場合、レスポンスはstring型
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'ja', // Japanese language
      response_format: 'text',
    });

    // response_format: 'text' の場合、transcriptionはstring型
    const transcriptText = transcription as string;

    if (!transcriptText) {
      return {
        success: false,
        error: '文字起こしに失敗しました',
      };
    }

    // キャッシュ保存
    transcriptionCache.set(fileHash, {
      transcript: transcriptText,
      timestamp: Date.now(),
    });

    return {
      success: true,
      transcript: transcriptText,
      fromCache: false,
    };
  } catch (error) {
    console.error('Unexpected error in transcribeAudio:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        return {
          success: false,
          error: 'APIの利用制限に達しました。しばらく経ってから再度お試しください',
        };
      }
      if (error.message.includes('invalid_api_key')) {
        return {
          success: false,
          error: '文字起こし機能が正しく設定されていません',
        };
      }
    }

    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}
