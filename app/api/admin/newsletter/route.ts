import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  construirResumo, contagem, contarSubscritoresActivos, emailDaNewsletter,
  envioAutomaticoLigado, enviarNewsletterSemanal, ultimoEnvio,
} from "@/lib/newsletter";

/* ============================================================
   MOTOBOX — Newsletter no painel
   GET  → pré-visualização do email desta semana, número de
          destinatários, estado do envio automático e último envio.
   POST → envia já, a todos os subscritores activos (forçado:
          ignora a trava de 6 dias e o interruptor automático).

   Só a equipa chega aqui: o middleware protege /api/admin.
   ============================================================ */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Endereço fictício: a pré-visualização nunca usa o de um subscritor. */
const EXEMPLO = { email: "exemplo@motobox.ao", nome: null };

export async function GET() {
  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json(
      { erro: "Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }
  try {
    const [resumo, destinatarios, automatico, ultimo] = await Promise.all([
      construirResumo({ db }),
      contarSubscritoresActivos(db),
      envioAutomaticoLigado(db),
      ultimoEnvio(db),
    ]);
    const email = emailDaNewsletter(resumo, EXEMPLO);
    return NextResponse.json({
      assunto: email.assunto,
      html: email.html,
      semana: resumo.semana,
      vazio: resumo.vazio,
      seccoes: contagem(resumo),
      destinatarios,
      automatico,
      ultimoEnvio: ultimo,
    });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Falha ao preparar a pré-visualização." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const corpo = (await req.json().catch(() => ({}))) as { utilizador?: unknown };
  const utilizador = typeof corpo.utilizador === "string" ? corpo.utilizador.slice(0, 80) : undefined;
  const resultado = await enviarNewsletterSemanal({ forcar: true, utilizador });
  return NextResponse.json(resultado, { status: resultado.estado === "erro" ? 500 : 200 });
}
