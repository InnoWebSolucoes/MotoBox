"use client";

/* ============================================================
   MOTOBOX ADMIN — Imagens e vídeos
   A biblioteca de ficheiros carregados: carregar vários de uma
   vez, copiar o endereço e apagar. As fotografias que o site já
   traz de origem estão no separador "Fotografias do site".
   ============================================================ */

import { Film, ImageIcon, Images, Info } from "lucide-react";
import { BibliotecaMedia } from "@/components/admin/Media";
import { CabecalhoPagina, ChipIcone, Painel } from "@/components/admin/kit";

const DICAS = [
  {
    icone: <ImageIcon />,
    titulo: "Fotografias",
    texto: "JPG, PNG, WebP ou AVIF, até 10 MB. O site reduz o tamanho sozinho para cada ecrã.",
  },
  {
    icone: <Images />,
    titulo: "Que tamanho",
    texto: "Fotografias de fundo e de abertura: pelo menos 1920 px de largura, deitadas. Cartões e mosaicos: 1200 px chega.",
  },
  {
    icone: <Film />,
    titulo: "Vídeos",
    texto: "MP4 ou WebM, até 50 MB. Para o fundo do site, um vídeo curto, sem som, que repita bem.",
  },
  {
    icone: <Info />,
    titulo: "Como usar",
    texto: "Em qualquer campo de imagem, carregue em \"Escolher da biblioteca\". Aqui pode também copiar o endereço de um ficheiro.",
  },
];

export default function AdminMedia() {
  return (
    <>
      <CabecalhoPagina
        sobretitulo="Site"
        titulo="Imagens e vídeos"
        icone={<Images />}
        descricao="As fotografias e os vídeos carregados para o site. Ficam aqui guardados para usar em qualquer página, artigo ou evento."
      />

      <ul className="mb-[var(--intervalo)] grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-4">
        {DICAS.map((d) => (
          <li key={d.titulo} className="painel painel-escuro flex gap-3 p-4">
            <ChipIcone>{d.icone}</ChipIcone>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight">{d.titulo}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/60">{d.texto}</p>
            </div>
          </li>
        ))}
      </ul>

      <Painel
        titulo="Biblioteca"
        descricao="Para apagar, carregue em Apagar e depois em Confirmar. Um ficheiro apagado deixa de aparecer onde estiver a ser usado."
      >
        <BibliotecaMedia gerir tipo="todos" />
      </Painel>
    </>
  );
}
