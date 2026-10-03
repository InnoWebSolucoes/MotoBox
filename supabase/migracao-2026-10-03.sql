-- ============================================================
-- MOTOBOX — Migração de 3 de Outubro de 2026
-- Correr UMA vez no Supabase: SQL Editor → New query → colar → Run.
-- É seguro correr de novo: só cria ou acrescenta o que falta.
-- Precisa das migrações de Setembro já corridas (a de 27/09 traz as
-- respostas do fórum).
--
-- Traz:
--   1. Eventos: `entrada`, como se participa quando a Motobox não vende
--      bilhetes ("Entrada livre", "5.000 Kz pagos no local"…).
--   2. Newsletter: `interesses` de cada subscritor; lista vazia = tudo.
--   3. Fórum: tópicos abertos pelos membros (`autor_id`) e denúncias
--      apontadas a uma resposta (`resposta_id`).
--   4. Marketplace: as motas passam a ser revistas pela equipa antes de
--      aparecerem; a declaração do vendedor (número de quadro, matrícula,
--      documentos) fica numa tabela sem leitura pública; e a página
--      "Termos do Marketplace", editável em Páginas legais.
--
-- Antes de correr, o site funciona na mesma, com estas excepções:
-- não se podem publicar nem editar motas (o vendedor vê um aviso),
-- os membros não abrem tópicos e os interesses da newsletter não ficam
-- guardados.
-- ============================================================

-- ============================================================
-- 1. Eventos: como se participa sem bilhete online
-- ============================================================

-- ---------- Eventos ----------
alter table eventos add column if not exists entrada text;

-- ============================================================
-- 2. Newsletter: interesses de cada subscritor
-- ============================================================

alter table subscritores add column if not exists interesses text[] not null default '{}';

-- ============================================================
-- 3. Fórum: tópicos dos membros e denúncias de respostas
-- ============================================================

-- ---------- Tópicos abertos pelos membros ----------
-- Escritos só pelo servidor (/api/forum/novo-topico, com a chave de
-- service role), que confirma a sessão, o estado da conta e se o
-- fórum está aberto. `autor_id` liga o tópico à conta que o abriu:
-- serve o limite de tópicos seguidos e diz à moderação de quem é.
-- Fica vazio nos tópicos da equipa e nos de demonstração.
alter table topicos
  add column if not exists autor_id uuid references auth.users(id) on delete set null;

-- O limite de tópicos seguidos conta os de cada autor na última hora.
create index if not exists idx_topicos_autor on topicos (autor_id, criado_em);

-- ---------- Denúncias de uma resposta ----------
-- `alvo_id` continua a ser o tópico; `resposta_id` diz qual das
-- respostas foi denunciada. Sem chave estrangeira: se a resposta
-- for apagada, a denúncia guarda na mesma a referência.
alter table denuncias
  add column if not exists resposta_id text;

-- ---------- Segurança (RLS) ----------
-- Nada muda: as duas tabelas já têm RLS activo, `topicos` com leitura
-- pública só do que está publicado e `denuncias` sem policy nenhuma
-- (só o service role lá chega). Continua a não haver policies de
-- escrita: a chave anónima nunca escreve.
alter table topicos   enable row level security;
alter table denuncias enable row level security;

-- ============================================================
-- 4. Marketplace: verificação das motas e Termos do Marketplace
-- ============================================================

alter table anuncios add column if not exists moderacao              text    not null default 'aprovado';
alter table anuncios add column if not exists motivo_moderacao       text;
alter table anuncios add column if not exists documentos_verificados boolean not null default false;

alter table anuncios drop constraint if exists anuncios_moderacao_valida;
alter table anuncios add constraint anuncios_moderacao_valida
  check (moderacao in ('pendente', 'aprovado', 'rejeitado'));

create index if not exists idx_anuncios_moderacao on anuncios (moderacao);

