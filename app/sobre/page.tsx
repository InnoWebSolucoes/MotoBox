import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { Newsletter } from "@/components/Newsletter";
import { ButtonLink, Icon, PageHero } from "@/components/ui";
import { SOCIAIS, equipas, eventos, pilotos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sobre a Motobox",
  description:
    "A história, a missão e a equipa da Motobox Angola — a casa digital do motociclismo angolano, um projecto sem fins lucrativos nascido em 2019.",
};

const EQUIPA = [
  {
    nome: "Sofia Mussungo",
    papel: "Fundadora e directora",
    iniciais: "SM",
    cor: "#e10600",
    bio: "Criou a Motobox em 2019 com a ideia de uma revista digital sobre o mundo motard angolano. Continua a ser quem responde às mensagens, quem escreve a maior parte dos textos e quem está em cada prova do calendário.",
  },
  {
    nome: "Gonçalo Pinto",
    papel: "Fotografia e vídeo",
    iniciais: "GP",
    cor: "#0ea5e9",
    bio: "O olhar da Motobox. Está em todas as provas, cobre passeios e concentrações, e é responsável pelo arquivo fotográfico que hoje conta a história do motociclismo angolano dos últimos anos.",
  },
  {
    nome: "Comunidade Motobox",
    papel: "Colaboradores",
    iniciais: "CM",
    cor: "#f59e0b",
    bio: "Pilotos, mecânicos, dirigentes de clube e motards que enviam resultados, fotografias e histórias. Sem eles, metade do que está neste site não existia.",
  },
];

const VALORES = [
  {
    icone: "flag",
    titulo: "Referência nacional",
    texto:
      "Ser a fonte onde qualquer pessoa encontra quem ganhou a última corrida, quem lidera o campeonato e quando é a próxima prova.",
  },
  {
    icone: "heart",
    titulo: "Comunidade primeiro",
    texto:
      "A Motobox nasceu de dentro da comunidade motard e é para ela que trabalha. Sem fins lucrativos, sem agenda própria.",
  },
  {
    icone: "shield",
    titulo: "Memória do motociclismo",
    texto:
      "Recuperar e guardar o que se tem perdido — entrevistas, resultados, fotografias, histórias de quem correu antes.",
  },
  {
    icone: "trending",
    titulo: "Crescer com o desporto",
    texto:
      "Dar visibilidade aos pilotos e clubes para atrair patrocínios, público e condições que o motociclismo angolano merece.",
  },
];

