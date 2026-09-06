import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PageHero, Tag } from "@/components/ui";
import { eventosComBilhetes, formatData, formatKz } from "@/lib/data";

export const metadata: Metadata = {
  title: "Bilhetes",
  description:
    "Compre bilhetes para as provas do motociclismo angolano. Pagamento por Multicaixa Express, transferência ou cartão. Bilhete digital com QR code no telemóvel.",
};

export default function BilhetesPage() {
  const eventos = eventosComBilhetes();

  return (
    <>
      <PageHero
        eyebrow="Bilhética oficial"
        titulo="Bilhetes"
        descricao="Compre online e receba o bilhete digital com código QR no seu email e telemóvel. Sem filas, sem dinheiro em mão, sem intermediários."
      >
        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
          {[
            { icone: "ticket", titulo: "Compra online", texto: "Multicaixa Express, transferência ou cartão." },
            { icone: "qr", titulo: "QR no telemóvel", texto: "Bilhete digital validado à entrada." },
            { icone: "verified", titulo: "Verificação automática", texto: "Pagamento confirmado em segundos." },
          ].map((c) => (
            <div key={c.titulo} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center bg-mb-red/10 text-mb-red">
                <Icon name={c.icone} className="size-4.5" />
              </span>
              <div>
                <p className="font-display text-sm uppercase text-white">{c.titulo}</p>
                <p className="mt-0.5 text-xs text-ink-500">{c.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="space-y-6">
          {eventos.map((e) => {
            const minimo = Math.min(...e.bilhetes!.map((b) => b.preco));
            const total = e.bilhetes!.reduce((s, b) => s + b.disponiveis, 0);
            return (
              <article key={e.slug} className="card overflow-hidden">
                <div className="grid lg:grid-cols-[1fr_1.5fr]">
                  {/* Imagem */}
                  <div className="relative min-h-[220px] lg:min-h-full">
                    <Placeholder nome={e.imagem} className="absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent lg:bg-gradient-to-r" />
                    <div className="absolute left-4 top-4 flex gap-2">
                      {e.ronda && <Tag tone="red">Ronda {e.ronda}</Tag>}
                      <Tag tone="outline">{e.disciplina}</Tag>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 lg:hidden">
                      <p className="font-display text-2xl uppercase text-white leading-tight">{e.titulo}</p>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-6 sm:p-8">
                    <h2 className="hidden lg:block font-display text-2xl sm:text-3xl uppercase leading-tight text-white">
                      {e.titulo}
                    </h2>
                    <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="calendar" className="size-3.5 text-mb-red" />
                        {formatData(e.dataInicio, { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="pin" className="size-3.5 text-mb-red" />
                        {e.circuito}, {e.provincia}
                      </span>
                    </p>
                    <p className="mt-4 text-sm text-ink-400 leading-relaxed">{e.resumo}</p>

                    {/* Tipos de bilhete */}
                    <div className="mt-6 grid gap-2 sm:grid-cols-2">
                      {e.bilhetes!.map((b) => (
                        <div
                          key={b.id}
                          className={`border p-3 ${
                            b.destaque ? "border-mb-red/50 bg-mb-red/5" : "border-ink-800"
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="font-display text-sm uppercase text-white truncate">{b.nome}</p>
                            {b.destaque && <Tag tone="red" className="!text-[9px] !px-1.5 !py-0.5">Popular</Tag>}
                          </div>
                          <p className="mt-1 font-display text-lg text-white">{formatKz(b.preco)}</p>
                          <p className="mt-0.5 text-[11px] text-ink-600">{b.disponiveis} disponíveis</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink-800 pt-5">
                      <div>
                        <p className="eyebrow text-ink-600">A partir de</p>
                        <p className="font-display text-2xl text-white">{formatKz(minimo)}</p>
                        <p className="text-[11px] text-ink-600">{total.toLocaleString("pt-PT")} bilhetes disponíveis</p>
                      </div>
                      <div className="flex gap-3">
                        <ButtonLink href={`/calendario/${e.slug}`} variant="outline" size="sm">
                          Detalhes
                        </ButtonLink>
                        <ButtonLink href={`/bilhetes/${e.slug}`} size="md">
                          <Icon name="ticket" className="size-4" />
                          Comprar
                        </ButtonLink>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Como funciona */}
        <section className="mt-16">
          <h2 className="title-xl text-3xl">Como funciona</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Escolha a prova", d: "Selecione o evento e o tipo de bilhete que quer." },
              { n: "02", t: "Pague online", d: "Multicaixa Express, transferência bancária ou cartão Visa." },
              { n: "03", t: "Receba o QR", d: "O bilhete digital chega ao email e fica na sua conta." },
              { n: "04", t: "Entre na prova", d: "Mostre o QR à entrada. Validação em segundos." },
            ].map((p) => (
              <div key={p.n} className="card p-6">
                <span className="font-display text-4xl text-mb-red/25">{p.n}</span>
                <h3 className="mt-3 font-display text-lg uppercase text-white">{p.t}</h3>
                <p className="mt-2 text-sm text-ink-500 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Nota para organizadores */}
        <section className="mt-12 relative overflow-hidden border border-ink-700 bg-ink-900 p-8 sm:p-10">
          <div className="speed-lines absolute inset-0 opacity-25" aria-hidden />
          <div className="relative grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow text-mb-red">Para clubes e organizadores</p>
              <h2 className="title-xl mt-3 text-2xl sm:text-3xl">
                Venda os bilhetes da sua prova connosco
              </h2>
              <p className="mt-4 max-w-xl text-sm text-ink-400 leading-relaxed">
                A Motobox trata da venda online, do pagamento e da validação à entrada. O clube recebe
                a receita e nós retemos uma comissão sobre cada bilhete vendido. Sem custos iniciais,
                sem pulseiras, sem dinheiro em mão.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <ButtonLink href="/contacto#parcerias" size="lg">
                Falar com a Motobox
              </ButtonLink>
              <p className="text-xs text-ink-600 text-center">Resposta em 48 horas úteis.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
