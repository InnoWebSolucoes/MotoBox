import type { Metadata } from "next";
import Link from "next/link";
import { Brain, Clock, EyeOff, FileText, Flame, Phone, ShieldCheck, TrendingUp } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Seccao } from "@/components/painel/blocos";
import { Foto } from "@/components/painel/kit";
import { lerDoc } from "@/lib/conteudo";
import { SEGURANCA_PADRAO, type ConteudoSeguranca } from "@/lib/conteudo/grupos/paginas";
import { fundir } from "@/lib/conteudo/grupos/site";
import type { Bi, ParteCapacete, ZonaCorpo } from "./conteudo";
import { Capitulos } from "./_componentes/Capitulos";
import { Contador } from "./_componentes/Contador";
import { Capacete } from "./_componentes/Capacete";
import { Chuva } from "./_componentes/Chuva";
import { Visibilidade } from "./_componentes/Visibilidade";
import { Equipamento } from "./_componentes/Equipamento";
import { Verificacao } from "./_componentes/Verificacao";
import { Grupo } from "./_componentes/Grupo";
import { Acidente } from "./_componentes/Acidente";
import { Historias } from "./_componentes/Historias";
import { Quiz } from "./_componentes/Quiz";
import { Separadores } from "./_componentes/Separadores";
import { EmVista } from "./_componentes/EmVista";
import { Refs, preencher } from "./_componentes/comum";
import s from "./seguranca.module.css";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

/* O texto vive no conteúdo editável ("paginas.seguranca", editado em
   Gestão › Páginas); ./conteudo.ts é o texto de partida. */
async function lerSeguranca(): Promise<ConteudoSeguranca> {
  return fundir(SEGURANCA_PADRAO, await lerDoc<ConteudoSeguranca>("paginas.seguranca"));
}

export async function generateMetadata(): Promise<Metadata> {
  const { SEO } = await lerSeguranca();
  return { title: SEO.titulo, description: SEO.descricao };
}

const t = (b: Bi | string | undefined) => (typeof b === "string" ? b : b?.pt ?? "");
const lista = <T,>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);
const dois = (n: number) => String(n).padStart(2, "0");

const ICONES_CABECA: Record<string, React.ReactNode> = {
  eyeOff: <EyeOff />,
  trending: <TrendingUp />,
  clock: <Clock />,
  fire: <Flame />,
};

const PARTES_CAPACETE: ParteCapacete[] = ["calota", "espuma", "forro", "viseira", "correia", "etiqueta"];
const ZONAS_POR_ORDEM: ZonaCorpo[] = ["casaco", "luvas", "calcas", "botas"];

/* ---------------- Peças da página ---------------- */

/** "01 ─── Capacete": o arranque de cada capítulo. */
function Capitulo({ id, n, total, nome, rotulo, children }: {
  id: string;
  n: number;
  total: number;
  nome: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <Seccao id={id} className={s.capitulo}>
      <div className={`${s.cabeca} mb-8 lg:mb-10`}>
        <span aria-hidden className={s.numero}>
          {dois(n)}
        </span>
        <p className="pb-0.5 text-[15px] leading-none text-white">
          <span className="sr-only">{preencher(rotulo, { n, total })}: </span>
          {nome}
        </p>
        <span aria-hidden className={s.linha} />
      </div>
      {children}
    </Seccao>
  );
}

function Titulo({ titulo, texto, className = "" }: { titulo: string; texto?: string; className?: string }) {
  return (
    <div className={className}>
      <h2 className="titulo-2 max-w-[20ch] text-balance">{titulo}</h2>
      {texto && <p className="texto-lead mt-5 max-w-[50ch] text-white/90">{texto}</p>}
    </div>
  );
}

function Lista({ itens, className = "" }: { itens: Bi[]; className?: string }) {
  return (
    <ul className={`space-y-3 text-[15px] leading-relaxed text-white/90 ${className}`}>
      {itens.map((i, n) => (
        <li key={n} className="flex gap-3">
          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-mb-red" />
          {t(i)}
        </li>
      ))}
    </ul>
  );
}

function Lei({ texto, fonte }: { texto: Bi; fonte: Bi }) {
  return (
    <figure className="mt-8 max-w-[60ch] border-l-2 border-mb-red pl-5">
      <blockquote className="text-lg leading-relaxed text-white">{t(texto)}</blockquote>
      <figcaption className="mt-2 text-sm text-white/80">{t(fonte)}</figcaption>
    </figure>
  );
}

