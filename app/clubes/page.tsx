import type { Metadata } from "next";
import Link from "next/link";
import { Flag, HeartHandshake, MapPinned, Route, Users, Venus } from "lucide-react";
import { lerClubes } from "@/lib/supabase/publico";
import { comResumo } from "@/lib/clubes-perfis";
import { ROTAS } from "@/lib/rotas";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import {
  Abertura, BotaoMB, Cabecalho, CartaoIcone, CartaoNumerado, Numeros, Pilulas, Seccao,
} from "@/components/painel/blocos";
import { Chip, Foto, Seta } from "@/components/painel/kit";
import { JuntarClube } from "./JuntarClube";
import { CartaoClube } from "./Partes";
import { TIPOS_CLUBE, tipoPorSlug } from "./comum";

export const metadata: Metadata = {
  title: "Clubes",
  description:
    "Todos os clubes de motas de Angola: moto-turismo, Lady Riders, scooters, clássicas e convívio. Encontre um clube perto de si ou junte o seu à MotoBox.",
};

export default async function Clubes({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; provincia?: string }>;
}) {
  const { tipo, provincia } = await searchParams;
  // A linha de apresentação dos cartões vem do perfil alargado, que vive no código.
  const clubes = (await lerClubes()).map(comResumo);

  const tipoActivo = tipoPorSlug(tipo);
  const tiposPresentes = TIPOS_CLUBE.filter((t) => clubes.some((c) => c.tipo === t.tipo));
  const provincias = [...new Set(clubes.map((c) => c.provincia).filter(Boolean))].sort((a, b) =>
    a === "Luanda" ? -1 : b === "Luanda" ? 1 : a.localeCompare(b),
  );
  const provinciaActiva = provincias.find((p) => p === provincia);

  const lista = clubes.filter(
    (c) => (!tipoActivo || c.tipo === tipoActivo.tipo) && (!provinciaActiva || c.provincia === provinciaActiva),
  );
  const ladyRiders = clubes.filter((c) => c.tipo === "Lady Riders" || /presidido por uma motociclista/i.test(c.descricao));

  // Ligações dos filtros, mantendo o outro filtro escolhido.
  const ligacao = (t?: string, p?: string) => {
    const q = new URLSearchParams();
    if (t) q.set("tipo", t);
    if (p) q.set("provincia", p);
    const s = q.toString();
    return `/clubes${s ? `?${s}` : ""}`;
  };

  return (
    <PaginaInterior icone={<Users />}>
      <Abertura
        foto="banner-clubes"
        sobretitulo="Clubes de Angola"
        titulo="Quem anda de mota em grupo"
        texto="Grupos de passeio, Lady Riders, scooters e clássicas, raides pelo país e viagens além-fronteiras. Os clubes de motas de Angola, todos no mesmo sítio."
      >
        <div className="flex flex-wrap gap-[var(--intervalo)]">
          <BotaoMB href="#lista">Encontrar um clube</BotaoMB>
          <BotaoMB href="#juntar" variante="escuro">Juntar o meu clube</BotaoMB>
        </div>
      </Abertura>

      {/* ---------- O movimento ---------- */}
      <Seccao>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Cabecalho
            icone={<Flag />}
            titulo="Andar de mota por gosto, em Angola"
            texto={
              <>
                <p>
                  O movimento motard angolano ganhou forma no início dos anos 2000, com grupos de amigos que saíam
                  juntos por Luanda. Em 2006, os Amigos da Picada atravessaram a fronteira pela primeira vez, numa
                  viagem em grupo até à Namíbia, e abriram caminho a uma ideia simples: conhecer Angola de mota.
                </p>
                <p className="mt-4">
                  Hoje há saídas de domingo à volta das cidades, raides a Malanje, a Benguela ou ao Soyo, viagens
                  além-fronteiras e acções solidárias em hospitais e comunidades. Em Julho de 2026, o primeiro Dia do
                  Motard Angolano juntou os clubes no Autódromo de Luanda.
                </p>
              </>
            }
          />
          <Numeros
            className="self-end"
            itens={[
              { valor: clubes.length, texto: "clubes e grupos na MotoBox" },
              { valor: provincias.length, texto: "províncias com sede publicada" },
              { valor: ladyRiders.length, texto: "clubes de mulheres ou presididos por mulheres" },
              { valor: 2006, texto: "a primeira viagem em grupo além-fronteiras" },
            ]}
          />
        </div>
      </Seccao>

      {/* ---------- Lista ---------- */}
      <Seccao id="lista" className="!pt-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="titulo-2">Todos os clubes</h2>
          <p className="text-sm text-white/60">
            {lista.length} {lista.length === 1 ? "clube" : "clubes"}
            {tipoActivo ? ` · ${tipoActivo.nome}` : ""}
            {provinciaActiva ? ` · ${provinciaActiva}` : ""}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Pilulas
            rotulo="Tipo de clube"
            activa={tipoActivo?.slug ?? "todos"}
            itens={[
              { chave: "todos", texto: "Todos os tipos", href: ligacao(undefined, provinciaActiva) },
              ...tiposPresentes.map((t) => ({ chave: t.slug, texto: t.nome, href: ligacao(t.slug, provinciaActiva) })),
            ]}
          />
          {provincias.length > 1 && (
            <Pilulas
              rotulo="Província"
              activa={provinciaActiva ?? "todas"}
              itens={[
                { chave: "todas", texto: "Todo o país", href: ligacao(tipoActivo?.slug) },
                ...provincias.map((p) => ({ chave: p, texto: p, href: ligacao(tipoActivo?.slug, p) })),
              ]}
            />
          )}
        </div>

        {lista.length ? (
          <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
            {lista.map((c) => (
              <CartaoClube key={c.slug} clube={c} />
            ))}
          </div>
        ) : (
          <div className="painel painel-escuro mt-8 p-10">
            <p className="text-white/75">Ainda não há clubes com este filtro.</p>
            <Link href="#juntar" className="mt-4 inline-flex items-center gap-2 text-sm">
              <span className="sublinhado">Conhece um? Junte-o à MotoBox</span>
            </Link>
          </div>
        )}
        <p className="mt-4 text-xs text-white/45">
          Informação recolhida nas páginas públicas dos clubes. Fotografias de capa ilustrativas.
        </p>
      </Seccao>

      {/* ---------- Lady Riders ---------- */}
      <Seccao className="!pt-4">
        <CartaoNumerado
          numero={<Venus className="size-5" aria-hidden />}
          sobretitulo="Lady Riders"
          titulo="Elas também conduzem"
          foto="clube-ladies-in-2-wheels"
          href="/clubes?tipo=lady-riders"
        >
          Há motociclistas angolanas a viajar juntas pelo país e além-fronteiras: as Ladies in 2 Wheels in Angola já
          rodaram até à Namíbia, ao Botswana e à África do Sul, com a filantropia na bagagem. E há clubes mistos
          presididos por mulheres, como o Clube Anjos Bantu.
        </CartaoNumerado>
      </Seccao>

      {/* ---------- Antes do primeiro passeio ---------- */}
      <Seccao className="!pt-4">
        <Cabecalho
          titulo="Antes do primeiro passeio em grupo"
          texto="Entrar num clube é mais fácil do que parece. Estes três passos ajudam."
        />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-3">
          <CartaoIcone icone={<Users />} titulo="Siga e apareça">
            Siga o clube nas redes e vá a um encontro aberto. A maior parte dos clubes recebe bem quem chega com
            vontade de rodar.
          </CartaoIcone>
          <CartaoIcone icone={<Route />} titulo="Conheça as regras do grupo">
            Líder à frente, fecho atrás, ziguezague nas rectas e fila indiana nas curvas.{" "}
            <Link href="/artigos/andar-em-grupo-regras" className="sublinhado text-white">Ler as regras</Link>
          </CartaoIcone>
          <CartaoIcone icone={<HeartHandshake />} titulo="Vá equipado">
            Capacete homologado e apertado, luvas, casaco e calçado fechado. E a mota verificada antes de sair.{" "}
            <Link href="/seguranca" className="sublinhado text-white">Ver segurança</Link>
          </CartaoIcone>
        </div>
      </Seccao>

      {/* ---------- Rotas ---------- */}
      <Seccao className="!pt-4">
        <Cabecalho
          icone={<MapPinned />}
          titulo="Para onde ir de mota"
          texto="Da Serra da Leba às quedas de Kalandula: estrada, piso, melhor época e cuidados de cada destino, com as fontes à vista."
          accao={{ href: "/rotas", texto: "Todas as rotas" }}
        />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-3">
          {ROTAS.slice(0, 3).map((r) => (
            <Link key={r.slug} href={`/rotas/${r.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
              <Foto nome={[r.slug, r.imagem]} className="aspect-[4/3]" largura={700} tamanhos="(max-width: 768px) 100vw, 33vw" />
              <div className="flex items-end justify-between gap-4 p-4 md:p-5">
                <div>
                  <p className="text-[0.8125rem] text-white/60">{r.regiao}</p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug">{r.nome}</h3>
                  <p className="mt-1 text-[0.8125rem] text-white/60">{r.piso} · {r.exigencia}</p>
                </div>
                <Seta className="mb-1 size-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </Seccao>

      {/* ---------- Juntar um clube ---------- */}
      <Seccao id="juntar" className="!pt-4">
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-[1fr_1.5fr]">
          <div className="flex min-h-80 flex-col rounded-[var(--raio)] bg-mb-red p-6 md:p-8">
            <Chip className="!bg-white/15"><Users /></Chip>
            <h2 className="titulo-3 mt-auto max-w-[14ch] pt-16">Tem um clube? Junte-o à MotoBox</h2>
            <ul className="mt-6 space-y-2 text-[15px] text-white/90">
              <li>Página própria do clube, com as redes e o contacto</li>
              <li>Os vossos passeios e encontros na secção Eventos</li>
              <li>É gratuito, e a equipa confirma os dados antes de publicar</li>
            </ul>
          </div>
          <div className="painel painel-escuro p-6 md:p-10">
            <JuntarClube />
          </div>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
