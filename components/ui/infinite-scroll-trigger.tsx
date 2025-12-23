"use client";

import * as React from "react";
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer";
import { Loader2 } from "lucide-react";

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  children?: React.ReactNode;
}

export function InfiniteScrollTrigger({
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  children,
}: InfiniteScrollTriggerProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
  });

  React.useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <div ref={ref} className="flex items-center justify-center py-4">
      {isFetchingNextPage ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more...
        </div>
      ) : hasNextPage ? (
        <div className="text-sm text-muted-foreground">Scroll to load more</div>
      ) : (
        children || <div className="text-sm text-muted-foreground">No more items</div>
      )}
    </div>
  );
}