create table if not exists verificacoes_anuncios (
  anuncio_id      text primary key references anuncios(id) on delete cascade,
  auth_id         text not null,
  numero_quadro   text not null,
  matricula       text not null default '',
  documentos      jsonb not null default '[]'::jsonb,
  em_nome_proprio boolean not null default false,
  observacoes     text not null default '',
  declaracao_em   timestamptz not null default now(),
  revisto_por     text,
  revisto_em      timestamptz,
  nota_interna    text not null default '',
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- O mesmo quadro em dois anúncios é o primeiro sinal de fraude.
create index if not exists idx_verificacoes_quadro on verificacoes_anuncios (numero_quadro);

drop trigger if exists trg_verificacoes_anuncios_atualizado on verificacoes_anuncios;
create trigger trg_verificacoes_anuncios_atualizado before update on verificacoes_anuncios
  for each row execute function tocar_atualizado_em();

-- RLS ligado e nenhuma policy: o anon e o authenticated não lêem nem escrevem.
alter table verificacoes_anuncios enable row level security;

insert into paginas_legais (slug, titulo, descricao, publicado, atualizado, seccoes) values (
  'termos-marketplace',
  'Termos do Marketplace',
  'Regras para comprar e vender no marketplace da Motobox Angola.',
  true,
  current_date,
  '[
    {"titulo": "1. Âmbito", "corpo": [
      "Estas regras aplicam-se a quem publica ou responde a anúncios no marketplace da Motobox Angola, para além dos Termos e Condições gerais."
    ]},
    {"titulo": "2. O papel da Motobox", "corpo": [
      "A Motobox disponibiliza o espaço onde os anúncios são publicados e revê as motas antes de as publicar. A compra e venda é feita entre comprador e vendedor.",
      "Por agora, a Motobox não recebe nem guarda pagamentos de anúncios: o pagamento é combinado directamente entre as partes."
    ]},
    {"titulo": "3. O que pode anunciar", "corpo": [
      "Motas, peças, equipamento e acessórios que lhe pertençam e que possa vender legalmente.",
      "Indique o preço em kwanzas, o estado real do artigo (novo ou usado) e a província onde se encontra."
    ]},
    {"titulo": "4. Verificação das motas", "corpo": [
      "Antes de uma mota aparecer no marketplace, o vendedor indica o número de quadro, a matrícula (se a tiver) e os documentos que possui. A equipa Motobox revê o anúncio e pode pedir para ver esses documentos.",
      "O número de quadro e os dados dos documentos não são publicados.",
      "A Motobox pode recusar um anúncio sem documentação suficiente ou com sinais de fraude, indicando o motivo ao vendedor.",
      "O selo «Documentação verificada» significa que a equipa viu os documentos indicados. Não substitui a confirmação, pelo comprador, junto das entidades competentes."
    ]},
    {"titulo": "5. O que não é permitido", "corpo": [
      "Anunciar veículos roubados, sem documentação legal ou com o número de quadro alterado.",
      "Anúncios falsos, enganadores ou repetidos, e artigos cuja venda seja ilegal.",
      "Os anúncios que violem estas regras são retirados e a conta pode ser suspensa."
    ]},
    {"titulo": "6. Responsabilidade", "corpo": [
      "O vendedor é responsável pela veracidade do anúncio e pela legalidade da venda.",
      "A Motobox não é parte no contrato de compra e venda e não garante o estado dos artigos anunciados."
    ]},
    {"titulo": "7. Denúncias", "corpo": [
      "Use «Denunciar este anúncio» em qualquer anúncio que lhe pareça suspeito. A equipa revê cada denúncia."
    ]},
    {"titulo": "8. Conselhos para comprar em segurança", "corpo": [
      "Encontre-se num local público e veja a mota antes de pagar.",
      "Confirme que o número de quadro gravado na mota é o mesmo dos documentos e que os documentos estão em nome de quem vende.",
      "Desconfie de preços muito abaixo do mercado e de pedidos de pagamento adiantado."
    ]}
  ]'::jsonb
) on conflict (slug) do nothing;
