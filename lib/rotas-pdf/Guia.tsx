/* ============================================================
   MOTOBOX — Guia em PDF de uma rota

   O que é preciso para fazer a viagem, pronto a imprimir em A4
   ou a levar no telemóvel sem rede: a capa com os números, os
   códigos QR e as ligações; o estado da estrada; o percurso em
   esquema; o itinerário troço a troço; as paragens com
   coordenadas; o horário com a luz do dia; combustível, comer,
   dormir, hospitais, perigos, emergência, rede, documentos,
   licenças e a mota certa; a lista do que levar com quadrados
   para marcar; o clima; as regras da estrada; as dicas e as
   fontes, numeradas e citadas ao longo do guia.

   Os textos fixos são os do documento "paginas.rotas" (guia),
   editáveis em /admin/rotas › Página Rotas › Guia em PDF.
   ============================================================ */

import { Document, Image as Imagem, Link, Page, Text, View } from "@react-pdf/renderer";
import { Fragment, type ReactNode } from "react";
import { duracao, minMota, urlPonto } from "@/lib/rotas-mapas";
import { preencher } from "@/lib/rotas-pagina";
import type { Exigencia, Facto, Lugar, Troco } from "@/lib/rotas-tipos";
import type { DadosGuia } from "./dados";
import { COR, LARGURA, TITULO, s } from "./estilos";
import { MapaEsquema, type MarcaMapa } from "./mapa";
import { Qr } from "./qr";

const num = (n: number) => n.toLocaleString("pt-PT");
const metros = (n: number) => `${num(n)} m`;
const coord = (p: { lat: number; lng: number }) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;

/** O lettering do logótipo tem 856 × 213 píxeis. */
const PROPORCAO_LOGO = 213 / 856;

const TOM_EXIGENCIA: Record<Exigencia, string> = {
  Tranquila: COR.ok,
  Média: "#e0a100",
  Exigente: COR.vermelho,
  Aventura: COR.vermelho,
};

/** Marcador no índice do PDF (o painel lateral dos leitores). */
const marcador = (titulo: string) => ({ bookmark: titulo }) as object;

/* ---------------- Peças ---------------- */

function Cita({ ns }: { ns: number[] }) {
  return ns.length ? <Text style={s.cita}> [{ns.join(", ")}]</Text> : null;
}

function Titulo({ children }: { children: string }) {
  return (
    <View style={[s.tituloSeccao, s.seccao]} {...marcador(children)}>
      <View style={s.tituloMarca} />
      <Text style={s.tituloTexto}>{children}</Text>
    </View>
  );
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <Text style={s.subtitulo}>{children}</Text>;
}

/**
 * Itens que não se partem entre páginas, com `cabeca` (o título da secção, o
 * subtítulo, o cabeçalho da tabela) colada ao primeiro: assim um título nunca
 * fica sozinho no fundo de uma página. Devolve os itens soltos (fragmento),
 * para a paginação os ver como irmãos.
 */
function Grupo<T>({ cabeca, itens, render }: { cabeca?: ReactNode; itens: T[]; render: (x: T, i: number) => ReactNode }) {
  if (!itens.length) return cabeca ? <View wrap={false}>{cabeca}</View> : null;
  return (
    <>
      {itens.map((x, i) => (
        <View key={i} wrap={false}>
          {i === 0 ? cabeca : null}
          {render(x, i)}
        </View>
      ))}
    </>
  );
}

function LinhaFacto({ f, d }: { f: Facto; d: DadosGuia }) {
  return (
    <View style={s.item}>
      <View style={s.marca} />
      <Text style={s.itemTexto}>
        {f.texto}
        <Cita ns={d.cita(f.fontes)} />
      </Text>
    </View>
  );
}

function Factos({ itens, d, cabeca }: { itens: Facto[]; d: DadosGuia; cabeca?: ReactNode }) {
  return <Grupo cabeca={cabeca} itens={itens} render={(f) => <LinhaFacto f={f} d={d} />} />;
}

function Lugares({ itens, d, cabeca }: { itens: Lugar[]; d: DadosGuia; cabeca?: ReactNode }) {
  return (
    <Grupo
      cabeca={cabeca}
      itens={itens}
      render={(l) => (
        <View style={[s.item, { marginBottom: 5 }]}>
          <View style={s.marca} />
          <View style={s.itemTexto}>
            <Text>
              <Text style={s.forte}>{l.nome}</Text>
              {l.onde ? <Text style={{ color: COR.cinza }}> · {l.onde}</Text> : null}
              <Cita ns={d.cita(l.fontes)} />
            </Text>
            {l.nota ? <Text style={{ color: COR.texto, fontSize: 8.5 }}>{l.nota}</Text> : null}
          </View>
        </View>
      )}
    />
  );
}

/** Em linhas de dois (uma View com flexWrap não se parte entre páginas). */
function aosPares<T>(lista: T[]): T[][] {
  const pares: T[][] = [];
  for (let i = 0; i < lista.length; i += 2) pares.push(lista.slice(i, i + 2));
  return pares;
}

const METADE = (LARGURA - 14) / 2;

