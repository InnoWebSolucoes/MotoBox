import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual } from "@/lib/conta/sessao";
import { enviarConfirmacao } from "@/lib/auth/emails-conta";

/* ============================================================
   MOTOBOX — Contas por confirmar (Definições → Contas)
   GET  → as contas criadas que ainda não confirmaram o email
          (não conseguem entrar).
   POST → { id, accao: "reenviar" } envia de novo a ligação de
          confirmação pela Resend;
          { id, accao: "confirmar" } confirma a conta à mão (só
          administradores), para quem não recebe o email.
   Só a equipa chega aqui: o proxy protege /api/admin.
   ============================================================ */

export const dynamic = "force-dynamic";

const POR_PAGINA = 1000;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

const semBase = () => erro("Supabase não configurado: as contas só existem com a base de dados ligada.", 503);

export async function GET() {
  const db = supabaseAdmin();
  if (!db) return semBase();

  const contas: { id: string; email: string; nome: string; criado: string; enviado: string | null }[] = [];
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({ page: pagina, perPage: POR_PAGINA });
    if (error) return erro(error.message, 500);
    const lista = data?.users ?? [];
    for (const u of lista) {
      if (u.email_confirmed_at || !u.email) continue;
      contas.push({
        id: u.id,
        email: u.email,
        nome: typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome : "",
        criado: u.created_at,
        enviado: u.confirmation_sent_at ?? null,
      });
    }
    if (lista.length < POR_PAGINA) break;
  }
  contas.sort((a, b) => b.criado.localeCompare(a.criado));
  return NextResponse.json({ contas });
}

/** Papel de quem fez o pedido, na tabela `utilizadores`. */
async function papelDe(db: NonNullable<ReturnType<typeof supabaseAdmin>>): Promise<string | null> {
  const user = await utilizadorActual();
  if (!user) return null;
  const { data } = await db.from("utilizadores").select("papel").eq("auth_id", user.id).maybeSingle();
  if (data?.papel) return String(data.papel);
  const { data: porEmail } = await db.from("utilizadores").select("papel").eq("email", (user.email ?? "").toLowerCase()).maybeSingle();
  return porEmail?.papel ? String(porEmail.papel) : null;
}

export async function POST(req: NextRequest) {
  const corpo = (await req.json().catch(() => ({}))) as { id?: unknown; accao?: unknown };
  const id = typeof corpo.id === "string" ? corpo.id : "";
  const accao = corpo.accao;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return erro("Conta desconhecida.");
  if (accao !== "reenviar" && accao !== "confirmar") return erro("Acção desconhecida.");

  const db = supabaseAdmin();
  if (!db) return semBase();

  const { data, error } = await db.auth.admin.getUserById(id);
  const u = data?.user;
  if (error || !u?.email) return erro("Esta conta já não existe. Recarregue a lista.", 404);
  if (u.email_confirmed_at) return NextResponse.json({ ok: true, jaConfirmada: true });

  if (accao === "confirmar") {
    if ((await papelDe(db)) !== "admin") return erro("Só um administrador pode confirmar contas à mão.", 403);
    const { error: e } = await db.auth.admin.updateUserById(id, { email_confirm: true });
    if (e) return erro(`Não foi possível confirmar a conta: ${e.message}`, 500);
    return NextResponse.json({ ok: true, email: u.email });
  }

  const ligacao = await db.auth.admin.generateLink({ type: "magiclink", email: u.email });
  if (ligacao.error || ligacao.data.user?.id !== id) {
    return erro(`Não foi possível gerar a ligação: ${ligacao.error?.message ?? "a conta não corresponde"}.`, 500);
  }
  const nome = typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome : "";
  const r = await enviarConfirmacao({
    email: u.email, nome, destino: "/conta",
    hash: ligacao.data.properties.hashed_token, tipo: ligacao.data.properties.verification_type,
  });
  if (!r.ok) return erro(r.erro, 502);
  return NextResponse.json({ ok: true, email: u.email, id: r.id });
}
