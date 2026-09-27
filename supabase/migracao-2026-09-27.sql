-- ============================================================
-- MOTOBOX — Migração de 27 de Setembro de 2026
-- Correr UMA vez no Supabase: SQL Editor → New query → colar → Run.
-- É seguro correr de novo: cada instrução só acrescenta o que falta.
--
-- Traz:
--   · respostas do fórum escritas pelos membros com sessão
-- ============================================================

-- ---------- Respostas do fórum ----------
-- Escritas só pelo servidor (/api/forum/responder, com a chave de
-- service role), que confirma a sessão, o estado da conta e se o
-- tópico aceita respostas. O nome, a cor e o logótipo ficam
-- copiados da conta no momento em que a resposta é publicada.
-- Para esconder uma resposta: publicado = false.
create table if not exists respostas_forum (
  id            text primary key,
  topico_id     text not null references topicos(id) on delete cascade,
  autor_id      uuid references auth.users(id) on delete set null,
  autor_nome    text not null,
  autor_cor     text,
  autor_avatar  text,
  corpo         text not null check (char_length(corpo) between 1 and 5000),
  criado_em     timestamptz not null default now(),
  publicado     boolean not null default true
);

-- A página do tópico lê as respostas por ordem de chegada.
create index if not exists idx_respostas_forum_topico on respostas_forum (topico_id, criado_em);
-- O limite de respostas seguidas conta as de cada autor nos últimos minutos.
create index if not exists idx_respostas_forum_autor on respostas_forum (autor_id, criado_em);

-- Leitura pública só do que está publicado; sem policies de escrita.
alter table respostas_forum enable row level security;
drop policy if exists ler_respostas_forum on respostas_forum;
create policy ler_respostas_forum on respostas_forum for select using (publicado);
