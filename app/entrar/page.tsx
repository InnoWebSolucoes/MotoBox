import type { Metadata } from "next";
import { Suspense } from "react";
import { EntrarClient } from "./EntrarClient";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Aceda à sua conta Motobox Angola.",
  robots: { index: false, follow: false },
};

export default function PaginaEntrar() {
  return (
    <Suspense fallback={null}>
      <EntrarClient />
    </Suspense>
  );
}
