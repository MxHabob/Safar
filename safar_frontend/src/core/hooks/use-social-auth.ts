/* eslint-disable @typescript-eslint/no-explicit-any */
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

    if (state && code) {
      authenticate({ provider, state, code })
        .unwrap()
        .then((response: any) => {
          dispatch(loginSuccess({
            user: response.user,
            access: response.access,
            refresh: response.refresh
          }));
          toast.success('Successfully logged in!');
          router.push('/create');
        })
        .catch((error: any) => {
          toast.error(`Authentication failed: ${ error.data?.detail }`);
          router.push('/login');
        })
        .finally(() => {
          effectRan.current = true;
        });
    }

    return () => {
      effectRan.current = false;
    };
  }, [authenticate, provider, searchParams, dispatch, router]);

  return {};
}