function ListaVisto({ itens, cabeca }: { itens: string[]; cabeca?: ReactNode }) {
  return (
    <Grupo
      cabeca={cabeca}
      itens={aosPares(itens)}
      render={(par) => (
        <View style={{ flexDirection: "row", gap: 14, marginBottom: 5 }}>
          {par.map((t, j) => (
            <View key={j} style={[s.item, { width: METADE, marginBottom: 0 }]}>
              <View style={s.caixaVisto} />
              <Text style={s.itemTexto}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    />
  );
}

function Lista({ itens, d, cabeca }: { itens: { texto: string; fontes?: Facto["fontes"] }[]; d: DadosGuia; cabeca?: ReactNode }) {
  return (
    <Grupo
      cabeca={cabeca}
      itens={itens}
      render={(x, i) => (
        <View style={[s.item, { gap: 8, marginBottom: 5 }]}>
          <Text style={s.numeroLista}>{i + 1}</Text>
          <Text style={[s.itemTexto, { paddingTop: 1 }]}>
            {x.texto}
            <Cita ns={d.cita(x.fontes)} />
          </Text>
        </View>
      )}
    />
  );
}

/** Um texto corrido com as citações (água, grupo). */
function Paragrafo({ facto, d }: { facto: Facto; d: DadosGuia }) {
  return (
    <Text>
      {facto.texto}
      <Cita ns={d.cita(facto.fontes)} />
    </Text>
  );
}

/** Linha "valor + legenda" dos números (capa e percurso). */
function Numero({ valor, legenda, largura, ponto }: { valor: string; legenda: string; largura: number; ponto?: string }) {
  return (
    <View style={[s.caixa, { width: largura, paddingVertical: 9 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        {ponto ? <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: ponto }} /> : null}
        <Text style={{ fontFamily: TITULO, fontWeight: 700, fontSize: 19, lineHeight: 1.1, color: COR.tinta }}>{valor || "–"}</Text>
      </View>
      <Text style={[s.pequeno, { marginTop: 1 }]}>{legenda}</Text>
    </View>
  );
}

/* ---------------- Cabeçalho e rodapé ---------------- */

function Cabecalho({ d, logo }: { d: DadosGuia; logo: Buffer }) {
  return (
    <View style={s.cabecalho} fixed>
      <Imagem src={{ data: logo, format: "png" }} style={{ width: 62, height: 62 * PROPORCAO_LOGO }} />
      <Text style={s.cabecalhoTexto}>
        {d.rota.nome} · {d.tx.titulo}
      </Text>
    </View>
  );
}

function Rodape({ d }: { d: DadosGuia }) {
  return (
    <View style={s.rodape} fixed>
      <Text style={s.rodapeTexto}>{d.rodape}</Text>
      <Text
        style={s.rodapePagina}
        render={({ pageNumber, totalPages }) => preencher(d.tx.pagina, { n: pageNumber, total: totalPages })}
      />
    </View>
  );
}

/* ---------------- Capa ---------------- */

const LARGURA_QR = 226;

/**
 * Um endereço numa só linha, por baixo do código QR: sem espaços não se
 * parte, por isso a letra encolhe até caber (a Instrument Sans tem perto de
 * meio quadratim de largura média).
 */
function Endereco({ url, d }: { url: string; d: DadosGuia }) {
  const texto = d.curto(url);
  const tamanho = Math.max(5, Math.min(7.5, (LARGURA_QR - 22) / (texto.length * 0.53)));
  return (
    <Link src={url} style={[s.ligacao, { fontSize: tamanho, lineHeight: 1.3, marginTop: 4 }]}>
      {texto}
    </Link>
  );
}

function Capa({ d, logo }: { d: DadosGuia; logo: Buffer }) {
  const { rota, tx, totais: t } = d;
  const c = tx.capa;
  const larguraNumero = (LARGURA - 16) / 3;
  const ficha = (
    [
      [c.partida, rota.partida, []],
      [c.oPiso, rota.pisoDetalhe, []],
      [c.porque, rota.exigenciaPorque, []],
      [c.melhorEpoca, rota.melhorEpoca, []],
      [c.quantosDias, rota.diasNota.texto, rota.diasNota.fontes],
    ] as [string, string, Facto["fontes"]][]
  ).filter(([, v]) => v);
  const emergencia = d.pagina.EMERGENCIA?.numeros ?? [];

  return (
    <Page size="A4" style={s.capa}>
      <View style={s.corpo}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Imagem src={{ data: logo, format: "png" }} style={{ width: 150, height: 150 * PROPORCAO_LOGO }} />
          <View style={{ alignItems: "flex-end", paddingBottom: 3 }}>
            <Text style={s.rotuloVermelho}>{tx.titulo}</Text>
            <Text style={[s.pequeno, { marginTop: 3 }]}>{[d.numero, rota.regiao].filter(Boolean).join(" · ")}</Text>
          </View>
        </View>
        <View style={{ height: 2.5, backgroundColor: COR.vermelho, marginTop: 10 }} />

        <Text
          style={{ fontFamily: TITULO, fontWeight: 800, fontSize: rota.nome.length > 24 ? 34 : 42, lineHeight: 1.05, color: COR.tinta, marginTop: 20 }}
          {...marcador(rota.nome)}
        >
          {rota.nome}
        </Text>
        {rota.subtitulo ? <Text style={{ fontSize: 13, lineHeight: 1.3, color: COR.cinza, marginTop: 4 }}>{rota.subtitulo}</Text> : null}
        {rota.resumo ? <Text style={{ fontSize: 10.5, lineHeight: 1.5, marginTop: 10 }}>{rota.resumo}</Text> : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <Numero largura={larguraNumero} valor={t.km ? `${num(t.km)} km` : ""} legenda={c.distancia} />
          <Numero largura={larguraNumero} valor={t.minMota ? duracao(t.minMota) : ""} legenda={c.rodar} />
          <Numero largura={larguraNumero} valor={String(rota.dias)} legenda={rota.dias > 1 ? c.dias : c.dia} />
          <Numero largura={larguraNumero} valor={rota.exigencia} legenda={c.exigencia} ponto={TOM_EXIGENCIA[rota.exigencia]} />
          <Numero largura={larguraNumero} valor={rota.piso} legenda={c.piso} />
          <Numero largura={larguraNumero} valor={rota.epocaCurta} legenda={c.epoca} />
        </View>

        <View style={{ flexDirection: "row", gap: 18, marginTop: 18 }}>
          <View style={{ flex: 1 }}>
            {ficha.map(([rotulo, texto, fontes]) => (
              <View key={rotulo} style={{ marginBottom: 9 }}>
                <Text style={s.rotulo}>{rotulo}</Text>
                <Text style={{ fontSize: 8.5, lineHeight: 1.45, marginTop: 2 }}>
                  {texto}
                  <Cita ns={d.cita(fontes)} />
                </Text>
              </View>
            ))}
          </View>

          <View style={{ width: LARGURA_QR }}>
            <View style={s.moldura}>
              <View style={{ flexDirection: "row", gap: 9 }}>
                <Link src={d.urlRota}>
                  <Qr texto={d.urlRota} tamanho={74} />
                </Link>
                <View style={{ flex: 1, paddingTop: 4 }}>
                  <Text style={[s.forte, { fontSize: 9 }]}>{c.qrPagina}</Text>
                  <Text style={[s.pequeno, { marginTop: 2 }]}>{c.qrPaginaTexto}</Text>
                </View>
              </View>
              <Endereco url={d.urlRota} d={d} />
              {d.urlMapa ? (
                <View style={{ flexDirection: "row", gap: 9, marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: COR.linha }}>
                  <Link src={d.urlMapa}>
                    {/* O endereço leva todas as paragens: código mais denso, por isso maior. */}
                    <Qr texto={d.urlMapa} tamanho={96} nivel="L" />
                  </Link>
                  <View style={{ flex: 1, paddingTop: 4 }}>
                    <Text style={[s.forte, { fontSize: 9 }]}>{c.qrMapa}</Text>
                    <Text style={[s.pequeno, { marginTop: 2 }]}>{c.qrMapaTexto}</Text>
                    <Link src={d.urlMapa} style={[s.pequeno, s.ligacao, { marginTop: 3, fontWeight: 600 }]}>
                      {c.mapa} ›
                    </Link>
                  </View>
                </View>
              ) : null}
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: COR.linha }}>
                <Link src={d.urlGpx} style={[s.ligacao, { fontSize: 8.5, fontWeight: 600 }]}>
                  {c.gpx} ›
                </Link>
                <Text style={[s.pequeno, { marginTop: 2 }]}>{c.gpxTexto}</Text>
                <Endereco url={d.urlGpx} d={d} />
              </View>
            </View>
          </View>
        </View>

        {emergencia.length > 0 && (
          <View style={[s.caixaAviso, { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 }]} wrap={false}>
            <Text style={[s.rotuloVermelho, { width: 64 }]}>{c.emergencia}</Text>
            {emergencia.slice(0, 4).map((n, i) => (
              <View key={`${n.numero}-${i}`} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 22, lineHeight: 1, color: COR.vermelho }}>{n.numero}</Text>
                <Text style={{ flex: 1, fontSize: 7, lineHeight: 1.3, color: COR.texto }}>{n.servico}</Text>
              </View>
            ))}
          </View>
        )}
        {c.offline ? <Text style={[s.pequeno, { marginTop: 8 }]}>{c.offline}</Text> : null}
      </View>

      <Rodape d={d} />
    </Page>
  );
}

/* ---------------- Itinerário ---------------- */

function Marca({ numero, tipo }: { numero: number; tipo: MarcaMapa["tipo"] }) {
  return (
    <View
      style={{
        width: 15,
        height: 15,
        borderRadius: 2,
        justifyContent: "center",
        backgroundColor: tipo === "partida" ? COR.vermelho : tipo === "chegada" ? COR.branco : COR.tinta,
        borderWidth: tipo === "chegada" ? 1.2 : 0,
        borderColor: COR.vermelho,
      }}
    >
      <Text style={{ fontSize: 7, fontWeight: 600, lineHeight: 1, textAlign: "center", color: tipo === "chegada" ? COR.vermelho : COR.branco }}>
        {numero}
      </Text>
    </View>
  );
}

function LinhaParagem({ d, indice, tipo }: { d: DadosGuia; indice: number; tipo: MarcaMapa["tipo"] }) {
  const p = d.rota.paragens[indice];
  return (
    <View style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
      <Marca numero={indice + 1} tipo={tipo} />
      <View style={{ flex: 1, paddingTop: 1 }}>
        <Text>
          <Text style={[s.forte, { fontSize: 10 }]}>{p.nome}</Text>
          {Number.isFinite(p.alt) && p.alt ? <Text style={{ color: COR.cinza, fontSize: 8 }}>  {metros(p.alt)}</Text> : null}
        </Text>
        {p.nota ? <Text style={s.pequeno}>{p.nota}</Text> : null}
      </View>
    </View>
  );
}

function CartaoTroco({ d, troco }: { d: DadosGuia; troco: Troco }) {
  const tx = d.tx.itinerario;
  return (
    <View style={{ flexDirection: "row", gap: 9 }} wrap={false}>
      <View style={{ width: 15, alignItems: "center" }}>
        <View style={{ width: 1.5, flexGrow: 1, backgroundColor: COR.linha }} />
      </View>
      <View style={[s.moldura, { flex: 1, marginVertical: 5, paddingVertical: 8 }]}>
        <Text>
          <Text style={{ fontFamily: TITULO, fontWeight: 700, fontSize: 13, color: COR.tinta }}>{num(troco.km)} km</Text>
          <Text style={{ color: COR.cinza }}>   ·   </Text>
          <Text style={[s.forte, { fontSize: 9.5 }]}>{duracao(minMota(troco))}</Text>
          <Text style={{ color: COR.cinza }}>   ·   {d.tx.pisos[troco.piso] ?? troco.piso}</Text>
        </Text>
        {troco.estrada ? (
          <Text style={{ marginTop: 3, fontSize: 8.5 }}>
            <Text style={s.rotulo}>{tx.estrada}  </Text>
            {troco.estrada}
          </Text>
        ) : null}
        {troco.ver ? (
          <Text style={{ marginTop: 3, fontSize: 8.5 }}>
            <Text style={s.rotulo}>{tx.peloCaminho}  </Text>
            {troco.ver}
          </Text>
        ) : null}
        {troco.aviso ? (
          <View style={[s.caixaAviso, { marginTop: 5, paddingVertical: 6, paddingHorizontal: 8 }]}>
            <Text style={{ fontSize: 8.5 }}>
              <Text style={[s.rotuloVermelho, { fontSize: 7.5 }]}>{tx.aviso}  </Text>
              {troco.aviso}
            </Text>
          </View>
        ) : null}
        {d.cita(troco.fontes).length > 0 && <Text style={[s.cita, { marginTop: 3 }]}>[{d.cita(troco.fontes).join(", ")}]</Text>}
      </View>
    </View>
  );
}

function CabecaDia({ d, dia }: { d: DadosGuia; dia: DadosGuia["dias"][number] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, paddingBottom: 5, marginTop: 10, marginBottom: 7, borderBottomWidth: 0.9, borderBottomColor: COR.tinta }}>
      <Text style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 14, lineHeight: 1, color: COR.vermelho, textTransform: "uppercase" }}>
        {d.tx.itinerario.dia} {dia.dia}
      </Text>
      <Text style={[s.forte, { flex: 1, fontSize: 10, lineHeight: 1.2 }]}>{dia.titulo}</Text>
      <Text style={{ fontSize: 8.5, lineHeight: 1.2, color: COR.cinza }}>
        {num(dia.km)} km · {duracao(dia.minMota)}
      </Text>
    </View>
  );
}

