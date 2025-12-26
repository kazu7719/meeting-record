'use server';

import { createClient } from '@/lib/supabase/server';
import { AUDIO_UPLOAD, type AllowedMimeType } from '@/lib/constants/audio';

// 戻り値の型定義
type UploadAudioResult =
  | { success: true; filePath: string }
  | { success: false; error: string };

type TranscribeAudioResult =
  | { success: true; transcript: string }
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
      filePath,
    };
  } catch (error) {
    console.error('Unexpected error in uploadAudio:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

export async function transcribeAudio(
  minuteId: string,
  filePath: string
): Promise<TranscribeAudioResult> {
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

    // Verify minute ownership
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

    // Download audio file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('audio')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return {
        success: false,
        error: '音声ファイルのダウンロードに失敗しました',
      };
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // Call Google Cloud Speech-to-Text API
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_CLOUD_API_KEY is not set');
      return {
        success: false,
        error: '文字起こし機能の設定が完了していません',
      };
    }

    const response = await fetch(
      'https://speech.googleapis.com/v1/speech:recognize',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          config: {
            encoding: 'MP3',
            sampleRateHertz: 16000,
            languageCode: 'ja-JP',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: base64Audio,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Cloud API error:', errorText);
      return {
        success: false,
        error: '文字起こしに失敗しました',
      };
    }

    const result = await response.json();

    // Extract transcript from response
    if (!result.results || result.results.length === 0) {
      return {
        success: false,
        error: '音声を認識できませんでした',
      };
    }

    const transcript = result.results
      .map((r: { alternatives: { transcript: string }[] }) =>
        r.alternatives[0]?.transcript || ''
      )
      .join('\n');

    if (!transcript) {
      return {
        success: false,
        error: '文字起こし結果が空です',
      };
    }

    // Update minutes.raw_text with transcript
    const { error: updateError } = await supabase
      .from('minutes')
      .update({ raw_text: transcript })
      .eq('id', minuteId)
      .eq('owner_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return {
        success: false,
        error: '文字起こし結果の保存に失敗しました',
      };
    }

    return {
      success: true,
      transcript,
    };
  } catch (error) {
    console.error('Unexpected error in transcribeAudio:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}
