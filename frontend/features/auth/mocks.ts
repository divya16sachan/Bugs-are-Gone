import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  AuthResponse,
  MessageResponse,
} from "./schemas";

// Toggle with NEXT_PUBLIC_USE_MOCKS=1 so the UI runs with no backend.
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockLogin(input: LoginInput): Promise<AuthResponse> {
  await delay(800);
  // Use these to exercise the error UI:
  if (input.email === "fail@test.com" || input.password === "wrongpass") {
    throw new Error("Invalid email or password");
  }
  return {
    user: { id: "u_1", name: "Test User", email: input.email, role: "customer" },
    accessToken: "mock.access.token",
  };
}

export async function mockRegister(input: RegisterInput): Promise<AuthResponse> {
  await delay(800);
  if (input.email === "taken@test.com") {
    throw new Error("An account with this email already exists");
  }
  return {
    user: { id: "u_2", name: input.name, email: input.email, role: input.role },
    accessToken: "mock.access.token",
  };
}

export async function mockForgotPassword(
  _input: ForgotPasswordInput
): Promise<MessageResponse> {
  await delay(800);
  return { message: "If an account exists, a reset link has been sent." };
}
