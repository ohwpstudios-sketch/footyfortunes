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
  saveSession(session: { token: string; user: AuthUser; expiresAt?: number | null }): void;
  clearSession(): void;
};

export default authService;
