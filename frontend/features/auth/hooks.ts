import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import { authKeys } from "./query-keys";
import { setAccessToken } from "@/lib/api-client";
import { useAuthStore } from "./auth-store";
import type { AuthResponse, AuthUser } from "./schemas";

function onAuthed(
  qc: ReturnType<typeof useQueryClient>,
  data: AuthResponse
) {
  const token = data.accessToken || (data as any).token;
  useAuthStore.getState().setAuth(data.user, token);
  qc.setQueryData(authKeys.session(), data.user);
  qc.invalidateQueries({ queryKey: authKeys.all });
}

export function useSession() {
  const storeUser = useAuthStore((state) => state.user);
  const storeIsLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const query = useQuery<AuthUser | null>({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const user = await useAuthStore.getState().fetchSession();
      return user;
    },
    initialData: storeUser || undefined,
    staleTime: 60 * 1000,
    retry: false,
  });

  const effectiveUser = query.data ?? storeUser ?? null;
  const isLoading = storeIsLoading && !effectiveUser;

  return {
    ...query,
    data: effectiveUser,
    user: effectiveUser,
    isAuthenticated: isAuthenticated || !!effectiveUser,
    isLoading,
  };
}

export function useLogout() {
  const qc = useQueryClient();
  return () => {
    useAuthStore.getState().clearAuth();
    qc.setQueryData(authKeys.session(), null);
    qc.invalidateQueries({ queryKey: authKeys.all });
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

