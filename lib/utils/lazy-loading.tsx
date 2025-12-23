/**
 * Lazy Loading Utilities
 * Optimized lazy loading for heavy components to improve initial page load
 */

import React from "react";
import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Lazy load PDF viewers (heavy components with pdf.js)
export const LazyDrawingPdfViewerAdvanced = dynamic(
  () =>
    import("@/components/projects/drawing-pdf-viewer-advanced").then(
      (mod) => mod.DrawingPdfViewerAdvanced
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading PDF viewer...</div>
      </div>
    ),
  }
);

export const LazyDrawingPdfViewerEnhanced = dynamic(
  () =>
    import("@/components/projects/drawing-pdf-viewer-enhanced").then(
      (mod) => mod.DrawingPdfViewerEnhanced
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading PDF viewer...</div>
      </div>
    ),
  }
);

// Lazy load Advanced PDF Editor (very heavy component)
export const LazyAdvancedPdfEditor = dynamic(
  () =>
    import("@/components/pdf-editor/advanced-pdf-editor").then(
      (mod) => mod.AdvancedPdfEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading PDF editor...</div>
      </div>
    ),
  }
);

// Lazy load Chart components (recharts is heavy)
export const LazyChart = dynamic(
  () => import("@/components/ui/chart").then((mod) => mod as any),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    ),
  }
);

// Lazy load Emoji Picker (heavy component)
export const LazyEmojiPicker = dynamic(
  () => import("@/components/chat/emoji-picker").then((mod) => mod.EmojiPicker),
  {
    ssr: false,
    loading: () => null,
  }
);

// Generic lazy loader factory
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: () => React.ReactElement | null;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    ssr: options?.ssr ?? false,
    loading: options?.loading ?? (() => null),
  });
}
