"use client";

import { useEffect, type RefObject } from "react";

/** Com movimento reduzido pedido no sistema? (só no navegador) */
export function calmo(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Marca o elemento com data-emvista enquanto está no ecrã: as animações
 * contínuas (chuva, estrada, 111) só correm quando se vêem.
 */
export function useEmVista(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.dataset.emvista = "";
      else delete el.dataset.emvista;
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
