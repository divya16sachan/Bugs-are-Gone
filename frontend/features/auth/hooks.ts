import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import { authKeys } from "./query-keys";
import { setAccessToken } from "@/lib/api-client";
import type { AuthResponse } from "./schemas";

// The only API surface the components touch. Redirects/toasts are handled by the
// forms (per-page concerns); these hooks own the shared side effects.
function onAuthed(
  qc: ReturnType<typeof useQueryClient>,
  data: AuthResponse
) {
  setAccessToken(data.accessToken);
  qc.invalidateQueries({ queryKey: authKeys.session() });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => onAuthed(qc, data),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => onAuthed(qc, data),
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}
