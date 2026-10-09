import type { Metadata } from "next";
import Link from "next/link";
import { Flag, HeartHandshake, MapPinned, Route, Users, Venus } from "lucide-react";
import { lerClubes } from "@/lib/supabase/publico";
import { comResumoDe, normalizarPerfil, type PerfilClube } from "@/lib/clubes-perfis";
import { lerDoc, lerGrupo, lerListaDados } from "@/lib/conteudo";
import type { ConteudoPaginaClubes } from "@/lib/conteudo/grupos/clubes";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import {
  Abertura, BotaoMB, Cabecalho, CartaoIcone, CartaoNumerado, Numeros, Pilulas, Seccao,
} from "@/components/painel/blocos";
import { Chip, Foto, Seta } from "@/components/painel/kit";
import { JuntarClube } from "./JuntarClube";
import { CartaoClube } from "./Partes";
import { TIPOS_CLUBE, eMovimento, tipoPorSlug } from "./comum";
import { fotoDe } from "@/app/eventos/foto";

/** O que o cartão de rota precisa (as rotas vêm do conteúdo editável). */
type RotaCartao = { slug: string; nome: string; imagem?: string; regiao: string; piso: string; exigencia: string };

/** Ícones dos primeiros passos, pela ordem dos cartões (repetem-se se houver mais cartões). */
const ICONES_PASSOS = [Users, Route, HeartHandshake];

// Os textos fixos desta página editam-se no painel: Clubes e movimentos → Página Clubes.
export async function generateMetadata(): Promise<Metadata> {
  const t = await lerDoc<ConteudoPaginaClubes>("paginas.clubes");
  return { title: "Clubes", description: t.descricaoPesquisa };
}

