"use client";

import { useRef, useState } from "react";
import { useAdmin, type ColeccaoNome } from "@/lib/admin/store";
import {
  CabecalhoPagina, Painel, Estatistica, useAviso, Confirmar, Area,
} from "@/components/admin/kit";

const COLECCOES: { chave: ColeccaoNome; nome: string }[] = [
  { chave: "eventos", nome: "Eventos" },
  { chave: "pilotos", nome: "Pilotos" },
  { chave: "equipas", nome: "Equipas" },
  { chave: "corridas", nome: "Corridas" },
  { chave: "noticias", nome: "Notícias" },
  { chave: "videos", nome: "Vídeos" },
  { chave: "patrocinadores", nome: "Patrocinadores" },
  { chave: "anuncios", nome: "Anúncios" },
  { chave: "topicos", nome: "Tópicos" },
  { chave: "utilizadores", nome: "Utilizadores" },
  { chave: "encomendas", nome: "Encomendas" },
  { chave: "denuncias", nome: "Denúncias" },
  { chave: "subscritores", nome: "Subscritores" },
  { chave: "mensagens", nome: "Mensagens" },
  { chave: "paginasLegais", nome: "Páginas legais" },
];

export default function AdminDados() {
  const { estado, exportar, importar, reiniciar } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const ficheiro = useRef<HTMLInputElement>(null);

  const [aReiniciar, setAReiniciar] = useState(false);
  const [colar, setColar] = useState("");

  const descarregar = () => {
    const url = URL.createObjectURL(new Blob([exportar()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `motobox-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrar("Cópia de segurança descarregada.");
  };

  const carregarFicheiro = async (f: File) => {
    const texto = await f.text();
    if (importar(texto)) mostrar("Dados importados com sucesso.");
    else mostrar("Ficheiro inválido — nada foi alterado.", "erro");
  };

  const importarColado = () => {
    if (!colar.trim()) { mostrar("Cole primeiro o conteúdo JSON.", "erro"); return; }
    if (importar(colar)) { mostrar("Dados importados com sucesso."); setColar(""); }
    else mostrar("JSON inválido — nada foi alterado.", "erro");
  };

  const totalRegistos = COLECCOES.reduce(
    (s, c) => s + (estado[c.chave] as unknown[]).length, 0,
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Dados"
        descricao="Cópias de segurança, importação e reposição dos dados de demonstração."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Estatistica rotulo="Registos totais" valor={totalRegistos} />
        <Estatistica rotulo="Coleções" valor={COLECCOES.length} />
        <Estatistica rotulo="Ações registadas" valor={estado.atividade.length} />
        <Estatistica rotulo="Armazenamento" valor="Local" variacao="localStorage do navegador" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Exportar" descricao="Guarda todo o conteúdo num ficheiro JSON.">
          <p className="mb-4 text-sm text-ink-400">
            A cópia inclui eventos, pilotos, equipas, conteúdo editorial, encomendas,
            utilizadores e definições. Use-a como salvaguarda antes de alterações grandes.
          </p>
          <button type="button" onClick={descarregar}
            className="h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark">
            Descarregar JSON
          </button>
        </Painel>

        <Painel titulo="Importar" descricao="Substitui os dados actuais pelos do ficheiro.">
          <p className="mb-4 text-sm text-ink-400">
            A importação substitui o conteúdo existente. Exporte primeiro se quiser
            poder voltar atrás.
          </p>
          <div className="flex flex-wrap gap-2">
            <input ref={ficheiro} type="file" accept="application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) carregarFicheiro(f); e.target.value = ""; }} />
            <button type="button" onClick={() => ficheiro.current?.click()}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red">
              Escolher ficheiro
            </button>
          </div>

          <div className="mt-4">
            <Area rows={4} value={colar} onChange={(e) => setColar(e.target.value)}
              aria-label="Colar JSON"
              placeholder="… ou cole aqui o conteúdo JSON" />
            <button type="button" onClick={importarColado}
              className="mt-2 h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red">
              Importar do texto
            </button>
          </div>
        </Painel>

        <Painel titulo="Conteúdo por coleção" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {COLECCOES.map((c) => (
              <div key={c.chave} className="border border-ink-700 bg-ink-950 p-3">
                <p className="font-display text-lg tabular-nums text-white">
                  {(estado[c.chave] as unknown[]).length}
                </p>
                <p className="text-xs text-ink-500">{c.nome}</p>
              </div>
            ))}
          </div>
        </Painel>

        <Painel titulo="Repor dados de demonstração" className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm text-ink-400">
              Descarta todas as alterações feitas no painel e repõe o conteúdo de
              demonstração original. Esta ação não pode ser anulada.
            </p>
            <button type="button" onClick={() => setAReiniciar(true)}
              className="h-10 border border-mb-red px-4 font-display text-xs uppercase tracking-wider text-mb-red transition-colors hover:bg-mb-red hover:text-white">
              Repor tudo
            </button>
          </div>
        </Painel>
      </div>

      <Confirmar
        aberta={aReiniciar}
        aoFechar={() => setAReiniciar(false)}
        aoConfirmar={() => { reiniciar(); mostrar("Dados repostos."); }}
        titulo="Repor dados de demonstração"
        mensagem="Todas as alterações guardadas neste navegador serão descartadas e o conteúdo original reposto."
        textoConfirmar="Repor tudo"
        perigo
      />

      {elemento}
    </>
  );
}
