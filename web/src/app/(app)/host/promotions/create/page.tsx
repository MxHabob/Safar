import { CreateCouponForm } from "@/components/promotions/CreateCouponForm";

export const metadata = {
  title: "Create Coupon",
  description: "Create a new coupon",
};

export default function CreateCouponPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Coupon</h1>
      <CreateCouponForm />
    </div>
  );
}

