import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import {
  ANO_MINIMO, anoMaximo, garagemDe, ID_MOTA, MAXIMO_MOTAS, pastaGaragem, prefixoFotosGaragem,
  type MotaGaragem,
} from "@/components/conta/dados";

/* ============================================================
   MOTOBOX — A minha garagem
   As motas de cada membro (marca, modelo, ano, nome e uma
   fotografia). Não há tabela para elas: vivem em
   user_metadata.garagem (no máximo 6), escritas só aqui, com o
   service role. As fotografias ficam na pasta pública `avatares`,
   em garagem/<id da conta>/, ao lado dos logótipos.

     GET                         a garagem
     PUT    { id?, marca, modelo, ano?, apelido? }   junta ou edita
     POST   multipart { id, ficheiro }               fotografia de uma mota
     DELETE ?id=…                tira a mota (e a fotografia)
     DELETE ?id=…&foto=1         tira só a fotografia

   A pasta vem sempre da sessão, nunca do pedido.
   ============================================================ */

export const dynamic = "force-dynamic";

const PASTA = "avatares";
const MAXIMO = 2 * 1024 * 1024;
const EXTENSOES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type Admin = NonNullable<ReturnType<typeof supabaseAdmin>>;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** Tipo real pelos primeiros bytes: o tipo que o navegador declara não chega. */
function tipoReal(b: Uint8Array): string | null {
  const texto = (ini: number, fim: number) => String.fromCharCode(...b.subarray(ini, fim));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && texto(1, 4) === "PNG") return "image/png";
  if (texto(0, 4) === "RIFF" && texto(8, 12) === "WEBP") return "image/webp";
  return null;
}

const limpo = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

async function contexto() {
  const user = await utilizadorActual();
  if (!user) return { falha: erro("Sessão necessária.", 401) };
  const db = supabaseAdmin();
  if (!db) return { falha: erro("Base de dados indisponível.", 503) };
  return { user, db };
}

async function gravar(db: Admin, user: User, garagem: MotaGaragem[]) {
  const { error } = await db.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, garagem },
  });
  return error?.message ?? null;
}

/** Caminho na pasta a partir do endereço público, só se for da garagem desta conta. */
function caminhoDaFoto(url: string | undefined, uid: string): string | null {
  const prefixo = prefixoFotosGaragem(uid);
  if (!url || !prefixo || !url.startsWith(prefixo)) return null;
  return `${pastaGaragem(uid)}/${url.slice(prefixo.length)}`;
}

/** Apaga as fotografias da garagem que nenhuma mota usa (substituídas, ou de motas tiradas). */
async function limparOrfas(db: Admin, uid: string, garagem: MotaGaragem[]) {
  const usadas = new Set(garagem.map((m) => caminhoDaFoto(m.foto, uid)).filter(Boolean));
  const { data } = await db.storage.from(PASTA).list(pastaGaragem(uid), { limit: 100 });
  const orfas = (data ?? [])
    .filter((f) => f.id) // as pastas vêm sem id
    .map((f) => `${pastaGaragem(uid)}/${f.name}`)
    .filter((c) => !usadas.has(c));
  if (orfas.length) await db.storage.from(PASTA).remove(orfas);
}

export async function GET() {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);
  return NextResponse.json({ garagem: garagemDe(user.user_metadata, user.id) });
}

