import type { Metadata } from "next";
import { VideosClient } from "./VideosClient";
import { lerVideos } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Vídeos",
  description:
    "Highlights, onboards, entrevistas e documentários do motociclismo angolano. Motobox TV.",
};

export default async function VideosPage() {
  return <VideosClient videos={await lerVideos()} />;
}
