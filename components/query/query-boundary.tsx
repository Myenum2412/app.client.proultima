"use client";

import * as React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import Loader from "@/components/kokonutui/loader";

class ErrorBoundary extends React.Component<
  {
    onReset: () => void;
    fallback: (error: unknown, reset: () => void) => React.ReactNode;
    children: React.ReactNode;
  },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch() {
    // noop (logging handled elsewhere)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => {
        this.setState({ error: null });
        this.props.onReset();
      });
    }
    return this.props.children;
  }
}

export function QueryBoundary({
  children,
  loadingTitle = "Loading...",
  loadingSubtitle = "Please wait",
}: {
  children: React.ReactNode;
  loadingTitle?: string;
  loadingSubtitle?: string;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(error, retry) => (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="text-sm text-muted-foreground max-w-md">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong."}
              </div>
              <Button onClick={retry} variant="outline">
                Try again
              </Button>
            </div>
          )}
        >
          <React.Suspense
            fallback={
              <div className="min-h-[40vh] flex items-center justify-center">
                <Loader title={loadingTitle} subtitle={loadingSubtitle} />
              </div>
            }
          >
            {children}
          </React.Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}


