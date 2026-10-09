"use client";

/* ============================================================
   MOTOBOX ADMIN — Página Clubes: os campos do documento
   "paginas.clubes" (todos os textos fixos de /clubes e da página
   de cada clube). Ver lib/conteudo/grupos/clubes.ts.
   ============================================================ */

import { Seta } from "@/components/admin/kit";
import type { CampoEsquema, Opcao } from "@/components/admin/editor/esquema";

const AJUDA_LIGACAO = "Uma página do site (ex.: /seguranca) ou um endereço completo (https://…).";

/** Escolha das rotas mostradas em "Para onde ir de mota", pela ordem em que se escolhem. */
function EscolhaRotas({ valor, mudar, rotas }: { valor: unknown; mudar: (v: unknown) => void; rotas: Opcao[] }) {
  const escolhidas = Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
  const alternar = (s: string) => mudar(escolhidas.includes(s) ? escolhidas.filter((x) => x !== s) : [...escolhidas, s]);
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= escolhidas.length) return;
    const v = [...escolhidas];
    [v[i], v[j]] = [v[j], v[i]];
    mudar(v);
  };
  const nome = (s: string) => rotas.find((r) => r.valor === s)?.nome ?? s;
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-[13px] font-medium text-white/75">Rotas mostradas</span>
      <span className="mb-2 block text-xs leading-relaxed text-white/50">
        Toque nas rotas para as escolher, pela ordem em que devem aparecer. Sem nenhuma escolhida, aparecem as três primeiras da lista de Rotas.
      </span>
      {rotas.length === 0 ? (
        <p className="text-sm text-white/50">A carregar as rotas…</p>
      ) : (
        <div className="flex flex-wrap gap-[var(--intervalo)]">
          {rotas.map((r) => {
            const n = escolhidas.indexOf(r.valor);
            return (
              <button
                key={r.valor} type="button" aria-pressed={n >= 0} onClick={() => alternar(r.valor)}
                className="pilula aria-pressed:bg-mb-red aria-pressed:text-white"
              >
                {n >= 0 && <span className="tabular-nums text-white/80">{n + 1}.</span>}
                {r.nome}
              </button>
            );
          })}
        </div>
      )}
      {escolhidas.length > 1 && (
        <ol className="mt-3 space-y-1">
          {escolhidas.map((s, i) => (
            <li key={s} className="flex items-center justify-between gap-2 rounded-[var(--raio)] bg-black/20 px-3 py-1.5 text-sm">
              <span className="truncate"><span className="text-white/50">{i + 1}.</span> {nome(s)}</span>
              <span className="flex shrink-0 gap-1">
                <button type="button" aria-label={`Subir ${nome(s)}`} onClick={() => mover(i, -1)} className="rounded p-1 text-white/50 hover:text-white"><Seta para="cima" /></button>
                <button type="button" aria-label={`Descer ${nome(s)}`} onClick={() => mover(i, 1)} className="rounded p-1 text-white/50 hover:text-white"><Seta para="baixo" /></button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function esquemaPaginaClubes(movimentos: Opcao[], rotas: Opcao[]): CampoEsquema[] {
  return [
    {
      tipo: "secao", titulo: "Abertura de /clubes", descricao: "O topo da página com todos os clubes.",
      campos: [
        { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo" },
        { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", ajuda: "A linha pequena em maiúsculas, por cima do título.", largura: "meia" },
        { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
        { tipo: "area", chave: "texto", etiqueta: "Texto de apresentação", linhas: 3 },
        { tipo: "texto", chave: "botaoLista", etiqueta: "Botão vermelho", ajuda: "Desce até à lista de clubes.", largura: "meia" },
        { tipo: "texto", chave: "botaoJuntar", etiqueta: "Botão escuro", ajuda: "Desce até ao formulário para juntar um clube.", largura: "meia" },
      ],
    },
    {
      tipo: "secao", titulo: "O movimento motard e os números",
      campos: [
        { tipo: "texto", chave: "introTitulo", etiqueta: "Título" },
        { tipo: "lista-texto", chave: "introParagrafos", etiqueta: "Parágrafos", multilinha: true, placeholder: "Novo parágrafo" },
        { tipo: "nota", texto: "Os três primeiros números contam-se sozinhos a partir dos clubes publicados. Aqui escreve-se a legenda de cada um." },
        { tipo: "texto", chave: "numeroClubes", etiqueta: "Legenda: número de clubes", largura: "meia" },
        { tipo: "texto", chave: "numeroProvincias", etiqueta: "Legenda: províncias com sede", largura: "meia" },
        { tipo: "texto", chave: "numeroMulheres", etiqueta: "Legenda: movimentos e clubes de mulheres" },
        { tipo: "texto", chave: "numeroFixoValor", etiqueta: "Quarto número", ajuda: "Escrito à mão. Vazio: o quadro não aparece.", largura: "meia" },
        { tipo: "texto", chave: "numeroFixoTexto", etiqueta: "Legenda do quarto número", largura: "meia" },
      ],
    },
    {
      tipo: "secao", titulo: "Lista de clubes",
      campos: [
        { tipo: "texto", chave: "listaTitulo", etiqueta: "Título", largura: "meia" },
        { tipo: "texto", chave: "listaTodosTipos", etiqueta: "Pílula de todos os tipos", largura: "meia" },
        { tipo: "texto", chave: "listaTodoPais", etiqueta: "Pílula de todas as províncias", largura: "meia" },
        { tipo: "texto", chave: "listaVazio", etiqueta: "Aviso quando o filtro não tem clubes", largura: "meia" },
        { tipo: "texto", chave: "listaVazioLigacao", etiqueta: "Ligação por baixo desse aviso", ajuda: "Leva ao formulário para juntar um clube." },
        { tipo: "texto", chave: "listaNota", etiqueta: "Nota por baixo da lista", ajuda: "Vazia: não aparece." },
      ],
    },
    {
      tipo: "secao", titulo: "Movimentos", descricao: "A secção dos movimentos, que não são clubes (ex.: Lady Riders).",
      campos: [
        { tipo: "texto", chave: "movimentosTitulo", etiqueta: "Título", largura: "meia" },
        { tipo: "texto", chave: "movimentosTexto", etiqueta: "Texto ao lado do título", largura: "meia" },
        {
          tipo: "seleccao", chave: "movimentoDestaque", etiqueta: "Movimento com o cartão grande",
          ajuda: "Os outros movimentos aparecem em cartões pequenos.",
          opcoes: movimentos, vazio: "Nenhum: todos em cartões pequenos",
        },
        { tipo: "texto", chave: "movimentoSobretitulo", etiqueta: "Cartão grande: sobretítulo", largura: "meia", mostrarSe: (v) => Boolean(v.movimentoDestaque) },
        { tipo: "texto", chave: "movimentoTitulo", etiqueta: "Cartão grande: título", largura: "meia", mostrarSe: (v) => Boolean(v.movimentoDestaque) },
        { tipo: "area", chave: "movimentoTexto", etiqueta: "Cartão grande: texto", linhas: 4, mostrarSe: (v) => Boolean(v.movimentoDestaque) },
        { tipo: "imagem", chave: "movimentoFoto", etiqueta: "Cartão grande: fotografia", mostrarSe: (v) => Boolean(v.movimentoDestaque) },
      ],
    },
    {
      tipo: "secao", titulo: "Antes do primeiro passeio em grupo", descricao: "Os cartões com conselhos para quem quer entrar num clube.",
      campos: [
        { tipo: "texto", chave: "passosTitulo", etiqueta: "Título" },
        { tipo: "texto", chave: "passosTexto", etiqueta: "Texto por baixo do título" },
        {
          tipo: "lista", chave: "passos", etiqueta: "Cartões", nomeItem: "cartão",
          resumo: (p) => String(p.titulo ?? ""),
          novo: () => ({ titulo: "", texto: "", ligacaoTexto: "", ligacao: "" }),
          campos: [
            { tipo: "texto", chave: "titulo", etiqueta: "Título" },
            { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
            { tipo: "texto", chave: "ligacaoTexto", etiqueta: "Ligação no fim do texto", ajuda: "Ex.: Ler as regras. Vazio: sem ligação.", largura: "meia" },
            { tipo: "texto", chave: "ligacao", etiqueta: "Para onde leva", ajuda: AJUDA_LIGACAO, largura: "meia" },
          ],
        },
      ],
    },
    {
      tipo: "secao", titulo: "Para onde ir de mota", descricao: "Três rotas sugeridas, com ligação para a secção Rotas.",
      campos: [
        { tipo: "booleano", chave: "rotasMostrar", etiqueta: "Mostrar esta secção" },
        { tipo: "texto", chave: "rotasTitulo", etiqueta: "Título", largura: "meia", mostrarSe: (v) => v.rotasMostrar !== false },
        { tipo: "texto", chave: "rotasLigacao", etiqueta: "Ligação para todas as rotas", largura: "meia", mostrarSe: (v) => v.rotasMostrar !== false },
        { tipo: "area", chave: "rotasTexto", etiqueta: "Texto", linhas: 2, mostrarSe: (v) => v.rotasMostrar !== false },
        {
          tipo: "personalizado", chave: "rotasEscolhidas", etiqueta: "Rotas mostradas", mostrarSe: (v) => v.rotasMostrar !== false,
          render: (valor, mudar) => <EscolhaRotas valor={valor} mudar={mudar} rotas={rotas} />,
        },
      ],
    },
    {
      tipo: "secao", titulo: "Juntar um clube", descricao: "O quadro vermelho e o formulário no fim da página.",
      campos: [
        { tipo: "texto", chave: "juntarTitulo", etiqueta: "Título do quadro vermelho" },
        { tipo: "lista-texto", chave: "juntarVantagens", etiqueta: "O que o clube ganha", placeholder: "Nova linha" },
        { tipo: "texto", chave: "juntarBotao", etiqueta: "Botão do formulário", largura: "meia" },
        { tipo: "texto", chave: "juntarSucesso", etiqueta: "Título depois de enviar", largura: "meia" },
        { tipo: "texto", chave: "juntarNota", etiqueta: "Nota ao lado do botão" },
      ],
    },
    {
      tipo: "secao", titulo: "Página de cada clube: títulos",
      descricao: "Nos textos desta parte e das duas seguintes, «{termo}» passa a «clube» ou «movimento», e «{nome}» ao nome do clube.",
      campos: [
        { tipo: "texto", chave: "fichaSobre", etiqueta: "Por cima do título da história", largura: "meia" },
        { tipo: "texto", chave: "fichaHistoria", etiqueta: "Título da história", largura: "meia" },
        { tipo: "texto", chave: "fichaPoucasPalavras", etiqueta: "Quadro da descrição curta", largura: "meia" },
        { tipo: "texto", chave: "fichaLema", etiqueta: "Cartão do lema", largura: "meia" },
        { tipo: "texto", chave: "fichaEstilo", etiqueta: "Estilo", largura: "meia" },
        { tipo: "texto", chave: "fichaMotas", etiqueta: "Motas", largura: "meia" },
        { tipo: "texto", chave: "fichaActividades", etiqueta: "Título das actividades", largura: "meia" },
        { tipo: "texto", chave: "fichaPercurso", etiqueta: "Título do percurso", largura: "meia" },
        { tipo: "texto", chave: "fichaEncontros", etiqueta: "Título dos encontros", largura: "meia" },
        { tipo: "texto", chave: "fichaAderirClube", etiqueta: "Título da adesão (clube)", largura: "meia" },
        { tipo: "texto", chave: "fichaAderirMovimento", etiqueta: "Título da adesão (movimento)", largura: "meia" },
        { tipo: "texto", chave: "fichaFontes", etiqueta: "Título das fontes", largura: "meia" },
        { tipo: "texto", chave: "fichaOutros", etiqueta: "Título dos outros clubes", largura: "meia" },
        { tipo: "texto", chave: "fichaTodos", etiqueta: "Ligação para a lista", largura: "meia" },
      ],
    },
    {
      tipo: "secao", titulo: "Página de cada clube: legendas e avisos",
      campos: [
        { tipo: "texto", chave: "fichaRotuloFundacao", etiqueta: "Legenda do ano de fundação", largura: "meia" },
        { tipo: "texto", chave: "fichaRotuloFundacaoFalta", etiqueta: "Legenda sem ano de fundação", largura: "meia" },
        { tipo: "texto", chave: "fichaRotuloSedeFalta", etiqueta: "Legenda sem cidade", largura: "meia" },
        { tipo: "texto", chave: "fichaRotuloTipo", etiqueta: "Legenda do tipo", largura: "meia" },
        { tipo: "texto", chave: "fichaRotuloActividades", etiqueta: "Legenda do número de actividades", largura: "meia" },
        { tipo: "texto", chave: "fichaSemData", etiqueta: "Momento sem data", largura: "meia" },
        { tipo: "texto", chave: "fichaPercursoComFontes", etiqueta: "Texto do percurso, com fontes" },
        { tipo: "texto", chave: "fichaPercursoSemFontes", etiqueta: "Texto do percurso, sem fontes" },
        { tipo: "texto", chave: "fichaViagensAno", etiqueta: "Tabela de viagens: coluna do ano", largura: "meia" },
        { tipo: "texto", chave: "fichaViagensNome", etiqueta: "Tabela de viagens: coluna da viagem", largura: "meia" },
        { tipo: "texto", chave: "fichaViagensKm", etiqueta: "Tabela de viagens: coluna dos km", largura: "meia" },
        { tipo: "texto", chave: "fichaFontePrefixo", etiqueta: "Antes do nome da fonte", ajuda: "Ao lado dos factos, ex.: «Fonte: Instagram».", largura: "meia" },
        { tipo: "area", chave: "fichaEncontrosVazio", etiqueta: "Aviso sem ponto de encontro", linhas: 2 },
        { tipo: "area", chave: "fichaAderirVazio", etiqueta: "Aviso sem regras de adesão", linhas: 2 },
        { tipo: "area", chave: "fichaFontesNota", etiqueta: "Nota das fontes", linhas: 2, ajuda: "Diz quando a informação foi consultada: actualize a data quando rever as fichas." },
        { tipo: "texto", chave: "fichaErro", etiqueta: "Ligação para comunicar um erro" },
      ],
    },
    {
      tipo: "secao", titulo: "Página de cada clube: quadro «Esta página é sua?»",
      campos: [
        { tipo: "texto", chave: "fichaPaginaSobretitulo", etiqueta: "Pergunta por cima do título", largura: "meia" },
        { tipo: "texto", chave: "fichaPaginaTitulo", etiqueta: "Título", largura: "meia" },
        { tipo: "area", chave: "fichaPaginaTexto", etiqueta: "Texto", linhas: 3 },
        { tipo: "texto", chave: "fichaPaginaBotao", etiqueta: "Botão para falar com a MotoBox", largura: "meia" },
        { tipo: "texto", chave: "fichaContactar", etiqueta: "Botão para contactar o clube", ajuda: "Só aparece quando o clube tem contacto na ficha.", largura: "meia" },
      ],
    },
    {
      tipo: "secao", titulo: "Pesquisa e partilhas",
      campos: [
        {
          tipo: "area", chave: "descricaoPesquisa", etiqueta: "Descrição da secção", linhas: 2,
          ajuda: "O texto que o Google e as redes sociais mostram por baixo do nome da página. Até cerca de 160 caracteres.",
        },
      ],
    },
  ];
}
