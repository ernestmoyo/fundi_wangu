import { useMutation, useQuery } from '@tanstack/react-query';
import { api, storeTokens, clearTokens, getStoredTokens } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { queryClient } from '@/config/query';

export function useRequestOtp() {
  const setOtpRequestId = useAuthStore((s) => s.setOtpRequestId);

  return useMutation({
    mutationFn: (phone: string) => api.auth.requestOtp(phone),
    onSuccess: (data) => {
      if (data.data) {
        setOtpRequestId(data.data.requestId ?? null);
      }
    },
  });
}

export function useVerifyOtp() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (params: { phone: string; code: string }) =>
      api.auth.verifyOtp(params.phone, params.code),
    onSuccess: async (data) => {
      if (data.data) {
        const { accessToken, refreshToken, user } = data.data;
        await storeTokens(accessToken, refreshToken);
        setUser(user);
      }
    },
  });
}

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const tokens = await getStoredTokens();
      if (!tokens) {
        setLoading(false);
        return null;
      }
      const res = await api.users.getMe();
      if (res.data) {
        setUser(res.data);
      }
      return res.data;
    },
    retry: false,
    staleTime: Infinity,
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: async () => {
      await clearTokens();
      logout();
      queryClient.clear();
    },
  });
}