/** Junta uma mota nova ou edita uma que já existe (a fotografia vai pelo POST). */
export async function PUT(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const { user, db } = c;

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const marca = limpo(corpo.marca, 40);
  const modelo = limpo(corpo.modelo, 60);
  const apelido = limpo(corpo.apelido, 40);
  if (marca.length < 2) return erro("Escreva a marca da mota.");
  if (modelo.length < 1) return erro("Escreva o modelo da mota.");
  let ano: number | undefined;
  if (corpo.ano !== undefined && corpo.ano !== null && corpo.ano !== "") {
    ano = Number(corpo.ano);
    if (!Number.isInteger(ano) || ano < ANO_MINIMO || ano > anoMaximo()) {
      return erro(`O ano tem de estar entre ${ANO_MINIMO} e ${anoMaximo()}.`);
    }
  }

  const garagem = garagemDe(user.user_metadata, user.id);
  const pedido = typeof corpo.id === "string" ? corpo.id : "";
  const existente = pedido ? garagem.find((m) => m.id === pedido) : undefined;
  if (pedido && !existente) return erro("Essa mota já não está na garagem.", 404);
  if (!existente && garagem.length >= MAXIMO_MOTAS) return erro(`Pode ter até ${MAXIMO_MOTAS} motas na garagem.`, 409);

  const id = existente?.id ?? `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const mota: MotaGaragem = {
    id, marca, modelo,
    ...(ano ? { ano } : {}),
    ...(apelido ? { apelido } : {}),
    ...(existente?.foto ? { foto: existente.foto } : {}),
  };
  const nova = existente ? garagem.map((m) => (m.id === id ? mota : m)) : [...garagem, mota];

  const falha = await gravar(db, user, nova);
  if (falha) return erro(falha, 500);
  return NextResponse.json({ garagem: nova, id });
}

/** Fotografia de uma mota: substitui a anterior, que é apagada. */
export async function POST(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const { user, db } = c;

  // A pasta é pública: contas suspensas ou banidas não publicam imagens.
  const perfil = await perfilDe(user);
  if (perfil && ["suspenso", "banido"].includes(perfil.estado)) {
    return erro("Esta conta não pode publicar imagens.", 403);
  }

  const declarado = Number(req.headers.get("content-length") ?? 0);
  if (declarado > MAXIMO + 64 * 1024) return erro("A fotografia tem mais de 2 MB.", 413);

  let dados: FormData;
  try { dados = await req.formData(); } catch { return erro("Pedido inválido. Envie a fotografia no campo \"ficheiro\"."); }
  const id = String(dados.get("id") ?? "");
  const ficheiro = dados.get("ficheiro");
  if (!ID_MOTA.test(id)) return erro("Mota desconhecida.");
  if (!ficheiro || typeof ficheiro === "string" || ficheiro.size === 0) return erro("Escolha uma fotografia.");
  if (ficheiro.size > MAXIMO) return erro("A fotografia tem mais de 2 MB.", 413);

  const garagem = garagemDe(user.user_metadata, user.id);
  if (!garagem.some((m) => m.id === id)) return erro("Essa mota já não está na garagem.", 404);

  const bytes = new Uint8Array(await ficheiro.arrayBuffer());
  const tipo = tipoReal(bytes);
  if (!tipo) return erro("Use uma fotografia JPG, PNG ou WebP.", 415);

  // A pasta é criada pela rota do logótipo ou pela migração de Setembro.
  const { data: pasta } = await db.storage.getBucket(PASTA);
  if (!pasta) {
    const { error } = await db.storage.createBucket(PASTA, {
      public: true, fileSizeLimit: MAXIMO, allowedMimeTypes: Object.keys(EXTENSOES),
    });
    if (error && !/exist/i.test(error.message)) return erro(error.message, 500);
  }

  const caminho = `${pastaGaragem(user.id)}/${id}-${Date.now()}.${EXTENSOES[tipo]}`;
  const { error: falhaEnvio } = await db.storage.from(PASTA).upload(caminho, bytes, {
    contentType: tipo, cacheControl: "31536000", upsert: false,
  });
  if (falhaEnvio) return erro(falhaEnvio.message, 500);

  const foto = db.storage.from(PASTA).getPublicUrl(caminho).data.publicUrl;
  const nova = garagem.map((m) => (m.id === id ? { ...m, foto } : m));
  const falha = await gravar(db, user, nova);
  if (falha) {
    await db.storage.from(PASTA).remove([caminho]);
    return erro(falha, 500);
  }
  // Só depois de a mota apontar para a fotografia nova se apaga a anterior.
  await limparOrfas(db, user.id, nova);
  return NextResponse.json({ garagem: nova });
}

export async function DELETE(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const { user, db } = c;

  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const soFoto = url.searchParams.get("foto") === "1";
  const garagem = garagemDe(user.user_metadata, user.id);
  if (!garagem.some((m) => m.id === id)) return erro("Essa mota já não está na garagem.", 404);

  const nova = soFoto
    ? garagem.map((m) => (m.id === id ? { id: m.id, marca: m.marca, modelo: m.modelo, ...(m.ano ? { ano: m.ano } : {}), ...(m.apelido ? { apelido: m.apelido } : {}) } : m))
    : garagem.filter((m) => m.id !== id);

  const falha = await gravar(db, user, nova);
  if (falha) return erro(falha, 500);
  await limparOrfas(db, user.id, nova);
  return NextResponse.json({ garagem: nova });
}
