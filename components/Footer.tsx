import Link from "next/link";
import { Logo } from "./Brand";
import { Icon } from "./ui";
import { Newsletter } from "./Newsletter";
import { T } from "./T";
import { TEMPORADA } from "@/lib/data";
import { lerRedes } from "@/lib/redes";

/**
 * As colunas seguem o menu (Motobox · Desporto · Comunidade · Notícias · Serviços).
 * `chave` passa pelo dicionário; `nome` é um nome próprio que não se traduz.
 */
const COLUNAS: { titulo: string; links: { href: string; chave?: string; nome?: string }[] }[] = [
  {
    titulo: "marca.motobox",
    links: [
      { href: "/sobre", chave: "menu.sobreNos" },
      { href: "/seguranca", chave: "nav.seguranca" },
      { href: "/patrocinadores", chave: "nav.patrocinadores" },
      { href: "/contacto", chave: "nav.contacto" },
      { href: "/contacto#parcerias", chave: "menu.parcerias" },
    ],
  },
  {
    titulo: "nav.desporto",
    links: [
      { href: "/desporto", chave: "menu.todosDesportos" },
      { href: "/desporto/motocross", nome: "Motocross" },
      { href: "/calendario", chave: "nav.calendario" },
      { href: "/resultados", chave: "nav.resultados" },
      { href: "/classificacao", chave: "nav.classificacao" },
      { href: "/pilotos", chave: "nav.pilotos" },
      { href: "/equipas", chave: "nav.equipas" },
    ],
  },
  {
    titulo: "nav.comunidade",
    links: [
      { href: "/eventos", chave: "nav.eventos" },
      { href: "/clubes", chave: "nav.clubes" },
      { href: "/clubes?tipo=lady-riders", chave: "menu.ladyRiders" },
      { href: "/clubes/rotas", chave: "menu.rotas" },
      { href: "/forum", chave: "nav.forum" },
    ],
  },
  {
    titulo: "nav.noticias",
    links: [
      { href: "/noticias", chave: "menu.todasNoticias" },
      { href: "/noticias?cat=Internacional", chave: "menu.internacional" },
      { href: "/noticias/arquivo", chave: "menu.arquivoNoticias" },
      { href: "/videos", chave: "nav.videos" },
    ],
  },
  {
    titulo: "nav.servicos",
    links: [
      { href: "/bilhetes", chave: "nav.bilhetes" },
      { href: "/marketplace", chave: "nav.marketplace" },
      { href: "/marketplace/importar", chave: "menu.importar" },
      { href: "/conta", chave: "menu.minhaConta" },
    ],
  },
];

export async function Footer() {
  const redes = await lerRedes();
  return (
    <footer className="mt-auto bg-ink-950">
      {/* Faixa newsletter */}
      <div className="stripes bg-ink-900">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 py-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow text-mb-red">Newsletter</p>
            <h2 className="title-xl mt-2 text-2xl sm:text-3xl">Fique a par de tudo</h2>
            <p className="mt-2 text-sm text-ink-500">
              Calendário, resultados e bilhetes no seu email.
            </p>
          </div>
          <div className="relative">
            <Newsletter variante="rodape" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_3fr]">
          <div>
            <Logo height={32} className="text-white" />
            <p className="mt-5 max-w-xs text-sm text-ink-500 leading-relaxed">
              A casa digital do motociclismo angolano. Um projecto sem fins lucrativos dedicado à
              comunidade motard de Angola, desde 2019.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {redes.map(({ rede: icone, url, nome: label }) => (
                <a
                  key={icone}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full bg-ink-800 text-ink-300 transition-colors hover:bg-mb-red hover:text-white"
                >
                  <Icon name={icone} className="size-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
            {COLUNAS.map((c) => (
              <div key={c.titulo}>
                <h3 className="font-ui text-base text-white"><T k={c.titulo} /></h3>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-ink-400 transition-colors hover:text-white"
                      >
                        {l.nome ?? <T k={l.chave ?? ""} />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/6 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-600">
            © {TEMPORADA} Motobox Angola. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-600">
            <Link href="/termos" className="hover:text-ink-300">Termos e condições</Link>
            <Link href="/privacidade" className="hover:text-ink-300">Política de privacidade</Link>
            <Link href="/cookies" className="hover:text-ink-300">Cookies</Link>
            <Link href="/regulamento" className="hover:text-ink-300">Regulamento</Link>
            <Link href="/termos-marketplace" className="hover:text-ink-300">Termos do Marketplace</Link>
            <span className="text-ink-700">Luanda, Angola</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
