"use client";

/* ============================================================
   MOTOBOX ADMIN — Utilizadores
   As contas do site: a equipa (com o papel que define o que
   pode fazer no painel) e os membros da comunidade. Aprovar,
   suspender, banir, verificar e mudar o papel.
   ============================================================ */

import { BadgeCheck, CheckCircle2, UserCog } from "lucide-react";
import { PaginaRecurso } from "@/components/admin/Recurso";
import {
  AccaoIcone, Area, CampoCor, Campo, Estado, Grupo, Input, Interruptor, Seleccao, useAviso,
} from "@/components/admin/kit";
import { useAdmin, novoId } from "@/lib/admin/store";
import { corPara } from "@/lib/admin/seed";
import { PAPEIS, PERMISSOES_POR_PAPEL, type Papel, type Permissao, type Utilizador } from "@/lib/admin/types";
import { PROVINCIAS } from "@/lib/provincias";
import { Avatar } from "../moderacao/_comum/partes";
import { dataCurta } from "../moderacao/_comum/formato";

const ESTADOS: { valor: Utilizador["estado"]; nome: string; descricao: string }[] = [
  { valor: "ativo", nome: "Activa", descricao: "Entra e usa o site normalmente." },
  { valor: "pendente", nome: "Por aprovar", descricao: "Ainda não foi confirmada pela equipa." },
  { valor: "suspenso", nome: "Suspensa", descricao: "Bloqueio temporário: não entra nem publica." },
  { valor: "banido", nome: "Banida", descricao: "Bloqueio definitivo por violar as regras." },
];
const nomeEstado = (e: string) => ESTADOS.find((x) => x.valor === e)?.nome ?? e;

/** O que cada permissão deixa fazer, em palavras de todos os dias. */
const PERMISSOES: Record<Permissao, string> = {
  "conteudo.ler": "Ver o conteúdo do painel",
  "conteudo.escrever": "Escrever e editar artigos, eventos, clubes e rotas",
  "conteudo.publicar": "Publicar no site",
  "conteudo.apagar": "Apagar conteúdo",
  "comunidade.ler": "Ver o fórum, o marketplace e as mensagens",
  "comunidade.moderar": "Moderar: esconder, fechar e apagar o que for denunciado",
  "comercial.ler": "Ver bilheteira e encomendas",
  "comercial.escrever": "Confirmar pagamentos e mudar preços",
  "utilizadores.ler": "Ver as contas",
  "utilizadores.escrever": "Criar contas e mudar papéis",
  "definicoes.ler": "Ver as definições do site",
  "definicoes.escrever": "Mudar as definições do site",
};

const op = (v: readonly string[]) => v.map((x) => ({ valor: x, nome: x }));

