-- ============================================================
-- MOTOBOX — Autenticação
-- Executar no SQL Editor depois de schema.sql.
--
-- Liga as contas do Supabase Auth à tabela `utilizadores`, que
-- guarda o papel e o perfil. Quem se regista no site fica como
-- "leitor"; os papéis de equipa são atribuídos no painel.
-- ============================================================

-- ---------- Ligação à conta de autenticação ----------

alter table utilizadores
  add column if not exists auth_id uuid unique references auth.users(id) on delete set null;

create index if not exists idx_utilizadores_auth on utilizadores (auth_id);
create index if not exists idx_utilizadores_email on utilizadores (lower(email));

-- ---------- Criação automática de perfil ----------
-- Sempre que alguém se regista, fica com um registo em
-- `utilizadores`. Se o email já existir (conta criada pela
-- equipa no painel), apenas se liga o auth_id.

create or replace function tratar_novo_utilizador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existente utilizadores%rowtype;
begin
  select * into existente
  from utilizadores
  where lower(email) = lower(new.email)
  limit 1;

  if found then
    update utilizadores
       set auth_id    = new.id,
           verificado = (new.email_confirmed_at is not null)
     where id = existente.id;
  else
    insert into utilizadores (
      id, nome, email, papel, estado, avatar_cor,
      registado, verificado, newsletter, auth_id
    ) values (
      'u-' || substr(replace(new.id::text, '-', ''), 1, 10),
      coalesce(new.raw_user_meta_data->>'nome',
               new.raw_user_meta_data->>'full_name',
               split_part(new.email, '@', 1)),
      new.email,
      'leitor',
      case when new.email_confirmed_at is not null then 'ativo' else 'pendente' end,
      '#e10600',
      current_date,
      new.email_confirmed_at is not null,
      coalesce((new.raw_user_meta_data->>'newsletter')::boolean, false),
      new.id
    );
  end if;

  return new;
end $$;

drop trigger if exists trg_novo_utilizador on auth.users;
create trigger trg_novo_utilizador
  after insert on auth.users
  for each row execute function tratar_novo_utilizador();

-- ---------- Confirmação de email ----------
-- Quando o utilizador confirma o email, a conta passa a activa.

create or replace function tratar_email_confirmado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update utilizadores
       set verificado = true,
           estado = case when estado = 'pendente' then 'ativo' else estado end
     where auth_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_email_confirmado on auth.users;
create trigger trg_email_confirmado
  after update on auth.users
  for each row execute function tratar_email_confirmado();

-- ---------- Funções auxiliares ----------

/** Papel do utilizador com sessão iniciada. */
create or replace function papel_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel from utilizadores where auth_id = auth.uid() limit 1;
$$;

/** Verdadeiro se o utilizador pertence à equipa de gestão. */
create or replace function e_equipa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from utilizadores
    where auth_id = auth.uid()
      and papel in ('admin','editor','moderador','financeiro','leitor')
      and estado not in ('suspenso','banido')
  );
$$;

-- ---------- Políticas de acesso ----------
-- Cada pessoa vê e edita apenas o seu próprio perfil.
-- A equipa de gestão continua a operar pelo service role, no
-- servidor, que ignora RLS.

drop policy if exists ler_proprio_perfil     on utilizadores;
drop policy if exists editar_proprio_perfil  on utilizadores;

create policy ler_proprio_perfil on utilizadores
  for select using (auth_id = auth.uid());

create policy editar_proprio_perfil on utilizadores
  for update using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- Encomendas: cada comprador vê as suas, por email.
drop policy if exists ler_proprias_encomendas on encomendas;
create policy ler_proprias_encomendas on encomendas
  for select using (
    lower(comprador->>'email') = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- ---------- Nota sobre papéis ----------
-- O primeiro administrador tem de ser promovido à mão. Depois de
-- se registar no site, correr (com o email correspondente):
--
--   update utilizadores
--      set papel = 'admin', estado = 'ativo', verificado = true
--    where lower(email) = lower('o-seu-email@exemplo.com');
