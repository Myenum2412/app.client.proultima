"use client";

import { useRef, useEffect, useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Project } from "./types";

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onProjectSelect: (project: Project) => void;
}

// 🚀 OPTIMIZATION: Memoize individual project card to prevent unnecessary re-renders
const ProjectCard = memo(({ 
  project, 
  isSelected, 
  index, 
  onSelect 
}: { 
  project: Project; 
  isSelected: boolean; 
  index: number;
  onSelect: (project: Project) => void;
}) => {
  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        delay: Math.min(index * 0.03, 0.3), // Cap delay at 0.3s
        ease: [0.4, 0, 0.2, 1]
      }}
      className="flex-shrink-0"
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200",
          "w-[260px] h-[120px] border rounded-lg",
          isSelected
            ? "bg-gray-900 text-white border-gray-700 shadow-lg"
            : "bg-white text-gray-900 border-gray-200 hover:border-gray-300 hover:shadow-md"
        )}
        onClick={() => onSelect(project)}
      >
        <CardContent className="h-full flex flex-col justify-between p-4">
          {/* Project Number */}
          <div
            className={cn(
              "text-lg font-semibold transition-colors",
              isSelected ? "text-white" : "text-gray-900"
            )}
          >
            {project.projectNumber}
          </div>

          {/* Project Name */}
          <div
            className={cn(
              "text-sm mt-1 leading-snug transition-colors",
              isSelected ? "text-white/80" : "text-gray-700"
            )}
          >
            {project.projectName}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export function ProjectSelector({
  projects,
  currentProject,
  onProjectSelect,
}: ProjectSelectorProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
      const cardWidth = 260; // w-[260px]
      const gap = 16; // gap-4 = 1rem = 16px
      const scrollAmount = cardWidth + gap;
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const cardWidth = 260; // w-[260px]
      const gap = 16; // gap-4 = 1rem = 16px
      const scrollAmount = cardWidth + gap;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Check scroll position on mount and when projects change
  useEffect(() => {
    checkScrollPosition();
    const timer = setTimeout(checkScrollPosition, 100); // Small delay to ensure DOM is ready
    return () => clearTimeout(timer);
  }, [projects]);

  // Update scroll position on scroll
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        carousel.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, []);

  return (
    <div
      className="px-4 lg:px-6 py-6 relative bg-cover bg-center bg-no-repeat rounded-lg"
      style={{
        backgroundImage: "url('/image/dashboard-bg.png')",
        minHeight: "200px",
      }}
    >
      <div className="absolute inset-0 bg-background/10 dark:bg-background/10 rounded-lg z-0 "></div>

      <div className="relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Project Selector
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
            {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={currentProject?.id === project.id}
              index={index}
              onSelect={onProjectSelect}
            />
          ))}
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
  );
}