export default function AdminUtilizadores() {
  const { atualizar } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const aprovar = async (u: Utilizador) => {
    const falha = await atualizar("utilizadores", u.id, { estado: "ativo" });
    mostrar(falha ?? `A conta de ${u.nome} foi aprovada.`, falha ? "erro" : "ok");
  };

  return (
    <>
      <PaginaRecurso<Utilizador>
        coleccao="utilizadores"
        titulo="Utilizadores"
        sobretitulo="Comunidade"
        icone={<UserCog />}
        descricao="As contas do site: a equipa, com o papel que define o que cada um pode fazer no painel, e os membros da comunidade."
        nomeItem="conta"
        feminino
        vazio="Ainda não há contas"
        larguraGaveta="max-w-2xl"
        procuraPlaceholder="Nome, email, telefone ou província…"
        mensagemApagar="A conta sai da lista. Para impedir alguém de entrar, é melhor suspender ou banir: fica o histórico."
        procuraEm={(u) => `${u.nome} ${u.email} ${u.telefone ?? ""} ${u.provincia ?? ""}`}
        ordenar={(a, b) => b.registado.localeCompare(a.registado)}
        filtrosRapidos={[
          { chave: "equipa", nome: "Equipa", teste: (u) => u.papel !== "leitor" },
          { chave: "membros", nome: "Membros", teste: (u) => u.papel === "leitor" },
          { chave: "por-aprovar", nome: "Por aprovar", teste: (u) => u.estado === "pendente" },
          { chave: "bloqueadas", nome: "Suspensas ou banidas", teste: (u) => u.estado === "suspenso" || u.estado === "banido" },
        ]}
        filtros={[
          { chave: "papel", etiqueta: "Todos os papéis", opcoes: PAPEIS.map((p) => ({ valor: p.valor, nome: p.nome })) },
          { chave: "provincia", etiqueta: "Todas as províncias", opcoes: op(PROVINCIAS) },
        ]}
        colunas={[
          {
            cabecalho: "Conta",
            celula: (u) => (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar nome={u.nome} cor={u.avatarCor} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium text-white">
                    <span className="max-w-60 truncate">{u.nome}</span>
                    {u.verificado && <BadgeCheck className="size-4 shrink-0 text-[#4ade80]" aria-label="Verificada" />}
                  </p>
                  <p className="max-w-64 truncate text-xs text-white/75">{u.email}</p>
                </div>
              </div>
            ),
          },
          {
            cabecalho: "Papel",
            celula: (u) => (
              <span className={u.papel === "leitor" ? "text-white/75" : "text-white"}>
                {u.papel === "leitor" ? "Membro" : PAPEIS.find((p) => p.valor === u.papel)?.nome ?? u.papel}
              </span>
            ),
          },
          { cabecalho: "Estado", celula: (u) => <Estado valor={u.estado} rotulo={nomeEstado(u.estado)} /> },
          { cabecalho: "Província", celula: (u) => <span className="text-white/80">{u.provincia ?? ""}</span> },
          { cabecalho: "Registo", celula: (u) => <span className="whitespace-nowrap tabular-nums text-white/80">{dataCurta(u.registado, true)}</span> },
          {
            cabecalho: "Último acesso",
            celula: (u) => <span className="whitespace-nowrap tabular-nums text-white/75">{u.ultimoAcesso ? dataCurta(u.ultimoAcesso) : "Nunca"}</span>,
          },
        ]}
        accoesLinha={(u) => u.estado === "pendente" ? (
          <AccaoIcone titulo="Aprovar a conta" tom="ok" onClick={() => void aprovar(u)}>
            <CheckCircle2 className="size-3.5" aria-hidden />
          </AccaoIcone>
        ) : null}
        tituloItem={(u) => `${u.nome} · ${u.email}`}
        novoRegisto={() => ({
          id: novoId("u"), nome: "", email: "", papel: "leitor", estado: "ativo",
          provincia: "Luanda", avatarCor: corPara(String(Date.now())),
          registado: new Date().toISOString().slice(0, 10),
          verificado: false, newsletter: false,
        }) as Utilizador}
        preparar={(r) => {
          if (!r.nome.trim()) return "Escreva o nome.";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())) return "Escreva um email válido.";
          return { ...r, nome: r.nome.trim(), email: r.email.trim().toLowerCase() };
        }}
        formulario={(r, definir) => {
          const papel = PAPEIS.find((p) => p.valor === r.papel);
          return (
            <>
              <Grupo titulo="A pessoa">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Nome" obrigatorio>
                    <Input value={r.nome} onChange={(e) => definir({ nome: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="Email" obrigatorio ajuda="É com ele que a pessoa entra no site.">
                    <Input type="email" value={r.email} onChange={(e) => definir({ email: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="Telefone">
                    <Input type="tel" value={r.telefone ?? ""} placeholder="+244 …" onChange={(e) => definir({ telefone: e.target.value || undefined })} />
                  </Campo>
                  <Campo etiqueta="Província">
                    <Seleccao valor={r.provincia ?? ""} opcoes={[{ valor: "", nome: "Não indicada" }, ...op(PROVINCIAS)]}
                      onChange={(v) => definir({ provincia: v || undefined })} />
                  </Campo>
                </div>
                <div className="flex items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <CampoCor etiqueta="Cor do quadradinho" valor={r.avatarCor} onChange={(v) => definir({ avatarCor: v })}
                      ajuda="A cor das iniciais na conta e nas respostas do fórum." />
                  </div>
                  <Avatar nome={r.nome} cor={r.avatarCor} className="mb-6 size-11 text-sm" />
                </div>
              </Grupo>

              <Grupo titulo="Papel e acesso" descricao="O papel decide se a pessoa entra no painel de gestão e o que pode fazer lá.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Papel">
                    <Seleccao valor={r.papel} opcoes={PAPEIS.map((p) => ({ valor: p.valor, nome: p.valor === "leitor" ? "Membro (sem acesso ao painel)" : p.nome }))}
                      onChange={(v) => definir({ papel: v as Papel })} />
                  </Campo>
                  <Campo etiqueta="Estado da conta" ajuda={ESTADOS.find((e) => e.valor === r.estado)?.descricao}>
                    <Seleccao valor={r.estado} opcoes={ESTADOS.map((e) => ({ valor: e.valor, nome: e.nome }))}
                      onChange={(v) => definir({ estado: v as Utilizador["estado"] })} />
                  </Campo>
                </div>
                <div className="rounded-[var(--raio)] bg-black/20 px-4 py-3.5">
                  <p className="text-sm text-white">{r.papel === "leitor" ? "Membro" : papel?.nome}</p>
                  <p className="mt-0.5 text-[13px] text-white/75">{r.papel === "leitor" ? "Conta do site público: sem acesso ao painel de gestão." : papel?.descricao}</p>
                  {PERMISSOES_POR_PAPEL[r.papel].length > 0 && (
                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {PERMISSOES_POR_PAPEL[r.papel].map((p) => (
                        <li key={p} className="flex items-start gap-2 text-[13px] text-white/75">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#4ade80]" aria-hidden />
                          {PERMISSOES[p]}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Grupo>

              <Grupo titulo="Mais">
                <Interruptor activo={r.verificado} etiqueta="Conta verificada"
                  descricao="A equipa confirmou quem é. Os anúncios desta pessoa mostram o selo de vendedor verificado."
                  onChange={(v) => definir({ verificado: v })} />
                <Interruptor activo={r.newsletter} etiqueta="Recebe a newsletter"
                  descricao="O resumo semanal por email." onChange={(v) => definir({ newsletter: v })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Registada a">
                    <Input type="date" value={r.registado.slice(0, 10)} onChange={(e) => definir({ registado: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="Último acesso">
                    <Input type="date" value={r.ultimoAcesso?.slice(0, 10) ?? ""} onChange={(e) => definir({ ultimoAcesso: e.target.value || undefined })} />
                  </Campo>
                </div>
                <Campo etiqueta="Notas da equipa" ajuda="Só a equipa vê. Não aparece no site.">
                  <Area rows={3} value={r.notas ?? ""} onChange={(e) => definir({ notas: e.target.value || undefined })} />
                </Campo>
              </Grupo>
            </>
          );
        }}
      />
      {elemento}
    </>
  );
}
