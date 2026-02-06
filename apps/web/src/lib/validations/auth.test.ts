import { describe, it, expect } from 'vitest';

import { loginSchema, registerSchema, forgotPasswordSchema } from './auth';

describe('Auth Validations', () => {
  describe('loginSchema', () => {
    it('should validate valid login input', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty fields', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration input', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid username format', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'test user!',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123',
        confirmPassword: 'Password456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
        confirmPassword: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short username', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'ab',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});
