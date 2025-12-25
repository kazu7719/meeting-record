'use client';

import { useState, useRef } from 'react';
import { uploadAudio, transcribeAudio } from '@/app/protected/minutes/[id]/actions';
import { useRouter } from 'next/navigation';
import { AUDIO_UPLOAD } from '@/lib/constants/audio';

interface AudioUploadFormProps {
  minuteId: string;
}

export default function AudioUploadForm({ minuteId }: AudioUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [enableTranscription, setEnableTranscription] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validateFile = (selectedFile: File): string | null => {
    // Validate MIME type
    if (selectedFile.type !== AUDIO_UPLOAD.ALLOWED_MIME_TYPE) {
      return `${AUDIO_UPLOAD.ALLOWED_MIME_TYPE}形式のファイルのみアップロード可能です`;
    }

    // Validate file size
    if (selectedFile.size > AUDIO_UPLOAD.MAX_FILE_SIZE) {
      return 'ファイルサイズは20MB以下にしてください';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTranscript('');

    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('minuteId', minuteId);

      // If transcription is enabled, transcribe first
      if (enableTranscription) {
        setIsTranscribing(true);
        const transcriptionFormData = new FormData();
        transcriptionFormData.append('file', file);

        const transcriptionResult = await transcribeAudio(transcriptionFormData);

        setIsTranscribing(false);

        if (!transcriptionResult.success) {
          setError(transcriptionResult.error || '文字起こしに失敗しました');
          setIsUploading(false);
          return;
        }

        if (transcriptionResult.transcript) {
          setTranscript(transcriptionResult.transcript);
          setSuccess('文字起こしが完了しました');
        }
      }

      // Upload audio file
      const result = await uploadAudio(formData);

      if (result.success) {
        if (!enableTranscription) {
          setSuccess('アップロードが完了しました');
        } else {
          setSuccess('アップロードと文字起こしが完了しました');
        }
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Refresh the page to show the newly uploaded audio file
        router.refresh();
      } else {
        setError(result.error || 'アップロードに失敗しました');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsUploading(false);
      setIsTranscribing(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">音声アップロード</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="audio-file" className="block text-sm font-medium mb-2">
            音声ファイル (m4a形式、20MB以下)
          </label>
          <input
            ref={fileInputRef}
            id="audio-file"
            type="file"
            accept="audio/mp4,.m4a"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              選択中: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableTranscription}
              onChange={(e) => setEnableTranscription(e.target.checked)}
              disabled={isUploading}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium">
              文字起こしを実行（OpenAI Whisper）
            </span>
          </label>
          <p className="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
            音声から自動的にテキストを抽出します
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-400 text-sm"
          >
            {success}
          </div>
        )}

        {isTranscribing && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-blue-700 dark:text-blue-400 text-sm"
          >
            文字起こし中... しばらくお待ちください
          </div>
        )}

        {transcript && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">文字起こし結果</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md max-h-64 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              ※ この文字起こし結果は自動的に保存されません。コピーして議事録として使用できます。
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isUploading}
          aria-label={
            isUploading
              ? isTranscribing
                ? '文字起こし中です。しばらくお待ちください'
                : 'アップロード中です。しばらくお待ちください'
              : '音声ファイルをアップロード'
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          {isUploading
            ? isTranscribing
              ? '文字起こし中...'
              : 'アップロード中...'
            : 'アップロード'}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>※ 対応形式: audio/mp4 (.m4a)</p>
        <p>※ 最大サイズ: 20MB</p>
        {enableTranscription && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            ⚠️ 文字起こしには時間がかかる場合があります（1分の音声で約10-20秒）
          </p>
        )}
      </div>
    </div>
  );
}
