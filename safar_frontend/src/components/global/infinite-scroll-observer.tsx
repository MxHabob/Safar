"use client";

import { useRef, useEffect, ReactNode, useState } from "react";
import { Skeleton } from "../ui/skeleton";

type Props = {
  children: ReactNode;
  loadingComponent?: ReactNode;
};

const InfiniteScrollObserver = ({ children, loadingComponent = <Skeleton /> }: Props) => {
  const observerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoading(true);
          setTimeout(() => setIsLoading(false), 500);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {children}
      <div ref={observerRef} className="h-1 w-full">{isLoading && loadingComponent}</div>
    </>
  );
};

export default InfiniteScrollObserver;
