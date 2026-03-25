import { describe, it, expect } from 'vitest';
import { AppError } from './app-error';

describe('AppError', () => {
  it('creates a badRequest error', () => {
    const err = AppError.badRequest('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('Invalid input');
  });

  it('creates an unauthorized error', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('creates a forbidden error', () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('creates a notFound error', () => {
    const err = AppError.notFound('User not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('User not found');
  });

  it('creates a conflict error', () => {
    const err = AppError.conflict('Already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('creates an error with details', () => {
    const err = AppError.badRequest('Validation failed', { email: ['Required'] });
    expect(err.details).toEqual({ email: ['Required'] });
  });

  it('is an instance of Error', () => {
    const err = AppError.internal();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
