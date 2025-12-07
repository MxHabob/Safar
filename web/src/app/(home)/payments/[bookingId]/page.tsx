import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaymentPage, PaymentPageLoading } from "@/features/payments/payment-page";
import { getSession } from "@/lib/auth/session-provider";

type Params = Promise<{ bookingId: string }>;

export const revalidate = 0; // No caching for payment pages

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { bookingId } = await params;
  
  return {
    title: `Payment - Booking ${bookingId} - Safar`,
    description: "Complete your booking payment",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PaymentPageRoute({ params }: { params: Params }) {
  const { bookingId } = await params;
  const session = await getSession().catch(() => null);

  if (!session) {
    notFound();
  }

  return (
    <Suspense fallback={<PaymentPageLoading />}>
      <PaymentPage bookingId={bookingId} />
    </Suspense>
  );
}

