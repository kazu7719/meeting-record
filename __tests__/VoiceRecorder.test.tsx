import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceRecorder, {
  type SpeechRecognitionEvent,
  type SpeechRecognitionErrorEvent,
  type SpeechRecognitionConstructor,
  type SpeechRecognitionResultList,
} from '@/components/voice-recorder';

// Mock Web Speech API
const mockRecognition = {
  continuous: false,
  interimResults: false,
  lang: '',
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null as ((event: SpeechRecognitionEvent) => void) | null,
  onerror: null as ((event: SpeechRecognitionErrorEvent) => void) | null,
  onend: null as (() => void) | null,
};

describe('VoiceRecorder', () => {
  let originalSpeechRecognition: SpeechRecognitionConstructor | undefined;

  beforeEach(() => {
    // Save original
    originalSpeechRecognition = (global as typeof globalThis & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition;

    // Mock SpeechRecognition
    (global as typeof globalThis & { SpeechRecognition: SpeechRecognitionConstructor; webkitSpeechRecognition: SpeechRecognitionConstructor }).SpeechRecognition = jest.fn(() => mockRecognition) as unknown as SpeechRecognitionConstructor;
    (global as typeof globalThis & { webkitSpeechRecognition: SpeechRecognitionConstructor }).webkitSpeechRecognition = jest.fn(() => mockRecognition) as unknown as SpeechRecognitionConstructor;

    // Reset mock
    jest.clearAllMocks();
    mockRecognition.start.mockClear();
    mockRecognition.stop.mockClear();
  });

  afterEach(() => {
    // Restore original
    (global as typeof globalThis & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition = originalSpeechRecognition;
  });

  test('録音開始ボタンが表示される', () => {
    const mockOnTranscriptChange = jest.fn();
    render(<VoiceRecorder onTranscriptChange={mockOnTranscriptChange} />);

    expect(screen.getByText('録音開始')).toBeInTheDocument();
  });

  test('録音開始後、録音中状態になる', async () => {
    const mockOnTranscriptChange = jest.fn();
    render(<VoiceRecorder onTranscriptChange={mockOnTranscriptChange} />);

    const startButton = screen.getByText('録音開始');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockRecognition.start).toHaveBeenCalled();
      expect(screen.getByText('録音停止')).toBeInTheDocument();
      expect(screen.getByText('録音中...')).toBeInTheDocument();
    });
  });

  test('録音停止後、録音が停止する', async () => {
    const mockOnTranscriptChange = jest.fn();
    render(<VoiceRecorder onTranscriptChange={mockOnTranscriptChange} />);

    // Start recording
    const startButton = screen.getByText('録音開始');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('録音停止')).toBeInTheDocument();
    });

    // Stop recording
    const stopButton = screen.getByText('録音停止');
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockRecognition.stop).toHaveBeenCalled();
    });
  });

  test('音声認識結果がonTranscriptChangeに渡される', async () => {
    const mockOnTranscriptChange = jest.fn();
    render(<VoiceRecorder onTranscriptChange={mockOnTranscriptChange} />);

    // Start recording
    const startButton = screen.getByText('録音開始');
    fireEvent.click(startButton);

    // Wait for recognition to be initialized
    await waitFor(() => {
      expect(mockRecognition.start).toHaveBeenCalled();
    });

    // Simulate recognition result
    const mockEvent: SpeechRecognitionEvent = {
      results: [
        [{ transcript: 'こんにちは', confidence: 1.0 }],
      ] as unknown as SpeechRecognitionResultList,
      resultIndex: 0,
    } as SpeechRecognitionEvent;

    // Set isFinal property
    (mockEvent.results[0] as { isFinal: boolean }).isFinal = true;

    // Trigger onresult handler
    if (mockRecognition.onresult) {
      mockRecognition.onresult(mockEvent);
    }

    // Check if callback was called
    await waitFor(() => {
      expect(mockOnTranscriptChange).toHaveBeenCalled();
    });

    // Verify the transcript contains the expected text
    expect(mockOnTranscriptChange).toHaveBeenCalledWith(expect.stringContaining('こんにちは'));
  });

  test('ブラウザが Web Speech API 非対応の場合、エラーメッセージが表示される', () => {
    // Remove SpeechRecognition support
    delete (global as typeof globalThis & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition;
    delete (global as typeof globalThis & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    const mockOnTranscriptChange = jest.fn();
    render(<VoiceRecorder onTranscriptChange={mockOnTranscriptChange} />);

    expect(screen.getByText('音声認識非対応')).toBeInTheDocument();
    expect(
      screen.getByText(/お使いのブラウザは音声認識に対応していません/)
    ).toBeInTheDocument();
  });
});
