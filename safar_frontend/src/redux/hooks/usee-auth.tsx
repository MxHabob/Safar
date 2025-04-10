/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from 'react';
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
  api,
} from '@/redux/services/api';
import { RootState } from '@/redux/store';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout as logoutAction,
  setUser,
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
  
  const { data: userData, refetch: fetchUser, isLoading: isUserLoading } = useGetUserQuery();


  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      try {
        dispatch(loginStart())

        // First, login to get the tokens (stored in cookies)
        await toast.promise(loginApi(credentials).unwrap(), {
          loading: "Logging in...",
          success: "Logged in successfully!",
          error: (error) => error.data?.detail || "Login failed",
        })

        // Then fetch the user data
        const user = await fetchUser().unwrap()
        console.log("user : " , user)
        dispatch(loginSuccess(user))

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
          error: (error) => error.data?.detail || 'Registration failed',
        }
      );
      router.push('/login');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Registration failed';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
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
    } catch (error) {
      toast.error('Failed to logout');
    } finally {
      dispatch(logoutAction());
      dispatch(api.util.resetApiState());
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
          error: (error) => error.data?.detail || 'Email verification failed',
        }
      );
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Email verification failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [verifyEmailApi]);

  const resendActivationEmail = useCallback(async (email: string) => {
    try {
      await toast.promise(
        resendActivationEmailApi({ email }).unwrap(),
        {
          loading: 'Sending activation email...',
          success: 'Activation email sent! Please check your inbox.',
          error: (error) => error.data?.detail || 'Failed to send activation email',
        }
      );
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to send activation email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [resendActivationEmailApi]);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await toast.promise(
        requestPasswordResetApi({ email }).unwrap(),
        {
          loading: 'Sending password reset email...',
          success: 'Password reset email sent! Please check your inbox.',
          error: (error) => error.data?.detail || 'Failed to send password reset email',
        }
      );
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to send password reset email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [requestPasswordResetApi]);

  const confirmPasswordReset = useCallback(async (data: { uid: string; token: string; new_password: string }) => {
    try {
      await toast.promise(
        confirmPasswordResetApi(data).unwrap(),
        {
          loading: 'Resetting your password...',
          success: 'Password reset successfully! You can now login with your new password.',
          error: (error) => error.data?.detail || 'Password reset failed',
        }
      );
      router.push('/login');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Password reset failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [confirmPasswordResetApi, router]);

  const socialLogin = useCallback(async (provider: string, code: string) => {
    try {
      dispatch(loginStart());
      const response = await toast.promise(
        socialAuthApi({ provider, code }).unwrap(),
        {
          loading: 'Logging in with social account...',
          success: 'Logged in successfully!',
          error: (error) => error.data?.detail || 'Social login failed',
        }
      );
      
      const user = await fetchUser().unwrap();
      dispatch(loginSuccess(user));
      router.push('/');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Social login failed';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [dispatch, socialAuthApi, fetchUser, router]);

  const loadUser = useCallback(async () => {
    if (!authState.isAuthenticated) return { success: false };
    
    try {
      const user = await fetchUser().unwrap();
      dispatch(setUser(user));
      return { success: true };
    } catch (error) {
      dispatch(logoutAction());
      return { success: false };
    }
  }, [authState.isAuthenticated, dispatch, fetchUser]);



  return {
    ...authState,
    login,
    register,
    logout,
    verifyEmail,
    resendActivationEmail,
    requestPasswordReset,
    confirmPasswordReset,
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