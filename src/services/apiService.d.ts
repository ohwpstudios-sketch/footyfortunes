// src/services/apiService.d.ts
export interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean; // include Authorization header
}

declare const apiService: {
  get<T = any>(path: string, opts?: RequestOptions): Promise<T>;
  post<T = any>(path: string, body?: any, opts?: RequestOptions): Promise<T>;
  put<T = any>(path: string, body?: any, opts?: RequestOptions): Promise<T>;
  del<T = any>(path: string, opts?: RequestOptions): Promise<T>;

  // (Optional) namespaced helpers if your real file exports them
  auth?: {
    login?(email: string, password: string): Promise<{ success: boolean; token: string; user: { email: string; role: 'user' | 'admin' } }>;
  };
  admin?: any;
  picks?: any;
};

export default apiService;
