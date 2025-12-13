import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import dynamic from "next/dynamic";
import { getPaymentApiV1AdminPaymentsPaymentIdGet } from "@/generated/actions/admin";
import { Spinner } from "@/components/ui/spinner";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Payment Details",
  description: "View and manage payment details",
};

// Dynamic import for better code splitting
const PaymentDetailPage = dynamic(
  () =>
    import("@/features/admin/payments/payment-detail").then((mod) => ({
      default: mod.PaymentDetailPage,
    })),
  {
    loading: () => (
      <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
        <Spinner />
      </div>
    ),
    ssr: true,
  }
);

// Cache the data fetching function
const getPaymentData = cache(async (paymentId: string) => {
  try {
    return await getPaymentApiV1AdminPaymentsPaymentIdGet({
      path: { payment_id: paymentId },
    });
  } catch {
    return null;
  }
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch payment data on server
  const paymentData = await getPaymentData(id);

  if (!paymentData?.data) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <PaymentDetailPage initialPaymentData={paymentData.data} />
    </Suspense>
  );
}

