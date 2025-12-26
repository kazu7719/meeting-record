'use client';

import { useState, useRef } from 'react';
import { uploadAudio, transcribeAudio } from '@/app/protected/minutes/[id]/actions';
import { useRouter } from 'next/navigation';
import { AUDIO_UPLOAD, type AllowedMimeType } from '@/lib/constants/audio';

interface AudioUploadFormProps {
  minuteId: string;
}

export default function AudioUploadForm({ minuteId }: AudioUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [enableTranscription, setEnableTranscription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validateFile = (selectedFile: File): string | null => {
    // Type guard for allowed MIME types
    const isAllowedMimeType = (type: string): type is AllowedMimeType => {
      return (AUDIO_UPLOAD.ALLOWED_MIME_TYPES as readonly string[]).includes(type);
    };

    // Validate MIME type
    if (!isAllowedMimeType(selectedFile.type)) {
      return `m4a形式のファイルのみアップロード可能です（${AUDIO_UPLOAD.ALLOWED_MIME_TYPES.join(', ')}）`;
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

    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('minuteId', minuteId);

      // Upload audio file
      const result = await uploadAudio(formData);

      if (result.success) {
        // If transcription is enabled, transcribe the audio
        if (enableTranscription) {
          const transcribeResult = await transcribeAudio(minuteId, result.filePath);

          if (transcribeResult.success) {
            setSuccess('アップロードと文字起こしが完了しました');
          } else {
            setError(transcribeResult.error || '文字起こしに失敗しました');
            setIsUploading(false);
            return;
          }
        } else {
          setSuccess('アップロードが完了しました');
        }

        setFile(null);
        setEnableTranscription(false);
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
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enableTranscription}
              onChange={(e) => setEnableTranscription(e.target.checked)}
              disabled={isUploading}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="文字起こしを実行"
            />
            <span className="text-sm font-medium">
              文字起こしを実行（Google Cloud Speech-to-Text）
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
            音声を文字起こしして、議事録テキスト（raw_text）として保存します
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

        <button
          type="submit"
          disabled={!file || isUploading}
          aria-label={
            isUploading
              ? 'アップロード中です。しばらくお待ちください'
              : '音声ファイルをアップロード'
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          {isUploading ? 'アップロード中...' : 'アップロード'}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>※ 対応形式: audio/mp4 (.m4a)</p>
        <p>※ 最大サイズ: 20MB</p>
        <p className="mt-2 text-xs">
          💡 文字起こしを有効にすると、音声がテキストに変換されraw_textとして保存されます
        </p>
      </div>
    </div>
  );
}
