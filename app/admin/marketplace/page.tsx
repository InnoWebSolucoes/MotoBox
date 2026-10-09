"use client";

/* ============================================================
   MOTOBOX ADMIN — Marketplace
   Aba "Anúncios": cada anúncio com tudo o que /marketplace e
   /marketplace/<id> mostram (fotografias, ficha, vendedor,
   visualizações, se está visível). Aba "Página Marketplace":
   os textos fixos da página (paginas.marketplace).
   ============================================================ */

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck, Eye, EyeOff, FileCheck, Handshake, Phone, ShieldCheck, Star, Store, UserCheck,
} from "lucide-react";
import { PaginaRecurso, useAbaUrl } from "@/components/admin/Recurso";
import {
  Abas, AccaoIcone, Area, Aviso, CabecalhoPagina, Campo, Carregando, Estado, Grupo, Input, Interruptor, Seleccao, useAviso,
} from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { useAdmin, novoId } from "@/lib/admin/store";
import { formatKz } from "@/lib/data";
import type { AnuncioMarketplace } from "@/lib/types";
import { PROVINCIAS } from "@/lib/provincias";
import { useVisibilidade } from "../moderacao/_comum/visibilidade";
import { EscolhaIcone, ListaImagens, Miniatura } from "../moderacao/_comum/partes";
import { dataCurta, numero } from "../moderacao/_comum/formato";

const CATEGORIAS = ["Motas", "Peças", "Equipamento", "Acessórios"];
const ESTADOS_ARTIGO = ["Nova", "Como nova", "Muito bom", "Bom", "Para peças"];
const op = (v: readonly string[]) => v.map((x) => ({ valor: x, nome: x }));
const ABAS = ["anuncios", "pagina"] as const;

type A = AnuncioMarketplace;

export default function Pagina() {
  return (
    <Suspense fallback={<Carregando />}>
      <AdminMarketplace />
    </Suspense>
  );
}

const DESCRICAO = "Anúncios de motas, peças e equipamento, e os textos da página do Marketplace.";

function AdminMarketplace() {
  const [aba, setAba] = useAbaUrl(ABAS);
  const { estado } = useAdmin();
  const abas = (
    <Abas
      rotulo="Partes do Marketplace"
      abas={[
        { chave: "anuncios", nome: "Anúncios", contador: estado.anuncios.length },
        { chave: "pagina", nome: "Página Marketplace" },
      ]}
      activa={aba}
      onChange={setAba}
    />
  );

  if (aba === "pagina") {
    return (
      <>
        <CabecalhoPagina titulo="Marketplace" sobretitulo="Comunidade" descricao={DESCRICAO} icone={<Store />} />
        <div className="mb-[var(--intervalo)]">{abas}</div>
        <EditorDoc chave="paginas.marketplace" pagina="/marketplace" titulo="Marketplace (página da secção)" esquema={ESQUEMA_PAGINA} />
      </>
    );
  }
  return <ListaAnuncios abas={abas} />;
}

