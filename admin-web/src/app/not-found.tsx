import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-light">404</h1>
        <h2 className="text-2xl font-light">Page not found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild className="rounded-[18px]">
          <Link href="/">
            <Home className="size-4 mr-2" />
            Go Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-[18px]">
          <Link href="/search">
            <Search className="size-4 mr-2" />
            Search
          </Link>
        </Button>
      </div>
    </div>
  );
}

