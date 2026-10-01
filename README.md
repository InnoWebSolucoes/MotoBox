# MotoBox Angola

A casa de quem anda de mota em Angola. Um site de comunidade: a secção principal são os **artigos**,
e à volta deles ficam os **clubes** de todo o país, os **eventos**, as **rotas** de moto-turismo, o
guia de **segurança**, o **marketplace** e o **fórum**. Todos os tipos de mota, da scooter à moto de
viagem; a competição é só um tipo de evento, não o centro do site.

Plataforma desenvolvida pela **Innoweb** para a **MotoBox Angola**.

## Design

Painel de comando, inspirado em [363sudbury.com](https://363sudbury.com/), com a identidade da
MotoBox (logótipo MB, vermelho `#e10600` sobre preto):

- **Vídeo de fundo** (`components/painel/Fundo.tsx`), nítido na entrada e desfocado no resto do site.
- **Moldura** com margens de 20/50px e **painéis** escuros translúcidos, cantos de 6px e 5px de intervalo.
- **Quadrado do logótipo** no canto superior esquerdo; os painéis grandes têm o corte à volta dele.
- **Quadrados de ícone vermelhos** e a seta ↗ que troca de lugar ao passar o rato.
- **Botão de acção** único por baixo da moldura: Explorar (entrada), Fechar (painel), Voltar ao painel
  (todas as outras páginas). No telemóvel é uma barra vermelha fixa.
- Nas páginas interiores o conteúdo **rola dentro do painel** no computador.
- Letra **Instrument Sans**; a Barlow Condensed fica só no painel de gestão.

Tokens e componentes visuais em `app/globals.css`; peças em `components/painel/`.

## Páginas

| Rota | O que é |
| --- | --- |
| `/` | Entrada: vídeo, a frase da casa, o tempo em Luanda e o artigo mais recente |
| `/explorar` | Painel: artigo em destaque, clubes, eventos, história, clube do mês, rotas, segurança, marketplace, fórum |
| `/artigos`, `/artigos/[slug]` | Secção principal, com filtro por categoria |
| `/clubes`, `/clubes/[slug]` | Todos os clubes, filtros por tipo e província, formulário "Junte o seu clube" |
| `/eventos`, `/eventos/[slug]` | Passeios, raides, encontros, concentrações, solidárias, formações, provas; ficheiro .ics |
| `/rotas`, `/rotas/[slug]` | Moto-turismo, com fontes |
| `/seguranca` | Guia com fontes |
| `/marketplace`, `/marketplace/[id]`, `/marketplace/importar` | Compra e venda e pedidos de importação |
| `/forum`, `/forum/[id]` | Fórum |
| `/sobre`, `/contacto` | A história da MotoBox e contacto |
| `/entrar`, `/conta` | Sessão e área de conta (clubes e marcas seguidos, notificações, anúncios) |
| `/admin` | Painel de gestão |

Os endereços antigos (`/noticias`, `/calendario`, `/bilhetes`, `/pilotos`...) redireccionam para a
secção nova mais próxima (`next.config.ts`).

## Conteúdo

- **Clubes, rotas e segurança**: factos com fonte pública (campo `fonte` nos clubes, `lib/rotas.ts`,
  `app/seguranca/conteudo.ts`).
- **Artigos**: escritos a partir desses factos, assinados pela Redacção MotoBox.
- **Demonstração**: os eventos futuros, os anúncios do marketplace e os tópicos do fórum.
- **Fotografias** do Unsplash (`lib/imagens.ts`) e **vídeo de fundo** do Mixkit (licença livre), em
  `public/videos/`. Trocar pelo arquivo da MotoBox quando existir.
- **Marca**: `public/marca/` (ícone MB, logótipo e o MB recortado).

Com o Supabase ligado, o site lê as tabelas e o conteúdo acima é só a reserva. Para levar este
conteúdo para uma base nova: correr os SQL de `supabase/` e, no painel, **Dados → Semear**.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:3000/motobox
npm run build
```

O site corre com `basePath: "/motobox"` (ver `lib/base.ts`). Variáveis de ambiente em `.env.example`
e `SUPABASE.md`.

---

Innoweb, Comércio e Prestação de Serviços, Lda. · Luanda, Angola
