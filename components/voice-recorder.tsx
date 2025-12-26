'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

// Web Speech API の型定義（ブラウザ API のため、ここで定義）
export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

export interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'aborted' | 'service-not-allowed';
  message: string;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void;
}

export default function VoiceRecorder({ onTranscriptChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptBufferRef = useRef<string>('');

  // ブラウザ互換性チェック
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        setError('お使いのブラウザは音声認識に対応していません。Chrome、Edge、Safariをご利用ください。');
      }
    }
  }, []);

  const startRecording = () => {
    if (typeof window === 'undefined' || !isSupported) return;

    setError(null);
    setTranscript('');
    transcriptBufferRef.current = '';

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('お使いのブラウザは音声認識に対応していません。');
        return;
      }
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        // finalTranscript を buffer に蓄積
        if (finalTranscript) {
          transcriptBufferRef.current += finalTranscript;
        }

        // 表示用: buffer + 暫定テキスト
        const currentTranscript = transcriptBufferRef.current + interimTranscript;
        setTranscript(currentTranscript);
        onTranscriptChange(currentTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError('音声が検出されませんでした。もう一度お試しください。');
        } else if (event.error === 'audio-capture') {
          setError('マイクにアクセスできません。ブラウザの権限設定を確認してください。');
        } else if (event.error === 'not-allowed') {
          setError('マイクの使用が許可されていません。ブラウザの設定で許可してください。');
        } else {
          setError(`音声認識エラーが発生しました: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('録音の開始に失敗しました。');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // 停止時に最終的なバッファ内容を確定
    setTranscript(transcriptBufferRef.current);
    onTranscriptChange(transcriptBufferRef.current);
    setIsRecording(false);
  };

  if (!isSupported) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
          音声認識非対応
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          お使いのブラウザは音声認識に対応していません。Chrome、Edge、Safariをご利用ください。
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">音声から文字起こし（リアルタイム録音）</h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        マイクボタンを押して、会議内容を話してください。自動的にテキストに変換されます。
      </p>

      <div className="mb-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Mic className="mr-2 h-4 w-4" />
            録音開始
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          >
            <Square className="mr-2 h-4 w-4" />
            録音停止
          </Button>
        )}
      </div>

      {isRecording && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <p className="text-sm text-red-900 dark:text-red-100 font-semibold">
              録音中...
            </p>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            録音を停止するまで、音声を認識し続けます
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-sm text-red-900 dark:text-red-100">
            {error}
          </p>
        </div>
      )}

      {transcript && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">認識中のテキスト</h4>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md max-h-64 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{transcript}</p>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          💡 録音を停止すると、認識されたテキストが上の「議事録テキスト」欄に自動的に挿入されます。
        </p>
        <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
          ⚠️ 初回使用時、ブラウザからマイクの使用許可を求められます。「許可」を選択してください。
        </p>
      </div>
    </div>
  );
}
