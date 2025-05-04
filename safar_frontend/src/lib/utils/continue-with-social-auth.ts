import { toast } from 'sonner';

export default async function ContinueWithSocialAuth(
  provider: string,
  redirect: string
) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URL || 'http://localhost:3000';

    if (!backendUrl || !redirectUri) {
      throw new Error('Missing necessary environment variables');
    }

    const url = `${backendUrl}/api/auth/o/${provider}/?redirect_uri=${redirectUri}/${redirect}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    const data = await res.json();

    if (res.ok && typeof window !== 'undefined') {
      window.location.replace(data.authorization_url);
    } else {
      const errorMessage = data?.detail || 'Something went wrong';
      toast.error(errorMessage);
    }
  } catch (err) {
    console.error('Error during social auth:', err);
    toast.error('Something went wrong. Please try again later.');
  }
}
