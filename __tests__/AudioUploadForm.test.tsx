import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioUploadForm from '@/components/audio-upload-form';

// Mock Next.js useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock Server Action
const mockUploadAudio = jest.fn();
const mockTranscribeAudio = jest.fn();
jest.mock('@/app/protected/minutes/[id]/actions', () => ({
  uploadAudio: (...args: unknown[]) => mockUploadAudio(...args),
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
}));

describe('AudioUploadForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('音声アップロードフォームが表示される', () => {
    render(<AudioUploadForm minuteId="test-minute-id" />);

    expect(screen.getByText(/音声アップロード/i)).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  test('許可外形式（mp3）はエラーメッセージが表示される', async () => {
    render(<AudioUploadForm minuteId="test-minute-id" />);

    const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/m4a形式のファイルのみ/i)).toBeInTheDocument();
    });
  });

  test('サイズ超過（20MB超）はエラーメッセージが表示される', async () => {
    render(<AudioUploadForm minuteId="test-minute-id" />);

    const largeFile = new File(
      [new ArrayBuffer(21 * 1024 * 1024)],
      'test.m4a',
      { type: 'audio/mp4' }
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/ファイルサイズは20MB以下にしてください/i)).toBeInTheDocument();
    });
  });

  test('20MB以内のm4aファイルがアップロードできる', async () => {
    mockUploadAudio.mockResolvedValue({ success: true });
    render(<AudioUploadForm minuteId="test-minute-id" />);

    const validFile = new File(
      [new ArrayBuffer(10 * 1024 * 1024)],
      'test.m4a',
      { type: 'audio/mp4' }
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /アップロード/i });

    fireEvent.change(input, { target: { files: [validFile] } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUploadAudio).toHaveBeenCalled();
    });
  });

  test('アップロード成功時に成功メッセージが表示される', async () => {
    mockUploadAudio.mockResolvedValue({ success: true });
    render(<AudioUploadForm minuteId="test-minute-id" />);

    const validFile = new File(
      [new ArrayBuffer(1 * 1024 * 1024)],
      'test.m4a',
      { type: 'audio/mp4' }
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /アップロード/i });

    fireEvent.change(input, { target: { files: [validFile] } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/アップロードが完了しました/i)).toBeInTheDocument();
    });
  });

  test('アップロード失敗時にエラーメッセージが表示される', async () => {
    mockUploadAudio.mockResolvedValue({
      success: false,
      error: 'アップロードに失敗しました'
    });
    render(<AudioUploadForm minuteId="test-minute-id" />);

    const validFile = new File(
      [new ArrayBuffer(1 * 1024 * 1024)],
      'test.m4a',
      { type: 'audio/mp4' }
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /アップロード/i });

    fireEvent.change(input, { target: { files: [validFile] } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/アップロードに失敗しました/i)).toBeInTheDocument();
    });
  });

  test('文字起こしチェックボックスが表示される', () => {
    render(<AudioUploadForm minuteId="test-minute-id" />);

    const checkbox = screen.getByLabelText(/文字起こしを実行/i);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test('文字起こしをONにしてアップロードすると文字起こしが実行される', async () => {
    mockUploadAudio.mockResolvedValue({ success: true, filePath: 'test/path.m4a' });
    mockTranscribeAudio.mockResolvedValue({ success: true, transcript: 'テスト文字起こし' });
    render(<AudioUploadForm minuteId="test-minute-id" />);

    const validFile = new File(
      [new ArrayBuffer(1 * 1024 * 1024)],
      'test.m4a',
      { type: 'audio/mp4' }
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const checkbox = screen.getByLabelText(/文字起こしを実行/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /アップロード/i });

    fireEvent.change(input, { target: { files: [validFile] } });
    fireEvent.click(checkbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUploadAudio).toHaveBeenCalled();
      expect(mockTranscribeAudio).toHaveBeenCalled();
    });
  });

  test('文字起こし失敗時にエラーメッセージが表示される', async () => {
    mockUploadAudio.mockResolvedValue({ success: true, filePath: 'test/path.m4a' });
    mockTranscribeAudio.mockResolvedValue({
      success: false,
      error: '文字起こしに失敗しました'
    });
    render(<AudioUploadForm minuteId="test-minute-id" />);

    const validFile = new File(
      [new ArrayBuffer(1 * 1024 * 1024)],
      'test.m4a',
      { type: 'audio/mp4' }
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const checkbox = screen.getByLabelText(/文字起こしを実行/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /アップロード/i });

    fireEvent.change(input, { target: { files: [validFile] } });
    fireEvent.click(checkbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/文字起こしに失敗しました/i)).toBeInTheDocument();
    });
  });
});
