import { apiClient } from "@/lib/api-client";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  AuthResponse,
  MessageResponse,
} from "./schemas";
import { USE_MOCKS, mockLogin, mockRegister, mockForgotPassword } from "./mocks";

// Fetchers only — no React here. Endpoints go through the gateway; adjust paths
// to match your backend routes.
export const authApi = {
  login: (input: LoginInput): Promise<AuthResponse> =>
    USE_MOCKS ? mockLogin(input) : apiClient.post<AuthResponse>("/auth/login", input),

  register: (input: RegisterInput): Promise<AuthResponse> =>
    USE_MOCKS
      ? mockRegister(input)
      : apiClient.post<AuthResponse>("/auth/register", input),

  forgotPassword: (input: ForgotPasswordInput): Promise<MessageResponse> =>
    USE_MOCKS
      ? mockForgotPassword(input)
      : apiClient.post<MessageResponse>("/auth/forgot-password", input),
};
