"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";
import { CampoPalavraPasse } from "@/components/CampoPalavraPasse";
import type { ConteudoContas } from "@/lib/conteudo/grupos/contas";

/**
 * Nova palavra-passe. Chega-se aqui pela ligação do email (que já abre
 * sessão em /auth/confirmar). Sem sessão, a ligação expirou ou já foi
 * usada: diz-se isso e mostra-se como pedir outra, em vez de deixar
 * escrever uma palavra-passe que não pode ser gravada.
 */
export function NovaPalavraClient({ textos }: { textos: ConteudoContas["novaPalavra"] }) {
  const { t } = useIdioma();
  const { definirPalavra, utilizador, carregando } = useAuth();
  const router = useRouter();

  const [palavra, setPalavra] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [feito, setFeito] = useState(false);

  // Gravada: mostra o aviso e segue para a conta.
  useEffect(() => {
    if (!feito) return;
    const tempo = window.setTimeout(() => router.replace("/conta"), 2500);
    return () => window.clearTimeout(tempo);
  }, [feito, router]);

  const campo =
    "h-12 w-full rounded-[0.625rem] bg-ink-900 px-4 text-sm text-white ring-1 ring-inset ring-white/10 " +
    "placeholder:text-ink-300 outline-none transition-shadow focus:ring-2 focus:ring-mb-red";
  const etiqueta = "mb-1.5 block text-sm text-white/70";

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (palavra.length < 8) { setErro(t("auth.palavraCurta")); return; }
    if (palavra !== confirmacao) { setErro(t("auth.palavrasDiferentes")); return; }

    setOcupado(true);
    const falha = await definirPalavra(palavra);
    setOcupado(false);

    if (falha) {
      setErro(/session|sessão/i.test(falha) ? textos.semSessao : falha);
      return;
    }
    setFeito(true);
  };

  const semSessao = !carregando && !utilizador && !feito;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="title-xl text-3xl text-white">{textos.titulo || t("auth.novaPalavra")}</h1>
      {textos.texto && !semSessao && !feito && <p className="mt-2 text-sm text-ink-300">{textos.texto}</p>}

      <div className="mt-6">
        {feito ? (
          <div role="status" className="rounded-xl bg-ok/12 px-4 py-3 text-sm text-ok">
            <p>{textos.sucesso}</p>
            <Link href="/conta" className="mt-2 inline-block text-white underline hover:no-underline">{t("auth.aMinhaConta")}</Link>
          </div>
        ) : semSessao ? (
          <div role="alert" className="rounded-xl bg-mb-red/12 px-4 py-3 text-sm leading-relaxed text-mb-red-light">
            <p>{textos.semSessao}</p>
            <Link href="/entrar?modo=recuperar" className="mt-2 inline-block text-white underline hover:no-underline">
              {t("auth.esqueceuPalavra")}
            </Link>
          </div>
        ) : (
          <>
            {erro && (
              <p role="alert" className="mb-4 rounded-xl bg-mb-red/12 px-4 py-3 text-sm text-mb-red-light">
                {erro}
              </p>
            )}

            <form onSubmit={submeter} className="space-y-4">
              <label className="block">
                <span className={etiqueta}>{t("auth.novaPalavra")}</span>
                <CampoPalavraPasse className={campo} value={palavra} required minLength={8}
                  autoComplete="new-password" placeholder={t("auth.minimoCaracteres")}
                  onChange={(e) => setPalavra(e.target.value)} />
              </label>

              <label className="block">
                <span className={etiqueta}>{t("auth.confirmarPalavra")}</span>
                <CampoPalavraPasse className={campo} value={confirmacao} required
                  autoComplete="new-password" placeholder="••••••••"
                  onChange={(e) => setConfirmacao(e.target.value)} />
              </label>

              <button type="submit" disabled={ocupado || carregando}
                className="h-12 w-full rounded-[6px] bg-mb-red text-[15px] text-white transition-colors hover:bg-mb-red-dark disabled:opacity-50">
                {ocupado ? t("auth.aguarde") : t("comum.guardar")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
