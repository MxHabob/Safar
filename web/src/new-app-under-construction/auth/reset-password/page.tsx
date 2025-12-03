import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password",
  description: "Reset your password",
};

type SearchParams = Promise<{ code?: string; email?: string }>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Reset Password</h1>
      <ResetPasswordForm code={params.code} email={params.email} />
    </div>
  );
}

