// Test helpers and utilities
// これはRailsのspec/support/に相当します

/**
 * テストデータを作成するヘルパー関数
 * FactoryBotのbuild/createに相当
 */
export const buildMeeting = (overrides = {}) => {
  return {
    id: '1',
    title: 'Test Meeting',
    date: '2025-12-19',
    participants: ['User 1', 'User 2'],
    notes: 'Test notes',
    ...overrides,
  }
}

export const buildUser = (overrides = {}) => {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  }
}

/**
 * カスタムマッチャー（Shoulda-matchersに相当）
 */
export const customMatchers = {
  toHaveValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = emailRegex.test(received)

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
    }
  },
}
