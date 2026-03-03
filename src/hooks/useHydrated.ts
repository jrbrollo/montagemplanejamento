"use client";
import { useEffect, useState } from "react";

/**
 * Retorna true somente após a hidratação no cliente.
 * Evita mismatch de conteúdo entre SSR e cliente no Zustand persist.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
