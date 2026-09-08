# Motobox Angola

A casa digital do motociclismo angolano. Plataforma desenvolvida pela **Innoweb** para a **Motobox
Angola**, correspondente ao **Plano Completo** da proposta de serviços.

Linguagem visual inspirada no site oficial da Formula 1: fundo escuro, vermelho de marca como acento
único, tipografia condensada em caixa alta, cartões de alto contraste e densidade de informação
elevada.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (design tokens em `app/globals.css`)
- **qrcode** para os bilhetes digitais
- Build totalmente estático (SSG) — 60+ páginas pré-renderizadas

## Arrancar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run start    # servir o build
```

## Funcionalidades implementadas

Todas as funcionalidades do Plano Completo da proposta:

### Base (Plano Essencial)

| Funcionalidade | Onde |
| --- | --- |
| Website informativo com página inicial | `/` |
| Página "Sobre a Motobox" (história, missão, equipa) | `/sobre` |
| Formulário de contacto e pedido de informações | `/contacto` |
| Links para redes sociais (Instagram, Facebook) | rodapé, menu móvel, `/contacto` |
| Sistema de newsletter com subscrição por email | componente `Newsletter` (3 variantes) |
| Calendário estático de eventos e provas | `/calendario` |
| Design responsivo (telemóvel, tablet, computador) | todo o site |

### Comunidade (Plano Comunidade)

| Funcionalidade | Onde |
| --- | --- |
| Calendário dinâmico com detalhes completos | `/calendario/[slug]` — horários, circuito, recorde de volta |
| Notícias internacionais (agregação automática) | `/noticias` — categoria Internacional, com atribuição de fonte |
| Notícias e cobertura de Angola | `/noticias` — categorias Angola, Entrevista, Comunidade, Solidária |
| Arquivo de resultados e histórico de corridas | `/resultados`, `/resultados/[slug]` |
| Tabela de classificação nacional | `/classificacao` — pilotos e equipas, filtro por categoria |
| Perfis de pilotos (fotos, estatísticas, redes) | `/pilotos`, `/pilotos/[slug]` |
| Perfis de equipas e clubes | `/equipas`, `/equipas/[slug]` |
| Página de patrocinadores | `/patrocinadores` — 4 níveis + proposta comercial |
| Secção de vídeos e highlights | `/videos` — leitor em destaque + grelha filtrável |

### Completo (Plano Completo)

| Funcionalidade | Onde |
| --- | --- |
| Venda de bilhetes online com pagamento integrado | `/bilhetes/[slug]` — checkout de 4 passos |
| Bilhetes digitais com código QR | gerados no cliente (`components/QRCode.tsx`) |
| Verificação automática de pagamentos | passo 3 do checkout, com estado de verificação |
| Sistema de comissões para a Motobox | `TAXA_MOTOBOX` no checkout, discriminada no resumo |
| Marketplace verificado | `/marketplace`, `/marketplace/[id]` |
| Contas de utilizador com preferências | `/conta` — 5 separadores |
| Notificações personalizadas | `/conta` → Notificações (tipo + canal) |
| Fórum comunitário | `/forum`, `/forum/[id]` |

## Estrutura

```
app/
  page.tsx                  Homepage — hero com contagem decrescente, notícias,
                            classificação, próximas provas, vídeos
  calendario/               Lista (filtros, vista lista/grelha) + detalhe do evento
  bilhetes/                 Listagem + checkout com QR
  resultados/               Arquivo + detalhe de corrida
  classificacao/            Pilotos e equipas
  pilotos/ equipas/         Perfis
  noticias/ videos/         Conteúdo editorial
  marketplace/ forum/       Comunidade
  conta/                    Área de utilizador
  sobre/ patrocinadores/ contacto/
components/
  Nav.tsx                   Navegação com dropdowns e menu móvel
  Footer.tsx                Rodapé + newsletter
  Brand.tsx                 Logótipo SVG, imagens de marcador, retratos
  ui.tsx                    Botões, etiquetas, cabeçalhos, biblioteca de ícones
  Countdown.tsx             Contagem decrescente para a próxima prova
  Newsletter.tsx            Subscrição (faixa / cartão / rodapé)
  QRCode.tsx                Código QR do bilhete
lib/
  types.ts                  Modelo de dados
  data.ts                   Conteúdo de demonstração + helpers
```

## Conteúdo

O conteúdo (pilotos, equipas, provas, notícias, anúncios) é de **demonstração**, escrito para
representar de forma realista o motociclismo angolano — circuitos do Kilamba, Tundavala, Caála,
dunas do Namibe; províncias, clubes e valores em kwanzas. Vive todo em `lib/data.ts`, pronto a ser
substituído pelos dados reais da Motobox ou ligado a um CMS.

As fotografias são de demonstração: cada chave de imagem usada em `lib/data.ts` está mapeada em
`lib/imagens.ts` para uma fotografia livre do Unsplash, servida por `next/image` (domínio
autorizado em `next.config.ts`). O gradiente determinístico por nome mantém-se por baixo, como
reserva para qualquer chave sem fotografia.

Para passar ao arquivo real da Motobox basta trocar os URLs em `lib/imagens.ts` — as chaves e a
assinatura de `Placeholder` / `Retrato` não mudam, pelo que nenhuma página precisa de ser tocada.
Os logótipos de equipas e patrocinadores continuam a ser monogramas de texto, por opção de design.

## Próximos passos para produção

1. **Fotografias** — trocar os URLs de demonstração em `lib/imagens.ts` pelo arquivo do Gonçalo.
2. **Backend** — ligar `lib/data.ts` a um CMS (Sanity, Payload) ou API própria.
3. **Pagamentos** — integrar Multicaixa Express / EMIS e um gateway de cartão no passo 3 do checkout.
4. **Autenticação** — contas reais em `/conta` (NextAuth ou equivalente).
5. **Agregação de notícias** — cron que consome feeds RSS internacionais para a secção Internacional.
6. **Validação de bilhetes** — aplicação de leitura de QR para o staff à entrada dos recintos.

---

Innoweb, Comércio e Prestação de Serviços, Lda. · Luanda, Angola
