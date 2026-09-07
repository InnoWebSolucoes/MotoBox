# Ligar a Motobox ao Supabase

Guia completo, por ordem. Demora cerca de 10 minutos.

---

## 1. Criar o projecto

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard) e criar conta (ou entrar).
2. **New project**:
   - **Name**: `motobox`
   - **Database Password**: gerar uma forte e **guardar num gestor de palavras-passe** — só é
     mostrada uma vez.
   - **Region**: `West EU (London)` ou `Central EU (Frankfurt)` — os mais próximos de Angola
     com boa latência.
3. Esperar ~2 minutos pelo aprovisionamento.

---

## 2. Criar as tabelas

1. No projecto, abrir **SQL Editor** (barra lateral).
2. **New query**.
3. Copiar todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e colar.
4. **Run**.

Deve aparecer `Success. No rows returned`. Isto cria 18 tabelas, índices, triggers e as
políticas de segurança (RLS).

Para confirmar: **Table Editor** → devem estar lá `eventos`, `pilotos`, `equipas`, etc.

---

## 3. Obter as chaves

**Project Settings** (roda dentada) → **API**:

| No painel do Supabase | Variável |
| --- | --- |
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon** / **publishable** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** / **secret** (carregar em *Reveal*) | `SUPABASE_SERVICE_ROLE_KEY` |

> **A chave `service_role` ignora todas as regras de segurança da base de dados.**
> Nunca a colar em código do lado do cliente, nunca a prefixar com `NEXT_PUBLIC_`,
> nunca a enviar por email ou WhatsApp. Se for exposta, revogar imediatamente em
> **Project Settings → API → Rotate**.

---

## 4. Configurar localmente

Criar `.env.local` na raiz do projecto (há um modelo em `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

Reiniciar o servidor de desenvolvimento:

```bash
npm run dev
```

---

## 5. Semear a base de dados

1. Abrir <http://localhost:3000/admin/dados>.
2. O aviso no topo deve dizer **«Ligado ao Supabase»** a verde.
3. Carregar em **Semear base de dados** → **Semear**.

Copia todo o conteúdo de demonstração (eventos, pilotos, equipas, notícias, encomendas,
páginas legais…) para o Postgres. É seguro correr mais do que uma vez — usa `upsert`,
não duplica registos.

---

## 6. Configurar na Vercel

**Project Settings → Environment Variables**, para *Production*, *Preview* e *Development*:

| Nome | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | o mesmo do `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | o mesmo do `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | o mesmo do `.env.local` |

Ou pela linha de comandos:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel deploy --prod
```

---

## Como funciona

```
Navegador (painel /admin)
        │  fetch
        ▼
/api/admin/[coleccao]        ← a chave service_role vive AQUI, no servidor
        │  supabase-js
        ▼
   Postgres (Supabase)
        ▲
        │  chave anónima, sujeita a RLS, só lê `publicado = true`
        │
Páginas públicas (ISR, revalidam a cada 60 s)
```

- **Escrita**: o painel nunca fala directamente com o Supabase. Passa sempre por
  `/api/admin`, que corre no servidor e é o único sítio onde a chave de service role existe.
  `lib/supabase/server.ts` importa `server-only`: se algum dia for importado por um
  componente de cliente, a compilação falha em vez de vazar a chave.
- **Leitura pública**: usa a chave anónima com RLS activo. As políticas só permitem ler
  linhas com `publicado = true`. As tabelas com dados pessoais — `utilizadores`,
  `encomendas`, `mensagens`, `denuncias`, `subscritores`, `atividade` — **não têm
  qualquer política**, pelo que são invisíveis à chave anónima.
- **Sem base de dados configurada**: o painel continua a funcionar em modo local
  (localStorage) e o site público mostra o conteúdo de `lib/data.ts`. Nada rebenta.
- **Revalidação**: ao guardar no painel, os caminhos públicos afectados são revalidados
  de imediato; caso contrário actualizam-se ao fim de 60 segundos.

---

## Em falta: autenticação

**`/admin` e `/api/admin` continuam sem autenticação.** Qualquer pessoa com o endereço
pode abrir o painel e escrever na base de dados.

Antes de pôr isto em produção com dados reais, é preciso:

1. Activar **Supabase Auth** e criar as contas da equipa.
2. Proteger `/admin` com middleware que verifique a sessão.
3. Verificar a sessão e o papel dentro de `app/api/admin/[coleccao]/route.ts`
   (há um `TODO(auth)` no topo do ficheiro).

Até lá, manter o endereço privado.
