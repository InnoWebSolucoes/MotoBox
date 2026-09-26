import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";

/* ============================================================
   MOTOBOX — Logótipo ou fotografia da conta
   POST recebe a imagem (multipart, campo "ficheiro"), guarda-a
   na pasta pública `avatares` em <id da conta>/<instante>.<ext>
   e põe o endereço público em user_metadata.avatarUrl; a imagem
   anterior é apagada. DELETE tira o logótipo.

   A pasta vem sempre da sessão, nunca do pedido: ninguém escreve
   nem apaga na pasta de outra pessoa.
   ============================================================ */

export const dynamic = "force-dynamic";

const PASTA = "avatares";
const MAXIMO = 2 * 1024 * 1024;
const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

/** Cria a pasta se ainda não existir. A migração de Setembro também a cria. */
async function garantirPasta(db: Admin): Promise<string | null> {
  const { data } = await db.storage.getBucket(PASTA);
  if (data) return null;
  const { error } = await db.storage.createBucket(PASTA, {
    public: true,
    fileSizeLimit: MAXIMO,
    allowedMimeTypes: Object.keys(EXTENSOES),
  });
  // Outro pedido pode tê-la criado entretanto.
  return error && !/exist/i.test(error.message) ? error.message : null;
}

/** Apaga os ficheiros da pasta da conta, excepto `manter`. */
async function limpar(db: Admin, userId: string, manter?: string) {
  const { data } = await db.storage.from(PASTA).list(userId, { limit: 100 });
  const velhos = (data ?? [])
    .map((f) => `${userId}/${f.name}`)
    .filter((caminho) => caminho !== manter);
  if (velhos.length) await db.storage.from(PASTA).remove(velhos);
}

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);
  const db = supabaseAdmin();
  if (!db) return erro("Base de dados indisponível.", 503);

  // A pasta é pública: contas suspensas ou banidas não publicam imagens.
  const perfil = await perfilDe(user);
  if (perfil && ["suspenso", "banido"].includes(perfil.estado)) {
    return erro("Esta conta não pode alterar a imagem.", 403);
  }

  // Recusa cedo um corpo muito maior do que a imagem permitida.
  const declarado = Number(req.headers.get("content-length") ?? 0);
  if (declarado > MAXIMO + 64 * 1024) return erro("A imagem tem mais de 2 MB.", 413);

  let ficheiro: FormDataEntryValue | null;
  try {
    ficheiro = (await req.formData()).get("ficheiro");
  } catch {
    return erro("Pedido inválido. Envie a imagem no campo \"ficheiro\".");
  }
  if (!ficheiro || typeof ficheiro === "string" || ficheiro.size === 0) return erro("Escolha uma imagem.");
  if (ficheiro.size > MAXIMO) return erro("A imagem tem mais de 2 MB.", 413);

  const bytes = new Uint8Array(await ficheiro.arrayBuffer());
  const tipo = tipoReal(bytes);
  if (!tipo) return erro("Use uma imagem JPG, PNG ou WebP.", 415);

  const falhaPasta = await garantirPasta(db);
  if (falhaPasta) return erro(falhaPasta, 500);

  const caminho = `${user.id}/${Date.now()}.${EXTENSOES[tipo]}`;
  const { error: falhaEnvio } = await db.storage.from(PASTA).upload(caminho, bytes, {
    contentType: tipo,
    // O nome muda a cada envio, por isso a imagem pode ficar em cache à vontade.
    cacheControl: "31536000",
    upsert: false,
  });
  if (falhaEnvio) return erro(falhaEnvio.message, 500);

  const avatarUrl = db.storage.from(PASTA).getPublicUrl(caminho).data.publicUrl;
  const { error: falhaConta } = await db.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, avatarUrl },
  });
  if (falhaConta) {
    await db.storage.from(PASTA).remove([caminho]);
    return erro(falhaConta.message, 500);
  }

  // Só depois de a conta apontar para a imagem nova se apaga a anterior.
  await limpar(db, user.id, caminho);
  return NextResponse.json({ ok: true, avatarUrl });
}

export async function DELETE() {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);
  const db = supabaseAdmin();
  if (!db) return erro("Base de dados indisponível.", 503);

  const { error } = await db.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, avatarUrl: null },
  });
  if (error) return erro(error.message, 500);

  await limpar(db, user.id);
  return NextResponse.json({ ok: true });
}
