import '@testing-library/jest-dom';

// Note: These tests are designed to verify the component structure.
// Since MinuteDetailPage is a Server Component, testing it requires special setup.
// For now, we test the expected behavior through component contracts.

describe('MinuteDetailPage', () => {
  test('音声アップロードフォームコンポーネントが存在する', async () => {
    // Verify that the AudioUploadForm component is importable
    const AudioUploadForm = (await import('@/components/audio-upload-form')).default;
    expect(AudioUploadForm).toBeDefined();
  });

  test('議事録詳細ページコンポーネントが存在する', async () => {
    // Verify that the page component exists
    const MinuteDetailPage = (await import('@/app/protected/minutes/[id]/page')).default;
    expect(MinuteDetailPage).toBeDefined();
  });

  test('Server Actionが正しくエクスポートされている', async () => {
    const { uploadAudio } = await import('@/app/protected/minutes/[id]/actions');
    expect(uploadAudio).toBeDefined();
    expect(typeof uploadAudio).toBe('function');
  });
});
