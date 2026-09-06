"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo, Placeholder, Retrato } from "@/components/Brand";
import { QRCode } from "@/components/QRCode";
import { Button, ButtonLink, Icon, Tag } from "@/components/ui";
import {
  anuncios,
  equipas,
  eventos,
  formatData,
  formatKz,
  noticias,
  pilotos,
} from "@/lib/data";

type Aba = "resumo" | "bilhetes" | "preferencias" | "notificacoes" | "anuncios";

const ABAS: { id: Aba; label: string; icone: string }[] = [
  { id: "resumo", label: "Resumo", icone: "user" },
  { id: "bilhetes", label: "Bilhetes", icone: "ticket" },
  { id: "preferencias", label: "Preferências", icone: "settings" },
  { id: "notificacoes", label: "Notificações", icone: "bell" },
  { id: "anuncios", label: "Anúncios", icone: "tag" },
];

/* Perfil de demonstração. */
const UTILIZADOR = {
  nome: "Kasim Custódio",
  email: "kasim@exemplo.ao",
  membroDesde: 2024,
  provincia: "Luanda",
  verificado: true,
};

const BILHETES = [
  {
    codigo: "MBX-GP-4K9T2A",
    evento: eventos.find((e) => e.slug === "gp-huambo-final")!,
    tipo: "Bancada Central",
    quantidade: 2,
    estado: "válido" as const,
    comprado: "2026-11-01",
  },
  {
    codigo: "MBX-GP-7X1M5B",
    evento: eventos.find((e) => e.slug === "gp-namibe-dunas")!,
    tipo: "Tribuna Coberta",
    quantidade: 1,
    estado: "válido" as const,
    comprado: "2026-09-28",
  },
  {
    codigo: "MBX-GP-2H8L4C",
    evento: eventos.find((e) => e.slug === "gp-huila-lubango")!,
    tipo: "Geral",
    quantidade: 2,
    estado: "usado" as const,
    comprado: "2026-05-30",
  },
];

