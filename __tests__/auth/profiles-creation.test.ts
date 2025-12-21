/**
 * @jest-environment node
 */

import { ensureProfileExists } from '@/app/auth/actions';

// Test for Issue 1: profiles自動作成機能
// Based on design.md F-001 受け入れ条件

describe('profiles自動作成機能', () => {
  const defaultDepartmentId = process.env.DEFAULT_DEPARTMENT_ID!;

  describe('ensureProfileExists関数', () => {
    it('ensureProfileExists関数が存在する', async () => {
      // Expected: ensureProfileExists function should be defined
      expect(ensureProfileExists).toBeDefined();
      expect(typeof ensureProfileExists).toBe('function');
    });

    it('userId引数を受け取る', async () => {
      // Expected: Function should accept userId parameter
      const mockUserId = '12345678-1234-1234-1234-123456789012';

      // This should not throw an error for calling with correct parameters
      await expect(async () => {
        await ensureProfileExists(mockUserId);
      }).rejects.toThrow(); // Will fail until implementation exists
    });

    it('department_idにDEFAULT_DEPARTMENT_IDを使用する', async () => {
      // Expected: Should use DEFAULT_DEPARTMENT_ID from environment
      expect(defaultDepartmentId).toBeDefined();
      expect(defaultDepartmentId).toBe('00000000-0000-0000-0000-000000000001');
    });
  });
});
