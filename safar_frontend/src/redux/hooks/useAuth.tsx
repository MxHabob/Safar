/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  useLoginMutation, 
  useRegisterMutation,
  useLogoutMutation,
  useGetUserQuery,
  useRefreshTokenMutation,
  useSocialAuthMutation,
  useVerifyEmailMutation,
  useResendActivationEmailMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
} from '@/redux/services/api';
import { RootState } from '@/redux/store';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout as logoutAction,
  setUser,
  setTokens,
} from '@/redux/features/auth/auth-slice';
import { RegisterUser } from '../types/types';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);
  
  const [loginApi, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerApi, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [logoutApi, { isLoading: isLogoutLoading }] = useLogoutMutation();
  const [refreshTokenApi, { isLoading: isRefreshLoading }] = useRefreshTokenMutation();
  const [socialAuthApi, { isLoading: isSocialAuthLoading }] = useSocialAuthMutation();
  const [verifyEmailApi, { isLoading: isVerifyEmailLoading }] = useVerifyEmailMutation();
  const [resendActivationEmailApi, { isLoading: isResendActivationLoading }] = useResendActivationEmailMutation();
  const [requestPasswordResetApi, { isLoading: isRequestPasswordResetLoading }] = useRequestPasswordResetMutation();
  const [confirmPasswordResetApi, { isLoading: isConfirmPasswordResetLoading }] = useConfirmPasswordResetMutation();
  
  const { refetch: fetchUser, isLoading: isUserLoading } = useGetUserQuery(undefined, {
    skip: !authState.accessToken,
  })

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      try {
        dispatch(loginStart())
        const response = await loginApi(credentials).unwrap()
        dispatch(loginSuccess(response))

        try {
          const userResponse = await fetchUser().unwrap()
          dispatch(setUser(userResponse))
        } catch (userError) {
          console.error("Failed to fetch user data:", userError)
        }

        toast.success("Login successful")
        router.push("/")
        return { success: true }
      } catch (error: any) {
        const errorMessage = error.data?.detail || "Login failed"
        dispatch(loginFailure(errorMessage))
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [dispatch, loginApi, fetchUser, router],
  )

  const register = useCallback(async (userData: Partial<RegisterUser>) => {
    try {
      dispatch(loginStart());
      await toast.promise(
        registerApi(userData).unwrap(),
        {
          loading: 'Creating your account...',
          success: 'Account created! Please check your email to verify your account.',
          error: (error) => {
            return error.data?.detail || 'Registration failed';
          },
        }
      );
      router.push('/login');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Registration failed';
      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, registerApi, router]);

  const logout = useCallback(async () => {
    try {
      await toast.promise(
        logoutApi().unwrap(),
        {
          loading: 'Logging out...',
          success: 'Logged out successfully',
          error: 'Failed to logout',
        }
      );
    } finally {
      dispatch(logoutAction());
      router.push('/login');
    }
  }, [dispatch, logoutApi, router]);

  const verifyEmail = useCallback(async (data: { uid: string; token: string }) => {
    try {
      await toast.promise(
        verifyEmailApi(data).unwrap(),
        {
          loading: 'Verifying your email...',
          success: 'Email verified successfully! You can now login.',
          error: (error) => {
            return error.data?.detail || 'Email verification failed';
          },
        }
      );
      // router.push('/login');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.data?.detail || 'Email verification failed' };
    }
  }, [verifyEmailApi]);

  const resendActivationEmail = useCallback(async (email: string) => {
    try {
      await toast.promise(
        resendActivationEmailApi({ email }).unwrap(),
        {
          loading: 'Sending activation email...',
          success: 'Activation email sent! Please check your inbox.',
          error: (error) => {
            return error.data?.detail || 'Failed to send activation email';
          },
        }
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.data?.detail || 'Failed to send activation email' };
    }
  }, [resendActivationEmailApi]);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await toast.promise(
        requestPasswordResetApi({ email }).unwrap(),
        {
          loading: 'Sending password reset email...',
          success: 'Password reset email sent! Please check your inbox.',
          error: (error) => {
            return error.data?.detail || 'Failed to send password reset email';
          },
        }
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.data?.detail || 'Failed to send password reset email' };
    }
  }, [requestPasswordResetApi]);

  const confirmPasswordReset = useCallback(async (data: { uid: string; token: string; new_password: string }) => {
    try {
      await toast.promise(
        confirmPasswordResetApi(data).unwrap(),
        {
          loading: 'Resetting your password...',
          success: 'Password reset successfully! You can now login with your new password.',
          error: (error) => {
            return error.data?.detail || 'Password reset failed';
          },
        }
      );
      router.push('/login');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.data?.detail || 'Password reset failed' };
    }
  }, [confirmPasswordResetApi, router]);

  const refreshTokens = useCallback(async () => {
    if (!authState.refreshToken) {
      dispatch(logoutAction())
      return { success: false, error: "No refresh token available" }
    }

    try {
      const response = await refreshTokenApi({ refresh: authState.refreshToken }).unwrap()
      dispatch(setTokens({ access: response.access, refresh: authState.refreshToken }))
      return { success: true }
    } catch (error) {
      dispatch(logoutAction())
      toast.error("Session expired. Please login again.")
      return { success: false, error: "Session expired" }
    }
  }, [authState.refreshToken, dispatch, refreshTokenApi])

  const socialLogin = useCallback(async (provider: string, code: string) => {
    try {
      dispatch(loginStart());
      const response = await toast.promise(
        socialAuthApi({ provider, code }).unwrap(),
        {
          loading: 'Logging in with social account...',
          success: 'Logged in successfully!',
          error: (error) => {
            return error.data?.detail || 'Social login failed';
          },
        }
      );
      dispatch(loginSuccess(response));
      
      if (response) {
        dispatch(setUser(response));
      }
      
      router.push('/');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Social login failed';
      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, socialAuthApi, router]);

  const loadUser = useCallback(async () => {
    if (!authState.accessToken) return { success: false }

    try {
      const response = await fetchUser().unwrap()
      dispatch(setUser(response))
      return { success: true, user: response }
    } catch (error) {
      const refreshResult = await refreshTokens()
      if (refreshResult.success) {
        try {
          const response = await fetchUser().unwrap()
          dispatch(setUser(response))
          return { success: true, user: response }
        } catch (error) {
          return { success: false }
        }
      }
      return { success: false }
    }
  }, [authState.accessToken, dispatch, fetchUser, refreshTokens])

  return {
    ...authState,
    login,
    register,
    logout,
    verifyEmail,
    resendActivationEmail,
    requestPasswordReset,
    confirmPasswordReset,
    refreshTokens,
    socialLogin,
    loadUser,
    isLoading: isLoginLoading || isRegisterLoading || isLogoutLoading || 
              isRefreshLoading || isSocialAuthLoading || isVerifyEmailLoading || 
              isResendActivationLoading || isRequestPasswordResetLoading || 
              isConfirmPasswordResetLoading || isUserLoading,
    isLoginLoading,
    isRegisterLoading,
    isLogoutLoading,
    isRefreshLoading,
    isSocialAuthLoading,
    isVerifyEmailLoading,
    isResendActivationLoading,
    isRequestPasswordResetLoading,
    isConfirmPasswordResetLoading,
    isUserLoading,
  };
};