const MARCOS = [
  {
    ano: "2019",
    titulo: "O início",
    texto:
      "A Motobox nasce como projecto de revista digital dedicada ao mundo motard angolano. As primeiras publicações saem no Instagram.",
  },
  {
    ano: "2020",
    titulo: "Uma perda difícil",
    texto:
      "O designer que dava forma à revista falece num acidente. O projecto da revista impressa fica pelo caminho, mas o trabalho de cobertura continua.",
  },
  {
    ano: "2021",
    titulo: "Cobertura de provas",
    texto:
      "A Motobox começa a estar presente em todas as provas do calendário nacional, com fotografia e cobertura das corridas.",
  },
  {
    ano: "2023",
    titulo: "Acções solidárias",
    texto:
      "Nasce o Passeio Solidário, que junta clubes de várias províncias para entregar material escolar e brinquedos.",
  },
  {
    ano: "2026",
    titulo: "A plataforma",
    texto:
      "A Motobox lança o seu site: calendário, resultados, classificações, bilhética, marketplace e fórum, numa só plataforma.",
  },
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Quem somos"
        titulo="A casa do motociclismo angolano"
        descricao="A Motobox nasceu de uma constatação simples: não havia, em Angola, um sítio onde se encontrasse informação sobre o mundo das motas. Resolvemos ser esse sítio."
      />

      {/* Manifesto */}
      <section className="border-b border-ink-800">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="eyebrow accent-bar text-white">A nossa história</h2>
            <div className="space-y-4 text-base text-ink-300 leading-relaxed">
              <p>
                A Motobox começou em 2019 como uma ideia de revista digital. A Sofia Mussungo, motard
                e fundadora do projecto, queria juntar num só lugar o que andava disperso: as corridas
                de motocross, os passeios, as concentrações, as histórias das pessoas que fazem o
                mundo motard angolano.
              </p>
              <p>
                A revista nunca chegou a sair como estava pensada. O designer que a desenhava faleceu
                num acidente e o projecto ficou suspenso. Mas o trabalho não parou — mudou de forma.
                Passou a viver no Instagram e no Facebook, com cobertura fotográfica das provas,
                entrevistas a pilotos e divulgação de tudo o que acontecia.
              </p>
              <p>
                Sete anos depois, a Motobox é a referência informal do motociclismo em Angola. O
                problema é que <span className="text-white">informal</span> significa que muita coisa
                se perde: resultados que ninguém arquiva, entrevistas que desaparecem no feed, pessoas
                que ligam para o número pessoal da Sofia a perguntar quando é a próxima prova.
              </p>
              <p>
                Este site existe para resolver isso. É a casa fixa de tudo o que a Motobox faz — e a
                base para o que ainda falta fazer.
              </p>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden border border-ink-700">
            <Placeholder nome="kilamba" className="absolute inset-0" />
            <div className="absolute inset-0 grid place-items-center">
              <p className="max-w-xs px-6 text-center font-display text-xl uppercase leading-tight text-white">
                “Queria que houvesse um sítio onde tudo isto estivesse.
                <span className="mt-3 block text-mb-red">Como não havia, fizemos.”</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="border-b border-ink-800 bg-ink-900">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-ink-800 px-4 sm:grid-cols-4 sm:px-6">
          {[
            [eventos.length, "Provas no calendário"],
            [pilotos.length, "Pilotos registados"],
            [equipas.length, "Equipas e clubes"],
            ["7", "Anos de cobertura"],
          ].map(([v, l]) => (
            <div key={l as string} className="px-4 py-8 text-center">
              <p className="font-display text-4xl text-white">{v}</p>
              <p className="eyebrow mt-2 text-ink-500">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Missão */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <h2 className="title-xl text-3xl sm:text-4xl">A nossa missão</h2>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALORES.map((v) => (
            <div key={v.titulo} className="card p-6">
              <span className="grid size-11 place-items-center bg-mb-red/10 text-mb-red">
                <Icon name={v.icone} className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg uppercase leading-tight text-white">
                {v.titulo}
              </h3>
              <p className="mt-2.5 text-sm text-ink-500 leading-relaxed">{v.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cronologia */}
      <section className="border-y border-ink-800 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <h2 className="title-xl text-3xl sm:text-4xl">O percurso</h2>
          <ol className="mt-10 relative border-l border-ink-700 pl-8 space-y-9">
            {MARCOS.map((m) => (
              <li key={m.ano} className="relative">
                <span
                  className="absolute -left-[2.3rem] top-1 grid size-4 place-items-center rounded-full border-2 border-ink-900 bg-mb-red"
                  aria-hidden
                />
                <p className="font-display text-2xl text-mb-red">{m.ano}</p>
                <h3 className="mt-1 font-display text-lg uppercase text-white">{m.titulo}</h3>
                <p className="mt-2 max-w-2xl text-sm text-ink-400 leading-relaxed">{m.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Equipa */}
      <section id="equipa" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 scroll-mt-20">
        <h2 className="title-xl text-3xl sm:text-4xl">A equipa</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink-400">
          A Motobox é um projecto pequeno, feito por poucas pessoas e por uma comunidade que colabora.
        </p>
        <div className="mt-9 grid gap-5 sm:grid-cols-3">
          {EQUIPA.map((p) => (
            <div key={p.nome} className="card overflow-hidden">
              <div
                className="relative aspect-[4/3]"
                style={{ background: `linear-gradient(155deg, ${p.cor} 0%, #0a0a0c 80%)` }}
              >
                <div className="speed-lines absolute inset-0 opacity-40" />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="font-display text-6xl text-white/15">{p.iniciais}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900 to-transparent p-5">
                  <p className="font-display text-lg uppercase text-white">{p.nome}</p>
                  <p className="eyebrow mt-0.5 text-mb-red">{p.papel}</p>
                </div>
              </div>
              <p className="p-5 text-sm text-ink-400 leading-relaxed">{p.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visão futura */}
      <section className="border-t border-ink-800 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow text-mb-red">O que vem a seguir</p>
              <h2 className="title-xl mt-3 text-3xl sm:text-4xl">
                Do mundo das motas<br />ao mundo motorizado
              </h2>
              <p className="mt-5 text-base text-ink-300 leading-relaxed">
                A ideia original da Motobox nunca foi só motas. Era o mundo motorizado angolano
                inteiro — os clubes de jipes, os Land Rover, os Land Cruiser, as travessias, o
                off-road em todas as suas formas.
              </p>
              <p className="mt-4 text-base text-ink-300 leading-relaxed">
                Começámos pelas motas porque era aí que estava a comunidade e a urgência. Mas a
                plataforma foi construída para crescer. Se organiza eventos noutra área do mundo
                motorizado em Angola, fale connosco.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/contacto#parcerias" size="lg">
                  Falar connosco
                </ButtonLink>
                <ButtonLink href={SOCIAIS.instagram} variant="outline" size="lg">
                  <Icon name="instagram" className="size-4" />
                  Seguir no Instagram
                </ButtonLink>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { t: "Clubes de jipes", d: "Land Rover, Land Cruiser e off-road 4×4." },
                { t: "Travessias", d: "Rotas e expedições por todo o país." },
                { t: "Velocidade", d: "Provas de asfalto e circuito." },
                { t: "Formação", d: "Escolas de pilotagem e segurança rodoviária." },
              ].map((c) => (
                <div key={c.t} className="card p-5">
                  <h3 className="font-display text-base uppercase text-white">{c.t}</h3>
                  <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contactos rápidos */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icone: "mail", t: "Email", v: SOCIAIS.email, href: `mailto:${SOCIAIS.email}` },
            { icone: "whatsapp", t: "WhatsApp", v: SOCIAIS.telefone, href: SOCIAIS.whatsapp },
            { icone: "instagram", t: "Instagram", v: "@motobox_angola", href: SOCIAIS.instagram },
          ].map((c) => (
            <a
              key={c.t}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="group card card-hover flex items-center gap-4 p-5"
            >
              <span className="grid size-11 shrink-0 place-items-center bg-mb-red/10 text-mb-red transition-colors group-hover:bg-mb-red group-hover:text-white">
                <Icon name={c.icone} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="eyebrow block text-ink-600">{c.t}</span>
                <span className="mt-0.5 block truncate text-sm text-white">{c.v}</span>
              </span>
            </a>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-500">
          Tem uma história para contar, resultados para partilhar ou um evento para divulgar?{" "}
          <Link href="/contacto" className="text-mb-red hover:underline underline-offset-4">
            Fale connosco
          </Link>
          .
        </p>
      </section>

      <Newsletter />
    </>
  );
}
