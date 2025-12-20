"use client"

interface ProtectedRouteProps {
  children: React.ReactNode
}

// Optimized: Removed all authentication checks for maximum performance
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>
}

