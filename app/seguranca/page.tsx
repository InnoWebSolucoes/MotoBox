import type { Metadata } from "next";
import Link from "next/link";
import {
  Ambulance, BadgeCheck, Brain, CloudRain, Eye, EyeOff, Flame, HardHat, Clock, ShieldCheck, TrendingUp, Users,
  UserRound, Wrench, BookOpen, FileText,
} from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Cabecalho, Numeros, Seccao } from "@/components/painel/blocos";
import { Foto } from "@/components/painel/kit";
import {
  ACIDENTE, CABECA, CAPACETE, CHUVA, EQUIPAMENTO, FONTES, GRUPO, HISTORIAS, NUMEROS, PASSAGEIROS, SECCOES,
  SEGURO, UI, VERIFICACAO, VISIBILIDADE, type Bi,
} from "./conteudo";

export const metadata: Metadata = {
  title: "Segurança",
  description:
    "Guia prático para quem anda de mota em Angola: capacete, chuva, visibilidade, equipamento, passageiros, verificação antes de sair, passeios em grupo e o que fazer num acidente. Com fontes.",
};

const t = (b: Bi) => b.pt;

const ICONES_CABECA: Record<string, React.ReactNode> = {
  eyeOff: <EyeOff />,
  trending: <TrendingUp />,
  clock: <Clock />,
  fire: <Flame />,
};

/** Título de secção numerado ("01 · Capacete"). */
function Numero({ n, nome }: { n: number; nome: string }) {
  return (
    <p className="mb-6 flex items-center gap-3 text-sm text-white/60">
      <span className="grid size-8 place-items-center rounded-[4px] bg-mb-red text-xs font-semibold text-white">
        {String(n).padStart(2, "0")}
      </span>
      {nome}
    </p>
  );
}