/**
 * Cada troço não se separa da paragem onde chega (nem, no primeiro do dia, da
 * de partida e do cabeçalho do dia; nem, no primeiro de todos, do título).
 */
function Itinerario({ d }: { d: DadosGuia }) {
  const tx = d.tx.itinerario;
  const unidades = d.dias.flatMap((dia) => dia.trocos.map((troco, i) => ({ dia, troco, i, ultimo: i === dia.trocos.length - 1 })));
  return (
    <Grupo
      cabeca={<Titulo>{tx.titulo}</Titulo>}
      itens={unidades}
      render={({ dia, troco, i, ultimo }) => (
        <>
          {i === 0 && d.multiDia ? <CabecaDia d={d} dia={dia} /> : null}
          {i === 0 && <LinhaParagem d={d} indice={troco.de} tipo="partida" />}
          <CartaoTroco d={d} troco={troco} />
          <LinhaParagem d={d} indice={troco.para} tipo={ultimo ? "chegada" : "meio"} />
          {ultimo && d.multiDia && dia.navegacao ? (
            <Link src={dia.navegacao} style={[s.pequeno, s.ligacao, { marginTop: 6, marginBottom: 4, fontWeight: 600 }]}>
              {preencher(tx.abrirDia, { n: dia.dia })} ›
            </Link>
          ) : null}
        </>
      )}
    />
  );
}

