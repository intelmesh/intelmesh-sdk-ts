import { describe, expect, it } from 'vitest';
import {
  ForbiddenError,
  IntelMeshError,
  InternalError,
  isForbidden,
  isIntelMeshError,
  isNetwork,
  isNotFound,
  isUnauthorized,
  isValidation,
  mapStatusToError,
  NetworkError,
  NotFoundError,
  ParseError,
  UnavailableError,
  UnauthorizedError,
  ValidationError,
} from '../../src/client/errors.js';

describe('IntelMeshError', () => {
  it('stores status, code, and message', () => {
    const err = new IntelMeshError('test', 500, 'ERR');
    expect(err.message).toBe('test');
    expect(err.status).toBe(500);
    expect(err.code).toBe('ERR');
    expect(err.name).toBe('IntelMeshError');
  });

  it('extends Error', () => {
    const err = new IntelMeshError('test', 500, 'ERR');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('Typed error subclasses', () => {
  it('ValidationError has status 400', () => {
    const err = new ValidationError('bad input');
    expect(err.status).toBe(400);
    expect(err.name).toBe('ValidationError');
    expect(err).toBeInstanceOf(IntelMeshError);
  });

  it('NotFoundError has status 404', () => {
    const err = new NotFoundError('missing');
    expect(err.status).toBe(404);
    expect(err.name).toBe('NotFoundError');
  });

  it('UnauthorizedError has status 401', () => {
    const err = new UnauthorizedError('no auth');
    expect(err.status).toBe(401);
    expect(err.name).toBe('UnauthorizedError');
  });

  it('ForbiddenError has status 403', () => {
    const err = new ForbiddenError('denied');
    expect(err.status).toBe(403);
    expect(err.name).toBe('ForbiddenError');
  });

  it('InternalError has status 500', () => {
    const err = new InternalError('boom');
    expect(err.status).toBe(500);
    expect(err.name).toBe('InternalError');
  });

  it('UnavailableError has status 503', () => {
    const err = new UnavailableError('down');
    expect(err.status).toBe(503);
    expect(err.name).toBe('UnavailableError');
  });

  it('NetworkError has status 0', () => {
    const err = new NetworkError('offline');
    expect(err.status).toBe(0);
    expect(err.code).toBe('NETWORK_ERROR');
  });

  it('ParseError has status 0', () => {
    const err = new ParseError('bad json');
    expect(err.status).toBe(0);
    expect(err.code).toBe('PARSE_ERROR');
  });
});

describe('Type guard helpers', () => {
  it('isNotFound identifies NotFoundError', () => {
    expect(isNotFound(new NotFoundError('x'))).toBe(true);
    expect(isNotFound(new ValidationError('x'))).toBe(false);
    expect(isNotFound(new Error('x'))).toBe(false);
    expect(isNotFound(null)).toBe(false);
  });

  it('isValidation identifies ValidationError', () => {
    expect(isValidation(new ValidationError('x'))).toBe(true);
    expect(isValidation(new NotFoundError('x'))).toBe(false);
  });

  it('isUnauthorized identifies UnauthorizedError', () => {
    expect(isUnauthorized(new UnauthorizedError('x'))).toBe(true);
    expect(isUnauthorized(new ForbiddenError('x'))).toBe(false);
  });

  it('isForbidden identifies ForbiddenError', () => {
    expect(isForbidden(new ForbiddenError('x'))).toBe(true);
    expect(isForbidden(new UnauthorizedError('x'))).toBe(false);
  });

  it('isNetwork identifies NetworkError', () => {
    expect(isNetwork(new NetworkError('x'))).toBe(true);
    expect(isNetwork(new ParseError('x'))).toBe(false);
  });

  it('isIntelMeshError matches all subclasses', () => {
    expect(isIntelMeshError(new ValidationError('x'))).toBe(true);
    expect(isIntelMeshError(new NetworkError('x'))).toBe(true);
    expect(isIntelMeshError(new Error('x'))).toBe(false);
  });
});

describe('mapStatusToError', () => {
  it('maps 400 to ValidationError', () => {
    const err = mapStatusToError(400, 'bad', 'INVALID');
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.code).toBe('INVALID');
  });

  it('maps 401 to UnauthorizedError', () => {
    const err = mapStatusToError(401, 'no auth', 'UNAUTH');
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  it('maps 403 to ForbiddenError', () => {
    const err = mapStatusToError(403, 'denied', 'FORBIDDEN');
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('maps 404 to NotFoundError', () => {
    const err = mapStatusToError(404, 'gone', 'MISSING');
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it('maps 503 to UnavailableError', () => {
    const err = mapStatusToError(503, 'down', 'UNAVAIL');
    expect(err).toBeInstanceOf(UnavailableError);
  });

  it('maps 502 to InternalError', () => {
    const err = mapStatusToError(502, 'gateway', 'GW');
    expect(err).toBeInstanceOf(InternalError);
  });

  it('maps unknown status to IntelMeshError', () => {
    const err = mapStatusToError(429, 'rate', 'RATE');
    expect(err).toBeInstanceOf(IntelMeshError);
    expect(err.status).toBe(429);
  });
});