function ListaAnuncios({ abas }: { abas: ReactNode }) {
  const { estado, atualizar, guardarDefinicoes } = useAdmin();
  // O Painel liga directamente a uma pílula (ex.: ?filtro=por-verificar).
  const filtroInicial = useSearchParams().get("filtro") ?? "";
  const { mostrar, elemento } = useAviso();
  const vis = useVisibilidade();

  const alternarVisivel = async (a: A) => {
    const mostrarNoSite = !vis.visivel("anuncios", a.id);
    const falha = await vis.mudar("anuncios", a.id, mostrarNoSite);
    mostrar(falha ?? (mostrarNoSite ? "O anúncio voltou a aparecer no site." : "Anúncio escondido do site."), falha ? "erro" : "ok");
  };

  const alternarVerificado = async (a: A) => {
    const v = !a.vendedor.verificado;
    const falha = await atualizar("anuncios", a.id, { vendedor: { ...a.vendedor, verificado: v } });
    mostrar(falha ?? (v ? `${a.vendedor.nome} tem agora o selo de verificado neste anúncio.` : "Selo de verificado retirado."), falha ? "erro" : "ok");
  };

  return (
    <>
      <PaginaRecurso<A>
        coleccao="anuncios"
        titulo="Marketplace"
        sobretitulo="Comunidade"
        icone={<Store />}
        descricao={DESCRICAO}
        nomeItem="anúncio"
        vazio="Ainda não há anúncios"
        larguraGaveta="max-w-3xl"
        procuraPlaceholder="Título, marca, modelo ou vendedor…"
        filtroRapidoInicial={filtroInicial}
        topo={
          <>
            {abas}
            <div className="grid gap-[var(--intervalo)] lg:grid-cols-2">
              <div className="painel painel-escuro p-4">
                <Interruptor
                  activo={estado.definicoes.marketplaceAberto}
                  etiqueta="Marketplace aberto a novos anúncios"
                  descricao="Desligado, os membros deixam de poder publicar anúncios na sua conta. Os anúncios que já existem continuam no site."
                  onChange={async (v) => {
                    const falha = await guardarDefinicoes({ marketplaceAberto: v });
                    mostrar(falha ?? (v ? "Marketplace aberto." : "Marketplace fechado a novos anúncios."), falha ? "erro" : "ok");
                  }}
                />
              </div>
              {vis.local ? (
                <Aviso tom="atencao" titulo="Demonstração local">
                  Sem base de dados, esconder um anúncio só fica marcado neste navegador. Com o site ligado, sai logo do Marketplace.
                </Aviso>
              ) : (
                <Aviso titulo="Como se aprova um anúncio">
                  Os anúncios aparecem no site assim que são publicados. Confirme o vendedor e dê-lhe o selo
                  (<BadgeCheck className="inline size-3.5 align-[-2px]" aria-hidden />), ou esconda o anúncio
                  (<EyeOff className="inline size-3.5 align-[-2px]" aria-hidden />) até estar tudo certo.
                </Aviso>
              )}
            </div>
          </>
        }
        procuraEm={(a) => `${a.titulo} ${a.marca} ${a.modelo ?? ""} ${a.vendedor.nome} ${a.descricao} ${a.id}`}
        ordenar={(a, b) => b.publicado.localeCompare(a.publicado)}
        filtrosRapidos={[
          { chave: "por-verificar", nome: "Vendedor por verificar", teste: (a) => !a.vendedor.verificado },
          { chave: "escondidos", nome: "Escondidos", teste: (a) => !vis.visivel("anuncios", a.id) },
          { chave: "do-site", nome: "Publicados pelos membros", teste: (a) => Boolean(a.vendedor.authId) },
        ]}
        filtros={[
          { chave: "categoria", etiqueta: "Todas as categorias", opcoes: op(CATEGORIAS) },
          { chave: "provincia", etiqueta: "Todas as províncias", opcoes: op(PROVINCIAS) },
          { chave: "estado", etiqueta: "Qualquer estado", opcoes: op(ESTADOS_ARTIGO) },
        ]}
        colunas={[
          {
            cabecalho: "Anúncio",
            celula: (a) => (
              <div className="flex min-w-0 items-center gap-3">
                <Miniatura valor={a.imagens[0]} className="h-11 w-14" />
                <div className="min-w-0">
                  <p className="max-w-[20rem] truncate font-medium text-white">{a.titulo || "Sem título"}</p>
                  <p className="truncate text-xs text-white/50">
                    {a.categoria} · {[a.marca, a.modelo].filter(Boolean).join(" ") || "Sem marca"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            cabecalho: "Preço",
            celula: (a) => (
              <span className="whitespace-nowrap tabular-nums text-white">
                {formatKz(a.preco)}
                {a.negociavel && <span className="block text-xs text-white/45">Negociável</span>}
              </span>
            ),
          },
          {
            cabecalho: "Vendedor",
            celula: (a) => (
              <span className="flex items-center gap-1.5 text-white/80">
                <span className="max-w-36 truncate">{a.vendedor.nome || "Sem nome"}</span>
                {a.vendedor.verificado && <BadgeCheck className="size-4 shrink-0 text-[#4ade80]" aria-label="Verificado" />}
              </span>
            ),
          },
          {
            cabecalho: "Publicado",
            celula: (a) => (
              <span className="whitespace-nowrap tabular-nums text-white/70">
                {dataCurta(a.publicado)}
                <span className="block text-xs text-white/45">{numero(a.visualizacoes)} vistas</span>
              </span>
            ),
          },
          {
            cabecalho: "No site",
            celula: (a) => vis.visivel("anuncios", a.id)
              ? <Estado valor="publicado" rotulo="Visível" />
              : <Estado valor="suspenso" rotulo="Escondido" />,
          },
        ]}
        accoesLinha={(a) => (
          <>
            <AccaoIcone
              titulo={a.vendedor.verificado ? "Tirar o selo de verificado" : "Dar o selo de verificado"}
              tom="ok" onClick={() => void alternarVerificado(a)}
            >
              <BadgeCheck className={`size-3.5 ${a.vendedor.verificado ? "text-[#4ade80]" : ""}`} aria-hidden />
            </AccaoIcone>
            <AccaoIcone
              titulo={vis.visivel("anuncios", a.id) ? "Esconder do site" : "Mostrar no site"}
              onClick={() => void alternarVisivel(a)}
            >
              {vis.visivel("anuncios", a.id) ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5 text-gold" aria-hidden />}
            </AccaoIcone>
          </>
        )}
        ligacaoSite={(a) => `/marketplace/${encodeURIComponent(a.id)}`}
        tituloItem={(a) => a.titulo || "Anúncio sem título"}
        novoRegisto={() => ({
          id: novoId("mkt"), titulo: "", categoria: "Motas", preco: 0, negociavel: false,
          marca: "", estado: "Bom", provincia: "Luanda", descricao: "", imagens: [""],
          vendedor: { nome: "", verificado: false, desde: new Date().getFullYear(), anuncios: 1, avaliacao: 0 },
          publicado: new Date().toISOString().slice(0, 10), visualizacoes: 0,
        }) as A}
        preparar={(r) => {
          if (!r.titulo.trim()) return "Escreva o título do anúncio.";
          if (!r.vendedor.nome.trim()) return "Escreva o nome do vendedor.";
          return { ...r, titulo: r.titulo.trim(), imagens: r.imagens.map((i) => i.trim()).filter(Boolean) };
        }}
        formulario={(r, definir, { novo }) => (
          <FormularioAnuncio
            r={r} definir={definir} novo={novo}
            visivel={vis.visivel("anuncios", r.id)}
            aoMudarVisivel={() => void alternarVisivel(r)}
          />
        )}
      />
      {elemento}
    </>
  );
}

function FormularioAnuncio({
  r, definir, novo, visivel, aoMudarVisivel,
}: {
  r: A; definir: (c: Partial<A>) => void; novo: boolean; visivel: boolean; aoMudarVisivel: () => void;
}) {
  const v = r.vendedor;
  const vendedor = (c: Partial<A["vendedor"]>) => definir({ vendedor: { ...v, ...c } });
  const numeroOuNada = (s: string) => (s === "" ? undefined : Number(s));
  return (
    <>
      <Grupo titulo="O anúncio" descricao="O que aparece no cartão da lista e no topo da página do anúncio.">
        <Campo etiqueta="Título" obrigatorio>
          <Input value={r.titulo} maxLength={90} placeholder="Ex.: Honda Africa Twin 2021, 18 000 km"
            onChange={(e) => definir({ titulo: e.target.value })} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Categoria" ajuda="Os filtros do Marketplace usam-na.">
            <Seleccao valor={r.categoria} opcoes={op(CATEGORIAS)} onChange={(x) => definir({ categoria: x as A["categoria"] })} />
          </Campo>
          <Campo etiqueta="Estado do artigo" ajuda="A etiqueta no canto da fotografia.">
            <Seleccao valor={r.estado} opcoes={op(ESTADOS_ARTIGO)} onChange={(x) => definir({ estado: x as A["estado"] })} />
          </Campo>
          <Campo etiqueta="Preço (Kz)">
            <Input type="number" min={0} inputMode="numeric" value={Number.isFinite(r.preco) ? r.preco : 0}
              onChange={(e) => definir({ preco: Number(e.target.value) || 0 })} />
          </Campo>
          <Campo etiqueta="Província" ajuda="Onde está o artigo.">
            <Seleccao valor={r.provincia} opcoes={op(PROVINCIAS)} onChange={(x) => definir({ provincia: x as A["provincia"] })} />
          </Campo>
        </div>
        <Interruptor activo={r.negociavel} etiqueta="Preço negociável"
          descricao="Mostra «Negociável» por baixo do preço; desligado mostra «Preço fixo»."
          onChange={(x) => definir({ negociavel: x })} />
        <Campo etiqueta="Descrição" ajuda="O texto da página do anúncio. As mudanças de linha contam.">
          <Area rows={6} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value })} />
        </Campo>
      </Grupo>

      <Grupo titulo="Ficha técnica" descricao="Aparece na página do anúncio. Os campos vazios não aparecem.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Marca">
            <Input value={r.marca} onChange={(e) => definir({ marca: e.target.value })} placeholder="Ex.: Yamaha" />
          </Campo>
          <Campo etiqueta="Modelo">
            <Input value={r.modelo ?? ""} onChange={(e) => definir({ modelo: e.target.value || undefined })} placeholder="Ex.: Ténéré 700" />
          </Campo>
          <Campo etiqueta="Ano">
            <Input type="number" min={1950} max={new Date().getFullYear() + 1} value={r.ano ?? ""}
              onChange={(e) => definir({ ano: numeroOuNada(e.target.value) })} />
          </Campo>
          <Campo etiqueta="Quilometragem (km)">
            <Input type="number" min={0} value={r.quilometragem ?? ""}
              onChange={(e) => definir({ quilometragem: numeroOuNada(e.target.value) })} />
          </Campo>
        </div>
      </Grupo>

      <Grupo titulo="Fotografias">
        <ListaImagens
          valores={r.imagens.length ? r.imagens : [""]}
          onChange={(imagens) => definir({ imagens })}
          ajuda="A capa aparece no cartão da lista; todas aparecem na galeria da página do anúncio. Pode carregar do computador, escolher da biblioteca ou colar um endereço."
        />
      </Grupo>

      <Grupo titulo="Vendedor" descricao="O quadro «Vendedor» da página do anúncio.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nome" obrigatorio>
            <Input value={v.nome} onChange={(e) => vendedor({ nome: e.target.value })} />
          </Campo>
          <Campo etiqueta="Membro desde (ano)">
            <Input type="number" min={2000} max={2100} value={v.desde}
              onChange={(e) => vendedor({ desde: Number(e.target.value) || new Date().getFullYear() })} />
          </Campo>
          <Campo etiqueta="Número de anúncios">
            <Input type="number" min={0} value={v.anuncios} onChange={(e) => vendedor({ anuncios: Number(e.target.value) || 0 })} />
          </Campo>
          <Campo etiqueta="Avaliação (0 a 5)" ajuda="0 mostra «Sem avaliações».">
            <Input type="number" min={0} max={5} step={0.1} value={v.avaliacao}
              onChange={(e) => vendedor({ avaliacao: Math.min(5, Math.max(0, Number(e.target.value) || 0)) })} />
          </Campo>
        </div>
        <Interruptor activo={v.verificado} etiqueta="Vendedor verificado"
          descricao="Dá o selo verde de verificado, na lista e ao lado do nome. Só depois de a equipa confirmar a identidade e o contacto."
          onChange={(x) => vendedor({ verificado: x })} />
        {v.authId && (
          <p className="text-xs leading-relaxed text-white/50">
            Publicado por um membro na sua conta do site: as mensagens de «Contactar vendedor» seguem para o email dessa conta.
          </p>
        )}
      </Grupo>

      <Grupo titulo="Publicação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Data de publicação" ajuda="Ordena a lista («Mais recentes»).">
            <Input type="date" value={r.publicado.slice(0, 10)} onChange={(e) => definir({ publicado: e.target.value })} />
          </Campo>
          <Campo etiqueta="Visualizações" ajuda="O número de vezes que o anúncio foi visto.">
            <Input type="number" min={0} value={r.visualizacoes} onChange={(e) => definir({ visualizacoes: Number(e.target.value) || 0 })} />
          </Campo>
        </div>
        {novo ? (
          <p className="text-xs leading-relaxed text-white/50">O anúncio aparece no Marketplace assim que o guardar.</p>
        ) : (
          <Interruptor activo={visivel} etiqueta="Visível no site"
            descricao="Desligado, o anúncio sai do Marketplace mas fica guardado aqui. Muda logo, sem precisar de guardar."
            onChange={aoMudarVisivel} />
        )}
      </Grupo>
    </>
  );
}

