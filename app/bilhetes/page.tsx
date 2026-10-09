import type { Metadata } from "next";
import { BadgeCheck, CalendarDays, Landmark, Lock, MapPin, Megaphone, QrCode, Smartphone, Ticket } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoIcone, CartaoNumerado, Seccao } from "@/components/painel/blocos";
import { Foto } from "@/components/painel/kit";
import { eventosComBilhetes, formatKz } from "@/lib/data";
import { hrefEvento, instante, vendaBilhetes } from "@/lib/desporto";
import { intervaloDatas } from "@/lib/motobox";
import { lerDefinicoes, lerEventos } from "@/lib/supabase/publico";
import { Aviso, Etiqueta } from "@/app/calendario/pecas";
import { fotoDe } from "@/app/eventos/foto";
import { contar, preencher, type IconeBilhetes } from "@/lib/conteudo/grupos/geral";
import { lerTextosBilhetes } from "@/lib/conteudo/ler-geral";
import { comValores } from "@/lib/textos";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Os textos fixos editam-se no painel: Provas › Páginas do campeonato › Bilhetes.
export async function generateMetadata(): Promise<Metadata> {
  const t = await lerTextosBilhetes();
  return { title: t.pesquisa.titulo, description: t.pesquisa.descricao };
}

/** Ícone de cada vantagem do topo da página. */
const ICONES: Record<IconeBilhetes, React.ReactNode> = {
  bilhete: <Ticket />,
  qr: <QrCode />,
  verificado: <BadgeCheck />,
  telemovel: <Smartphone />,
  banco: <Landmark />,
  seguro: <Lock />,
};

