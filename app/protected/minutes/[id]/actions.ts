'use server';

import { createClient } from '@/lib/supabase/server';
import { AUDIO_UPLOAD, type AllowedMimeType } from '@/lib/constants/audio';

// 戻り値の型定義
type UploadAudioResult =
  | { success: true }
  | { success: false; error: string };

export async function uploadAudio(formData: FormData): Promise<UploadAudioResult> {
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
    const isAllowedMimeType = (type: string): type is AllowedMimeType => {
      return (AUDIO_UPLOAD.ALLOWED_MIME_TYPES as readonly string[]).includes(type);
    };

    if (!isAllowedMimeType(file.type)) {
      return {
        success: false,
        error: `m4a形式のファイルのみアップロード可能です（${AUDIO_UPLOAD.ALLOWED_MIME_TYPES.join(', ')}）`,
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
