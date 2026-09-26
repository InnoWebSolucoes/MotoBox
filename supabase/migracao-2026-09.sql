-- ============================================================
-- MOTOBOX — Migração de Setembro de 2026
-- Correr UMA vez no Supabase: SQL Editor → New query → colar → Run.
-- É seguro correr de novo: cada instrução só acrescenta o que falta.
--
-- Traz:
--   · LinkedIn e Google Business nas redes sociais das definições
--   · interruptor da newsletter semanal automática
--   · data de envio da resposta às mensagens de contacto
--   · pasta pública para os logótipos/fotografias das contas
-- ============================================================

-- ---------- Definições ----------
alter table definicoes add column if not exists linkedin              text    not null default '';
alter table definicoes add column if not exists google_business       text    not null default '';
alter table definicoes add column if not exists newsletter_automatica boolean not null default true;

-- ---------- Mensagens de contacto ----------
-- Preenchida quando a resposta segue por email para quem escreveu.
alter table mensagens add column if not exists respondida_em timestamptz;

-- ---------- Logótipos das contas ----------
-- Pasta pública: qualquer pessoa vê a imagem, só o servidor escreve
-- (com a chave de service role, que ignora estas regras).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
