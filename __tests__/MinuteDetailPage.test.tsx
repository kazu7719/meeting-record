import '@testing-library/jest-dom';

// Note: These tests are designed to verify the component structure.
// Since MinuteDetailPage is a Server Component, testing it requires special setup.
// For now, we test the expected behavior through component contracts.

describe('MinuteDetailPage', () => {
  test('議事録詳細ページコンポーネントが存在する', async () => {
    // Verify that the page component exists
    const MinuteDetailPage = (await import('@/app/protected/minutes/[id]/page')).default;
    expect(MinuteDetailPage).toBeDefined();
  });

  test('AI機能コンポーネントが存在する', async () => {
    // Verify that the MinuteDetailAI component is importable
    const { MinuteDetailAI } = await import('@/components/minute-detail-ai');
    expect(MinuteDetailAI).toBeDefined();
  });
});
