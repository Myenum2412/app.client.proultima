/**
 * React hook for Intersection Observer API
 */

import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): { ref: React.RefObject<HTMLDivElement | null>; isIntersecting: boolean } {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: options.threshold ?? 0,
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? "0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.root, options.rootMargin]);

  return { ref, isIntersecting };
}

