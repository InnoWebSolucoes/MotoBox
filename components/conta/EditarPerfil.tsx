"use client";

/* ============================================================
   MOTOBOX — Área de membro: editar perfil
   Logótipo ou fotografia (com recorte), cor, nome, telefone,
   província e o clube a que pertence. Só segue para o servidor
   o que mudou.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { PROVINCIAS } from "@/lib/provincias";
import { RecortarAvatar, useTextosRecorte, type EstadoRecorte } from "@/app/conta/RecortarAvatar";
import { pedir, type AvatarDados, type ClubeResumo, type PerfilConta } from "./dados";
import { AvatarConta, Janela, Rotulo, campo, useTextosConta } from "./partes";

/** Cores prontas: todas seguram a inicial a branco e assentam no fundo escuro do site. */
export const CORES_AVATAR = [
  "#e10600", "#c2410c", "#b45309", "#15803d", "#0f766e",
  "#0369a1", "#1d4ed8", "#6d28d9", "#be185d", "#475569",
];
export const COR_PADRAO = "#e10600";
const COR_HEX = /^#[0-9a-f]{6}$/i;
const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
// A fotografia escolhida só serve para recortar: o que sobe é o recorte de
// 512 px (bem abaixo dos 2 MB do servidor). Fotografias de telemóvel passam.
const IMAGEM_MAX = 20 * 1024 * 1024;

export const normalizarCor = (c: string | undefined) => (c && COR_HEX.test(c) ? c.toLowerCase() : COR_PADRAO);

/**
 * O que fazer à imagem ao guardar: nada, pôr uma nova, ou tirá-la. A nova
 * guarda o ficheiro original e o enquadramento, para se poder voltar a ajustar.
 */
type EscolhaImagem =
  | { tipo: "manter" }
  | { tipo: "nova"; blob: Blob; preview: string; original: File; recorte: EstadoRecorte }
  | { tipo: "remover" };

async function enviarImagem(imagem: Blob): Promise<string | null> {
  const dados = new FormData();
  dados.append("ficheiro", imagem, `logotipo.${imagem.type.split("/")[1] ?? "jpg"}`);
  return (await pedir("/api/conta/avatar", "POST", dados)).erro;
}

