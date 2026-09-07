-- ============================================================
-- MOTOBOX ANGOLA — Esquema da base de dados
-- Executar no SQL Editor do Supabase (uma vez, por ordem).
--
-- Segurança: RLS activo em todas as tabelas. O site público lê
-- apenas conteúdo publicado através da chave anónima; toda a
-- escrita passa pelo service role, usado exclusivamente no
-- servidor (rotas /api/admin).
-- ============================================================

-- ---------- Extensões ----------
create extension if not exists "pgcrypto";

-- ---------- Tabelas de desporto ----------

create table if not exists eventos (
  slug            text primary key,
  titulo          text not null,
  disciplina      text not null,
  ronda           int,
  temporada       int  not null default 2026,
  circuito        text not null default '',
  provincia       text not null default 'Luanda',
  localidade      text not null default '',
  data_inicio     date not null,
  data_fim        date not null,
  estado          text not null default 'agendado',
  imagem          text not null default '',
  resumo          text not null default '',
  descricao       text not null default '',
  organizador     text not null default 'Motobox Angola',
  horarios        jsonb not null default '[]'::jsonb,
  bilhetes        jsonb not null default '[]'::jsonb,
  distancia_volta text,
  numero_voltas   int,
  recorde_volta   jsonb,
  publicado       boolean not null default true,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create table if not exists equipas (
  slug          text primary key,
  nome          text not null,
  tipo          text not null default 'Equipa',
  base          text not null default '',
  provincia     text not null default 'Luanda',
  fundacao      int  not null default 2020,
  logo          text not null default '',
  cor           text not null default '#e10600',
  chefe         text not null default '',
  membros       int  not null default 0,
  pilotos       jsonb not null default '[]'::jsonb,
  descricao     text not null default '',
  motas         jsonb not null default '[]'::jsonb,
  estatisticas  jsonb not null default '{}'::jsonb,
  redes         jsonb not null default '{}'::jsonb,
  publicado     boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists pilotos (
  slug          text primary key,
  nome          text not null,
  apelido       text,
  numero        int  not null default 0,
  equipa        text not null default '',
  equipa_slug   text references equipas(slug) on delete set null,
  provincia     text not null default 'Luanda',
  nacionalidade text not null default 'Angolana',
  idade         int  not null default 0,
  mota          text not null default '',
  categoria     text not null default '',
  foto          text not null default '',
  bio           text not null default '',
  estreia       int  not null default 2026,
  estatisticas  jsonb not null default '{}'::jsonb,
  redes         jsonb not null default '{}'::jsonb,
  campeonatos   int  not null default 0,
  publicado     boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists corridas (
  slug          text primary key,
  evento_slug   text references eventos(slug) on delete set null,
  nome          text not null,
  ronda         int  not null default 1,
  temporada     int  not null default 2026,
  circuito      text not null default '',
  provincia     text not null default 'Luanda',
  data          date not null,
  categoria     text not null default '',
  vencedor      text not null default '',
  imagem        text not null default '',
  resultados    jsonb not null default '[]'::jsonb,
  publicado     boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Conteúdo editorial ----------

create table if not exists noticias (
  slug          text primary key,
  titulo        text not null,
  resumo        text not null default '',
  corpo         jsonb not null default '[]'::jsonb,
  categoria     text not null default 'Angola',
  tags          jsonb not null default '[]'::jsonb,
  autor         text not null default '',
  data          date not null,
  imagem        text not null default '',
  leitura       int  not null default 3,
  destaque      boolean not null default false,
  fonte         text,
  fonte_url     text,
  publicado     boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists videos (
  slug           text primary key,
  titulo         text not null,
  descricao      text not null default '',
  duracao        text not null default '0:00',
  data           date not null,
  thumbnail      text not null default '',
  categoria      text not null default 'Highlights',
  visualizacoes  int  not null default 0,
  evento         text,
  publicado      boolean not null default true,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create table if not exists patrocinadores (
  slug          text primary key,
  nome          text not null,
  nivel         text not null default 'Apoio',
  setor         text not null default '',
  descricao     text not null default '',
  logo          text not null default '',
  website       text not null default '',
  desde         int  not null default 2026,
  publicado     boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists paginas_legais (
  slug          text primary key,
  titulo        text not null,
  descricao     text not null default '',
  seccoes       jsonb not null default '[]'::jsonb,
  publicado     boolean not null default false,
  atualizado    date not null default current_date,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Comunidade ----------

create table if not exists categorias_forum (
  slug      text primary key,
  nome      text not null,
  descricao text not null default '',
  icone     text not null default 'chat',
  topicos   int  not null default 0,
  mensagens int  not null default 0,
  cor       text not null default '#e10600'
);

create table if not exists topicos (
  id              text primary key,
  titulo          text not null,
  categoria       text not null default '',
  categoria_slug  text references categorias_forum(slug) on delete set null,
  autor           text not null default '',
  autor_avatar    text not null default '',
  avatar_cor      text not null default '#e10600',
  criado          date not null default current_date,
  respostas       int  not null default 0,
  visualizacoes   int  not null default 0,
  ultima_resposta jsonb not null default '{}'::jsonb,
  fixado          boolean not null default false,
  bloqueado       boolean not null default false,
  resolvido       boolean not null default false,
  excerto         text not null default '',
  publicado       boolean not null default true,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create table if not exists anuncios (
  id             text primary key,
  titulo         text not null,
  categoria      text not null default 'Motas',
  preco          numeric(12,2) not null default 0,
  negociavel     boolean not null default false,
  marca          text not null default '',
  modelo         text,
  ano            int,
  quilometragem  int,
  estado         text not null default 'Bom',
  provincia      text not null default 'Luanda',
  descricao      text not null default '',
  imagens        jsonb not null default '[]'::jsonb,
  vendedor       jsonb not null default '{}'::jsonb,
  publicado_em   date not null default current_date,
  visualizacoes  int  not null default 0,
  publicado      boolean not null default true,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- ---------- Pessoas e operações (privado) ----------

create table if not exists utilizadores (
  id             text primary key,
  nome           text not null,
  email          text not null unique,
  telefone       text,
  papel          text not null default 'leitor',
  estado         text not null default 'pendente',
  provincia      text,
  avatar_cor     text not null default '#e10600',
  registado      date not null default current_date,
  ultimo_acesso  date,
  verificado     boolean not null default false,
  newsletter     boolean not null default false,
  notas          text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create table if not exists encomendas (
  id                text primary key,
  referencia        text not null unique,
  evento_slug       text references eventos(slug) on delete set null,
  evento_titulo     text not null default '',
  tipo_bilhete_id   text not null default '',
  tipo_bilhete_nome text not null default '',
  quantidade        int  not null default 1,
  preco_unitario    numeric(12,2) not null default 0,
  taxa              numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  estado            text not null default 'pendente',
  comprador         jsonb not null default '{}'::jsonb,
  metodo            text not null default 'Multicaixa Express',
  criado            date not null default current_date,
  pago              date,
  codigo_qr         text not null default '',
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

create table if not exists denuncias (
  id           text primary key,
  tipo         text not null default 'forum',
  alvo_id      text not null default '',
  alvo_titulo  text not null default '',
  motivo       text not null default '',
  detalhe      text not null default '',
  denunciante  text not null default '',
  criado       date not null default current_date,
  estado       text not null default 'pendente',
  resolucao    text,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists subscritores (
  id         text primary key,
  email      text not null unique,
  nome       text,
  origem     text not null default 'rodapé',
  subscrito  date not null default current_date,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create table if not exists mensagens (
  id         text primary key,
  nome       text not null,
  email      text not null,
  telefone   text,
  assunto    text not null default '',
  mensagem   text not null default '',
  recebido   date not null default current_date,
  lida       boolean not null default false,
  arquivada  boolean not null default false,
  resposta   text,
  criado_em  timestamptz not null default now()
);

create table if not exists definicoes (
  id                 int primary key default 1,
  nome_site          text not null default 'Motobox Angola',
  descricao          text not null default '',
  email_contacto     text not null default '',
  telefone           text not null default '',
  morada             text not null default '',
  temporada          int  not null default 2026,
  taxa_motobox       numeric(5,2) not null default 5,
  moeda              text not null default 'Kz',
  instagram          text not null default '',
  facebook           text not null default '',
  youtube            text not null default '',
  manutencao         boolean not null default false,
  registos_abertos   boolean not null default true,
  marketplace_aberto boolean not null default true,
  forum_aberto       boolean not null default true,
  bilheteira_aberta  boolean not null default true,
  cookie_banner      boolean not null default true,
  analytics          text not null default '',
  atualizado_em      timestamptz not null default now(),
  constraint definicoes_linha_unica check (id = 1)
);

create table if not exists atividade (
  id          text primary key,
  quando      timestamptz not null default now(),
  utilizador  text not null default '',
  accao       text not null default '',
  entidade    text not null default '',
  detalhe     text not null default ''
);

-- ---------- Índices ----------
create index if not exists idx_eventos_data      on eventos (data_inicio);
create index if not exists idx_eventos_estado    on eventos (estado);
create index if not exists idx_noticias_data     on noticias (data desc);
create index if not exists idx_noticias_cat      on noticias (categoria);
create index if not exists idx_pilotos_equipa    on pilotos (equipa_slug);
create index if not exists idx_corridas_data     on corridas (data desc);
create index if not exists idx_encomendas_estado on encomendas (estado);
create index if not exists idx_encomendas_evento on encomendas (evento_slug);
create index if not exists idx_denuncias_estado  on denuncias (estado);
create index if not exists idx_mensagens_lida    on mensagens (lida, arquivada);
create index if not exists idx_atividade_quando  on atividade (quando desc);

-- ---------- Trigger: atualizado_em ----------
create or replace function tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'eventos','equipas','pilotos','corridas','noticias','videos',
    'patrocinadores','paginas_legais','topicos','anuncios',
    'utilizadores','encomendas','denuncias'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_atualizado on %1$s;
       create trigger trg_%1$s_atualizado before update on %1$s
       for each row execute function tocar_atualizado_em();', t);
  end loop;
end $$;

-- ============================================================
-- SEGURANÇA (RLS)
-- ============================================================
-- Todas as tabelas com RLS activo. Sem policies de escrita:
-- a chave anónima nunca escreve. O service role ignora RLS e é
-- usado apenas no servidor.

do $$
declare t text;
begin
  foreach t in array array[
    'eventos','equipas','pilotos','corridas','noticias','videos',
    'patrocinadores','paginas_legais','categorias_forum','topicos',
    'anuncios','utilizadores','encomendas','denuncias','subscritores',
    'mensagens','definicoes','atividade'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- Leitura pública: apenas conteúdo publicado.
drop policy if exists ler_eventos        on eventos;
drop policy if exists ler_equipas        on equipas;
drop policy if exists ler_pilotos        on pilotos;
drop policy if exists ler_corridas       on corridas;
drop policy if exists ler_noticias       on noticias;
drop policy if exists ler_videos         on videos;
drop policy if exists ler_patrocinadores on patrocinadores;
drop policy if exists ler_paginas        on paginas_legais;
drop policy if exists ler_categorias     on categorias_forum;
drop policy if exists ler_topicos        on topicos;
drop policy if exists ler_anuncios       on anuncios;
drop policy if exists ler_definicoes     on definicoes;

create policy ler_eventos        on eventos        for select using (publicado);
create policy ler_equipas        on equipas        for select using (publicado);
create policy ler_pilotos        on pilotos        for select using (publicado);
create policy ler_corridas       on corridas       for select using (publicado);
create policy ler_noticias       on noticias       for select using (publicado);
create policy ler_videos         on videos         for select using (publicado);
create policy ler_patrocinadores on patrocinadores for select using (publicado);
create policy ler_paginas        on paginas_legais for select using (publicado);
create policy ler_categorias     on categorias_forum for select using (true);
create policy ler_topicos        on topicos        for select using (publicado);
create policy ler_anuncios       on anuncios       for select using (publicado);
create policy ler_definicoes     on definicoes     for select using (true);

-- Sem policies para: utilizadores, encomendas, denuncias,
-- subscritores, mensagens, atividade.
-- Estas tabelas contêm dados pessoais e operacionais e só são
-- acessíveis pelo service role, no servidor.

-- ---------- Linha única de definições ----------
insert into definicoes (id) values (1) on conflict (id) do nothing;
