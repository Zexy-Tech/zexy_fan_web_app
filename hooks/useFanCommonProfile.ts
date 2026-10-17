import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/hooks/useAuth';
import { commonProfileService } from '@/services/commonProfile';
import type {
  FanCommonProfile,
  UpdateCommonProfilePayload,
  MobileChangeRequest,
  MobileVerifyRequest,
  MobileVerifyResponse,
  VerifyCurrentMobileSendRequest,
  VerifyCurrentMobileVerifyRequest,
  VerifyCurrentMobileResponse,
} from '@/services/commonProfile';

export function useFanCommonProfile() {
  const { isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: ['common', 'profile'],
    queryFn: () => commonProfileService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useUpdateFanCommonProfile() {
  const queryClient = useQueryClient();
  const { user, login, token, refreshToken, sessionToken } = useAuthContext();

  return useMutation({
    mutationFn: (payload: UpdateCommonProfilePayload) => commonProfileService.updateProfile(payload),
    onSuccess: (data: FanCommonProfile) => {
      void queryClient.invalidateQueries({ queryKey: ['common', 'profile'] });
      if (user && token) {
        login(
          {
            access_token: token,
            refresh_token: refreshToken ?? undefined,
            session_token: sessionToken ?? undefined,
          },
          {
            ...user,
            name: data.name,
            username: data.username,
            mobile: data.mobile,
            avatar: data.avatar,
            has_completed_onboarding: data.has_completed_onboarding ?? user.has_completed_onboarding,
          }
        );
      }
    },
  });
}

export function useRequestMobileChange() {
  return useMutation({
    mutationFn: (payload: MobileChangeRequest) => commonProfileService.requestMobileChange(payload),
  });
}

export function useVerifyMobileChange() {
  const queryClient = useQueryClient();
  const { user, login, token, refreshToken, sessionToken } = useAuthContext();

  return useMutation({
    mutationFn: (payload: MobileVerifyRequest) => commonProfileService.verifyMobileChange(payload),
    onSuccess: (data: MobileVerifyResponse) => {
      void queryClient.invalidateQueries({ queryKey: ['common', 'profile'] });
      if (user && token) {
        login(
          {
            access_token: token,
            refresh_token: refreshToken ?? undefined,
            session_token: sessionToken ?? undefined,
          },
          {
            ...user,
            mobile: data.new_mobile,
          }
        );
      }
    },
  });
}

export function useDeleteFanCommonProfile() {
  return useMutation({
    mutationFn: () => commonProfileService.deleteProfile(),
  });
}

export function useSendCurrentMobileOtp() {
  return useMutation({
    mutationFn: (payload?: VerifyCurrentMobileSendRequest) =>
      commonProfileService.sendCurrentMobileOtp(payload),
  });
}

export function useVerifyCurrentMobileOtp() {
  return useMutation({
    mutationFn: (payload: VerifyCurrentMobileVerifyRequest) =>
      commonProfileService.verifyCurrentMobileOtp(payload),
  });
}
