// ---------------------------------------------------------------------------
// Base HTTP client — fetch wrapper with auth, JSON parsing, error mapping
// ---------------------------------------------------------------------------

import type { ClientConfig, ErrorResponse, SuccessResponse } from '../types.js';
import { mapStatusToError, NetworkError, ParseError } from './errors.js';

/** HTTP methods supported by the client. */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Options for a single HTTP request. */
interface RequestOptions {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: unknown;
  readonly query?: Readonly<Record<string, string | number | undefined>>;
  readonly signal?: AbortSignal;
}

/** Default request timeout in milliseconds. */
const DEFAULT_TIMEOUT = 30_000;

/**
 * Low-level HTTP client for the IntelMesh API.
 * Handles authentication, serialization, and error mapping.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Executes a GET request and returns the parsed data.
   * @param path - The API path.
   * @param query - Optional query parameters.
   * @returns The response data of type T.
   */
  async get<T>(path: string, query?: RequestOptions['query']): Promise<T> {
    return this.request<T>({ method: 'GET', path, query });
  }

  /**
   * Executes a POST request and returns the parsed data.
   * @param path - The API path.
   * @param body - The request body.
   * @returns The response data of type T.
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', path, body });
  }

  /**
   * Executes a PUT request and returns the parsed data.
   * @param path - The API path.
   * @param body - The request body.
   * @returns The response data of type T.
   */
  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body });
  }

  /**
   * Executes a DELETE request and returns the parsed data.
   * @param path - The API path.
   * @returns The response data of type T.
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path });
  }

  /**
   * Builds the full URL with query parameters.
   * @param path - The API path.
   * @param query - Optional query parameters.
   * @returns The full URL string.
   */
  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  /**
   * Executes an HTTP request with timeout, auth, and error handling.
   * @param options - The request options.
   * @returns The parsed response data.
   */
  private async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.timeout);

    try {
      const response = await this.executeFetch(url, options, controller.signal);
      return await this.handleResponse<T>(response);
    } catch (error: unknown) {
      throw this.wrapError(error);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Calls fetch with the configured headers and body.
   * @param url - The full URL.
   * @param options - The request options.
   * @param signal - The abort signal.
   * @returns The fetch Response.
   */
  private async executeFetch(
    url: string,
    options: RequestOptions,
    signal: AbortSignal,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    return this.fetchFn(url, {
      method: options.method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal,
    });
  }

  /**
   * Parses the response and throws typed errors for non-2xx status.
   * @param response - The fetch Response.
   * @returns The parsed data.
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();

    if (!response.ok) {
      this.throwApiError(response.status, text);
    }

    const parsed = this.parseJson(text) as SuccessResponse<T>;
    return parsed.data;
  }

  /**
   * Parses and throws an API error from the response body.
   * @param status - The HTTP status code.
   * @param text - The raw response body.
   */
  private throwApiError(status: number, text: string): never {
    try {
      const body = JSON.parse(text) as ErrorResponse;
      throw mapStatusToError(status, body.error.message, body.error.code);
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error) throw error;
      throw mapStatusToError(status, text || `HTTP ${String(status)}`, 'UNKNOWN');
    }
  }

  /**
   * Safely parses JSON with a typed parse error.
   * @param text - The raw JSON text.
   * @returns The parsed JSON object.
   */
  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ParseError(`Failed to parse response: ${text.slice(0, 200)}`);
    }
  }

  /**
   * Wraps unexpected errors into NetworkError.
   * @param error - The caught error.
   * @returns A NetworkError or the original error.
   */
  private wrapError(error: unknown): unknown {
    if (error instanceof Error && error.name === 'AbortError') {
      return new NetworkError('Request timed out');
    }
    if (error instanceof Error && 'status' in error) {
      return error;
    }
    if (error instanceof Error) {
      return new NetworkError(error.message);
    }
    return new NetworkError('Unknown network error');
  }
}
