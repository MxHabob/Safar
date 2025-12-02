import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login",
  description: "Login to your Safar account",
};

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Login</h1>
      <LoginForm />
    </div>
  );
}

