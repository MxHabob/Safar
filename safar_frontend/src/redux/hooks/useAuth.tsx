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

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  
  const [loginApi] = useLoginMutation();
  const [registerApi] = useRegisterMutation();
  const [logoutApi] = useLogoutMutation();
  const [refreshTokenApi] = useRefreshTokenMutation();
  const [socialAuthApi] = useSocialAuthMutation();
  const [verifyEmailApi] = useVerifyEmailMutation();
  const [resendActivationEmailApi] = useResendActivationEmailMutation();
  const [requestPasswordResetApi] = useRequestPasswordResetMutation();
  const [confirmPasswordResetApi] = useConfirmPasswordResetMutation();
  
  const { refetch: fetchUser } = useGetUserQuery();

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      dispatch(loginStart());
      const response = await loginApi(credentials).unwrap();
      dispatch(loginSuccess(response));
      
      // Fetch user details after successful login
      const userResponse = await fetchUser().unwrap();
      dispatch(setUser(userResponse));
      
      toast.success('Login successful');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Login failed';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [dispatch, loginApi, fetchUser]);

  const register = useCallback(async (userData: Partial<RegisterUser>) => {
    try {
      dispatch(loginStart());
      await toast.promise(
        registerApi(userData).unwrap(),
        {
          loading: 'Creating your account...',
          success: () => {
            return 'Account created! Please check your email to verify your account.';
          },
          error: (error) => {
            return error.data?.detail || 'Registration failed';
          },
        }
      );
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Registration failed';
      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, registerApi]);

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
    }
  }, [dispatch, logoutApi]);

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
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.data?.detail || 'Password reset failed' };
    }
  }, [confirmPasswordResetApi]);

  const refreshTokens = useCallback(async () => {
    if (!authState.refreshToken) {
      dispatch(logoutAction());
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const response = await refreshTokenApi({ refresh: authState.refreshToken }).unwrap();
      dispatch(setTokens({ access: response.access, refresh: authState.refreshToken }));
      return { success: true };
    } catch (error) {
      dispatch(logoutAction());
      toast.error('Session expired. Please login again.');
      return { success: false, error: 'Session expired. Please login again.' };
    }
  }, [authState.refreshToken, dispatch, refreshTokenApi]);
    // google, facebook 
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
      
      // Social auth response includes user data
      if (response.user) {
        dispatch(setUser(response.user));
      }
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Social login failed';
      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [dispatch, socialAuthApi]);

  const loadUser = useCallback(async () => {
    if (!authState.accessToken) return { success: false };

    try {
      const response = await fetchUser().unwrap();
      dispatch(setUser(response));
      return { success: true, user: response };
    } catch (error) {
      return { success: false };
    }
  }, [authState.accessToken, dispatch, fetchUser]);

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
  };
};