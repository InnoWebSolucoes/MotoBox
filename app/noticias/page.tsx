import type { Metadata } from "next";
import { NoticiasClient } from "./NoticiasClient";
import { lerNoticias, lerVideos } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Notícias",
  description:
    "Notícias do motociclismo angolano e internacional: cobertura de provas, entrevistas, comunidade e notícias de fora escolhidas pela redacção, sempre com a fonte.",
};

/** Quantos vídeos aparecem na faixa de vídeos. */
const VIDEOS_NA_FAIXA = 4;

export default async function NoticiasPage() {
  const [noticias, videos] = await Promise.all([lerNoticias(), lerVideos()]);
  // `lerVideos` já vem do mais recente para o mais antigo.
  return <NoticiasClient noticias={noticias} videos={videos.slice(0, VIDEOS_NA_FAIXA)} />;
}
