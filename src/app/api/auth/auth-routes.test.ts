import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

import { POST as loginPOST } from './login/route';
import { POST as signupPOST } from './signup/route';
import { POST as forgotPasswordPOST } from './forgot-password/route';

beforeEach(() => {
  mocks.signInWithPassword.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'test@example.com' } },
    error: null,
  });
  mocks.signUp.mockResolvedValue({
    data: { user: { id: 'user-456', email: 'new@example.com' } },
    error: null,
  });
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

  mocks.createClient.mockResolvedValue({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
    },
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when missing credentials', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(400);
  });

  it('signs in successfully with valid credentials', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBe('test@example.com');
  });

  it('returns 401 when invalid credentials', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/signup', () => {
  it('creates account successfully', async () => {
    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'password123',
        fullName: 'Test User',
      }),
    });
    const res = await signupPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('sends password reset successfully', async () => {
    const req = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        redirectTo: 'http://localhost:3000/reset-password',
      }),
    });
    const res = await forgotPasswordPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
