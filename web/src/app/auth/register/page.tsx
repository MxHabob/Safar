import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Register",
  description: "Create a new Safar account",
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Create Account</h1>
      <RegisterForm />
    </div>
  );
}

