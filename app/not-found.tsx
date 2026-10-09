import Link from "next/link";
import { Compass } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { BotaoMB } from "@/components/painel/blocos";
import { GERAL_PADRAO } from "@/lib/conteudo/grupos/geral";
import { lerTextosGerais } from "@/lib/conteudo/ler-geral";

// Os textos editam-se em Gestão › Entrada e painel › Geral (Página 404).
export default async function NaoEncontrada() {
  const { naoEncontrada: t } = await lerTextosGerais().catch(() => GERAL_PADRAO());
  return (
    <PaginaInterior icone={<Compass />} rodape={false}>
      <div className="coluna flex min-h-full flex-col justify-center pb-16 pt-28">
        {t.sobretitulo && <p className="sobretitulo text-white/70">{t.sobretitulo}</p>}
        <h1 className="titulo-1 mt-4 max-w-[13ch]">{t.titulo}</h1>
        {t.texto && <p className="texto-lead mt-6 max-w-[46ch] text-white/80">{t.texto}</p>}
        <div className="mt-10 flex flex-wrap gap-[var(--intervalo)]">
          {t.botao.texto && t.botao.href && <BotaoMB href={t.botao.href}>{t.botao.texto}</BotaoMB>}
          {t.botaoSecundario.texto && t.botaoSecundario.href && (
            <BotaoMB href={t.botaoSecundario.href} variante="escuro">{t.botaoSecundario.texto}</BotaoMB>
          )}
        </div>
        {(t.nota || t.notaLigacao.texto) && (
          <p className="mt-10 text-sm text-white/75">
            {t.nota}
            {t.nota && t.notaLigacao.texto ? " " : null}
            {t.notaLigacao.texto && t.notaLigacao.href && (
              <>
                <Link href={t.notaLigacao.href} className="sublinhado text-white">{t.notaLigacao.texto}</Link>.
              </>
            )}
          </p>
        )}
      </div>
    </PaginaInterior>
  );
}
