import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata = {
  title: "Verify Email",
  description: "Verify your email address",
};

type SearchParams = Promise<{ code?: string }>;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Verify Email</h1>
      <VerifyEmailForm code={params.code} />
    </div>
  );
}

