'use client';

import { useState, useRef, useEffect } from 'react';
import { SaveButton } from './save-button';
import { AiControls } from './ai-controls';
import { SummaryResult } from './summary-result';
import { ActionsResult } from './actions-result';
import { QAResultDisplay } from './qa-result';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { generateSummary } from '@/app/actions/generate-summary';
import { extractActions, type ActionItem } from '@/app/actions/extract-actions';
import { executeQA, type QAResult } from '@/app/actions/qa-answer';
import { transcribeAudio } from '@/app/protected/minutes/[id]/actions';
import { AUDIO_UPLOAD, type AllowedMimeType } from '@/lib/constants/audio';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Type definition for transcribeAudio result
type TranscribeAudioResult = {
  success: boolean;
  transcript?: string;
  error?: string;
  fromCache?: boolean;
};

const SAMPLE_TEXT =
  '# 開発進捗定例（サンプル）\n\n' +
  '## 日時\n2025-01-15 10:00-11:00\n\n' +
  '## 参加者\n田中、佐藤、鈴木\n\n' +
  '## 議題\n1. 前回アクションの確認\n2. 今週の進捗報告\n\n' +
  '## 決定事項\n- ログイン機能を今週中に実装する（担当：田中）\n' +
  '- UI/UXレビューを来週実施する（担当：佐藤）';

const MAX_CHARS = 30000;

/**
 * ゲストトップ画面コンポーネント（Client Component）
 * Issue 5, 7, 8, 9: raw_text登録・AI要約・アクション抽出・QA
 *
 * - サンプル議事録エリア表示
 * - 文字数カウンタ
 * - サンプル操作ボタン（挿入/クリア）
 * - AI機能（要約・アクション抽出・QA）
 * - 保存ボタン（Client Component）
 */
