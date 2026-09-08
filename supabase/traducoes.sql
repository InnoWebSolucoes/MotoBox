-- ============================================================
-- MOTOBOX — Cache de traduções automáticas
-- Executar no SQL Editor do Supabase, depois de schema.sql.
--
-- Cada texto traduzido é guardado uma única vez, identificado
-- por uma impressão SHA-256 do par (idioma, texto original).
-- Assim, o conteúdo do painel só é enviado ao serviço de
-- tradução na primeira vez que aparece.
-- ============================================================

create table if not exists traducoes (
  impressao   text primary key,
  original    text not null,
  traduzido   text not null,
  idioma      text not null default 'en',
  criado_em   timestamptz not null default now()
);

create index if not exists idx_traducoes_idioma on traducoes (idioma);

alter table traducoes enable row level security;

-- Leitura pública: as traduções acompanham conteúdo já público.
drop policy if exists ler_traducoes on traducoes;
create policy ler_traducoes on traducoes for select using (true);

-- Escrita apenas pelo service role (rotas /api), que ignora RLS.
