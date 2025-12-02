import { OAuthCallback } from "@/components/auth/OAuthCallback";

export const metadata = {
  title: "OAuth Callback",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  code?: string;
  state?: string;
  error?: string;
}>;

export default async function OAuthCallbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return <OAuthCallback params={params} />;
}

