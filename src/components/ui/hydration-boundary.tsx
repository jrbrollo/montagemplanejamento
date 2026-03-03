"use client";
import { useHydrated } from "@/hooks/useHydrated";

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Só renderiza children após hidratação no cliente.
 * Evita mismatches SSR/client com Zustand persist.
 */
export function HydrationBoundary({ children, fallback }: HydrationBoundaryProps) {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
          </div>
        </div>
      )
    );
  }
  return <>{children}</>;
}