function iniciais(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export function ContaClient() {
  const [aba, setAba] = useState<Aba>("resumo");
  const [seguidos, setSeguidos] = useState<string[]>(["nelson-kiala", "joana-ferraz"]);
  const [equipasSeguidas, setEquipasSeguidas] = useState<string[]>(["kilamba-racing"]);
  const [marcas, setMarcas] = useState<string[]>(["KTM", "Honda"]);
  const [notificacoes, setNotificacoes] = useState({
    resultados: true,
    calendario: true,
    bilhetes: true,
    marketplace: false,
    forum: true,
    newsletter: true,
    push: true,
    email: true,
    whatsapp: false,
  });

  const alternar = <T,>(lista: T[], set: (v: T[]) => void, item: T) =>
    set(lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]);

  const bilhetesValidos = BILHETES.filter((b) => b.estado === "válido");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Cabeçalho do perfil */}
      <header className="card overflow-hidden">
        <div className="relative h-28">
          <Placeholder nome="kilamba" className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6 -mt-10">
          <span className="relative grid size-20 shrink-0 place-items-center border-2 border-ink-900 bg-mb-red font-display text-2xl text-white">
            {iniciais(UTILIZADOR.nome)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 font-display text-2xl uppercase text-white">
              {UTILIZADOR.nome}
              {UTILIZADOR.verificado && <Icon name="verified" className="size-5 text-ok" />}
            </h1>
            <p className="mt-0.5 text-sm text-ink-500">
              {UTILIZADOR.email} · {UTILIZADOR.provincia} · membro desde {UTILIZADOR.membroDesde}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Icon name="settings" className="size-4" />
              Editar perfil
            </Button>
            <Button variant="ghost" size="sm">
              <Icon name="logout" className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Abas */}
      <nav className="mt-6 flex gap-1 overflow-x-auto no-scrollbar border-b border-ink-800">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            aria-pressed={aba === a.id}
            className={`relative inline-flex h-12 shrink-0 items-center gap-2 px-4 font-display text-xs uppercase tracking-wider transition-colors ${
              aba === a.id ? "text-white" : "text-ink-500 hover:text-ink-200"
            }`}
          >
            <Icon name={a.icone} className="size-4" />
            {a.label}
            {aba === a.id && <span className="absolute inset-x-2 bottom-0 h-[3px] bg-mb-red" aria-hidden />}
          </button>
        ))}
      </nav>

      <div className="py-8">
        {/* ---------- RESUMO ---------- */}
        {aba === "resumo" && (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { v: bilhetesValidos.length, l: "Bilhetes activos", i: "ticket" },
                  { v: seguidos.length + equipasSeguidas.length, l: "A seguir", i: "bell" },
                  { v: 3, l: "Anúncios activos", i: "tag" },
                ].map((s) => (
                  <div key={s.l} className="card p-5">
                    <span className="grid size-9 place-items-center bg-mb-red/10 text-mb-red">
                      <Icon name={s.i} className="size-4.5" />
                    </span>
                    <p className="mt-3 font-display text-3xl text-white">{s.v}</p>
                    <p className="eyebrow mt-0.5 text-ink-600">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Próximo bilhete */}
              {bilhetesValidos[0] && (
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="eyebrow text-mb-red">Próximo evento</h2>
                    <button onClick={() => setAba("bilhetes")} className="eyebrow text-ink-500 hover:text-white">
                      Todos →
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-5">
                    <QRCode valor={bilhetesValidos[0].codigo} size={110} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xl uppercase leading-tight text-white">
                        {bilhetesValidos[0].evento.titulo}
                      </p>
                      <p className="mt-1.5 text-sm text-ink-400">
                        {bilhetesValidos[0].tipo} · {bilhetesValidos[0].quantidade}{" "}
                        {bilhetesValidos[0].quantidade === 1 ? "bilhete" : "bilhetes"}
                      </p>
                      <p className="mt-1 text-xs text-ink-600">
                        {formatData(bilhetesValidos[0].evento.dataInicio)} ·{" "}
                        {bilhetesValidos[0].evento.circuito}
                      </p>
                      <p className="mt-2 font-mono text-xs text-ink-500">{bilhetesValidos[0].codigo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed personalizado */}
              <div className="card p-6">
                <h2 className="eyebrow text-mb-red mb-1">Para si</h2>
                <p className="text-xs text-ink-600 mb-5">
                  Com base nos pilotos, equipas e marcas que segue.
                </p>
                <div className="space-y-3">
                  {noticias.slice(0, 4).map((n) => (
                    <Link key={n.slug} href={`/noticias/${n.slug}`} className="group flex gap-3.5">
                      <Placeholder nome={n.imagem} className="size-16 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="eyebrow text-mb-red">{n.categoria}</p>
                        <p className="mt-1 text-sm text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                          {n.titulo}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-600">
                          {formatData(n.data, { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Lateral */}
            <aside className="space-y-4">
              <div className="card p-5">
                <h2 className="eyebrow text-mb-red mb-4">Pilotos que segue</h2>
                <div className="space-y-3">
                  {pilotos
                    .filter((p) => seguidos.includes(p.slug))
                    .map((p) => (
                      <Link key={p.slug} href={`/pilotos/${p.slug}`} className="group flex items-center gap-3">
                        <Retrato
                          nome={p.slug}
                          iniciais={iniciais(p.nome)}
                          className="size-10 shrink-0 rounded-full [container-type:size]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white group-hover:text-mb-red transition-colors">
                            {p.nome}
                          </p>
                          <p className="truncate text-xs text-ink-600">{p.equipa}</p>
                        </div>
                        <span className="font-display text-sm text-white tabular-nums">
                          {p.estatisticas.pontos}
                        </span>
                      </Link>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setAba("preferencias")}>
                  Gerir
                </Button>
              </div>

              <div className="card p-5">
                <h2 className="eyebrow text-mb-red mb-3">Actividade no fórum</h2>
                <dl className="space-y-2.5">
                  {[
                    ["Tópicos criados", "4"],
                    ["Respostas", "37"],
                    ["Melhores respostas", "6"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <dt className="text-ink-500">{k}</dt>
                      <dd className="text-white tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                <ButtonLink href="/forum" variant="outline" size="sm" className="mt-4 w-full">
                  Ir para o fórum
                </ButtonLink>
              </div>
            </aside>
          </div>
        )}

        {/* ---------- BILHETES ---------- */}
        {aba === "bilhetes" && (
          <div className="space-y-4">
            {BILHETES.map((b) => (
              <article
                key={b.codigo}
                className={`card overflow-hidden ${b.estado === "usado" ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="min-w-0 flex-1 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <Logo height={18} className="text-white" />
                      <Tag tone={b.estado === "válido" ? "ok" : "neutral"}>
                        {b.estado === "válido" ? "Válido" : "Utilizado"}
                      </Tag>
                    </div>

                    <h2 className="mt-4 font-display text-xl uppercase leading-tight text-white">
                      {b.evento.titulo}
                    </h2>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-3">
                      {[
                        ["Tipo", b.tipo],
                        ["Quantidade", `${b.quantidade}`],
                        ["Data", formatData(b.evento.dataInicio, { day: "2-digit", month: "short", year: "numeric" })],
                        ["Local", b.evento.circuito],
                        ["Província", b.evento.provincia],
                        ["Comprado", formatData(b.comprado, { day: "2-digit", month: "short" })],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="eyebrow text-ink-600">{k}</dt>
                          <dd className="mt-0.5 text-sm text-white">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-800 pt-4">
                      <Button variant="outline" size="sm">
                        <Icon name="download" className="size-3.5" />
                        Descarregar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Icon name="share" className="size-3.5" />
                        Transferir
                      </Button>
                      <ButtonLink href={`/calendario/${b.evento.slug}`} variant="ghost" size="sm">
                        Ver evento
                      </ButtonLink>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-2.5 border-t border-dashed border-ink-700 p-6 sm:border-l sm:border-t-0">
                    <QRCode valor={b.codigo} size={140} />
                    <p className="font-mono text-[11px] text-ink-500">{b.codigo}</p>
                  </div>
                </div>
              </article>
            ))}

            <div className="card p-6 text-center">
              <p className="text-sm text-ink-400">Quer ir a mais provas?</p>
              <ButtonLink href="/bilhetes" className="mt-3">
                <Icon name="ticket" className="size-4" />
                Ver bilhetes disponíveis
              </ButtonLink>
            </div>
          </div>
        )}

        {/* ---------- PREFERÊNCIAS ---------- */}
        {aba === "preferencias" && (
          <div className="space-y-6 max-w-4xl">
            <p className="text-sm text-ink-400 leading-relaxed">
              Escolha o que quer seguir. Usamos estas preferências para personalizar a página inicial,
              a newsletter e as notificações que recebe.
            </p>

            {/* Pilotos */}
            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Pilotos</h2>
              <p className="text-xs text-ink-600 mb-5">
                Receba aviso quando estes pilotos correm, pontuam ou sobem ao pódio.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {pilotos.map((p) => {
                  const on = seguidos.includes(p.slug);
                  return (
                    <button
                      key={p.slug}
                      onClick={() => alternar(seguidos, setSeguidos, p.slug)}
                      aria-pressed={on}
                      className={`flex items-center gap-3 border p-2.5 text-left transition-colors ${
                        on ? "border-mb-red bg-mb-red/5" : "border-ink-800 hover:border-ink-600"
                      }`}
                    >
                      <Retrato
                        nome={p.slug}
                        iniciais={iniciais(p.nome)}
                        className="size-9 shrink-0 rounded-full [container-type:size]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{p.nome}</span>
                        <span className="block truncate text-[11px] text-ink-600">{p.categoria}</span>
                      </span>
                      <span
                        className={`grid size-5 shrink-0 place-items-center ${
                          on ? "bg-mb-red text-white" : "border border-ink-600"
                        }`}
                      >
                        {on && <Icon name="check" className="size-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Equipas */}
            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Equipas e clubes</h2>
              <p className="text-xs text-ink-600 mb-5">
                Novidades, resultados e eventos das estruturas que segue.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {equipas.map((e) => {
                  const on = equipasSeguidas.includes(e.slug);
                  return (
                    <button
                      key={e.slug}
                      onClick={() => alternar(equipasSeguidas, setEquipasSeguidas, e.slug)}
                      aria-pressed={on}
                      className={`flex items-center gap-3 border p-2.5 text-left transition-colors ${
                        on ? "border-mb-red bg-mb-red/5" : "border-ink-800 hover:border-ink-600"
                      }`}
                    >
                      <span
                        className="grid size-9 shrink-0 place-items-center font-display text-[10px] text-white"
                        style={{ background: e.cor }}
                      >
                        {e.logo}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{e.nome}</span>
                        <span className="block truncate text-[11px] text-ink-600">{e.tipo}</span>
                      </span>
                      <span
                        className={`grid size-5 shrink-0 place-items-center ${
                          on ? "bg-mb-red text-white" : "border border-ink-600"
                        }`}
                      >
                        {on && <Icon name="check" className="size-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Marcas */}
            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Marcas de interesse</h2>
              <p className="text-xs text-ink-600 mb-5">
                Avisamos quando surgirem anúncios ou notícias destas marcas.
              </p>
              <div className="flex flex-wrap gap-2">
                {["KTM", "Honda", "Yamaha", "Husqvarna", "Kawasaki", "Suzuki", "BMW", "Royal Enfield"].map(
                  (m) => {
                    const on = marcas.includes(m);
                    return (
                      <button
                        key={m}
                        onClick={() => alternar(marcas, setMarcas, m)}
                        aria-pressed={on}
                        className={`h-9 px-4 font-display text-[11px] uppercase tracking-wider transition-colors ${
                          on
                            ? "bg-mb-red text-white"
                            : "border border-ink-700 text-ink-400 hover:border-ink-500 hover:text-white"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            <div className="flex gap-3">
              <Button size="lg">Guardar preferências</Button>
              <Button variant="ghost" size="lg">Repor</Button>
            </div>
          </div>
        )}

        {/* ---------- NOTIFICAÇÕES ---------- */}
        {aba === "notificacoes" && (
          <div className="max-w-3xl space-y-6">
            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">O que quer receber</h2>
              <p className="text-xs text-ink-600 mb-5">
                Notificações personalizadas com base nas suas preferências.
              </p>
              <div className="divide-y divide-ink-800">
                {(
                  [
                    ["resultados", "Resultados de corridas", "Quando os pilotos e equipas que segue terminam uma prova."],
                    ["calendario", "Calendário", "Novas provas, alterações de data e lembretes 48h antes."],
                    ["bilhetes", "Bilhetes", "Quando abre a venda para uma prova do seu interesse."],
                    ["marketplace", "Marketplace", "Novos anúncios das marcas que segue."],
                    ["forum", "Fórum", "Respostas aos seus tópicos e menções."],
                    ["newsletter", "Newsletter semanal", "Resumo da semana, às sextas-feiras."],
                  ] as const
                ).map(([k, titulo, desc]) => (
                  <label key={k} className="flex cursor-pointer items-start gap-4 py-4">
                    <input
                      type="checkbox"
                      checked={notificacoes[k]}
                      onChange={(e) => setNotificacoes({ ...notificacoes, [k]: e.target.checked })}
                      className="mt-1 size-4 shrink-0 accent-[#e10600]"
                    />
                    <span className="min-w-0">
                      <span className="block font-display text-sm uppercase text-white">{titulo}</span>
                      <span className="mt-0.5 block text-xs text-ink-500">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-5">Como quer receber</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["push", "Notificação no telemóvel", "bell"],
                    ["email", "Email", "mail"],
                    ["whatsapp", "WhatsApp", "whatsapp"],
                  ] as const
                ).map(([k, label, icone]) => (
                  <button
                    key={k}
                    onClick={() => setNotificacoes({ ...notificacoes, [k]: !notificacoes[k] })}
                    aria-pressed={notificacoes[k]}
                    className={`flex flex-col items-center gap-2.5 border p-5 transition-colors ${
                      notificacoes[k] ? "border-mb-red bg-mb-red/5" : "border-ink-800 hover:border-ink-600"
                    }`}
                  >
                    <Icon
                      name={icone}
                      className={`size-6 ${notificacoes[k] ? "text-mb-red" : "text-ink-500"}`}
                    />
                    <span className="text-center text-xs text-white">{label}</span>
                  </button>
                ))}
              </div>
            </section>

            <Button size="lg">Guardar</Button>
          </div>
        )}

        {/* ---------- ANÚNCIOS ---------- */}
        {aba === "anuncios" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl uppercase text-white">Os meus anúncios</h2>
                <p className="mt-1 text-sm text-ink-500">
                  Gira os anúncios que publicou no marketplace.
                </p>
              </div>
              <Button size="lg">
                <Icon name="plus" className="size-4" />
                Publicar anúncio
              </Button>
            </div>

            <div className="card border-ok/30 bg-ok/5 p-5">
              <p className="flex items-center gap-2.5 text-sm text-ink-200">
                <Icon name="verified" className="size-5 shrink-0 text-ok" />
                <span>
                  <strong className="text-white">Conta verificada.</strong> Os seus anúncios aparecem
                  com o selo de vendedor verificado.
                </span>
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {anuncios.slice(0, 3).map((a) => (
                <div key={a.id} className="card overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    <Placeholder nome={a.imagens[0]} className="absolute inset-0" />
                    <div className="absolute left-3 top-3">
                      <Tag tone="ok">Activo</Tag>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-sm uppercase leading-snug text-white line-clamp-2">
                      {a.titulo}
                    </h3>
                    <p className="mt-2 font-display text-lg text-white">{formatKz(a.preco)}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-600">
                      <Icon name="eye" className="size-3" />
                      {a.visualizacoes.toLocaleString("pt-PT")} visualizações
                    </p>
                    <div className="mt-4 flex gap-2 border-t border-ink-800 pt-3">
                      <Button variant="ghost" size="sm" className="flex-1">Editar</Button>
                      <Button variant="ghost" size="sm" className="flex-1">Terminar</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