function Lista({ itens }: { itens: Bi[] }) {
  return (
    <ul className="space-y-3 text-[15px] leading-relaxed text-white/85">
      {itens.map((i) => (
        <li key={i.pt} className="flex gap-3">
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
      <blockquote className="text-lg leading-relaxed text-white/90">{t(texto)}</blockquote>
      <figcaption className="mt-2 text-sm text-white/55">{t(fonte)}</figcaption>
    </figure>
  );
}

export default function Seguranca() {
  const nome = (id: string) => t(SECCOES.find((s) => s.id === id)!.nome);

  return (
    <PaginaInterior icone={<ShieldCheck />}>
      <Abertura
        foto="banner-seguranca"
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

      {/* ---------- Números ---------- */}
      <Seccao>
        <Numeros
          colunas={3}
          itens={NUMEROS.map((n) => ({
            valor: (
              <>
                {n.prefixo && <span className="mr-2 text-xl text-white/60">{t(n.prefixo)}</span>}
                {n.valor}
              </>
            ),
            texto: t(n.texto),
            nota: `Fonte: ${t(n.fonte)}`,
          }))}
        />
        <nav aria-label={t(UI.nestaPagina)} className="mt-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">{t(UI.nestaPagina)}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SECCOES.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="pilula">
                  <span className="text-white/40">{String(i + 1).padStart(2, "0")}</span> {t(s.nome)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Seccao>

      {/* ---------- 01 Capacete ---------- */}
      <Seccao id="capacete">
        <Numero n={1} nome={nome("capacete")} />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div>
            <Cabecalho icone={<HardHat />} titulo={t(CAPACETE.titulo)} texto={t(CAPACETE.lead)} />
            <Lei texto={CAPACETE.lei} fonte={CAPACETE.leiFonte} />
          </div>
          <figure>
            <Foto nome="artigo-capacete" alt={t(CAPACETE.fotoLegenda)} className="aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[28rem]" largura={1000} />
            <figcaption className="mt-2 text-xs text-white/50">{t(CAPACETE.fotoLegenda)}</figcaption>
          </figure>
        </div>
        <div className="mt-10 grid gap-[var(--intervalo)] lg:grid-cols-3">
          {CAPACETE.grupos.map((g) => (
            <div key={g.titulo.pt} className="painel painel-escuro p-6">
              <h3 className="mb-5 text-xl font-semibold">{t(g.titulo)}</h3>
              <Lista itens={g.itens} />
            </div>
          ))}
        </div>
      </Seccao>

      {/* ---------- 02 Chuva ---------- */}
      <Seccao id="chuva">
        <Numero n={2} nome={nome("chuva")} />
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <Cabecalho icone={<CloudRain />} titulo={t(CHUVA.titulo)} texto={t(CHUVA.lead)} />
          <div className="flex min-h-48 flex-col justify-end rounded-[var(--raio)] bg-mb-red p-6">
            <span className="text-6xl font-semibold leading-none">{CHUVA.numero}</span>
            <span className="mt-3 text-[15px]">{t(CHUVA.numeroTexto)}</span>
            <span className="mt-1 text-xs text-white/75">Fonte: {t(CHUVA.numeroFonte)}</span>
          </div>
        </div>
        <ol className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {CHUVA.dicas.map((d, i) => (
            <li key={d.titulo.pt} className="painel painel-escuro flex min-h-48 flex-col p-6">
              <span className="text-3xl font-semibold text-mb-red-light">{i + 1}</span>
              <h3 className="mt-auto pt-6 text-lg font-semibold">{t(d.titulo)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{t(d.texto)}</p>
            </li>
          ))}
        </ol>
      </Seccao>

      {/* ---------- 03 Visibilidade ---------- */}
      <Seccao id="visibilidade">
        <Numero n={3} nome={nome("visibilidade")} />
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div>
            <Cabecalho icone={<Eye />} titulo={t(VISIBILIDADE.titulo)} texto={t(VISIBILIDADE.lead)} />
            <div className="mt-8">
              <Lista itens={VISIBILIDADE.dicas} />
            </div>
          </div>
          <Foto nome="noite" className="min-h-80" largura={1000} />
        </div>
      </Seccao>

      {/* ---------- 04 Equipamento ---------- */}
      <Seccao id="equipamento">
        <Numero n={4} nome={nome("equipamento")} />
        <Cabecalho icone={<BadgeCheck />} titulo={t(EQUIPAMENTO.titulo)} texto={t(EQUIPAMENTO.lead)} />
        <Numeros
          className="mt-10"
          colunas={3}
          itens={EQUIPAMENTO.numeros.map((n) => ({ valor: n.valor, texto: t(n.texto), nota: t(EQUIPAMENTO.estudo) }))}
        />
        <div className="mt-[var(--intervalo)] grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-4">
          {EQUIPAMENTO.pecas.map((p) => (
            <div key={p.nome.pt} className="painel painel-escuro p-6">
              <h3 className="text-xl font-semibold">{t(p.nome)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/80">{t(p.texto)}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-white/65">{t(EQUIPAMENTO.etiquetas)}</p>
      </Seccao>

      {/* ---------- 05 Passageiros ---------- */}
      <Seccao id="passageiros">
        <Numero n={5} nome={nome("passageiros")} />
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div>
            <Cabecalho icone={<UserRound />} titulo={t(PASSAGEIROS.titulo)} texto={t(PASSAGEIROS.lead)} />
            <Lei texto={PASSAGEIROS.lei} fonte={PASSAGEIROS.leiFonte} />
          </div>
          <div className="painel painel-escuro p-6 lg:p-8">
            <Lista itens={PASSAGEIROS.dicas} />
          </div>
        </div>
      </Seccao>

      {/* ---------- 06 Cabeça fria ---------- */}
      <Seccao id="cabeca">
        <Numero n={6} nome={nome("cabeca")} />
        <Cabecalho icone={<Brain />} titulo={t(CABECA.titulo)} texto={t(CABECA.lead)} />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2">
          {CABECA.temas.map((tema) => (
            <div key={tema.titulo.pt} className="painel painel-escuro flex flex-col p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <span aria-hidden className="text-white [&_svg]:size-7">{ICONES_CABECA[tema.icone]}</span>
                <span className="rounded-[4px] bg-mb-red px-2.5 py-1 text-sm font-semibold">
                  {typeof tema.destaque === "string" ? tema.destaque : t(tema.destaque)}
                </span>
              </div>
              <h3 className="mt-10 text-xl font-semibold">{t(tema.titulo)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{t(tema.texto)}</p>
            </div>
          ))}
        </div>
      </Seccao>

      {/* ---------- 07 Antes de sair ---------- */}
      <Seccao id="verificacao">
        <Numero n={7} nome={nome("verificacao")} />
        <Cabecalho icone={<Wrench />} titulo={t(VERIFICACAO.titulo)} texto={t(VERIFICACAO.lead)} />
        <ol className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {VERIFICACAO.itens.map((i, n) => (
            <li key={n} className="painel painel-escuro flex min-h-52 flex-col p-6">
              <span className="text-5xl font-semibold leading-none text-mb-red-light">{i.letra}</span>
              <h3 className="mt-auto pt-6 text-lg font-semibold">{t(i.nome)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{t(i.texto)}</p>
            </li>
          ))}
        </ol>
      </Seccao>

      {/* ---------- 08 Em grupo ---------- */}
      <Seccao id="grupo">
        <Numero n={8} nome={nome("grupo")} />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div>
            <Cabecalho icone={<Users />} titulo={t(GRUPO.titulo)} texto={t(GRUPO.lead)} />
            <div className="mt-8">
              <Lista itens={GRUPO.dicas} />
            </div>
            <div className="mt-8">
              <BotaoMB href="/clubes" variante="escuro">{t(GRUPO.clubes)}</BotaoMB>
            </div>
          </div>
          <figure className="painel painel-escuro p-6">
            <figcaption className="text-lg font-semibold">{t(GRUPO.diagramaTitulo)}</figcaption>
            <Ziguezague
              sentido={t(GRUPO.diagramaSentido)}
              lider={t(GRUPO.diagramaLider)}
              fecho={t(GRUPO.diagramaFecho)}
              descricao={t(GRUPO.diagramaDescricao)}
            />
          </figure>
        </div>
      </Seccao>

      {/* ---------- 09 Acidente ---------- */}
      <Seccao id="acidente">
        <Numero n={9} nome={nome("acidente")} />
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <Cabecalho icone={<Ambulance />} titulo={t(ACIDENTE.titulo)} texto={t(ACIDENTE.lead)} />
          <a href={`tel:${ACIDENTE.numero}`} className="flex min-h-48 flex-col justify-end rounded-[var(--raio)] bg-mb-red p-6 transition-colors hover:bg-mb-red-dark">
            <span className="text-6xl font-semibold leading-none">{ACIDENTE.numero}</span>
            <span className="mt-3 text-[15px]">{t(ACIDENTE.numeroTexto)}</span>
            <span className="mt-1 text-xs text-white/80">{t(ACIDENTE.numeroDica)}</span>
          </a>
        </div>
        <ol className="mt-10 grid gap-[var(--intervalo)] lg:grid-cols-3">
          {ACIDENTE.passos.map((p, i) => (
            <li key={p.nome.pt} className="painel painel-escuro p-6">
              <p className="flex items-center gap-3 text-xl font-semibold">
                <span className="grid size-9 place-items-center rounded-[4px] bg-mb-red text-sm">{i + 1}</span>
                {t(p.nome)}
              </p>
              <div className="mt-5">
                <Lista itens={p.itens} />
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-white/65">{t(ACIDENTE.extra)}</p>
      </Seccao>

      {/* ---------- 10 Seguro ---------- */}
      <Seccao id="seguro">
        <Numero n={10} nome={nome("seguro")} />
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <Cabecalho icone={<FileText />} titulo={t(SEGURO.titulo)} texto={t(SEGURO.texto)} />
          <div className="painel painel-escuro self-end p-6 lg:p-8">
            <Lista itens={SEGURO.itens} />
          </div>
        </div>
      </Seccao>

      {/* ---------- 11 Histórias ---------- */}
      <Seccao id="historias">
        <Numero n={11} nome={nome("historias")} />
        <Cabecalho icone={<BookOpen />} titulo={t(HISTORIAS.titulo)} texto={t(HISTORIAS.aviso)} />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2">
          {HISTORIAS.lista.map((h) => (
            <article key={h.titulo.pt} className="painel painel-escuro flex flex-col p-6 lg:p-8">
              <h3 className="text-xl font-semibold">{t(h.titulo)}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">{t(h.texto)}</p>
              <p className="mt-auto pt-6 text-sm">
                <span className="text-mb-red-light">{t(UI.licao)}:</span> <span className="text-white/90">{t(h.licao)}</span>
              </p>
            </article>
          ))}
        </div>
        <div className="mt-[var(--intervalo)] flex flex-col gap-6 rounded-[var(--raio)] bg-mb-red p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="titulo-4">{t(HISTORIAS.convite)}</p>
            <p className="mt-2 max-w-[56ch] text-[15px] text-white/90">{t(HISTORIAS.conviteTexto)}</p>
          </div>
          <div className="flex flex-wrap gap-[var(--intervalo)]">
            <Link href="/forum" className="inline-flex h-12 items-center rounded-[var(--raio)] bg-black/25 px-5 text-sm transition-colors hover:bg-black/40">
              {t(HISTORIAS.forum)}
            </Link>
            <Link href="/contacto" className="inline-flex h-12 items-center rounded-[var(--raio)] bg-white px-5 text-sm text-black transition-colors hover:bg-white/85">
              Escrever à MotoBox
            </Link>
          </div>
        </div>
      </Seccao>

      {/* ---------- Fontes ---------- */}
      <Seccao>
        <h2 className="titulo-4">{t(UI.fontesTitulo)}</h2>
        <p className="mt-3 max-w-[70ch] text-sm text-white/65">{t(UI.fontesSub)}</p>
        <ol className="mt-6 grid gap-x-10 gap-y-2 text-sm text-white/65 md:grid-cols-2">
          {FONTES.map((f, i) => (
            <li key={f.url}>
              <span className="text-white/40">[{i + 1}]</span>{" "}
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {t(f.nome)}
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-[70ch] rounded-[var(--raio)] bg-white/5 p-5 text-sm leading-relaxed text-white/70">{t(UI.aviso)}</p>
      </Seccao>
    </PaginaInterior>
  );
}

/** Esquema da formação em ziguezague, visto de cima. */
function Ziguezague({ sentido, lider, fecho, descricao }: { sentido: string; lider: string; fecho: string; descricao: string }) {
  const motas = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 280 300" role="img" aria-label={descricao} className="mx-auto mt-6 w-full max-w-sm">
      {/* faixa */}
      <rect x="60" y="10" width="160" height="280" rx="6" fill="rgb(255 255 255 / 0.04)" />
      <line x1="60" y1="10" x2="60" y2="290" stroke="rgb(255 255 255 / 0.35)" strokeWidth="2" />
      <line x1="220" y1="10" x2="220" y2="290" stroke="rgb(255 255 255 / 0.35)" strokeWidth="2" />
      <line x1="140" y1="10" x2="140" y2="290" stroke="rgb(255 255 255 / 0.25)" strokeWidth="2" strokeDasharray="10 10" />
      {motas.map((i) => {
        const x = i % 2 === 0 ? 95 : 185;
        const y = 40 + i * 52;
        const cor = i === 0 || i === motas.length - 1 ? "#e10600" : "#ffffff";
        return (
          <g key={i}>
            <rect x={x - 7} y={y - 16} width="14" height="32" rx="7" fill={cor} />
            {i === 0 && (
              <text x={x - 16} y={y + 4} textAnchor="end" fill="#fff" fontSize="12">{lider}</text>
            )}
            {i === motas.length - 1 && (
              <text x={x - 16} y={y + 4} textAnchor="end" fill="#fff" fontSize="12">{fecho}</text>
            )}
          </g>
        );
      })}
      {/* sentido de marcha */}
      <g fill="rgb(255 255 255 / 0.6)" fontSize="11">
        <path d="M250 200 V60 m-7 10 l7 -10 l7 10" stroke="rgb(255 255 255 / 0.6)" strokeWidth="2" fill="none" />
        <text x="262" y="140" transform="rotate(90 262 140)" textAnchor="middle">{sentido}</text>
      </g>
    </svg>
  );
}