/* ---------------- Página Marketplace (textos fixos) ---------------- */

const ICONES = [
  { valor: "selo", nome: "Selo de verificado", icone: <BadgeCheck /> },
  { valor: "estrela", nome: "Estrela", icone: <Star /> },
  { valor: "escudo", nome: "Escudo", icone: <ShieldCheck /> },
  { valor: "utilizador", nome: "Pessoa confirmada", icone: <UserCheck /> },
  { valor: "telefone", nome: "Telefone", icone: <Phone /> },
  { valor: "documento", nome: "Documento confirmado", icone: <FileCheck /> },
  { valor: "aperto", nome: "Aperto de mão", icone: <Handshake /> },
];

const ESQUEMA_PAGINA: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "abertura", etiqueta: "Abertura",
    ajuda: "A fotografia grande no topo de /marketplace, com o título e o botão vermelho.",
    campos: [
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Texto pequeno por cima do título", largura: "meia" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia", obrigatorio: true },
      { tipo: "area", chave: "texto", etiqueta: "Texto de apresentação", linhas: 3 },
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo", formato: "aspect-[21/9]" },
      { tipo: "texto", chave: "botao", etiqueta: "Texto do botão", largura: "meia", ajuda: "Vazio, o botão não aparece." },
      { tipo: "texto", chave: "botaoLigacao", etiqueta: "Para onde leva o botão", largura: "meia", ajuda: "Uma página do site, ex.: /conta#anuncios" },
    ],
  },
  {
    tipo: "objecto", chave: "lista", etiqueta: "Lista de anúncios",
    ajuda: "Os textos pequenos dos filtros, da contagem e dos cartões.",
    campos: [
      { tipo: "texto", chave: "todas", etiqueta: "Filtro de todas as categorias", largura: "meia" },
      { tipo: "texto", chave: "todasProvincias", etiqueta: "Filtro de todas as províncias", largura: "meia" },
      { tipo: "texto", chave: "recentes", etiqueta: "Ordenar: mais recentes", largura: "meia" },
      { tipo: "texto", chave: "precoMenor", etiqueta: "Ordenar: preço mais baixo primeiro", largura: "meia" },
      { tipo: "texto", chave: "precoMaior", etiqueta: "Ordenar: preço mais alto primeiro", largura: "meia" },
      { tipo: "texto", chave: "maisVistos", etiqueta: "Ordenar: mais vistos", largura: "meia" },
      { tipo: "texto", chave: "procurar", etiqueta: "Texto dentro da caixa de procura", largura: "meia" },
      { tipo: "texto", chave: "negociavel", etiqueta: "Preço negociável (no cartão)", largura: "meia" },
      { tipo: "texto", chave: "precoFixo", etiqueta: "Preço fixo (no cartão)", largura: "meia" },
      { tipo: "texto", chave: "umAnuncio", etiqueta: "Contagem: um anúncio", largura: "meia", ajuda: "Ex.: 1 anúncio" },
      { tipo: "texto", chave: "variosAnuncios", etiqueta: "Contagem: vários anúncios", largura: "meia", ajuda: "Ex.: 15 anúncios" },
      { tipo: "texto", chave: "vazioTitulo", etiqueta: "Sem resultados: título", largura: "meia" },
      { tipo: "texto", chave: "vazioTexto", etiqueta: "Sem resultados: texto", largura: "inteira" },
    ],
  },
  {
    tipo: "objecto", chave: "importar", etiqueta: "Cartão «Importar do estrangeiro»",
    ajuda: "O cartão com fotografia por baixo da lista, que leva ao guia de importação.",
    campos: [
      { tipo: "booleano", chave: "mostrar", etiqueta: "Mostrar este cartão" },
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Texto pequeno por cima do título", largura: "meia", mostrarSe: (v) => v.mostrar !== false },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia", mostrarSe: (v) => v.mostrar !== false },
      { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3, mostrarSe: (v) => v.mostrar !== false },
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia", mostrarSe: (v) => v.mostrar !== false },
      { tipo: "texto", chave: "ligacao", etiqueta: "Para onde leva", ajuda: "Uma página do site, ex.: /marketplace/importar", mostrarSe: (v) => v.mostrar !== false },
    ],
  },
  {
    tipo: "objecto", chave: "verificacao", etiqueta: "Como funciona a verificação",
    ajuda: "Os cartões no fim da página que explicam o selo de vendedor verificado.",
    campos: [
      { tipo: "booleano", chave: "mostrar", etiqueta: "Mostrar esta secção" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título da secção", mostrarSe: (v) => v.mostrar !== false },
      {
        tipo: "lista", chave: "cartoes", etiqueta: "Cartões", nomeItem: "cartão",
        mostrarSe: (v) => v.mostrar !== false,
        resumo: (c) => String(c.titulo ?? ""),
        novo: () => ({ icone: "selo", titulo: "", texto: "" }),
        campos: [
          {
            tipo: "personalizado", chave: "icone", etiqueta: "Ícone",
            render: (valor, mudar) => (
              <EscolhaIcone etiqueta="Ícone" valor={String(valor ?? "")} onChange={mudar} opcoes={ICONES} />
            ),
          },
          { tipo: "texto", chave: "titulo", etiqueta: "Título" },
          { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
        ],
      },
    ],
  },
  {
    tipo: "objecto", chave: "anuncio", etiqueta: "Página de cada anúncio",
    ajuda: "Os textos fixos de /marketplace/<anúncio>: títulos das secções, o quadro do vendedor e o aviso de segurança.",
    campos: [
      { tipo: "texto", chave: "voltar", etiqueta: "Ligação de volta (no topo)", largura: "meia" },
      { tipo: "texto", chave: "descricao", etiqueta: "Título «Descrição»", largura: "meia" },
      { tipo: "texto", chave: "ficha", etiqueta: "Título «Ficha técnica»", largura: "meia" },
      { tipo: "texto", chave: "semelhantes", etiqueta: "Título «Anúncios semelhantes»", largura: "meia" },
      { tipo: "texto", chave: "precoNegociavel", etiqueta: "Por baixo do preço: negociável", largura: "meia" },
      { tipo: "texto", chave: "precoFixo", etiqueta: "Por baixo do preço: fixo", largura: "meia" },
      { tipo: "texto", chave: "visualizacoes", etiqueta: "Depois do número de visualizações", largura: "meia" },
      { tipo: "texto", chave: "vendedor", etiqueta: "Título do quadro do vendedor", largura: "meia" },
      { tipo: "texto", chave: "membroDesde", etiqueta: "Antes do ano de registo", largura: "meia", ajuda: "Ex.: Membro desde 2021" },
      { tipo: "texto", chave: "anuncios", etiqueta: "Por baixo do número de anúncios", largura: "meia" },
      { tipo: "texto", chave: "avaliacao", etiqueta: "Por baixo da avaliação", largura: "meia" },
      { tipo: "texto", chave: "semAvaliacoes", etiqueta: "Quando ainda não há avaliações", largura: "meia" },
      { tipo: "area", chave: "aviso", etiqueta: "Aviso de segurança", linhas: 3, ajuda: "O quadro com o escudo vermelho, por baixo do vendedor." },
      { tipo: "texto", chave: "denunciar", etiqueta: "Ligação para denunciar o anúncio", largura: "meia" },
      { tipo: "area", chave: "mensagemContacto", etiqueta: "Mensagem já escrita ao contactar o vendedor", linhas: 2, ajuda: "Quem carrega em «Contactar vendedor» encontra este texto na caixa e pode mudá-lo." },
    ],
  },
  {
    tipo: "objecto", chave: "seo", etiqueta: "Google e partilhas",
    ajuda: "O título do separador do navegador e o resumo que o Google e o WhatsApp mostram.",
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título" },
      { tipo: "area", chave: "descricao", etiqueta: "Resumo", linhas: 2, ajuda: "Cerca de 150 caracteres." },
    ],
  },
];
