// ---------------------------------------------------------------------------
// Typed error hierarchy for IntelMesh API responses
// ---------------------------------------------------------------------------

/** Base error for all IntelMesh SDK errors. */
export class IntelMeshError extends Error {
  /** HTTP status code, if applicable. */
  readonly status: number;
  /** Machine-readable error code from the API. */
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'IntelMeshError';
    this.status = status;
    this.code = code;
  }
}

/** 400 — The request was malformed or invalid. */
export class ValidationError extends IntelMeshError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, 400, code);
    this.name = 'ValidationError';
  }
}

/** 404 — The requested resource was not found. */
export class NotFoundError extends IntelMeshError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, 404, code);
    this.name = 'NotFoundError';
  }
}

/** 401 — Authentication failed or missing. */
export class UnauthorizedError extends IntelMeshError {
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message, 401, code);
    this.name = 'UnauthorizedError';
  }
}

/** 403 — Authenticated but insufficient permissions. */
export class ForbiddenError extends IntelMeshError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(message, 403, code);
    this.name = 'ForbiddenError';
  }
}

/** 500 — Internal server error. */
export class InternalError extends IntelMeshError {
  constructor(message: string, code = 'INTERNAL_ERROR') {
    super(message, 500, code);
    this.name = 'InternalError';
  }
}

/** 503 — Service temporarily unavailable. */
export class UnavailableError extends IntelMeshError {
  constructor(message: string, code = 'UNAVAILABLE') {
    super(message, 503, code);
    this.name = 'UnavailableError';
  }
}

/** Network-level failure (no HTTP response received). */
export class NetworkError extends IntelMeshError {
  constructor(message: string) {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/** Failed to parse the API response body. */
export class ParseError extends IntelMeshError {
  constructor(message: string) {
    super(message, 0, 'PARSE_ERROR');
    this.name = 'ParseError';
  }
}

// ---------------------------------------------------------------------------
// Type guard helpers
// ---------------------------------------------------------------------------

/**
 * Checks if an error is a NotFoundError.
 * @param error - The error to check.
 * @returns True if the error is a NotFoundError.
 */
export function isNotFound(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Checks if an error is a ValidationError.
 * @param error - The error to check.
 * @returns True if the error is a ValidationError.
 */
export function isValidation(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Checks if an error is an UnauthorizedError.
 * @param error - The error to check.
 * @returns True if the error is an UnauthorizedError.
 */
export function isUnauthorized(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

/**
 * Checks if an error is a ForbiddenError.
 * @param error - The error to check.
 * @returns True if the error is a ForbiddenError.
 */
export function isForbidden(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

/**
 * Checks if an error is a NetworkError.
 * @param error - The error to check.
 * @returns True if the error is a NetworkError.
 */
export function isNetwork(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Checks if an error is any IntelMeshError.
 * @param error - The error to check.
 * @returns True if the error is an IntelMeshError.
 */
export function isIntelMeshError(error: unknown): error is IntelMeshError {
  return error instanceof IntelMeshError;
}

// ---------------------------------------------------------------------------
// Status code to error mapping
// ---------------------------------------------------------------------------

/**
 * Maps an HTTP status code and error body to a typed error.
 * @param status - The HTTP status code.
 * @param message - The error message from the API.
 * @param code - The machine-readable error code from the API.
 * @returns The appropriate typed error instance.
 */
export function mapStatusToError(status: number, message: string, code: string): IntelMeshError {
  switch (status) {
    case 400:
      return new ValidationError(message, code);
    case 401:
      return new UnauthorizedError(message, code);
    case 403:
      return new ForbiddenError(message, code);
    case 404:
      return new NotFoundError(message, code);
    case 503:
      return new UnavailableError(message, code);
    default:
      if (status >= 500) {
        return new InternalError(message, code);
      }
      return new IntelMeshError(message, status, code);
  }
}
