interface RequestConfig extends RequestInit {
  baseURL?: string;
  timeout?: number;
}

const defaultConfig: RequestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
};

class Request {
  constructor(config: RequestConfig) {
    this.config = config;
  }

  private readonly config: RequestConfig;

  private async request<T>(
    url: string,
    init: RequestInit = {},
    config?: RequestConfig,
  ): Promise<T> {
    const token = localStorage.getItem('token');
    const headers = new Headers(this.config.headers);

    if (config?.headers) {
      new Headers(config.headers).forEach((value, key) => headers.set(key, value));
    }

    if (init.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      config?.timeout ?? this.config.timeout ?? 10000,
    );

    try {
      const response = await fetch(`${config?.baseURL ?? this.config.baseURL ?? ''}${url}`, {
        ...this.config,
        ...config,
        ...init,
        headers,
        signal: controller.signal,
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { method: 'GET' }, config);
  }

  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(
      url,
      {
        method: 'POST',
        body: data === undefined ? undefined : JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      },
      config,
    );
  }

  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(
      url,
      {
        method: 'PUT',
        body: data === undefined ? undefined : JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      },
      config,
    );
  }

  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' }, config);
  }

  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(
      url,
      {
        method: 'PATCH',
        body: data === undefined ? undefined : JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      },
      config,
    );
  }
}

const request = new Request(defaultConfig);

export default request;
