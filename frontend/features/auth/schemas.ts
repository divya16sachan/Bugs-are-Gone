import { z } from "zod";

/**
 * If you have a shared contracts package (packages/contracts), import these
 * schemas from there instead, so the frontend and backend validate with the
 * exact same rules. Defined locally here so UI work isn't blocked on it.
 */

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Za-z]/, "Must contain a letter")
  .regex(/[0-9]/, "Must contain a number");

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(false),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    role: z.enum(["customer", "seller"]).default("customer"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

// Reset lives on its own page (/reset-password?token=...). Included so the pair
// is ready when you build that page next.
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---- API response shapes (align these with your backend / contracts) ----
export type Role = "customer" | "seller" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
export interface MessageResponse {
  message: string;
}
