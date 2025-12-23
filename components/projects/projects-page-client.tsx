"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  jobNumber: string;
  name: string;
};

export function ProjectsPageClient({
  projects,
  selectedProjectId,
}: {
  projects: Project[];
  selectedProjectId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleProjectClick = useCallback(
    (projectId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("project", projectId);
      router.push(`/projects?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollButtons();
    container.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, [checkScrollButtons]);

  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -300, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 300, behavior: "smooth" });
  }, []);

  return (
    <div className="relative">
      {/* Left Arrow Button */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Right Arrow Button */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Scrollable Container (scrollbar hidden) */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex flex-nowrap gap-4 pb-2">
          {projects.length > 0 ? (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProjectClick(p.id)}
                className={`min-w-[280px] rounded-xl border bg-background p-4 shadow-md hover:shadow-lg transition-shadow text-left ${
                  selectedProjectId === p.id
                    ? "ring-2 ring-primary border-primary"
                    : ""
                }`}
              >
                <div className="text-base font-semibold">{p.jobNumber}</div>
                <div className="mt-2 text-sm text-muted-foreground">{p.name}</div>
              </button>
            ))
          ) : (
            <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
              No projects found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

