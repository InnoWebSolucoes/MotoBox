"use client";

/* Um bloco que sabe quando está no ecrã (data-emvista), para as
   animações contínuas só correrem quando se vêem. */

import { useRef, type ReactNode } from "react";
import { useEmVista } from "./ganchos";

export function EmVista({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEmVista(ref);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
