import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminProvider } from "@/lib/admin/store";
import { AdminShell } from "@/components/admin/Shell";

export const metadata: Metadata = {
  title: "Gestão · Motobox Angola",
  description: "Painel de administração da plataforma Motobox Angola.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