export function GuestTop() {
  const router = useRouter();
  const [rawText, setRawText] = useState(SAMPLE_TEXT);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionItem[] | null>(null);
  const [isExtractingActions, setIsExtractingActions] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [isExecutingQA, setIsExecutingQA] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Audio transcription state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication status (CRITICAL: audio feature is login-only)
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleInsertSample = () => {
    setRawText(SAMPLE_TEXT);
  };

  const handleClear = () => {
    setRawText('');
  };

  const handleGenerateSummary = async () => {
    setSummaryError(null);
    setIsGeneratingSummary(true);

    try {
      const result = await generateSummary({ rawText });

      if (result.success && result.summary) {
        setSummary(result.summary);
      } else {
        setSummaryError(result.error || '要約生成に失敗しました');
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      setSummaryError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExtractActions = async () => {
    setActionsError(null);
    setIsExtractingActions(true);

    try {
      const result = await extractActions({ rawText });

      if (result.success && result.actions) {
        setActions(result.actions);
      } else {
        setActionsError(result.error || 'アクション抽出に失敗しました');
      }
    } catch (error) {
      console.error('Action extraction error:', error);
      setActionsError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsExtractingActions(false);
    }
  };

  const handleExecuteQA = async () => {
    setQaError(null);
    setIsExecutingQA(true);

    try {
      const result = await executeQA({ rawText, question });

      if (result.success && result.result) {
        setQaResult(result.result);
      } else {
        setQaError(result.error || 'QA処理に失敗しました');
      }
    } catch (error) {
      console.error('QA execution error:', error);
      setQaError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsExecutingQA(false);
    }
  };

  // Audio transcription handlers
  const validateAudioFile = (file: File): string | null => {
    // Type guard for allowed MIME types
    const isAllowedMimeType = (type: string): type is AllowedMimeType => {
      return (AUDIO_UPLOAD.ALLOWED_MIME_TYPES as readonly string[]).includes(type);
    };

    if (!isAllowedMimeType(file.type)) {
      return `m4a形式のファイルのみ対応しています（${AUDIO_UPLOAD.ALLOWED_MIME_TYPES.join(', ')}）`;
    }
    if (file.size > AUDIO_UPLOAD.MAX_FILE_SIZE) {
      return 'ファイルサイズは20MB以下にしてください';
    }
    return null;
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranscriptionError(null);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setAudioFile(null);
      return;
    }

    const validationError = validateAudioFile(selectedFile);
    if (validationError) {
      setTranscriptionError(validationError);
      setAudioFile(null);
      return;
    }

    setAudioFile(selectedFile);
  };

  const handleTranscribe = async () => {
    // Login check (also checked at UI layer)
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!audioFile) {
      setTranscriptionError('音声ファイルを選択してください');
      return;
    }

    setTranscriptionError(null);
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);

      const result = (await transcribeAudio(formData)) as TranscribeAudioResult;

      if (result.success && result.transcript) {
        // Set the transcription result to rawText
        setRawText(result.transcript);
        // Clear the audio file
        setAudioFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setTranscriptionError(result.error || '文字起こしに失敗しました');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsTranscribing(false);
    }
  };

  const charCount = rawText.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="sample-meeting-area">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">サンプル議事録</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          サンプル議事録が入力されています。自由に編集できます。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="raw-text-input">議事録テキスト</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertSample}
              type="button"
            >
              サンプル議事録を挿入
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              type="button"
            >
              クリア
            </Button>
          </div>
        </div>

        <textarea
          id="raw-text-input"
          name="rawText"
          aria-label="議事録テキスト入力欄"
          className="w-full h-96 p-4 border rounded-md font-mono text-sm"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />

        <div className="mt-2 flex justify-between items-center text-sm">
          <span
            className={`${
              isOverLimit
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            文字数: {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
          {isOverLimit && (
            <span className="text-red-600 dark:text-red-400 font-semibold">
              ⚠️ 30,000文字を超えています
            </span>
          )}
        </div>
      </div>

      {/* 音声文字起こしセクション（ログイン後のみ表示） */}
      {!isCheckingAuth && isAuthenticated && (
        <div className="mb-6 border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">音声から文字起こし</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            音声ファイル（m4a形式、20MB以下）をアップロードして、自動的にテキストに変換できます。
          </p>

          <div className="mb-4">
            <Label htmlFor="audio-file-input" className="block mb-2">
              音声ファイルを選択
            </Label>
            <input
              ref={fileInputRef}
              id="audio-file-input"
              type="file"
              accept="audio/mp4,.m4a"
              onChange={handleAudioFileChange}
              disabled={isTranscribing}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {audioFile && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                選択中: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button
            onClick={handleTranscribe}
            disabled={!audioFile || isTranscribing}
            className="w-full"
          >
            {isTranscribing ? '文字起こし中...' : '文字起こし実行'}
          </Button>

          {isTranscribing && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                文字起こし中... しばらくお待ちください
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                ⚠️ 文字起こしには時間がかかる場合があります（1分の音声で約10-20秒）
              </p>
            </div>
          )}

          {transcriptionError && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-900 dark:text-red-100">
                {transcriptionError}
              </p>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 文字起こし結果は上の「議事録テキスト」欄に自動的に挿入されます。結果を確認後、必要に応じて編集してください。
            </p>
          </div>
        </div>
      )}

      {/* 未ログイン時の案内メッセージ */}
      {!isCheckingAuth && !isAuthenticated && (
        <div className="mb-6 border rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-semibold mb-2">音声文字起こし機能</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            音声ファイルから自動的にテキストを生成する機能は、ログイン後にご利用いただけます。
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/auth/login')}
            className="w-full"
          >
            ログインして音声文字起こしを利用する
          </Button>
        </div>
      )}

      {/* AI実行ボタンエリア */}
      <AiControls
        rawText={rawText}
        isOverLimit={isOverLimit}
        isGeneratingSummary={isGeneratingSummary}
        onGenerateSummary={handleGenerateSummary}
        isExtractingActions={isExtractingActions}
        onExtractActions={handleExtractActions}
        question={question}
        onQuestionChange={setQuestion}
        isExecutingQA={isExecutingQA}
        onExecuteQA={handleExecuteQA}
      />

      {/* AI結果表示エリア */}
      <SummaryResult summary={summary} error={summaryError} />

      <ActionsResult actions={actions} error={actionsError} />

      <QAResultDisplay result={qaResult} error={qaError} />

      {/* 保存ボタンエリア */}
      <div className="flex justify-end gap-4">
        <SaveButton rawText={rawText} summary={summary} actions={actions} />
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>このアプリについて：</strong>
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
          <li>AI機能はボタンを押すと実行されます（自動では実行されません）</li>
          <li>このアプリは入力テキスト（raw_text）を元にAI処理します</li>
          <li>保存・共有・検索・音声アップロードはログイン後に利用できます</li>
          <li>AIは入力テキストにない内容を創作しません</li>
        </ul>
      </div>
    </div>
  );
}
