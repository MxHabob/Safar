import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/redux/hooks/usee-auth';
import { Spinner } from '@/components/ui/spinner';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <Spinner />;
  }

  return <>{children}</>;
};