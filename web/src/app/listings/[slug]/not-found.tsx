import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The listing you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/listings">Browse all listings</Link>
      </Button>
    </div>
  );
}