export default async function BilhetesPage() {
  const [todos, { bilheteiraAberta }, t] = await Promise.all([lerEventos(), lerDefinicoes(), lerTextosBilhetes()]);
  const agora = instante();
  // Só os eventos que a MotoBox vende de facto (à venda ou esgotados): ver `vendaBilhetes`.
  const eventos = eventosComBilhetes(todos, bilheteiraAberta, agora);

  return (
    <PaginaInterior icone={<Ticket />}>
      <Abertura
        compacta
        foto={t.foto}
        sobretitulo={t.sobretitulo}
        titulo={t.titulo}
        texto={t.texto}
      />

      {t.vantagens.length > 0 && (
        <Seccao>
          <div className="grid gap-[var(--intervalo)] md:grid-cols-3">
            {t.vantagens.map((v, i) => (
              <CartaoIcone key={i} icone={ICONES[v.icone] ?? <Ticket />} titulo={v.titulo}>
                {v.texto}
              </CartaoIcone>
            ))}
          </div>
        </Seccao>
      )}

      <Seccao className={t.vantagens.length > 0 ? "!pt-0" : ""}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="titulo-2">{t.aVenda}</h2>
          {eventos.length > 0 && (
            <p className="text-sm text-white/80">
              {contar(eventos.length, t.contadorUm, t.contadorVarios)}
            </p>
          )}
        </div>

        {!bilheteiraAberta ? (
          <Aviso className="mt-8" titulo={t.fechada.titulo} icone={<Ticket />}>
            {t.fechada.texto}
          </Aviso>
        ) : (
          eventos.length === 0 && (
            <Aviso className="mt-8" titulo={t.semBilhetes.titulo} icone={<Ticket />}>
              {t.semBilhetes.texto}
            </Aviso>
          )
        )}

        <div className="mt-8 grid gap-[var(--intervalo)]">
          {eventos.map((e) => {
            const esgotado = vendaBilhetes(e, bilheteiraAberta, agora) === "esgotado";
            const minimo = Math.min(...e.bilhetes!.map((b) => b.preco));
            const total = e.bilhetes!.reduce((s, b) => s + b.disponiveis, 0);
            return (
              <article
                key={e.slug}
                className="painel painel-escuro grid gap-[var(--intervalo)] p-[var(--intervalo)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
              >
                {/* Fotografia, com a ronda e a disciplina por cima */}
                <div className="relative">
                  <Foto nome={fotoDe(e.slug, e.imagem)} className="h-full min-h-56 sm:min-h-72" largura={1000} tamanhos="(max-width: 1024px) 100vw, 40vw" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {e.ronda && <Etiqueta tom="vermelho">{preencher(t.cartao.ronda, { ronda: e.ronda })}</Etiqueta>}
                    <Etiqueta tom="vidro">{e.disciplina}</Etiqueta>
                    {esgotado && <Etiqueta tom="vidro">{t.cartao.esgotado}</Etiqueta>}
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex flex-col p-4 md:p-6">
                  <h3 className="titulo-4 text-balance">{e.titulo}</h3>
                  <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/80">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-mb-red-light" aria-hidden />
                      {intervaloDatas(e.dataInicio, e.dataFim)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 text-mb-red-light" aria-hidden />
                      {e.circuito}, {e.provincia}
                    </span>
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-white/75">{e.resumo}</p>

                  {/* Tipos de bilhete */}
                  <ul className="mt-6 grid gap-[var(--intervalo)] sm:grid-cols-2">
                    {e.bilhetes!.map((b) => (
                      <li
                        key={b.id}
                        className={`rounded-[var(--raio)] px-4 py-3.5 ${b.destaque ? "bg-mb-red/15 ring-1 ring-inset ring-mb-red/40" : "bg-white/5"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 text-sm font-medium">{b.nome}</p>
                          {b.destaque && <Etiqueta tom="vermelho" className="!h-5 !text-[10px]">{t.cartao.popular}</Etiqueta>}
                        </div>
                        <p className="mt-1 text-lg font-semibold tabular-nums">{formatKz(b.preco)}</p>
                        {!esgotado && (
                          <p className="mt-0.5 text-xs text-white/75">
                            {comValores(t.cartao.disponiveis, {
                              n: <span className="tabular-nums">{b.disponiveis.toLocaleString("pt-PT")}</span>,
                            })}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/8 pt-5">
                    <div>
                      <p className="text-xs text-white/75">{t.cartao.aPartirDe}</p>
                      <p className="text-2xl font-semibold tabular-nums">{formatKz(minimo)}</p>
                      {!esgotado && (
                        <p className="text-xs text-white/75">
                          {comValores(t.cartao.totalDisponiveis, {
                            n: <span className="tabular-nums">{total.toLocaleString("pt-PT")}</span>,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex w-full flex-wrap gap-[var(--intervalo)] sm:w-auto">
                      <BotaoMB href={hrefEvento(e)} variante="escuro" className="sm:!w-48">
                        {t.cartao.detalhes}
                      </BotaoMB>
                      {esgotado ? (
                        <span className="inline-flex h-14 w-full max-w-[20.5rem] items-center gap-3 rounded-[var(--raio)] bg-white/8 px-5 text-[15px] text-white/75 sm:w-48">
                          <Ticket className="size-4" aria-hidden />
                          {t.cartao.esgotado}
                        </span>
                      ) : (
                        <BotaoMB href={`/bilhetes/${e.slug}`} className="sm:!w-48">
                          {t.cartao.comprar}
                        </BotaoMB>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Seccao>

      {/* Como funciona */}
      {t.comoFunciona.passos.length > 0 && (
        <Seccao className="!pt-0">
          <h2 className="titulo-3">{t.comoFunciona.titulo}</h2>
          <ol className="mt-8 grid gap-[var(--intervalo)] sm:grid-cols-2 lg:grid-cols-4">
            {t.comoFunciona.passos.map((p, i) => (
              <li key={i} className="painel painel-escuro flex min-h-52 flex-col p-6">
                <span aria-hidden className="grid size-9 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                  {i + 1}
                </span>
                <h3 className="mt-auto pt-8 text-lg font-semibold">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{p.texto}</p>
              </li>
            ))}
          </ol>
        </Seccao>
      )}

      {/* Nota para organizadores */}
      {t.organizadores.mostrar && (
        <Seccao className="!pt-0">
          <CartaoNumerado
            numero={<Megaphone className="size-5" aria-hidden />}
            sobretitulo={t.organizadores.sobretitulo}
            titulo={t.organizadores.titulo}
            foto={t.organizadores.foto}
          >
            {t.organizadores.texto}
            {t.organizadores.botao && (
              <span className="mt-6 block">
                <BotaoMB href={t.organizadores.ligacao || "/contacto#parcerias"}>{t.organizadores.botao}</BotaoMB>
              </span>
            )}
            {t.organizadores.nota && <span className="mt-3 block text-xs text-white/75">{t.organizadores.nota}</span>}
          </CartaoNumerado>
        </Seccao>
      )}
    </PaginaInterior>
  );
}