/* ---------------- Página ---------------- */

export default async function Seguranca() {
  const {
    ACIDENTE, CABECA, CAPACETE, CHUVA, EQUIPAMENTO, FONTES, FOTOS, GRUPO, HISTORIAS, NUMEROS, PASSAGEIROS, QUIZ, SECCOES,
    SEGURO, UI, VERIFICACAO, VISIBILIDADE,
  } = await lerSeguranca();

  // As 11 secções, pela ordem de partida; um nome por gravar fica com o de partida.
  const seccoes = SEGURANCA_PADRAO.SECCOES.map((p) => ({
    id: p.id,
    nome: t(lista(SECCOES).find((x) => x.id === p.id)?.nome ?? p.nome) || t(p.nome),
  }));
  const total = seccoes.length;
  const num = (id: string) => seccoes.findIndex((x) => x.id === id) + 1;
  const nome = (id: string) => seccoes.find((x) => x.id === id)?.nome ?? "";
  const fontes = lista(FONTES);
  const ref = { total: fontes.length, rotulo: t(UI.verFonte) };
  const cap = (id: string) => ({ id, n: num(id), total, nome: nome(id), rotulo: t(UI.capituloDe) });

  return (
    <PaginaInterior icone={<ShieldCheck />}>
      <Abertura
        foto={FOTOS.abertura}
        sobretitulo={t(UI.eyebrow)}
        titulo={
          <>
            {t(UI.titulo1)} <span className="text-mb-red-light">{t(UI.titulo2)}</span>
          </>
        }
        tamanho="2"
        texto={t(UI.sub)}
      >
        <BotaoMB href="#capacete">{t(UI.comecar)}</BotaoMB>
      </Abertura>

      {/* ---------- Números e mapa da página ---------- */}
      <Seccao>
        <dl className="grid gap-[var(--intervalo)] sm:grid-cols-3">
          {lista(NUMEROS).map((n, i) => (
            <div key={i} className="painel painel-escuro flex min-h-44 flex-col justify-end p-6 lg:min-h-52 lg:p-7">
              <dt className="sr-only">{t(n.texto)}</dt>
              <dd>
                <span className="block text-[3.25rem] font-semibold leading-none tracking-tight lg:text-6xl">
                  {t(n.prefixo) && <span className="mr-2 text-xl font-normal text-white/85">{t(n.prefixo)}</span>}
                  <Contador valor={n.valor} />
                </span>
                <span className="mt-3 block text-[15px] leading-snug text-white">{t(n.texto)}</span>
                <span className="mt-2 block text-xs text-white/80">
                  {t(UI.fonte)}: {t(n.fonte)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <nav aria-label={t(UI.nestaPagina)} className="mt-10">
          <h2 className="text-sm text-white/85">{t(UI.nestaPagina)}</h2>
          <ol className="mt-4 flex flex-wrap gap-2">
            {seccoes.map((c, i) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="pilula text-white">
                  <span className="tabular-nums text-white/75">{dois(i + 1)}</span> {c.nome}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Seccao>

      <Capitulos seccoes={seccoes} rotulos={{ nav: t(UI.nestaPagina), capitulos: t(UI.capitulos), capituloDe: t(UI.capituloDe) }}>
        {/* ---------- 01 Capacete ---------- */}
        <Capitulo {...cap("capacete")}>
          <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-14">
            <div>
              <Titulo titulo={t(CAPACETE.titulo)} texto={t(CAPACETE.lead)} />
              <Lei texto={CAPACETE.lei} fonte={CAPACETE.leiFonte} />
            </div>
            <figure>
              <Foto nome={FOTOS.capacete} alt={t(CAPACETE.fotoLegenda)} className="aspect-[4/3]" largura={900} />
              <figcaption className="mt-2 text-xs text-white/80">{t(CAPACETE.fotoLegenda)}</figcaption>
            </figure>
          </div>
          <div className={`${s.palco} painel painel-escuro mt-10`}>
            <Capacete
              partes={lista(CAPACETE.anatomia)
                .filter((p) => PARTES_CAPACETE.includes(p.id))
                .map((p) => ({ id: p.id, nome: t(p.nome), texto: t(p.texto), fontes: lista(p.fontes) }))}
              titulo={t(CAPACETE.anatomiaTitulo)}
              texto={t(CAPACETE.anatomiaTexto)}
              descricao={t(CAPACETE.anatomiaDescricao)}
              anterior={t(CAPACETE.anatomiaAnterior)}
              seguinte={t(CAPACETE.anatomiaSeguinte)}
              totalFontes={ref.total}
              rotuloFonte={ref.rotulo}
            />
          </div>
          <div className="mt-[var(--intervalo)]">
            <Separadores
              rotulo={nome("capacete")}
              abas={lista(CAPACETE.grupos).map((g) => ({
                titulo: t(g.titulo),
                conteudo: (
                  <div className="painel painel-escuro p-6 md:p-8">
                    <Lista itens={lista(g.itens)} className="md:columns-2 md:gap-10 md:space-y-0 [&>li]:md:mb-4 [&>li]:break-inside-avoid" />
                  </div>
                ),
              }))}
            />
          </div>
        </Capitulo>

        {/* ---------- 02 Chuva ---------- */}
        <Capitulo {...cap("chuva")}>
          <Titulo titulo={t(CHUVA.titulo)} texto={t(CHUVA.lead)} />
          <div className={`${s.palco} mt-10`}>
            <Chuva
              numero={CHUVA.numero}
              numeroTexto={t(CHUVA.numeroTexto)}
              numeroFonte={t(CHUVA.numeroFonte)}
              fonteRotulo={t(UI.fonte)}
              travagem={{
                titulo: t(CHUVA.travagem.titulo),
                texto: t(CHUVA.travagem.texto),
                velocidade: t(CHUVA.travagem.velocidade),
                seco: t(CHUVA.travagem.seco),
                molhado: t(CHUVA.travagem.molhado),
                reaccao: t(CHUVA.travagem.reaccao),
                travar: t(CHUVA.travagem.travar),
                noMinimo: t(CHUVA.travagem.noMinimo),
                velocidades: lista(CHUVA.travagem.velocidades),
                nota: t(CHUVA.travagem.nota),
                fontes: lista(CHUVA.travagem.fontes),
              }}
              totalFontes={ref.total}
              rotuloFonte={ref.rotulo}
            />
          </div>
          <ol className="mt-[var(--intervalo)] grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
            {lista(CHUVA.dicas).map((d, i) => (
              <li key={i} className="painel painel-escuro flex gap-4 p-5 md:p-6">
                <span aria-hidden className="text-2xl font-semibold leading-none tabular-nums text-mb-red-light">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-lg font-semibold leading-snug text-white">{t(d.titulo)}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-white/90">{t(d.texto)}</span>
                </span>
              </li>
            ))}
          </ol>
        </Capitulo>

        {/* ---------- 03 Visibilidade ---------- */}
        <Capitulo {...cap("visibilidade")}>
          <Titulo titulo={t(VISIBILIDADE.titulo)} texto={t(VISIBILIDADE.lead)} />
          <div className="mt-10 grid gap-[var(--intervalo)] lg:grid-cols-[1.35fr_1fr]">
            <div className={`${s.palco} painel painel-escuro p-5 md:p-7`}>
              <Visibilidade
                cena={{
                  titulo: t(VISIBILIDADE.cena.titulo),
                  dia: t(VISIBILIDADE.cena.dia),
                  noite: t(VISIBILIDADE.cena.noite),
                  escuro: t(VISIBILIDADE.cena.escuro),
                  visivel: t(VISIBILIDADE.cena.visivel),
                  diaEscuro: t(VISIBILIDADE.cena.diaEscuro),
                  diaVisivel: t(VISIBILIDADE.cena.diaVisivel),
                  noiteEscuro: t(VISIBILIDADE.cena.noiteEscuro),
                  noiteVisivel: t(VISIBILIDADE.cena.noiteVisivel),
                  nota: t(VISIBILIDADE.cena.nota),
                  descricao: t(VISIBILIDADE.cena.descricao),
                  fontes: lista(VISIBILIDADE.cena.fontes),
                }}
                totalFontes={ref.total}
                rotuloFonte={ref.rotulo}
              />
            </div>
            <div className="painel painel-escuro p-6 md:p-8">
              <Lista itens={lista(VISIBILIDADE.dicas)} />
            </div>
          </div>
        </Capitulo>

        {/* ---------- 04 Equipamento ---------- */}
        <Capitulo {...cap("equipamento")}>
          <Titulo titulo={t(EQUIPAMENTO.titulo)} texto={t(EQUIPAMENTO.lead)} />
          <div className={`${s.palco} painel painel-escuro mt-10`}>
            <Equipamento
              pecas={lista(EQUIPAMENTO.pecas).map((p, i) => ({
                nome: t(p.nome),
                texto: t(p.texto),
                zona: p.zona && ZONAS_POR_ORDEM.includes(p.zona) ? p.zona : ZONAS_POR_ORDEM[i] ?? "casaco",
                norma: p.norma ?? "",
              }))}
              titulo={t(EQUIPAMENTO.figuraTitulo)}
              texto={t(EQUIPAMENTO.figuraTexto)}
              descricao={t(EQUIPAMENTO.figuraDescricao)}
              normaRotulo={t(EQUIPAMENTO.normaRotulo)}
            />
          </div>
          <div className="mt-[var(--intervalo)] painel painel-escuro p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white">{t(EQUIPAMENTO.numerosTitulo)}</h3>
            <dl className="mt-6 space-y-6">
              {lista(EQUIPAMENTO.numeros).map((n, i) => {
                const pct = Math.min(100, Math.abs(parseFloat(String(n.valor).replace(/[^\d.,]/g, "").replace(",", "."))) || 0);
                return (
                  <div key={i} className="grid grid-cols-[5.75rem_1fr] items-center gap-4 md:grid-cols-[8rem_1fr] md:gap-6">
                    <dt className="text-[2rem] font-semibold leading-none tracking-tight md:text-5xl">
                      <Contador valor={n.valor} />
                    </dt>
                    <dd>
                      <span className="block text-[15px] leading-snug text-white">{t(n.texto)}</span>
                      <span aria-hidden className="mt-2.5 block h-2 overflow-hidden rounded-full bg-white/10">
                        <span className={`${s.cresce} block h-full rounded-full bg-mb-red`} style={{ width: `${pct}%` }} />
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-6 text-xs text-white/80">
              {t(UI.fonte)}: {t(EQUIPAMENTO.estudo)}
              <Refs fontes={lista(EQUIPAMENTO.fontes)} {...ref} />
            </p>
          </div>
          <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-white/85">{t(EQUIPAMENTO.etiquetas)}</p>
        </Capitulo>

        {/* ---------- 05 Passageiros ---------- */}
        <Capitulo {...cap("passageiros")}>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            <div>
              <Titulo titulo={t(PASSAGEIROS.titulo)} texto={t(PASSAGEIROS.lead)} />
              <Lei texto={PASSAGEIROS.lei} fonte={PASSAGEIROS.leiFonte} />
            </div>
            <div className="grid gap-[var(--intervalo)]">
              {PASSAGEIROS.destaque?.valor && (
                <div className={`${s.palco} flex items-end gap-5 rounded-[var(--raio)] bg-mb-red p-6`}>
                  <span className="text-[5.5rem] font-semibold leading-[0.8] tracking-tighter">{PASSAGEIROS.destaque.valor}</span>
                  <span className="pb-1">
                    <span className="block text-xl font-semibold leading-none">{t(PASSAGEIROS.destaque.unidade)}</span>
                    <span className="mt-2 block text-[15px] leading-snug text-white">{t(PASSAGEIROS.destaque.texto)}</span>
                  </span>
                </div>
              )}
              <div className="painel painel-escuro p-6 lg:p-8">
                <Lista itens={lista(PASSAGEIROS.dicas)} />
              </div>
            </div>
          </div>
        </Capitulo>

        {/* ---------- 06 Cabeça fria ---------- */}
        <Capitulo {...cap("cabeca")}>
          <Titulo titulo={t(CABECA.titulo)} texto={t(CABECA.lead)} />
          <div className={`${s.palco} mt-10 grid gap-[var(--intervalo)] md:grid-cols-2`}>
            {lista(CABECA.temas).map((tema, i) => {
              const destaque = t(tema.destaque);
              return (
                <div key={i} className="painel painel-escuro flex flex-col p-6 lg:p-8">
                  <span aria-hidden className="text-white [&_svg]:size-7">
                    {ICONES_CABECA[tema.icone] ?? <Brain />}
                  </span>
                  <p className={`mt-8 font-semibold leading-none tracking-tight text-mb-red-light ${destaque.length > 12 ? "text-3xl" : "text-5xl"}`}>
                    {destaque}
                  </p>
                  <h3 className="mt-5 text-xl font-semibold text-white">{t(tema.titulo)}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/90">{t(tema.texto)}</p>
                </div>
              );
            })}
          </div>
        </Capitulo>

        {/* ---------- 07 Antes de sair ---------- */}
        <Capitulo {...cap("verificacao")}>
          <Titulo titulo={t(VERIFICACAO.titulo)} texto={t(VERIFICACAO.lead)} />
          <div className={`${s.palco} mt-10`}>
            <Verificacao
              itens={lista(VERIFICACAO.itens).map((i) => ({ letra: i.letra, nome: t(i.nome), texto: t(i.texto) }))}
              rotulos={{
                progresso: t(VERIFICACAO.progresso),
                falta: t(VERIFICACAO.falta),
                pronto: t(VERIFICACAO.pronto),
                prontoTexto: t(VERIFICACAO.prontoTexto),
                recomecar: t(VERIFICACAO.recomecar),
                memoria: t(VERIFICACAO.memoria),
              }}
            />
          </div>
        </Capitulo>

        {/* ---------- 08 Em grupo ---------- */}
        <Capitulo {...cap("grupo")}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
            <div>
              <Titulo titulo={t(GRUPO.titulo)} texto={t(GRUPO.lead)} />
              <Lista itens={lista(GRUPO.dicas)} className="mt-8" />
              <div className="mt-8">
                <BotaoMB href="/clubes" variante="escuro">
                  {t(GRUPO.clubes)}
                </BotaoMB>
              </div>
            </div>
            <figure className={`${s.palco} painel painel-escuro self-start p-6 md:p-8`}>
              <Grupo
                titulo={t(GRUPO.diagramaTitulo)}
                sentido={t(GRUPO.diagramaSentido)}
                lider={t(GRUPO.diagramaLider)}
                fecho={t(GRUPO.diagramaFecho)}
                descricaoRecta={t(GRUPO.diagramaDescricao)}
                descricaoCurva={t(GRUPO.diagramaDescricaoCurva)}
                modoRecta={t(GRUPO.modoRecta)}
                modoCurva={t(GRUPO.modoCurva)}
                legendaRecta={t(GRUPO.legendaRecta)}
                legendaCurva={t(GRUPO.legendaCurva)}
                umSegundo={t(GRUPO.umSegundo)}
                doisSegundos={t(GRUPO.doisSegundos)}
              />
              {t(GRUPO.diagramaFonte) && (
                <figcaption className="mt-3 text-xs text-white/80">
                  {t(UI.fonte)}: {t(GRUPO.diagramaFonte)}
                  <Refs fontes={lista(GRUPO.fontes)} {...ref} />
                </figcaption>
              )}
            </figure>
          </div>
        </Capitulo>

        {/* ---------- 09 Acidente ---------- */}
        <Capitulo {...cap("acidente")}>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <Titulo titulo={t(ACIDENTE.titulo)} texto={t(ACIDENTE.lead)} />
            <EmVista>
              <a
                href={`tel:${ACIDENTE.numero}`}
                className={`${s.ligar} relative flex min-h-48 flex-col justify-end rounded-[var(--raio)] bg-mb-red p-6 transition-colors hover:bg-mb-red-dark`}
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="text-7xl font-semibold leading-none tracking-tight">{ACIDENTE.numero}</span>
                  <span className="inline-flex h-11 items-center gap-2 rounded-[var(--raio)] bg-white px-4 text-sm font-semibold text-[#1d1d23]">
                    <Phone aria-hidden className="size-4" />
                    {t(ACIDENTE.ligar)}
                  </span>
                </span>
                <span className="mt-4 text-[15px] leading-snug text-white">{t(ACIDENTE.numeroTexto)}</span>
                <span className="mt-2 text-sm text-white/90">{t(ACIDENTE.numeroDica)}</span>
              </a>
            </EmVista>
          </div>
          <div className={`${s.palco} mt-10`}>
            <Acidente
              passos={lista(ACIDENTE.passos).map((p) => ({ nome: t(p.nome), itens: lista(p.itens).map(t) }))}
              rotulos={{
                passoDe: t(ACIDENTE.passoDe),
                anterior: t(ACIDENTE.anterior),
                seguinte: t(ACIDENTE.seguinte),
                titulo: t(ACIDENTE.titulo),
              }}
            />
          </div>
          <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-white/85">
            {t(ACIDENTE.extra)}
            <Refs fontes={lista(ACIDENTE.fontes)} {...ref} />
          </p>
        </Capitulo>

        {/* ---------- 10 Seguro ---------- */}
        <Capitulo {...cap("seguro")}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
            <Titulo titulo={t(SEGURO.titulo)} texto={t(SEGURO.texto)} />
            <ul className={`${s.palco} grid gap-[var(--intervalo)] self-end`}>
              {lista(SEGURO.itens).map((item, i) => (
                <li key={i} className="painel painel-escuro flex gap-4 p-6">
                  <span aria-hidden className="chip-mb">
                    {i === 0 ? <ShieldCheck /> : <FileText />}
                  </span>
                  <span className="text-[15px] leading-relaxed text-white">{t(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Capitulo>

        {/* ---------- 11 Histórias ---------- */}
        <Capitulo {...cap("historias")}>
          <Titulo titulo={t(HISTORIAS.titulo)} texto={t(HISTORIAS.aviso)} />
          <div className={`${s.palco} mt-10`}>
            <Historias
              lista={lista(HISTORIAS.lista).map((h) => ({ titulo: t(h.titulo), texto: t(h.texto), licao: t(h.licao) }))}
              rotulos={{ titulo: t(HISTORIAS.titulo), licao: t(UI.licao), anterior: t(HISTORIAS.anterior), seguinte: t(HISTORIAS.seguinte) }}
            />
          </div>
          <div className="mt-10 flex flex-col gap-6 rounded-[var(--raio)] bg-mb-red p-6 md:flex-row md:items-end md:justify-between md:p-8">
            <div>
              <p className="titulo-4">{t(HISTORIAS.convite)}</p>
              <p className="mt-2 max-w-[56ch] text-[15px] text-white">{t(HISTORIAS.conviteTexto)}</p>
            </div>
            <div className="flex flex-wrap gap-[var(--intervalo)]">
              <Link href="/forum" className="inline-flex h-12 items-center rounded-[var(--raio)] bg-black/25 px-5 text-sm transition-colors hover:bg-black/40">
                {t(HISTORIAS.forum)}
              </Link>
              <Link href="/contacto" className="inline-flex h-12 items-center rounded-[var(--raio)] bg-white px-5 text-sm text-black transition-colors hover:bg-white/85">
                {t(HISTORIAS.contacto)}
              </Link>
            </div>
          </div>
        </Capitulo>
      </Capitulos>

      {/* ---------- Teste rápido ---------- */}
      <Seccao id="teste" className="scroll-mt-16 lg:scroll-mt-6">
        <Titulo titulo={t(QUIZ.titulo)} texto={t(QUIZ.texto)} className="mb-10" />
        <Quiz
          perguntas={lista(QUIZ.perguntas)
            .map((p) => {
              const opcoes = lista(p.opcoes).map(t).filter(Boolean);
              return {
                pergunta: t(p.pergunta),
                opcoes,
                certa: Math.min(Math.max(1, Math.round(Number(p.certa) || 1)), opcoes.length) - 1,
                explicacao: t(p.explicacao),
                seccao: seccoes.some((x) => x.id === p.seccao) ? p.seccao : "",
                seccaoNome: nome(p.seccao),
              };
            })
            .filter((p) => p.pergunta && p.opcoes.length > 1)}
          rotulos={{
            perguntaDe: t(QUIZ.perguntaDe),
            certo: t(QUIZ.certo),
            errado: t(QUIZ.errado),
            seguinte: t(QUIZ.seguinte),
            verResultado: t(QUIZ.verResultado),
            resultado: t(QUIZ.resultado),
            resultadoTudo: t(QUIZ.resultadoTudo),
            resultadoParte: t(QUIZ.resultadoParte),
            rever: t(QUIZ.rever),
            recomecar: t(QUIZ.recomecar),
          }}
        />
      </Seccao>

      {/* ---------- Fontes ---------- */}
      <Seccao>
        <h2 className="titulo-4">{t(UI.fontesTitulo)}</h2>
        <p className="mt-3 max-w-[70ch] text-sm text-white/85">{t(UI.fontesSub)}</p>
        <ol className="mt-6 grid gap-x-10 gap-y-2.5 text-sm md:grid-cols-2">
          {fontes.map((f, i) => (
            <li key={i} id={`fonte-${i + 1}`} className="scroll-mt-20 rounded-[4px] target:bg-white/10 lg:scroll-mt-8">
              <span className="tabular-nums text-white/75">[{i + 1}]</span>{" "}
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-white/90 underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white">
                {t(f.nome)}
                <span className="sr-only"> ({t(UI.abreNovaJanela)})</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-[70ch] rounded-[var(--raio)] bg-white/5 p-5 text-sm leading-relaxed text-white/85">{t(UI.aviso)}</p>
      </Seccao>
    </PaginaInterior>
  );
}
