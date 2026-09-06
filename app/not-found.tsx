import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-25" aria-hidden />
      <div className="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="font-display text-[9rem] leading-none text-mb-red/25 sm:text-[12rem]">404</p>
        <h1 className="title-xl -mt-6 text-3xl sm:text-4xl">Saiu de pista</h1>
        <p className="mt-4 max-w-md text-sm text-ink-400 leading-relaxed">
          A página que procura não existe ou mudou de sítio. Volte ao traçado principal.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">
            Página inicial
          </ButtonLink>
          <ButtonLink href="/calendario" variant="outline" size="lg">
            Calendário
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
