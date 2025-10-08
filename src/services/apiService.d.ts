// src/services/apiService.d.ts
export interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean; // include Authorization header
}

export interface LoginResponseData {
  success: boolean;
  token: string;
  user: { email: string; role: 'user' | 'admin' };
  error?: string; // optional error message returned by API
}

declare const apiService: {
  get<T = any>(path: string, opts?: RequestOptions): Promise<T>;
  post<T = any>(path: string, body?: any, opts?: RequestOptions): Promise<T>;
  put<T = any>(path: string, body?: any, opts?: RequestOptions): Promise<T>;
  del<T = any>(path: string, opts?: RequestOptions): Promise<T>;

  // matches how App.tsx uses it
  login(email: string, password: string): Promise<{ data: LoginResponseData }>;

  // optional namespaces; keep as any if not using
  auth?: any;
  admin?: any;
  picks?: any;
};

export default apiService;


// src/services/authService.d.ts
export type Role = 'user' | 'admin';

export interface AuthUser {
  email: string;
  role: Role;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token?: string | null;
  expiresAt?: number | null;
}

declare const authService: {
  initializeAuth(): AuthState;

  // Your current call style: saveSession(token, user)
  saveSession(token: string, user: AuthUser): void;

  // Also support object form if you later switch to it
  saveSession(session: { token: string; user: AuthUser; expiresAt?: number | null }): void;

  clearSession(): void;
};

export default authService;

