# Configurar o envio de email

> ## Estado actual — leia primeiro
>
> **O registo de contas não funciona para ninguém além de `motoboxweb@gmail.com`.**
>
> Diagnóstico feito a 8 de Setembro de 2026:
>
> | Verificação | Resultado |
> | --- | --- |
> | Limite de 3 emails/hora do Supabase | Já reposto, deixou de ser o problema |
> | Supabase regista o envio | Sim — `confirmation_sent_at` fica preenchido |
> | O email chega ao Gmail | **Não** — o servidor incluído no Supabase não é fiável |
> | Resend com a chave actual | **Só entrega a `motoboxweb@gmail.com`** (erro 403 para os restantes) |
>
> A causa é uma só: **não há domínio verificado no Resend**. Sem isso, nenhum
> serviço de email aceita entregar a terceiros — é assim que se trava o spam.
>
> **Só há duas saídas, e ambas dependem de uma decisão sua:**
>
> **A · Desligar a confirmação de email (imediato, 30 segundos)**
> Supabase → Authentication → Sign In / Providers → Email → desactivar
> *Confirm email*. Os registos passam a funcionar de imediato, sem envio nenhum.
> Serve para desenvolver e demonstrar. **Tem de ser revertido antes do
> lançamento**, senão qualquer pessoa se regista com o email de outra.
>
> **B · Verificar um domínio (definitivo, depende do DNS)**
> Requer um domínio com acesso aos registos DNS. `motobox.ao` não está
> registado — ou se regista, ou se usa um domínio da Innoweb entretanto.
> O procedimento está nas secções abaixo.

O serviço de email que vem com o Supabase envia **3 mensagens por hora, no
projecto inteiro**. Serve para experimentar; não serve para produção. Foi por isso
que os emails de confirmação deixaram de chegar — a quota esgotou-se.

Este guia liga um serviço a sério. Demora cerca de 20 minutos, mais o tempo de
propagação do DNS.

---

## Decisão prévia: que domínio usar para enviar

O endereço de origem determina se o email chega à caixa de entrada ou ao spam.

**`motobox.ao` ainda não está registado** (confirmado por consulta de DNS). Há
duas alternativas:

| Opção | Endereço de origem | Quando faz sentido |
| --- | --- | --- |
| **A. Registar `motobox.ao`** | `nao-responder@motobox.ao` | É o correcto para a marca. O domínio `.ao` regista-se junto de um agente credenciado em Angola. |
| **B. Usar um domínio já detido pela Innoweb** | `motobox@innoweb.ao` | Desbloqueia hoje, sem esperar pelo registo. Muda-se mais tarde. |

Sem domínio verificado o Resend só permite enviar para o email da própria conta,
o que chega para testar mas não para o público.

---

## 1. Criar conta no Resend

1. [resend.com](https://resend.com) → criar conta (o plano gratuito dá 3 000
   emails por mês, mais do que suficiente no arranque).
2. **Domains** → **Add Domain** → introduzir o domínio escolhido acima.
3. O Resend mostra três registos DNS. Acrescentá-los no painel do domínio:

   | Tipo | Nome | Finalidade |
   | --- | --- | --- |
   | `TXT` | `resend._domainkey` | DKIM — assina as mensagens |
   | `MX` | `send` | Devoluções |
   | `TXT` | `send` | SPF — autoriza o envio |

4. Esperar pela verificação (minutos a algumas horas, conforme o registador).

---

## 2. Credenciais SMTP

> **Estado actual:** a chave já existe e foi validada — envio confirmado a
> funcionar. Está guardada em `.env.local` e nas variáveis da Vercel como
> `RESEND_API_KEY`. A conta Resend está registada em `motoboxweb@gmail.com`.
>
> **Falta apenas verificar um domínio.** Enquanto isso não acontecer, o Resend
> só entrega mensagens para `motoboxweb@gmail.com`; qualquer outro destinatário
> é recusado com erro 403.

Os valores para o Supabase são estes:

```
Host:      smtp.resend.com
Port:      465
Username:  resend
Password:  <a API key criada agora>
```

---

## 3. Ligar ao Supabase

**Project Settings → Authentication → SMTP Settings** → activar
*Enable Custom SMTP* e preencher:

| Campo | Valor |
| --- | --- |
| Sender email | `nao-responder@motobox.ao` *(ou o domínio escolhido)* |
| Sender name | `Motobox Angola` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | a API key do Resend |

Guardar. A partir daqui o limite passa a ser o do Resend, não o do Supabase.

---

## 4. Confirmar os endereços de retorno

**Authentication → URL Configuration**:

- **Site URL**: `https://moto-box-wc4x.vercel.app`
- **Redirect URLs**:
  ```
  https://moto-box-wc4x.vercel.app/**
  http://localhost:3000/**
  ```

O *Site URL* é o que entra dentro dos emails. Se ficar em `localhost`, todas as
ligações enviadas apontam para a máquina de quem programou, e mais ninguém as
consegue abrir.

---

## 5. Traduzir os emails

Os modelos que o Supabase envia estão em inglês. Em
**Authentication → Email Templates**, o texto de *Confirm signup* pode passar a:

```html
<h2>Confirme a sua conta Motobox</h2>
<p>Obrigado por se juntar à comunidade do motociclismo angolano.</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar o meu email</a></p>
<p>Se não foi você que criou esta conta, ignore esta mensagem.</p>
<p>— Motobox Angola</p>
```

Vale a pena fazer o mesmo a *Reset password* e *Magic Link*.

---

## Enquanto isto não está feito

Para continuar a trabalhar sem esperar pelo DNS, há duas saídas imediatas:

**Confirmar contas à mão** — Authentication → Users → menu `⋮` da linha →
*Confirm email*.

**Desligar a confirmação** — Authentication → Sign In / Providers → Email →
desactivar *Confirm email*. Os registos passam a funcionar de imediato, sem
qualquer envio.

> A segunda opção **tem de ser revertida antes do lançamento**: sem confirmação,
> qualquer pessoa pode registar-se com o email de outra.

---

## Verificar que ficou a funcionar

1. Registar uma conta nova em `/entrar`.
2. O email deve chegar em segundos, vindo do domínio configurado.
3. No Resend, **Logs** mostra cada mensagem enviada e o respectivo estado.

Se cair no spam, falta quase sempre a verificação do domínio — confirmar no
Resend que os três registos DNS aparecem a verde.
