import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAppDispatch } from '../store';
import { loginSuccess } from '../features/auth/auth-slice';

export default function useSocialAuth(authenticate: any, provider: string) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    
    const state = searchParams.get('state');
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      router.push('/login');
      return;
    }

    if (!state || !code) {
      // If no state/code but we're on callback URL, something went wrong
      if (window.location.pathname.includes('/google')) {
        toast.error('Missing authentication parameters');
        router.push('/login');
      }
      return;
    }

    // Verify state matches what we stored
    const storedState = localStorage.getItem('oauth_state');
    if (state !== storedState) {
      toast.error('Invalid authentication state');
      router.push('/login');
      return;
    }

    authenticate({ provider, state, code })
      .unwrap()
      .then((response: any) => {
        dispatch(loginSuccess({
          user: response.user,
          access: response.access,
          refresh: response.refresh
        }));
        toast.success('Successfully logged in!');
        router.push('/');
      })
      .catch((error: any) => {
        const errorMessage = error.data?.detail || 
                            error.data?.message || 
                            'Authentication failed';
        toast.error(errorMessage);
        router.push('/login');
      })
      .finally(() => {
        localStorage.removeItem('oauth_state');
        effectRan.current = true;
      });

    return () => {
      effectRan.current = false;
    };
  }, [authenticate, provider, searchParams, dispatch, router]);

  return {};
}