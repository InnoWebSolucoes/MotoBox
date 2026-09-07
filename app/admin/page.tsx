"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAdmin } from "@/lib/admin/store";
import { formatKz, formatDataCurta } from "@/lib/data";
import { CabecalhoPagina, Estatistica, Painel, Estado } from "@/components/admin/kit";
import { IconeNav } from "@/components/admin/Shell";

export default function PainelAdmin() {
  const { estado } = useAdmin();

  const m = useMemo(() => {
    const pagas = estado.encomendas.filter((e) => e.estado === "pago" || e.estado === "usado");
    const receita = pagas.reduce((s, e) => s + e.total, 0);
    const comissao = pagas.reduce((s, e) => s + e.taxa, 0);
    const bilhetes = pagas.reduce((s, e) => s + e.quantidade, 0);
    return {
      receita, comissao, bilhetes,
      pendentes: estado.encomendas.filter((e) => e.estado === "pendente").length,
      utilizadores: estado.utilizadores.length,
      novos: estado.utilizadores.filter((u) => u.estado === "pendente").length,
      denuncias: estado.denuncias.filter((d) => d.estado === "pendente").length,
      mensagens: estado.mensagens.filter((x) => !x.lida && !x.arquivada).length,
      subscritores: estado.subscritores.filter((s) => s.ativo).length,
      eventosAbertos: estado.eventos.filter((e) => e.estado === "bilhetes-abertos").length,
    };
  }, [estado]);

  // Receita por evento, para o gráfico de barras
  const porEvento = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const e of estado.encomendas) {
      if (e.estado !== "pago" && e.estado !== "usado") continue;
      mapa.set(e.eventoTitulo, (mapa.get(e.eventoTitulo) ?? 0) + e.total);
    }
    const linhas = [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = Math.max(1, ...linhas.map(([, v]) => v));
    return { linhas, max };
  }, [estado.encomendas]);

  const proximos = useMemo(
    () => [...estado.eventos]
      .filter((e) => e.estado !== "concluido")
      .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio))
      .slice(0, 5),
    [estado.eventos],
  );

  const atalhos = [
    { href: "/admin/noticias", nome: "Nova notícia", icone: "news" },
    { href: "/admin/eventos", nome: "Novo evento", icone: "calendar" },
    { href: "/admin/pilotos", nome: "Novo piloto", icone: "user" },
    { href: "/admin/utilizadores", nome: "Nova conta", icone: "users" },
    { href: "/admin/encomendas", nome: "Encomendas", icone: "cart" },
    { href: "/admin/moderacao", nome: "Moderação", icone: "alert" },
  ];

  return (
    <>
      <CabecalhoPagina
        titulo="Painel"
        descricao="Estado geral da plataforma Motobox Angola."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Estatistica rotulo="Receita confirmada" valor={formatKz(m.receita)} tom="ok"
          variacao={`${m.bilhetes} bilhetes vendidos`} icone={<IconeNav nome="ticket" />} />
        <Estatistica rotulo="Comissão Motobox" valor={formatKz(m.comissao)} tom="gold"
          variacao={`Taxa de ${estado.definicoes.taxaMotobox}%`} icone={<IconeNav nome="star" />} />
        <Estatistica rotulo="Utilizadores" valor={m.utilizadores}
          variacao={`${m.novos} por aprovar`} icone={<IconeNav nome="users" />} />
        <Estatistica rotulo="Subscritores" valor={m.subscritores}
          variacao="Newsletter activa" icone={<IconeNav nome="send" />} />
      </div>

      {/* Avisos accionáveis */}
      {(m.pendentes > 0 || m.denuncias > 0 || m.mensagens > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {m.pendentes > 0 && (
            <Link href="/admin/encomendas" className="border border-gold/30 bg-gold/10 p-4 transition-colors hover:bg-gold/15">
              <p className="font-display text-lg text-gold">{m.pendentes}</p>
              <p className="text-xs text-ink-300">encomendas por confirmar</p>
            </Link>
          )}
          {m.denuncias > 0 && (
            <Link href="/admin/moderacao" className="border border-mb-red/30 bg-mb-red/10 p-4 transition-colors hover:bg-mb-red/15">
              <p className="font-display text-lg text-mb-red">{m.denuncias}</p>
              <p className="text-xs text-ink-300">denúncias por resolver</p>
            </Link>
          )}
          {m.mensagens > 0 && (
            <Link href="/admin/mensagens" className="border border-ink-700 bg-ink-900 p-4 transition-colors hover:border-ink-600">
              <p className="font-display text-lg text-white">{m.mensagens}</p>
              <p className="text-xs text-ink-300">mensagens por ler</p>
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Painel titulo="Receita por evento" descricao="Encomendas pagas e utilizadas" className="lg:col-span-2">
          {porEvento.linhas.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">Ainda sem receita registada.</p>
          ) : (
            <ul className="space-y-3">
              {porEvento.linhas.map(([nome, valor]) => (
                <li key={nome}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm text-ink-200">{nome}</span>
                    <span className="shrink-0 font-display text-sm tabular-nums text-white">{formatKz(valor)}</span>
                  </div>
                  <div className="h-2 bg-ink-800">
                    <div className="h-full bg-mb-red" style={{ width: `${(valor / porEvento.max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Painel>

        <Painel titulo="Atalhos">
          <div className="grid grid-cols-2 gap-2">
            {atalhos.map((a) => (
              <Link key={a.href} href={a.href}
                className="flex flex-col items-center gap-2 border border-ink-700 bg-ink-950 p-3 text-center transition-colors hover:border-mb-red hover:bg-mb-red/5">
                <IconeNav nome={a.icone} className="size-5 text-mb-red" />
                <span className="text-[11px] leading-tight text-ink-200">{a.nome}</span>
              </Link>
            ))}
          </div>
        </Painel>

        <Painel titulo="Próximas provas" className="lg:col-span-2">
          {proximos.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">Nenhuma prova agendada.</p>
          ) : (
            <ul className="divide-y divide-ink-800">
              {proximos.map((e) => (
                <li key={e.slug} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link href="/admin/eventos" className="block truncate text-sm text-white hover:text-mb-red">
                      {e.titulo}
                    </Link>
                    <p className="truncate text-xs text-ink-500">
                      {formatDataCurta(e.dataInicio)} · {e.circuito}, {e.provincia}
                    </p>
                  </div>
                  <Estado valor={e.estado} />
                </li>
              ))}
            </ul>
          )}
        </Painel>

        <Painel titulo="Atividade recente" accoes={
          <Link href="/admin/atividade" className="text-[11px] uppercase tracking-widest text-ink-400 hover:text-white">
            Ver tudo
          </Link>
        }>
          <ul className="space-y-3">
            {estado.atividade.slice(0, 6).map((a) => (
              <li key={a.id} className="text-xs">
                <p className="text-ink-200">
                  <span className="text-white">{a.utilizador}</span> {a.accao}{" "}
                  <span className="text-ink-400">{a.entidade.toLowerCase()}</span>
                </p>
                <p className="truncate text-ink-500">{a.detalhe}</p>
              </li>
            ))}
          </ul>
        </Painel>
      </div>
    </>
  );
}
