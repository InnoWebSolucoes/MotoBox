import Link from "next/link";
import { Logo } from "./Brand";
import { Icon } from "./ui";
import { Newsletter } from "./Newsletter";
import { SOCIAIS, TEMPORADA } from "@/lib/data";

const COLUNAS: { titulo: string; links: { href: string; label: string }[] }[] = [
  {
    titulo: "Competição",
    links: [
      { href: "/calendario", label: "Calendário" },
      { href: "/resultados", label: "Resultados" },
      { href: "/classificacao", label: "Classificação" },
      { href: "/pilotos", label: "Pilotos" },
      { href: "/equipas", label: "Equipas e clubes" },
    ],
  },
  {
    titulo: "Conteúdo",
    links: [
      { href: "/noticias", label: "Notícias" },
      { href: "/noticias?cat=Internacional", label: "Internacional" },
      { href: "/videos", label: "Vídeos" },
      { href: "/forum", label: "Fórum" },
    ],
  },
  {
    titulo: "Serviços",
    links: [
      { href: "/bilhetes", label: "Bilhetes" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/conta", label: "A minha conta" },
      { href: "/patrocinadores", label: "Patrocinadores" },
    ],
  },
  {
    titulo: "Motobox",
    links: [
      { href: "/sobre", label: "Sobre nós" },
      { href: "/contacto", label: "Contacto" },
      { href: "/sobre#equipa", label: "Equipa" },
      { href: "/contacto#parcerias", label: "Parcerias" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-ink-800 bg-ink-950">
      {/* Faixa newsletter */}
      <div className="border-b border-ink-800 bg-ink-900">
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
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2.6fr]">
          <div>
            <Logo height={32} className="text-white" />
            <p className="mt-5 max-w-xs text-sm text-ink-500 leading-relaxed">
              A casa digital do motociclismo angolano. Um projecto sem fins lucrativos dedicado à
              comunidade motard de Angola, desde 2019.
            </p>
            <div className="mt-6 flex gap-2">
              {([
                ["instagram", SOCIAIS.instagram, "Instagram"],
                ["facebook", SOCIAIS.facebook, "Facebook"],
                ["youtube", SOCIAIS.youtube, "YouTube"],
                ["whatsapp", SOCIAIS.whatsapp, "WhatsApp"],
              ] as const).map(([icone, url, label]) => (
                <a
                  key={icone}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center border border-ink-700 text-ink-400 transition-colors hover:border-mb-red hover:text-white"
                >
                  <Icon name={icone} className="size-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUNAS.map((c) => (
              <div key={c.titulo}>
                <h3 className="eyebrow text-white">{c.titulo}</h3>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-ink-500 transition-colors hover:text-mb-red"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-ink-800 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-600">
            © {TEMPORADA} Motobox Angola. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-600">
            <Link href="/contacto" className="hover:text-ink-300">Termos de utilização</Link>
            <Link href="/contacto" className="hover:text-ink-300">Política de privacidade</Link>
            <Link href="/contacto" className="hover:text-ink-300">Cookies</Link>
            <span className="text-ink-700">Luanda, Angola</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
