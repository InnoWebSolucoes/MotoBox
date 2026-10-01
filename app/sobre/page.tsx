import type { Metadata } from "next";
import { BookOpen, Camera, Compass, HeartHandshake, Info, Library, ShieldCheck } from "lucide-react";
import { lerClubes, lerEventos, lerNoticias } from "@/lib/supabase/publico";
import { ROTAS } from "@/lib/rotas";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import {
  Abertura, BotaoMB, Cabecalho, CartaoIcone, CartaoNumerado, Chamada, FraseFinal, Numeros, Seccao, Triptico,
} from "@/components/painel/blocos";
import { Foto, Monograma } from "@/components/painel/kit";
import { Icon } from "@/components/ui";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sobre a MotoBox",
  description:
    "A MotoBox é a casa de quem anda de mota em Angola: um projecto sem fins lucrativos, criado por Sofia Mussungo, que junta histórias, clubes, passeios e segurança num só lugar.",
};

const INSTAGRAM = "https://www.instagram.com/motobox_angola";

export default async function Sobre() {
  const [artigos, clubes, eventos] = await Promise.all([lerNoticias(), lerClubes(), lerEventos()]);

  return (
    <PaginaInterior icone={<Info />}>
      <Abertura
        foto="banner-sobre"
        sobretitulo="MotoBox Angola"
        titulo="O que é a MotoBox?"
        texto="A casa de quem anda de mota em Angola. Um projecto sem fins lucrativos que junta num só lugar o que andava espalhado: histórias, clubes, passeios, eventos e conselhos de segurança."
      />

      {/* ---------- Feito por motards ---------- */}
      <Seccao>
        <Cabecalho
          icone={<HeartHandshake />}
          titulo={<>Feito por motards, <br className="hidden md:block" />para motards</>}
          texto="Para quem vê na mota uma forma de liberdade, e na estrada um sítio para fazer amigos. Da scooter de todos os dias à moto de viagem."
        />
        <Triptico
          className="mt-12"
          fotos={[
            { nome: "classicas", alt: "Mota clássica estacionada junto a um muro" },
            { nome: "painel-clubes", alt: "Grupo de motards numa estrada de montanha junto ao mar" },
            { nome: "scooters", alt: "Scooter azul numa rua calcetada" },
          ]}
        />
      </Seccao>

      {/* ---------- A história ---------- */}
      <Seccao>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <Cabecalho icone={<BookOpen />} titulo="A nossa história" />
          <div className="prosa max-w-[62ch]">
            <p>
              A MotoBox começou como a ideia de uma revista digital sobre o mundo motard angolano. A fundadora, Sofia
              Mussungo, queria juntar num só lugar o que andava disperso: os passeios, os encontros, as corridas e as
              histórias das pessoas que fazem a comunidade.
            </p>
            <p>
              A revista nunca chegou a sair como estava pensada. O designer que lhe dava forma faleceu num acidente,
              e o projecto ficou suspenso. Mas o trabalho não parou: mudou de forma e passou a viver no Instagram e no
              Facebook, com fotografias, divulgação e a cobertura do que ia acontecendo.
            </p>
            <p>
              Faltava um sítio fixo. A informação perdia-se no feed e as perguntas chegavam ao telefone pessoal da
              fundadora. Este site existe para isso: ser a referência de quem anda de mota em Angola, e a casa de
              tudo o que a MotoBox faz.
            </p>
          </div>
        </div>
      </Seccao>

      {/* ---------- Em números ---------- */}
      <Seccao>
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h2 className="titulo-2">Tudo num só lugar</h2>
            <p className="texto-lead mt-5 max-w-[46ch] text-white/85">
              Artigos escritos com fontes, os clubes de todo o país, rotas para viajar, um guia de segurança, um
              marketplace e um fórum. Sem publicidade escondida e sem fins lucrativos.
            </p>
            <Numeros
              className="mt-10"
              itens={[
                { valor: artigos.length, texto: "artigos publicados" },
                { valor: clubes.length, texto: "clubes e grupos" },
                { valor: ROTAS.length, texto: "rotas, com fontes" },
                { valor: eventos.length, texto: "eventos no calendário" },
                { valor: 11, texto: "temas de segurança" },
                { valor: "0 Kz", texto: "de lucro: é um projecto da comunidade" },
              ]}
            />
          </div>
          <Foto nome="painel-sobre" alt="Motards à conversa junto a uma mota clássica" className="min-h-96 lg:min-h-full" largura={1200} />
        </div>
      </Seccao>

      {/* ---------- O que fazemos ---------- */}
      <Seccao>
        <h2 className="titulo-2">O que encontra aqui</h2>
        <div className="mt-10 grid gap-[var(--intervalo)]">
          <CartaoNumerado numero={1} sobretitulo="A secção principal" titulo="Artigos" foto="artigo-lady-riders" href="/artigos">
            Histórias da comunidade, perfis de clubes, viagens pelo país e guias práticos, escritos pela redacção a
            partir de fontes públicas.
          </CartaoNumerado>
          <CartaoNumerado numero={2} sobretitulo="De norte a sul" titulo="Clubes" foto="painel-clubes" href="/clubes" inverter>
            Os clubes de motas de Angola, de todos os tipos: moto-turismo, Lady Riders, scooters, clássicas e
            convívio. Cada um com a sua página, as redes e o que faz.
          </CartaoNumerado>
          <CartaoNumerado numero={3} sobretitulo="Passeios, encontros e raides" titulo="Eventos e rotas" foto="painel-eventos" href="/eventos">
            O calendário da comunidade e as rotas para viajar de mota, com a estrada, o piso, a melhor época e os
            cuidados de cada destino.
          </CartaoNumerado>
          <CartaoNumerado numero={4} sobretitulo="Chegar a casa" titulo="Segurança" foto="artigo-capacete" href="/seguranca" inverter>
            Um guia prático sobre o capacete, a chuva, o equipamento, os passageiros e o que fazer num acidente. Com
            fontes, sem sermões.
          </CartaoNumerado>
        </div>
      </Seccao>

      {/* ---------- Missão ---------- */}
      <Seccao>
        <Cabecalho titulo="Porque existimos" />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-4">
          <CartaoIcone icone={<Compass />} titulo="Ser a referência">
            O sítio onde qualquer pessoa encontra o que se passa no mundo das motas em Angola.
          </CartaoIcone>
          <CartaoIcone icone={<HeartHandshake />} titulo="Comunidade primeiro">
            Nasceu de dentro da comunidade motard e é para ela que trabalha. Sem fins lucrativos.
          </CartaoIcone>
          <CartaoIcone icone={<Library />} titulo="Guardar a memória">
            Histórias, fotografias e encontros que se perdiam no feed ficam aqui, arrumados.
          </CartaoIcone>
          <CartaoIcone icone={<ShieldCheck />} titulo="Andar com segurança">
            Mais motas na estrada pede mais cuidado. A informação certa ajuda a voltar a casa.
          </CartaoIcone>
        </div>
      </Seccao>

      {/* ---------- Equipa ---------- */}
      <Seccao>
        <Cabecalho
          titulo="Quem faz a MotoBox"
          texto="Um projecto pequeno, feito por poucas pessoas e por uma comunidade que colabora."
        />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-3">
          {[
            {
              nome: "Sofia Mussungo",
              papel: "Fundadora e directora",
              texto: "Criou a MotoBox para dar à comunidade motard angolana um sítio de referência, e é quem lidera o projecto.",
            },
            {
              nome: "Gonçalo",
              papel: "Fotografia",
              texto: "Vai aos eventos, fotografa e cuida das redes sociais. É o olhar por detrás das imagens da MotoBox.",
              icone: true,
            },
            {
              nome: "Comunidade MotoBox",
              papel: "Colaboradores",
              texto: "Motards, clubes e mecânicos que enviam histórias, fotografias e correcções. Sem eles, metade disto não existia.",
            },
          ].map((p) => (
            <div key={p.nome} className="painel painel-escuro flex min-h-72 flex-col p-6">
              {p.icone ? (
                <span className="grid size-14 place-items-center rounded-[4px] bg-mb-red" aria-hidden>
                  <Camera className="size-6" />
                </span>
              ) : (
                <Monograma nome={p.nome} className="size-14 text-lg" />
              )}
              <p className="mt-auto pt-10 text-sm text-mb-red-light">{p.papel}</p>
              <h3 className="mt-1 text-xl font-semibold">{p.nome}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/80">{p.texto}</p>
            </div>
          ))}
        </div>
      </Seccao>

      {/* ---------- Instagram ---------- */}
      <Seccao>
        <div className="grid gap-[var(--intervalo)] md:grid-cols-[1fr_1fr_2fr]">
          <Chamada href={INSTAGRAM} externo icone={<Icon name="instagram" />} titulo="Acompanhe a MotoBox no Instagram" />
          <Foto nome="artigo-primeira-mota" className="min-h-72" largura={700} />
          <Foto nome="artigo-grupo" className="row-span-2 min-h-72" largura={1100} />
          <Foto nome="clube-vespa" className="min-h-64 md:col-span-2" largura={1100} />
        </div>
      </Seccao>

      <FraseFinal
        foto="painel-clubes"
        frase="Andar de mota é mais do que chegar ao destino. É o caminho que se faz em conjunto."
      >
        <div className="flex flex-wrap gap-[var(--intervalo)]">
          <BotaoMB href="/clubes">Encontrar um clube</BotaoMB>
          <BotaoMB href="/contacto" variante="escuro">Falar connosco</BotaoMB>
        </div>
      </FraseFinal>
    </PaginaInterior>
  );
}
