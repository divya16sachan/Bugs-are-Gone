import { apiClient } from "@/lib/api-client";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  AuthResponse,
  AuthUser,
  MessageResponse,
} from "./schemas";
import { USE_MOCKS, mockLogin, mockRegister, mockForgotPassword } from "./mocks";

// Fetchers only — no React here. Endpoints go through the gateway (/api/v1/auth/*)
export const authApi = {
  login: (input: LoginInput): Promise<AuthResponse> =>
    USE_MOCKS
      ? mockLogin(input)
      : apiClient.post<AuthResponse>("/api/v1/auth/login", input),

  register: (input: RegisterInput): Promise<AuthResponse> => {
    if (USE_MOCKS) return mockRegister(input);
    const { confirmPassword, ...payload } = input;
    return apiClient.post<AuthResponse>("/api/v1/auth/signup", payload);
  },

  forgotPassword: (input: ForgotPasswordInput): Promise<MessageResponse> =>
    USE_MOCKS
      ? mockForgotPassword(input)
      : apiClient.post<MessageResponse>("/api/v1/auth/forgot-password", input),

  checkAuth: (): Promise<AuthUser> => apiClient.get<AuthUser>("/api/v1/auth/check"),
  getMe: (): Promise<AuthUser> => apiClient.get<AuthUser>("/api/v1/users/me"),
};