export default async function Clubes({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; provincia?: string }>;
}) {
  const { tipo, provincia } = await searchParams;
  const [t, perfisGravados, rotas] = await Promise.all([
    lerDoc<ConteudoPaginaClubes>("paginas.clubes"),
    lerGrupo<PerfilClube>("clubes-perfis"),
    lerListaDados<RotaCartao>("rotas"),
  ]);
  // A linha de apresentação dos cartões vem do perfil alargado (editável no painel).
  const perfis = new Map(perfisGravados.map((d) => [d.chave, normalizarPerfil(d.dados)]));
  const todos = (await lerClubes()).map(comResumoDe(perfis));
  // Os movimentos (ex.: Lady Riders) têm secção própria: não são clubes.
  const clubes = todos.filter((c) => !eMovimento(c));
  const movimentos = todos.filter(eMovimento);

  const tipoActivo = tipoPorSlug(tipo);
  const tiposPresentes = TIPOS_CLUBE.filter((tp) => clubes.some((c) => c.tipo === tp.tipo));
  const provincias = [...new Set(clubes.map((c) => c.provincia).filter(Boolean))].sort((a, b) =>
    a === "Luanda" ? -1 : b === "Luanda" ? 1 : a.localeCompare(b),
  );
  const provinciaActiva = provincias.find((p) => p === provincia);

  const lista = clubes.filter(
    (c) => (!tipoActivo || c.tipo === tipoActivo.tipo) && (!provinciaActiva || c.provincia === provinciaActiva),
  );
  const mulheres = todos.filter((c) => eMovimento(c) || c.tipo === "Lady Riders" || /presidido por uma motociclista/i.test(c.descricao));

  // O movimento com o cartão grande (as Lady Riders, escolhido no painel).
  const destaque = t.movimentoDestaque;
  // As rotas de "Para onde ir de mota": as escolhidas no painel ou, sem escolha, as três primeiras.
  const escolhidas = (t.rotasEscolhidas ?? [])
    .map((s) => rotas.find((r) => r.slug === s))
    .filter((r): r is RotaCartao => Boolean(r));
  const rotasMostradas = escolhidas.length ? escolhidas : rotas.slice(0, 3);

  // Ligações dos filtros, mantendo o outro filtro escolhido.
  const ligacao = (tp?: string, p?: string) => {
    const q = new URLSearchParams();
    if (tp) q.set("tipo", tp);
    if (p) q.set("provincia", p);
    const s = q.toString();
    return `/clubes${s ? `?${s}` : ""}`;
  };

  return (
    <PaginaInterior icone={<Users />}>
      <Abertura foto={t.foto} sobretitulo={t.sobretitulo} titulo={t.titulo} texto={t.texto}>
        <div className="flex flex-wrap gap-[var(--intervalo)]">
          <BotaoMB href="#lista">{t.botaoLista}</BotaoMB>
          <BotaoMB href="#juntar" variante="escuro">{t.botaoJuntar}</BotaoMB>
        </div>
      </Abertura>

      {/* ---------- O movimento ---------- */}
      <Seccao>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Cabecalho
            icone={<Flag />}
            titulo={t.introTitulo}
            texto={
              <>
                {(t.introParagrafos ?? []).map((p, i) => (
                  <p key={i} className={i > 0 ? "mt-4" : undefined}>{p}</p>
                ))}
              </>
            }
          />
          <Numeros
            className="self-end"
            itens={[
              { valor: clubes.length, texto: t.numeroClubes },
              { valor: provincias.length, texto: t.numeroProvincias },
              { valor: mulheres.length, texto: t.numeroMulheres },
              ...(t.numeroFixoValor ? [{ valor: t.numeroFixoValor, texto: t.numeroFixoTexto }] : []),
            ]}
          />
        </div>
      </Seccao>

      {/* ---------- Lista ---------- */}
      <Seccao id="lista" className="!pt-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="titulo-2">{t.listaTitulo}</h2>
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
              { chave: "todos", texto: t.listaTodosTipos, href: ligacao(undefined, provinciaActiva) },
              ...tiposPresentes.map((tp) => ({ chave: tp.slug, texto: tp.nome, href: ligacao(tp.slug, provinciaActiva) })),
            ]}
          />
          {provincias.length > 1 && (
            <Pilulas
              rotulo="Província"
              activa={provinciaActiva ?? "todas"}
              itens={[
                { chave: "todas", texto: t.listaTodoPais, href: ligacao(tipoActivo?.slug) },
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
            <p className="text-white/75">{t.listaVazio}</p>
            <Link href="#juntar" className="mt-4 inline-flex items-center gap-2 text-sm">
              <span className="sublinhado">{t.listaVazioLigacao}</span>
            </Link>
          </div>
        )}
        {t.listaNota && <p className="mt-4 text-xs text-white/45">{t.listaNota}</p>}
      </Seccao>

      {/* ---------- Movimentos ---------- */}
      {movimentos.length > 0 && (
        <Seccao id="movimentos" className="!pt-4">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="titulo-2">{t.movimentosTitulo}</h2>
            <p className="max-w-[52ch] text-sm text-white/60">{t.movimentosTexto}</p>
          </div>
          {/* O movimento em destaque tem o cartão grande; os outros, em cartões. */}
          {movimentos.some((c) => c.slug === destaque) && (
            <div className="mt-8">
              <CartaoNumerado
                numero={<Venus className="size-5" aria-hidden />}
                sobretitulo={t.movimentoSobretitulo}
                titulo={t.movimentoTitulo}
                foto={t.movimentoFoto}
                href={`/clubes/${destaque}`}
              >
                {t.movimentoTexto}
              </CartaoNumerado>
            </div>
          )}
          {movimentos.some((c) => c.slug !== destaque) && (
            <div className="mt-[var(--intervalo)] grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
              {movimentos.filter((c) => c.slug !== destaque).map((c) => (
                <CartaoClube key={c.slug} clube={c} />
              ))}
            </div>
          )}
        </Seccao>
      )}

      {/* ---------- Antes do primeiro passeio ---------- */}
      <Seccao className="!pt-4">
        <Cabecalho titulo={t.passosTitulo} texto={t.passosTexto} />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-3">
          {(t.passos ?? []).map((p, i) => {
            const Icone = ICONES_PASSOS[i % ICONES_PASSOS.length];
            return (
              <CartaoIcone key={i} icone={<Icone />} titulo={p.titulo}>
                {p.texto}
                {p.ligacao && p.ligacaoTexto && (
                  <>
                    {" "}
                    <Link href={p.ligacao} className="sublinhado text-white">{p.ligacaoTexto}</Link>
                  </>
                )}
              </CartaoIcone>
            );
          })}
        </div>
      </Seccao>

      {/* ---------- Rotas ---------- */}
      {t.rotasMostrar && rotasMostradas.length > 0 && (
        <Seccao className="!pt-4">
          <Cabecalho
            icone={<MapPinned />}
            titulo={t.rotasTitulo}
            texto={t.rotasTexto}
            accao={{ href: "/rotas", texto: t.rotasLigacao }}
          />
          <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-3">
            {rotasMostradas.map((r) => (
              <Link key={r.slug} href={`/rotas/${r.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
                <Foto nome={fotoDe(r.slug, r.imagem)} className="aspect-[4/3]" largura={700} tamanhos="(max-width: 768px) 100vw, 33vw" />
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
      )}

      {/* ---------- Juntar um clube ---------- */}
      <Seccao id="juntar" className="!pt-4">
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-[1fr_1.5fr]">
          <div className="flex min-h-80 flex-col rounded-[var(--raio)] bg-mb-red p-6 md:p-8">
            <Chip className="!bg-white/15"><Users /></Chip>
            <h2 className="titulo-3 mt-auto max-w-[14ch] pt-16">{t.juntarTitulo}</h2>
            {(t.juntarVantagens ?? []).length > 0 && (
              <ul className="mt-6 space-y-2 text-[15px] text-white/90">
                {t.juntarVantagens.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="painel painel-escuro p-6 md:p-10">
            <JuntarClube botao={t.juntarBotao} nota={t.juntarNota} sucesso={t.juntarSucesso} />
          </div>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
