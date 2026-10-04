import type { Metadata } from "next";
import { BadgeCheck, CalendarDays, MapPin, Megaphone, QrCode, Ticket } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoIcone, CartaoNumerado, Seccao } from "@/components/painel/blocos";
import { Foto } from "@/components/painel/kit";
import { eventosComBilhetes, formatKz } from "@/lib/data";
import { hrefEvento, instante, vendaBilhetes } from "@/lib/desporto";
import { intervaloDatas } from "@/lib/motobox";
import { lerDefinicoes, lerEventos } from "@/lib/supabase/publico";
import { Aviso, Etiqueta } from "@/app/calendario/pecas";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bilhetes",
  description:
    "Compre bilhetes para as provas do motociclismo angolano. Pagamento por Multicaixa Express, transferência ou cartão. Bilhete digital com QR code no telemóvel.",
};

const PASSOS = [
  { t: "Escolha a prova", d: "Selecione o evento e o tipo de bilhete que quer." },
  { t: "Pague online", d: "Multicaixa Express, transferência bancária ou cartão Visa." },
  { t: "Guarde o QR", d: "O bilhete digital aparece no fim da compra. Guarde-o no telemóvel ou imprima-o." },
  { t: "Entre na prova", d: "Mostre o QR à entrada. Validação em segundos." },
];

export default async function BilhetesPage() {
  const [todos, { bilheteiraAberta }] = await Promise.all([lerEventos(), lerDefinicoes()]);
  const agora = instante();
  // Só os eventos que a MotoBox vende de facto (à venda ou esgotados): ver `vendaBilhetes`.
  const eventos = eventosComBilhetes(todos, bilheteiraAberta, agora);

  return (
    <PaginaInterior icone={<Ticket />}>
      <Abertura
        compacta
        foto="kilamba"
        sobretitulo="Bilhética oficial"
        titulo="Bilhetes"
        texto="Compre online e guarde o bilhete digital com código QR no telemóvel. Sem filas, sem dinheiro em mão, sem intermediários."
      />

      <Seccao>
        <div className="grid gap-[var(--intervalo)] md:grid-cols-3">
          <CartaoIcone icone={<Ticket />} titulo="Compra online">
            Multicaixa Express, transferência ou cartão.
          </CartaoIcone>
          <CartaoIcone icone={<QrCode />} titulo="QR no telemóvel">
            Bilhete digital validado à entrada.
          </CartaoIcone>
          <CartaoIcone icone={<BadgeCheck />} titulo="Verificação automática">
            Pagamento confirmado em segundos.
          </CartaoIcone>
        </div>
      </Seccao>

      <Seccao className="!pt-0">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="titulo-2">À venda</h2>
          {eventos.length > 0 && (
            <p className="text-sm text-white/60">
              {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
            </p>
          )}
        </div>

        {!bilheteiraAberta ? (
          <Aviso className="mt-8" titulo="Bilheteira fechada" icone={<Ticket />}>
            A venda de bilhetes online na MotoBox está fechada de momento. Consulte o calendário e a página de cada
            evento para saber como participar.
          </Aviso>
        ) : (
          eventos.length === 0 && (
            <Aviso className="mt-8" titulo="Sem bilhetes à venda" icone={<Ticket />}>
              De momento não há provas com bilhetes à venda. Consulte o calendário para ver o que vem a seguir.
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
                  <Foto nome={[e.slug, e.imagem]} className="h-full min-h-56 sm:min-h-72" largura={1000} tamanhos="(max-width: 1024px) 100vw, 40vw" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {e.ronda && <Etiqueta tom="vermelho">Ronda {e.ronda}</Etiqueta>}
                    <Etiqueta tom="vidro">{e.disciplina}</Etiqueta>
                    {esgotado && <Etiqueta tom="vidro">Esgotado</Etiqueta>}
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex flex-col p-4 md:p-6">
                  <h3 className="titulo-4 text-balance">{e.titulo}</h3>
                  <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/65">
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
                          {b.destaque && <Etiqueta tom="vermelho" className="!h-5 !text-[10px]">Popular</Etiqueta>}
                        </div>
                        <p className="mt-1 text-lg font-semibold tabular-nums">{formatKz(b.preco)}</p>
                        {!esgotado && (
                          <p className="mt-0.5 text-xs text-white/50">
                            <span className="tabular-nums">{b.disponiveis.toLocaleString("pt-PT")}</span> disponíveis
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/8 pt-5">
                    <div>
                      <p className="text-xs text-white/50">A partir de</p>
                      <p className="text-2xl font-semibold tabular-nums">{formatKz(minimo)}</p>
                      {!esgotado && (
                        <p className="text-xs text-white/50">
                          <span className="tabular-nums">{total.toLocaleString("pt-PT")}</span> bilhetes disponíveis
                        </p>
                      )}
                    </div>
                    <div className="flex w-full flex-wrap gap-[var(--intervalo)] sm:w-auto">
                      <BotaoMB href={hrefEvento(e)} variante="escuro" className="sm:!w-48">
                        Detalhes
                      </BotaoMB>
                      {esgotado ? (
                        <span className="inline-flex h-14 w-full max-w-[20.5rem] items-center gap-3 rounded-[var(--raio)] bg-white/8 px-5 text-[15px] text-white/75 sm:w-48">
                          <Ticket className="size-4" aria-hidden />
                          Esgotado
                        </span>
                      ) : (
                        <BotaoMB href={`/bilhetes/${e.slug}`} className="sm:!w-48">
                          Comprar
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
      <Seccao className="!pt-0">
        <h2 className="titulo-3">Como funciona</h2>
        <ol className="mt-8 grid gap-[var(--intervalo)] sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p, i) => (
            <li key={p.t} className="painel painel-escuro flex min-h-52 flex-col p-6">
              <span aria-hidden className="grid size-9 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                {i + 1}
              </span>
              <h3 className="mt-auto pt-8 text-lg font-semibold">{p.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{p.d}</p>
            </li>
          ))}
        </ol>
      </Seccao>

      {/* Nota para organizadores */}
      <Seccao className="!pt-0">
        <CartaoNumerado
          numero={<Megaphone className="size-5" aria-hidden />}
          sobretitulo="Para clubes e organizadores"
          titulo="Venda os bilhetes da sua prova connosco"
          foto="huambo"
        >
          A MotoBox trata da venda online, do pagamento e da validação à entrada. O clube recebe a receita e nós
          retemos uma comissão sobre cada bilhete vendido. Sem custos iniciais, sem pulseiras, sem dinheiro em mão.
          <span className="mt-6 block">
            <BotaoMB href="/contacto#parcerias">Falar com a MotoBox</BotaoMB>
          </span>
          <span className="mt-3 block text-xs text-white/50">Resposta em 48 horas úteis.</span>
        </CartaoNumerado>
      </Seccao>
    </PaginaInterior>
  );
}
