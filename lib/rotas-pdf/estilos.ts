/* ============================================================
   MOTOBOX — Guia em PDF: cores, letras e medidas

   A4, fundo branco para imprimir, o vermelho da marca como
   acento. As letras são as do site: Instrument Sans no texto e
   Barlow Condensed nos títulos (o lettering do logótipo), com a
   Inter como reserva para os poucos sinais que lhes faltam.
   ============================================================ */

import { StyleSheet } from "@react-pdf/renderer";

export const COR = {
  vermelho: "#e10600",
  vermelhoEscuro: "#b30500",
  tinta: "#1d1d23",
  texto: "#2c2c33",
  cinza: "#5c5c68",
  cinzaClaro: "#8b8b96",
  linha: "#dcdce2",
  fundo: "#f4f4f6",
  fundoAviso: "#fdeceb",
  ok: "#15803d",
  fundoOk: "#e6f4ea",
  ouro: "#8a5a00",
  fundoOuro: "#fff1cc",
  branco: "#ffffff",
};

/** Famílias registadas em index.tsx; a segunda é a reserva. */
export const TEXTO = ["MBTexto", "MBReserva"];
export const TITULO = ["MBTitulo", "MBReserva"];

/** A4 em pontos e as margens das páginas de conteúdo. */
export const A4 = { largura: 595.28, altura: 841.89 };
export const MARGEM = { lado: 42, topo: 64, fundo: 56 };
export const LARGURA = A4.largura - 2 * MARGEM.lado;

export const s = StyleSheet.create({
  /* ---------- páginas ---------- */
  // Sem lineHeight na página: herdada, apaga os textos com `render` (o número
  // da página) no @react-pdf/renderer 4.9. Vai no `corpo`, à volta do conteúdo.
  pagina: {
    paddingTop: MARGEM.topo,
    paddingBottom: MARGEM.fundo,
    paddingHorizontal: MARGEM.lado,
    fontFamily: TEXTO,
    fontSize: 9,
    color: COR.texto,
    backgroundColor: COR.branco,
  },
  capa: {
    paddingTop: 38,
    paddingBottom: MARGEM.fundo,
    paddingHorizontal: MARGEM.lado,
    fontFamily: TEXTO,
    fontSize: 9,
    color: COR.texto,
    backgroundColor: COR.branco,
  },
  corpo: { fontSize: 9, lineHeight: 1.45 },
  cabecalho: {
    position: "absolute",
    top: 24,
    left: MARGEM.lado,
    right: MARGEM.lado,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
    borderBottomWidth: 0.75,
    borderBottomColor: COR.linha,
  },
  cabecalhoTexto: { fontSize: 7.5, color: COR.cinza, lineHeight: 1 },
  rodape: {
    position: "absolute",
    bottom: 22,
    left: MARGEM.lado,
    right: MARGEM.lado,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    paddingTop: 6,
    borderTopWidth: 0.75,
    borderTopColor: COR.linha,
  },
  rodapeTexto: { flex: 1, fontSize: 7, lineHeight: 1.35, color: COR.cinza },
  rodapePagina: { fontSize: 7, color: COR.tinta, fontWeight: 600 },

  /* ---------- títulos ---------- */
  seccao: { marginTop: 20 },
  tituloSeccao: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  tituloMarca: { width: 4, height: 15, backgroundColor: COR.vermelho, borderRadius: 1 },
  tituloTexto: { fontFamily: TITULO, fontWeight: 800, fontSize: 17, lineHeight: 1.1, color: COR.tinta, textTransform: "uppercase" },
  subtitulo: { fontWeight: 600, fontSize: 10, lineHeight: 1.3, color: COR.tinta, marginTop: 10, marginBottom: 4 },
  rotulo: { fontSize: 7, lineHeight: 1.2, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", color: COR.cinza },
  rotuloVermelho: { fontSize: 7, lineHeight: 1.2, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", color: COR.vermelho },

  /* ---------- texto ---------- */
  paragrafo: { marginBottom: 4 },
  pequeno: { fontSize: 7.5, lineHeight: 1.4, color: COR.cinza },
  cita: { fontSize: 6.5, color: COR.cinzaClaro },
  ligacao: { color: COR.vermelhoEscuro, textDecoration: "none" },
  forte: { fontWeight: 600, color: COR.tinta },

  /* ---------- listas ---------- */
  item: { flexDirection: "row", gap: 6, marginBottom: 3.5 },
  marca: { width: 3.5, height: 3.5, backgroundColor: COR.vermelho, marginTop: 4.6, borderRadius: 0.5 },
  itemTexto: { flex: 1 },
  caixaVisto: { width: 8.5, height: 8.5, borderWidth: 0.9, borderColor: COR.tinta, borderRadius: 1.5, marginTop: 2 },
  numeroLista: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: COR.tinta,
    color: COR.branco,
    fontSize: 7.5,
    fontWeight: 600,
    textAlign: "center",
    paddingTop: 3,
    lineHeight: 1,
  },

  /* ---------- caixas ---------- */
  caixa: { backgroundColor: COR.fundo, borderRadius: 4, padding: 10 },
  caixaAviso: { backgroundColor: COR.fundoAviso, borderRadius: 4, padding: 10 },
  moldura: { borderWidth: 0.75, borderColor: COR.linha, borderRadius: 4, padding: 10 },

  /* ---------- tabelas ---------- */
  linhaTabela: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COR.linha, paddingVertical: 3.5 },
  cabecaTabela: { flexDirection: "row", borderBottomWidth: 0.9, borderBottomColor: COR.tinta, paddingBottom: 3 },
  celula: { fontSize: 8, lineHeight: 1.35 },
  celulaNumero: { fontSize: 8, lineHeight: 1.35, textAlign: "center" },
});
