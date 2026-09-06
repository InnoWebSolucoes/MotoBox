import type { Metadata } from "next";
import { VideosClient } from "./VideosClient";
import { videos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Vídeos",
  description:
    "Highlights, onboards, entrevistas e documentários do motociclismo angolano. Motobox TV.",
};

export default function VideosPage() {
  return <VideosClient videos={videos} />;
}
