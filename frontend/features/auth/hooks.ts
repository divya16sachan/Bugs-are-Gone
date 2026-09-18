import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import { authKeys } from "./query-keys";
import { getAccessToken, setAccessToken } from "@/lib/api-client";
import type { AuthResponse, AuthUser } from "./schemas";

// The only API surface the components touch. Redirects/toasts are handled by the
// forms (per-page concerns); these hooks own the shared side effects.
function onAuthed(
  qc: ReturnType<typeof useQueryClient>,
  data: AuthResponse
) {
  setAccessToken(data.accessToken);
  qc.setQueryData(authKeys.session(), data.user);
  qc.invalidateQueries({ queryKey: authKeys.session() });
}

export function useSession() {
  const token = typeof window !== "undefined" ? getAccessToken() : null;
  return useQuery<AuthUser | null>({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const currentToken = getAccessToken();
      if (!currentToken) return null;
      try {
        return await authApi.checkAuth();
      } catch (err: any) {
        // Only reset token if backend explicitly returns 401 Unauthorized
        if (err?.status === 401 || err?.statusCode === 401) {
          setAccessToken(null);
        }
        return null;
      }
    },
    enabled: typeof window !== "undefined" && !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return () => {
    setAccessToken(null);
    qc.setQueryData(authKeys.session(), null);
    qc.invalidateQueries({ queryKey: authKeys.session() });
  };
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