/* ---------------- O documento ---------------- */

export function Guia({ d, logo }: { d: DadosGuia; logo: Buffer }) {
  const { rota, pagina, tx, totais: t } = d;
  const larguraNumero = (LARGURA - 5 * 6) / 6;
  const marcas: MarcaMapa[] = d.noMapa.map((p, i, todas) => ({
    numero: rota.paragens.indexOf(p) + 1,
    paragem: p,
    tipo: i === 0 ? "partida" : i === todas.length - 1 ? "chegada" : "meio",
  }));
  const estrada = rota.estrada;
  const NOME_ESTADO = { boa: tx.estrada.boa, irregular: tx.estrada.irregular, má: tx.estrada.ma };
  const COR_ESTADO = {
    boa: { fundo: COR.fundoOk, cor: COR.ok },
    irregular: { fundo: COR.fundoOuro, cor: COR.ouro },
    má: { fundo: COR.vermelho, cor: COR.branco },
  };
  const combustivel = [...rota.combustivel, pagina.PRECO_COMBUSTIVEL].filter((f) => f?.texto);
  const rede = [...rota.rede, pagina.REDE_GERAL].filter((f) => f?.texto);
  const clima = d.clima;
  // Luz do dia em Junho e em Dezembro, os dois extremos do ano.
  const luz = d.sol.length === 12 ? [5, 11] : [];
  const emergencia = pagina.EMERGENCIA;

  /* ----- Informação prática e o que levar: subsecções; a primeira leva o título da secção ----- */
  type Parte = (cabeca: ReactNode) => ReactNode;
  const juntar = (titulo: ReactNode, partes: (Parte | false)[]) =>
    partes.filter((x): x is Parte => Boolean(x)).map((parte, i) => <Fragment key={i}>{parte(i === 0 ? titulo : null)}</Fragment>);
  const sub = (cabeca: ReactNode, texto: string) => (
    <>
      {cabeca}
      <Subtitulo>{texto}</Subtitulo>
    </>
  );

  const pratico: (Parte | false)[] = [
    (Boolean(rota.semCombustivel.texto) || combustivel.length > 0) &&
      ((c) => (
        <Factos
          d={d}
          itens={combustivel}
          cabeca={
            <>
              {sub(c, tx.pratico.combustivel)}
              {rota.semCombustivel.texto ? (
                <View style={[s.caixaAviso, { marginBottom: 6 }]}>
                  <Text style={s.rotuloVermelho}>{tx.pratico.semCombustivel}</Text>
                  <Text style={{ marginTop: 2 }}>
                    {rota.semCombustivel.texto}
                    <Cita ns={d.cita(rota.semCombustivel.fontes)} />
                  </Text>
                </View>
              ) : null}
            </>
          }
        />
      )),
    emergencia.numeros.length > 0 &&
      ((c) => (
        <>
          <View wrap={false}>
            {sub(c, tx.pratico.emergencia)}
            {aosPares(emergencia.numeros).map((par, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
                {par.map((n, j) => (
                  <View
                    key={`${n.numero}-${j}`}
                    style={[s.caixa, { width: (LARGURA - 6) / 2, flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 7 }]}
                  >
                    <Text style={{ fontFamily: TITULO, fontWeight: 800, fontSize: 22, lineHeight: 1, color: COR.vermelho }}>{n.numero}</Text>
                    <Text style={{ flex: 1, fontSize: 8, lineHeight: 1.35 }}>{n.servico}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          {emergencia.notas.map((n, i) => (
            <Text key={`${i}-${n.slice(0, 30)}`} style={[s.paragrafo, { fontSize: 8.5 }]}>
              {n}
              {i === emergencia.notas.length - 1 ? <Cita ns={d.cita(emergencia.fontes)} /> : null}
            </Text>
          ))}
          {tx.pratico.contactos ? (
            <View style={[s.moldura, { marginTop: 4 }]} wrap={false}>
              <Text style={s.forte}>{tx.pratico.contactos}</Text>
              {tx.pratico.contactosTexto ? <Text style={s.pequeno}>{tx.pratico.contactosTexto}</Text> : null}
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ height: 17, borderBottomWidth: 0.6, borderBottomColor: COR.cinzaClaro }} />
              ))}
            </View>
          ) : null}
        </>
      )),
    rota.comer.length > 0 && ((c) => <Lugares d={d} itens={rota.comer} cabeca={sub(c, tx.pratico.comer)} />),
    rota.dormir.length > 0 && ((c) => <Lugares d={d} itens={rota.dormir} cabeca={sub(c, tx.pratico.dormir)} />),
    rota.saude.length > 0 && ((c) => <Lugares d={d} itens={rota.saude} cabeca={sub(c, tx.pratico.saude)} />),
    rota.perigos.length > 0 && ((c) => <Factos d={d} itens={rota.perigos} cabeca={sub(c, tx.pratico.perigos)} />),
    rede.length > 0 && ((c) => <Factos d={d} itens={rede} cabeca={sub(c, tx.pratico.rede)} />),
    pagina.DOCUMENTOS.length > 0 && ((c) => <Factos d={d} itens={pagina.DOCUMENTOS} cabeca={sub(c, tx.pratico.documentos)} />),
    rota.licencas.length > 0 && ((c) => <Factos d={d} itens={rota.licencas} cabeca={sub(c, tx.pratico.licencas)} />),
    rota.motas.length > 0 && ((c) => <Factos d={d} itens={rota.motas} cabeca={sub(c, tx.pratico.motas)} />),
  ];

  const levar: (Parte | false)[] = [
    rota.levar.length > 0 && ((c) => <ListaVisto itens={rota.levar} cabeca={sub(c, tx.levar.rota)} />),
    pagina.LEVAR_BASE.length > 0 && ((c) => <ListaVisto itens={pagina.LEVAR_BASE} cabeca={sub(c, tx.levar.sempre)} />),
    Boolean(rota.agua.texto) &&
      ((c) => <Grupo cabeca={sub(c, tx.levar.agua)} itens={[rota.agua]} render={(f) => <Paragrafo facto={f} d={d} />} />),
    Boolean(rota.grupo.texto) &&
      ((c) => <Grupo cabeca={sub(c, tx.levar.grupo)} itens={[rota.grupo]} render={(f) => <Paragrafo facto={f} d={d} />} />),
  ];

  const cabecaHorario = (
    <>
      <Titulo>{tx.horario.titulo}</Titulo>
      {tx.horario.texto ? <Text style={s.paragrafo}>{tx.horario.texto}</Text> : null}
      {clima && luz.length > 0 && (
        <View style={[s.caixa, { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 4, marginBottom: 4 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.forte}>{preencher(tx.horario.luz, { cidade: clima.cidade })}</Text>
            <Text style={s.pequeno}>{tx.horario.luzNota}</Text>
          </View>
          {luz.map((m) => (
            <View key={m}>
              <Text style={s.rotulo}>{d.meses[m]}</Text>
              <Text style={{ fontFamily: TITULO, fontWeight: 700, fontSize: 15, lineHeight: 1.15, color: COR.tinta }}>
                {d.sol[m].nascer} – {d.sol[m].por}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  const cabecaTabelaParagens = (
    <View style={s.cabecaTabela}>
      <Text style={[s.rotulo, { width: 22 }]}>#</Text>
      <Text style={[s.rotulo, { flex: 1 }]}>{tx.paragens.paragem}</Text>
      <Text style={[s.rotulo, { width: 128 }]}>{tx.paragens.coordenadas}</Text>
      <Text style={[s.rotulo, { width: 58, textAlign: "right" }]}>{tx.paragens.altitude}</Text>
    </View>
  );
  const cabecaTabelaPontos = (
    <View style={s.cabecaTabela}>
      <Text style={[s.rotulo, { width: 150 }]}>{tx.paragens.lugar}</Text>
      <Text style={[s.rotulo, { width: 110 }]}>{tx.paragens.coordenadas}</Text>
      <Text style={[s.rotulo, { flex: 1 }]}>{tx.paragens.nota}</Text>
    </View>
  );

  return (
    <Document
      title={`${rota.nome}: ${tx.titulo}`}
      author="MotoBox Angola"
      subject={rota.resumo}
      keywords={["MotoBox", "Angola", "mota", rota.nome, rota.regiao].filter(Boolean).join(", ")}
      creator="MotoBox Angola"
      producer="MotoBox Angola"
      language="pt"
    >
      <Capa d={d} logo={logo} />

      <Page size="A4" style={s.pagina} wrap>
        <Cabecalho d={d} logo={logo} />
        <View style={s.corpo}>
          {/* ============ ESTADO DA ESTRADA ============ */}
          {estrada && estrada.relatos.length > 0 && (
            <Grupo
              cabeca={
                <>
                  <Titulo>{tx.estrada.titulo}</Titulo>
                  {tx.estrada.texto ? (
                    <Text style={[s.paragrafo, { color: COR.cinza }]}>{preencher(tx.estrada.texto, { quando: estrada.quando })}</Text>
                  ) : null}
                </>
              }
              itens={estrada.relatos}
              render={(r) => (
                <View style={[s.linhaTabela, { gap: 10, alignItems: "flex-start" }]}>
                  <Text
                    style={{
                      width: 56,
                      fontSize: 7.5,
                      fontWeight: 600,
                      lineHeight: 1,
                      textAlign: "center",
                      paddingVertical: 3.5,
                      borderRadius: 2,
                      marginTop: 1,
                      backgroundColor: COR_ESTADO[r.estado].fundo,
                      color: COR_ESTADO[r.estado].cor,
                    }}
                  >
                    {NOME_ESTADO[r.estado]}
                  </Text>
                  <Text style={{ flex: 1 }}>
                    <Text style={s.forte}>{r.troco}</Text>
                    {r.nota ? (
                      <Text>
                        {r.troco ? ". " : ""}
                        {r.nota}
                      </Text>
                    ) : null}
                  </Text>
                </View>
              )}
            />
          )}

          {/* ============ O PERCURSO ============ */}
          {marcas.length >= 2 && (
            <>
              <View wrap={false}>
                <Titulo>{tx.mapa.titulo}</Titulo>
                <MapaEsquema tracado={rota.tracado || undefined} marcas={marcas} largura={LARGURA} norte={tx.mapa.norte} escala={tx.mapa.escala} />
                <Text style={[s.pequeno, { marginTop: 5 }]}>{marcas.map((m) => `${m.numero} ${m.paragem.nome}`).join("  ·  ")}</Text>
                {tx.mapa.nota ? <Text style={[s.pequeno, { color: COR.cinzaClaro }]}>{tx.mapa.nota}</Text> : null}
              </View>
              {t.km > 0 && (
                <View wrap={false}>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
                    <Numero largura={larguraNumero} valor={`${num(t.km)} km`} legenda={tx.itinerario.total} />
                    <Numero largura={larguraNumero} valor={duracao(t.minMota)} legenda={tx.itinerario.rodar} />
                    <Numero largura={larguraNumero} valor={duracao(t.minCarro)} legenda={tx.itinerario.carro} />
                    <Numero largura={larguraNumero} valor={metros(rota.altimetria.subida)} legenda={tx.itinerario.subida} />
                    <Numero largura={larguraNumero} valor={metros(rota.altimetria.max)} legenda={tx.itinerario.maxima} />
                    <Numero largura={larguraNumero} valor={metros(rota.altimetria.min)} legenda={tx.itinerario.minima} />
                  </View>
                  {tx.itinerario.metodo ? (
                    <Text style={[s.pequeno, { marginTop: 5, color: COR.cinzaClaro, fontSize: 6.5 }]}>{tx.itinerario.metodo}</Text>
                  ) : null}
                </View>
              )}
            </>
          )}

          {/* ============ ITINERÁRIO ============ */}
          {d.dias.length > 0 && <Itinerario d={d} />}

          {/* ============ PARAGENS E COORDENADAS ============ */}
          {d.noMapa.length > 0 && (
            <Grupo
              cabeca={
                <>
                  <Titulo>{tx.paragens.titulo}</Titulo>
                  {tx.paragens.texto ? <Text style={[s.paragrafo, { color: COR.cinza }]}>{tx.paragens.texto}</Text> : null}
                  {cabecaTabelaParagens}
                </>
              }
              itens={d.noMapa}
              render={(p) => (
                <View style={s.linhaTabela}>
                  <Text style={[s.celula, { width: 22, fontWeight: 600 }]}>{rota.paragens.indexOf(p) + 1}</Text>
                  <Text style={[s.celula, { flex: 1, paddingRight: 8 }]}>
                    <Link src={urlPonto(p)} style={{ color: COR.tinta, textDecoration: "none" }}>
                      {p.nome}
                    </Link>
                    <Cita ns={d.cita(p.fonte)} />
                  </Text>
                  <Text style={[s.celula, { width: 128 }]}>{coord(p)}</Text>
                  <Text style={[s.celula, { width: 58, textAlign: "right" }]}>{p.alt ? metros(p.alt) : "–"}</Text>
                </View>
              )}
            />
          )}
          {rota.pontos.length > 0 && (
            <Grupo
              cabeca={
                <>
                  {d.noMapa.length > 0 ? <Subtitulo>{tx.paragens.pontos}</Subtitulo> : <Titulo>{tx.paragens.pontos}</Titulo>}
                  {cabecaTabelaPontos}
                </>
              }
              itens={rota.pontos}
              render={(p) => (
                <View style={s.linhaTabela}>
                  <Text style={[s.celula, { width: 150, paddingRight: 8, fontWeight: 600, color: COR.tinta }]}>
                    <Link src={urlPonto(p)} style={{ color: COR.tinta, textDecoration: "none" }}>
                      {p.nome}
                    </Link>
                  </Text>
                  <Text style={[s.celula, { width: 110 }]}>{coord(p)}</Text>
                  <Text style={[s.celula, { flex: 1 }]}>
                    {p.nota}
                    <Cita ns={d.cita(p.fontes)} />
                  </Text>
                </View>
              )}
            />
          )}

          {/* ============ HORÁRIO ============ */}
          {rota.horario.length > 0
            ? rota.horario.map((h, i) => (
                <Grupo
                  key={`${i}-${h.titulo}`}
                  cabeca={
                    <>
                      {i === 0 ? cabecaHorario : null}
                      <Subtitulo>
                        {d.multiDia ? (
                          <Text style={{ color: COR.vermelho }}>
                            {tx.itinerario.dia} {i + 1} ·{" "}
                          </Text>
                        ) : null}
                        {h.titulo}
                      </Subtitulo>
                    </>
                  }
                  itens={h.passos}
                  render={(p) => (
                    <View style={{ flexDirection: "row", gap: 9, marginBottom: 4 }}>
                      <Text
                        style={{
                          width: 38,
                          backgroundColor: p.hora ? COR.vermelho : COR.branco,
                          color: COR.branco,
                          fontWeight: 600,
                          fontSize: 8.5,
                          lineHeight: 1,
                          textAlign: "center",
                          paddingVertical: 3.5,
                          borderRadius: 2,
                        }}
                      >
                        {p.hora}
                      </Text>
                      <Text style={{ flex: 1, paddingTop: 1 }}>{p.texto}</Text>
                    </View>
                  )}
                />
              ))
            : luz.length > 0 && <View wrap={false}>{cabecaHorario}</View>}

          {/* ============ INFORMAÇÃO PRÁTICA ============ */}
          {juntar(<Titulo>{tx.pratico.titulo}</Titulo>, pratico)}

          {/* ============ O QUE LEVAR ============ */}
          {juntar(
            <>
              <Titulo>{tx.levar.titulo}</Titulo>
              {tx.levar.texto ? <Text style={[s.paragrafo, { color: COR.cinza }]}>{tx.levar.texto}</Text> : null}
            </>,
            levar,
          )}

          {/* ============ CLIMA E LUZ ============ */}
          {clima && (
            <View wrap={false}>
              <Titulo>{preencher(tx.clima.titulo, { cidade: clima.cidade })}</Titulo>
              <View style={s.cabecaTabela}>
                <Text style={[s.celula, { width: 75 }]} />
                {d.meses.map((m) => (
                  <Text key={m} style={[s.rotulo, { flex: 1, textAlign: "center" }]}>
                    {m}
                  </Text>
                ))}
              </View>
              {(
                [
                  [tx.clima.maxima, (i: number) => clima.meses[i]?.max, false],
                  [tx.clima.minima, (i: number) => clima.meses[i]?.min, false],
                  [tx.clima.chuva, (i: number) => clima.meses[i]?.chuva, true],
                  [tx.clima.nascer, (i: number) => d.sol[i]?.nascer, false],
                  [tx.clima.por, (i: number) => d.sol[i]?.por, false],
                ] as [string, (i: number) => number | string | null | undefined, boolean][]
              ).map(([rotulo, valor, eChuva]) => (
                <View key={rotulo} style={s.linhaTabela}>
                  <Text style={[s.celula, { width: 75, color: COR.cinza, fontSize: 7.5 }]}>{rotulo}</Text>
                  {d.meses.map((m, i) => {
                    const v = valor(i);
                    const chuvoso = eChuva && typeof v === "number" && v >= 50;
                    return (
                      <Text key={m} style={[s.celulaNumero, { flex: 1, fontSize: 7.5 }, chuvoso ? { color: COR.vermelho, fontWeight: 700 } : {}]}>
                        {typeof v === "number" ? num(v) : (v ?? "–")}
                      </Text>
                    );
                  })}
                </View>
              ))}
              <Text style={[s.pequeno, { marginTop: 5 }]}>
                {[clima.nota, tx.clima.nota].filter(Boolean).join(" ")}
                <Cita ns={d.cita(clima.fonte)} />
              </Text>
            </View>
          )}

          {/* ============ REGRAS E DICAS ============ */}
          {pagina.REGRAS_ESTRADA.length > 0 && (
            <Lista
              d={d}
              cabeca={<Titulo>{tx.regras.titulo}</Titulo>}
              itens={pagina.REGRAS_ESTRADA.map((r) => ({ texto: r.texto, fontes: r.fonte ? [r.fonte] : [] }))}
            />
          )}
          {rota.dicas.length > 0 && <Lista d={d} cabeca={<Titulo>{tx.dicas.titulo}</Titulo>} itens={rota.dicas.map((texto) => ({ texto }))} />}

          {/* ============ FONTES ============ */}
          {d.fontes.length > 0 && (
            <>
              <Grupo
                cabeca={
                  <>
                    <Titulo>{tx.fontes.titulo}</Titulo>
                    {tx.fontes.texto ? <Text style={[s.paragrafo, { color: COR.cinza }]}>{tx.fontes.texto}</Text> : null}
                  </>
                }
                itens={aosPares(d.fontes.map((f, i) => ({ ...f, n: i + 1 })))}
                render={(par) => (
                  <View style={{ flexDirection: "row", gap: 14, marginBottom: 3 }}>
                    {par.map((f) => (
                      <View key={f.url} style={{ width: METADE, flexDirection: "row", gap: 4 }}>
                        <Text style={{ width: 14, fontSize: 7, lineHeight: 1.35, color: COR.cinzaClaro }}>{f.n}</Text>
                        <Link src={f.url} style={{ flex: 1, fontSize: 7, lineHeight: 1.35, color: COR.texto, textDecoration: "none" }}>
                          {f.nome}
                          <Text style={{ color: COR.cinzaClaro }}> · {dominio(f.url)}</Text>
                        </Link>
                      </View>
                    ))}
                  </View>
                )}
              />
              {tx.fontes.nota ? <Text style={[s.pequeno, { marginTop: 6 }]}>{tx.fontes.nota}</Text> : null}
            </>
          )}
        </View>

        <Rodape d={d} />
      </Page>
    </Document>
  );
}

/** "https://www.jornaldeangola.ao/noticias/…" → "jornaldeangola.ao". */
function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
