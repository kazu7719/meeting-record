'use client';

import { useState, useRef } from 'react';
import { uploadAudio } from '@/app/protected/minutes/[id]/actions';
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

    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('minuteId', minuteId);

      const result = await uploadAudio(formData);

      if (result.success) {
        setSuccess('アップロードが完了しました');
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
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
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
            <p className="mt-2 text-sm text-gray-600">
              選択中: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          {isUploading ? 'アップロード中...' : 'アップロード'}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        <p>※ 対応形式: audio/mp4 (.m4a)</p>
        <p>※ 最大サイズ: 20MB</p>
      </div>
    </div>
  );
}
