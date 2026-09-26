/* ============================================================
   MOTOBOX — Redes sociais
   As ligações vêm das Definições do painel; o que ficar em branco
   usa o valor por omissão de `SOCIAIS`, e uma rede sem ligação não
   aparece no site. Os componentes de cliente só importam o tipo.
   ============================================================ */

import { SOCIAIS } from "@/lib/data";
import { lerDefinicoes } from "@/lib/supabase/publico";

/** O nome da rede é também o nome do ícone em `components/ui.tsx`. */
export type Rede = "instagram" | "facebook" | "youtube" | "linkedin" | "google" | "whatsapp";

export interface LigacaoRede {
  rede: Rede;
  nome: string;
  url: string;
}

export async function lerRedes(): Promise<LigacaoRede[]> {
  const d = await lerDefinicoes();
  const lista: LigacaoRede[] = [
    { rede: "instagram", nome: "Instagram", url: d.instagram || SOCIAIS.instagram },
    { rede: "facebook", nome: "Facebook", url: d.facebook || SOCIAIS.facebook },
    { rede: "youtube", nome: "YouTube", url: d.youtube || SOCIAIS.youtube },
    { rede: "linkedin", nome: "LinkedIn", url: d.linkedin || SOCIAIS.linkedin },
    { rede: "google", nome: "Google", url: d.googleBusiness || SOCIAIS.googleBusiness },
    { rede: "whatsapp", nome: "WhatsApp", url: SOCIAIS.whatsapp },
  ];
  return lista.filter((l) => /^https?:\/\//.test(l.url.trim()));
}