export function EditarPerfil({ perfil, avatar, nomeConta, clube, clubes, aoFechar, aoGuardar }: {
  perfil: PerfilConta | null; avatar: AvatarDados; nomeConta: string;
  clube: string | null; clubes: ClubeResumo[];
  aoFechar: () => void; aoGuardar: () => Promise<void>;
}) {
  const t = useTextosConta();
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [telefone, setTelefone] = useState(perfil?.telefone ?? "");
  const [provincia, setProvincia] = useState(perfil?.provincia ?? "");
  const [meuClube, setMeuClube] = useState(clube ?? "");
  const [cor, setCor] = useState(avatar.cor);
  const [hex, setHex] = useState(avatar.cor);
  const [imagem, setImagem] = useState<EscolhaImagem>({ tipo: "manter" });
  const [erro, setErro] = useState<string | null>(null);
  const [erroImagem, setErroImagem] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  /** Imagem aberta no recorte (a janela mostra-o em vez do formulário). */
  const [recorte, setRecorte] = useState<{ original: File; inicial?: EstadoRecorte } | null>(null);
  const seletor = useRef<HTMLInputElement>(null);
  const secaoImagem = useRef<HTMLElement>(null);
  const voltarFoco = useRef(false);
  const tx = useTextosRecorte();

  // Ao sair do recorte, o foco volta aos botões da imagem em vez de cair no início da página.
  useEffect(() => {
    if (recorte || !voltarFoco.current) return;
    voltarFoco.current = false;
    secaoImagem.current?.querySelector<HTMLButtonElement>("[data-foco-imagem]")?.focus();
  }, [recorte]);

  // Liberta a pré-visualização anterior quando muda, e a última ao fechar.
  useEffect(() => () => {
    if (imagem.tipo === "nova") URL.revokeObjectURL(imagem.preview);
  }, [imagem]);

  const urlMostrada = imagem.tipo === "nova" ? imagem.preview : imagem.tipo === "remover" ? null : avatar.url;
  const personalizada = !CORES_AVATAR.includes(cor);

  const mudarCor = (c: string) => { setCor(c); setHex(c); };
  const escreverHex = (v: string) => {
    const valor = v.trim().startsWith("#") ? v.trim() : `#${v.trim()}`;
    setHex(v);
    if (COR_HEX.test(valor)) setCor(valor.toLowerCase());
  };

  const escolherFicheiro = (fich: File | undefined) => {
    setErroImagem(null);
    if (!fich) return;
    if (!TIPOS_IMAGEM.includes(fich.type)) { setErroImagem("Use uma imagem JPG, PNG ou WebP."); return; }
    if (fich.size > IMAGEM_MAX) { setErroImagem("A imagem tem mais de 20 MB."); return; }
    setRecorte({ original: fich });
  };

  const fecharRecorte = () => { voltarFoco.current = true; setRecorte(null); };

  // O recorte já sai a 512 px: é esse que se mostra e se envia ao guardar.
  const aplicarRecorte = (blob: Blob, estado: EstadoRecorte) => {
    if (!recorte) return;
    setImagem({ tipo: "nova", blob, preview: URL.createObjectURL(blob), original: recorte.original, recorte: estado });
    fecharRecorte();
  };

  const guardar = async () => {
    setAGuardar(true);
    setErro(null);
    // Só vai o que mudou: uma conta sem linha em `utilizadores` pode mudar a cor,
    // o clube e o logótipo sem esbarrar na validação do nome.
    const corpo: Record<string, unknown> = {};
    if (perfil && (nome !== (perfil.nome ?? "") || telefone !== (perfil.telefone ?? "") || provincia !== (perfil.provincia ?? ""))) {
      corpo.perfil = { nome, telefone, provincia };
    }
    if (cor !== avatar.cor) corpo.avatarCor = cor;
    if (meuClube !== (clube ?? "")) corpo.clube = meuClube;

    let e: string | null = null;
    if (Object.keys(corpo).length > 0) e = (await pedir("/api/conta", "PATCH", corpo)).erro;
    if (!e && imagem.tipo === "nova") e = await enviarImagem(imagem.blob);
    if (!e && imagem.tipo === "remover") e = (await pedir("/api/conta/avatar", "DELETE")).erro;
    setAGuardar(false);
    if (e) { setErro(e); return; }
    await aoGuardar();
  };

  if (recorte) {
    // Esc, o fundo e o X fecham só o recorte: o que já se escreveu no perfil fica.
    return (
      <Janela titulo={tx.titulo} aoFechar={fecharRecorte}>
        <RecortarAvatar fonte={recorte.original} inicial={recorte.inicial} cor={cor}
          aoAplicar={aplicarRecorte} aoCancelar={fecharRecorte} />
      </Janela>
    );
  }

  return (
    <Janela titulo={t.accoes.perfil} aoFechar={aoFechar}>
      {/* Logótipo e cor, com o resultado ao vivo no círculo grande */}
      <section ref={secaoImagem} aria-label="Logótipo e cor" className="mb-6 border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center gap-5">
          <AvatarConta url={urlMostrada} cor={cor} nome={nome || nomeConta} className="size-24 text-3xl" />
          <div className="min-w-0 flex-1 basis-44">
            <p className="text-base font-semibold text-white">Logótipo ou fotografia</p>
            <p className="mt-0.5 text-sm text-white/70">JPG, PNG ou WebP, até 20 MB.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {imagem.tipo === "nova" && (
                <Button type="button" variant="dark" size="sm" data-foco-imagem
                  onClick={() => setRecorte({ original: imagem.original, inicial: imagem.recorte })}>
                  {tx.ajustar}
                </Button>
              )}
              <Button type="button" variant="dark" size="sm" data-foco-imagem={imagem.tipo === "nova" ? undefined : true}
                onClick={() => seletor.current?.click()}>
                {urlMostrada ? "Trocar imagem" : "Carregar imagem"}
              </Button>
              {urlMostrada && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImagem({ tipo: "remover" })}>
                  Remover
                </Button>
              )}
            </div>
            <input ref={seletor} type="file" accept={TIPOS_IMAGEM.join(",")} className="sr-only" tabIndex={-1} aria-hidden
              onChange={(e) => { escolherFicheiro(e.target.files?.[0]); e.target.value = ""; }} />
            {erroImagem && <p role="alert" className="mt-2 text-sm text-mb-red-light">{erroImagem}</p>}
          </div>
        </div>

        <p className="mb-2.5 mt-6 text-sm text-white/85">Cor</p>
        <div className="flex flex-wrap items-center gap-2.5">
          {CORES_AVATAR.map((c) => (
            <button key={c} type="button" onClick={() => mudarCor(c)} aria-pressed={cor === c} aria-label={`Cor ${c}`}
              className={`size-8 rounded-full transition-transform motion-safe:hover:scale-110 ${
                cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-ink-900" : ""
              }`}
              style={{ backgroundColor: c }} />
          ))}
          {/* Cor livre, para acertar com a do logótipo */}
          <label title="Cor personalizada"
            className={`relative size-8 cursor-pointer overflow-hidden rounded-full transition-transform motion-safe:hover:scale-110 ${
              personalizada ? "ring-2 ring-white ring-offset-2 ring-offset-ink-900" : ""
            }`}
            style={{
              background: personalizada
                ? cor
                : "conic-gradient(#e10600, #f59e0b, #22c55e, #0ea5e9, #6d28d9, #be185d, #e10600)",
            }}>
            <input type="color" value={cor} onChange={(e) => mudarCor(e.target.value.toLowerCase())}
              aria-label="Cor personalizada" className="absolute inset-0 size-full cursor-pointer opacity-0" />
          </label>
          <input value={hex} onChange={(e) => escreverHex(e.target.value)} maxLength={7} spellCheck={false}
            aria-label="Código da cor (#rrggbb)"
            className="h-8 w-24 bg-ink-950 px-3 font-mono text-xs uppercase text-white ring-1 ring-inset ring-white/15 outline-none focus:ring-2 focus:ring-mb-red" />
        </div>
        <p className="mt-3 text-sm text-white/70">A cor aparece por trás do logótipo e quando não há imagem.</p>
      </section>

      <div className="space-y-4">
        {perfil && (
          <>
            <Rotulo texto="Nome"><input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} autoComplete="name" /></Rotulo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Rotulo texto="Telefone"><input className={campo} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+244 9xx xxx xxx" maxLength={30} autoComplete="tel" inputMode="tel" /></Rotulo>
              <Rotulo texto="Província">
                <select className={campo} value={provincia} onChange={(e) => setProvincia(e.target.value)}>
                  <option value="">Não indicada</option>
                  {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Rotulo>
            </div>
          </>
        )}
        <Rotulo texto={t.preferencias.meuClube} ajuda={t.preferencias.meuClubeTexto}>
          <select className={campo} value={meuClube} onChange={(e) => setMeuClube(e.target.value)}>
            <option value="">{t.paraSi.semClubeOpcao}</option>
            {clubes.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
          </select>
        </Rotulo>
        {erro && <p role="alert" className="text-sm text-mb-red-light">{erro}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button onClick={guardar} disabled={aGuardar}>{aGuardar ? "A guardar…" : "Guardar"}</Button>
        </div>
      </div>
    </Janela>
  );
}
