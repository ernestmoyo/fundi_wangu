import type { ApiResponse, ApiError } from '@fundi-wangu/shared-types';

export interface ClientConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  onTokenRefreshed: (accessToken: string, refreshToken: string) => Promise<void>;
  onAuthError: () => void;
  getLanguage: () => string;
}

/**
 * Base HTTP client for Fundi Wangu API.
 * Handles authentication, token refresh, bilingual errors, and idempotency.
 */
export class FundiWanguClient {
  private config: ClientConfig;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  /** Make an authenticated GET request */
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url);
  }

  /** Make an authenticated POST request */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', this.buildUrl(path), body);
  }

  /** Make an authenticated PATCH request */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', this.buildUrl(path), body);
  }

  /** Make an authenticated DELETE request */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', this.buildUrl(path));
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.config.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async request<T>(method: string, url: string, body?: unknown, isRetry = false): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Language': this.config.getLanguage(),
    };

    const token = await this.config.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Idempotency key for mutating requests
    if (method === 'POST' || method === 'PATCH') {
      headers['X-Idempotency-Key'] = crypto.randomUUID();
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 — attempt token refresh
    if (response.status === 401 && !isRetry) {
      const refreshed = await this.attemptTokenRefresh();
      if (refreshed) {
        return this.request<T>(method, url, body, true);
      }
      this.config.onAuthError();
      throw new ApiClientError(401, 'Session expired', 'Kipindi kimeisha', 'TOKEN_EXPIRED');
    }

    const data = await response.json() as ApiResponse<T>;

    if (!response.ok || !data.success) {
      const error = data.error as ApiError | null;
      const lang = this.config.getLanguage();
      throw new ApiClientError(
        error?.status ?? response.status,
        error?.message_en ?? 'An error occurred',
        error?.message_sw ?? 'Hitilafu imetokea',
        error?.code ?? 'UNKNOWN_ERROR',
      );
    }

    return data.data as T;
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise ?? Promise.resolve(false);
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const refreshToken = await this.config.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.config.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json() as ApiResponse<{
        access_token: string;
        refresh_token: string;
      }>;

      if (!data.success || !data.data) return false;

      await this.config.onTokenRefreshed(data.data.access_token, data.data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }
}

/** Typed API error with bilingual messages */
export class ApiClientError extends Error {
  constructor(
    public status: number,
    public messageEn: string,
    public messageSw: string,
    public code: string,
  ) {
    super(messageEn);
    this.name = 'ApiClientError';
  }

  /** Get localized message */
  getLocalizedMessage(lang: string): string {
    return lang === 'sw' ? this.messageSw : this.messageEn;
  }
}
