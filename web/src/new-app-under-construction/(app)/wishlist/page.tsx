import { Suspense } from "react";
import { getWishlist } from "@/lib/server/queries/wishlist";
import { WishlistGrid } from "@/components/wishlist/WishlistGrid";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Wishlist",
  description: "Your saved listings",
};

export default async function WishlistPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Wishlist</h1>
      <Suspense fallback={<PageSkeleton />}>
        <WishlistContent />
      </Suspense>
    </div>
  );
}

async function WishlistContent() {
  const wishlist = await getWishlist();
  return <WishlistGrid items={wishlist} />;
}

