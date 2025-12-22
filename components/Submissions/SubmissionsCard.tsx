"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSubmissions } from "@/hooks/use-submissions";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import MaxWidthWrapper from "../MaxWidthWrapper";
import { Submission } from "../submissions-table";

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color: string;
  bgColor: string;
}

interface SubmissionsCardProps {
  initialSubmissions?: Submission[];
}

export default function SubmissionsCard({
  initialSubmissions = [],
}: SubmissionsCardProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const {
    data: submissions,
    isLoading,
    error,
  } = useSubmissions({ initialData: initialSubmissions });

  // Calculate statistics from submissions data
  const stats = useMemo(() => {
    if (!submissions || !Array.isArray(submissions)) {
      return {
        total: 0,
        lastSubmission: null as string | null,
        reviewCount: 0,
        statusBreakdown: {
          APP: 0,
          "R&R": 0,
          FFU: 0,
          PENDING: 0,
        },
      };
    }

    const total = submissions.length;

    // Find most recent submission date
    const dates = submissions
      .map((s: any) => s.submissionDate)
      .filter(Boolean)
      .sort(
        (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime()
      );
    const lastSubmission = dates.length > 0 ? dates[0] : null;

    // Count reviews (R&R status)
    const reviewCount = submissions.filter(
      (s: any) => s.submissionType === "R&R"
    ).length;

    // Status breakdown
    const statusBreakdown = submissions.reduce(
      (acc: any, s: any) => {
        const status = s.submissionType || "PENDING";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { APP: 0, "R&R": 0, FFU: 0, PENDING: 0 }
    );

    return {
      total,
      lastSubmission,
      reviewCount,
      statusBreakdown,
    };
  }, [submissions]);

  // Create stat cards
  const statCards: StatCard[] = useMemo(() => {
    const cards: StatCard[] = [
      {
        id: "total",
        title: "Total Submissions",
        value: stats.total,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
      },
      {
        id: "last",
        title: "Last Submissions",
        value: stats.lastSubmission
          ? format(new Date(stats.lastSubmission), "MMM dd, yyyy")
          : "No submissions",
        subtitle: stats.lastSubmission
          ? format(new Date(stats.lastSubmission), "h:mm a")
          : undefined,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
      },
      {
        id: "review",
        title: "Number of Review",
        value: stats.reviewCount,
        subtitle:
          stats.total > 0
            ? `${Math.round((stats.reviewCount / stats.total) * 100)}% of total`
            : undefined,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
      },
      {
        id: "status",
        title: "Status",
        value: `${
          stats.statusBreakdown.APP +
          stats.statusBreakdown["R&R"] +
          stats.statusBreakdown.FFU
        } Active`,

        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
      },
    ];

    return cards;
  }, [stats]);

  // Check scroll position to show/hide navigation arrows
  const checkScrollPosition = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll handlers
  const scrollLeft = () => {
    if (carouselRef.current) {
      const cardWidth = 280; // w-[280px]
      const gap = 16; // gap-4 = 1rem = 16px
      const scrollAmount = cardWidth + gap;
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const cardWidth = 280; // w-[280px]
      const gap = 16; // gap-4 = 1rem = 16px
      const scrollAmount = cardWidth + gap;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Check scroll position on mount and when data changes
  useEffect(() => {
    checkScrollPosition();
    const timer = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [submissions, statCards]);

  // Update scroll position on scroll
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        carousel.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, []);

  if (error) {
    return (
      <div className="px-4 lg:px-6 py-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">
              Error loading submissions data
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MaxWidthWrapper>
      <div
        className="px-4  py-6 relative bg-cover bg-center bg-no-repeat rounded-lg overflow-x-hidden w-full "
        style={{
          backgroundImage: "url('/image/dashboard-bg.png')",
          minHeight: "200px",
        }}
      >
        <div className="absolute inset-0 bg-background/10 dark:bg-background/10 rounded-lg z-0"></div>

        <div className="relative z-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              Submissions Overview
            </h1>
          </div>

          {/* Carousel Container */}
          <div className="relative w-full overflow-hidden">
            {/* Left Navigation Arrow */}
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 shadow-lg"
                onClick={scrollLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white" />
              </Button>
            )}

            {/* Scrollable Carousel */}
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-2 px-2"
              onScroll={checkScrollPosition}
            >
              {isLoading
                ? // Loading skeletons
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex-shrink-0">
                      <Card className="w-[280px] h-[160px] border rounded-lg">
                        <CardContent className="h-full flex flex-col justify-between p-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </CardContent>
                      </Card>
                    </div>
                  ))
                : // Stat cards
                  statCards.map((card, index) => {
                    const isSelected = selectedCardId === card.id;

                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex-shrink-0"
                      >
                        <Card
                          className={cn(
                            "cursor-pointer transition-all duration-200",
                            "w-[280px] h-[130px] border rounded-lg",
                            isSelected
                              ? "bg-gray-900 text-white border-gray-700 shadow-lg dark:bg-gray-800 dark:border-gray-600"
                              : "bg-white text-gray-900 border-gray-200 hover:border-gray-300 hover:shadow-md dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:hover:border-gray-600"
                          )}
                          onClick={() => setSelectedCardId(card.id)}
                        >
                          <CardContent className="h-full flex flex-col justify-center p-4 -mt-4">
                            {/* Header with icon */}

                            {/* Title */}
                            <div
                              className={cn(
                                "text-sm font-medium transition-colors",
                                isSelected
                                  ? "text-white/80"
                                  : "text-gray-500 dark:text-gray-400"
                              )}
                            >
                              {card.title}
                            </div>

                            {/* Value */}
                            <div
                              className={cn(
                                "text-2xl font-semibold transition-colors",
                                isSelected
                                  ? "text-white"
                                  : "text-gray-900 dark:text-white"
                              )}
                            >
                              {card.value}
                            </div>

                            {/* Subtitle */}
                            {card.subtitle && (
                              <div
                                className={cn(
                                  "text-xs transition-colors",
                                  isSelected
                                    ? "text-white/70"
                                    : "text-gray-500 dark:text-gray-400"
                                )}
                              >
                                {card.subtitle}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
            </div>

            {/* Right Navigation Arrow */}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 shadow-lg"
                onClick={scrollRight}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
