import type { Metadata } from "next";
import { CanceladaClient, type EstadoCancelamento } from "./CanceladaClient";

/* Destino da ligação "Cancelar subscrição" dos emails, depois de
   /api/newsletter/cancelar ter feito o trabalho. */

export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: false },
};

const ESTADOS: EstadoCancelamento[] = ["ok", "invalido", "erro"];

const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function PaginaNewsletterCancelada({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const p = await searchParams;
  const pedido = primeiro(p.estado) as EstadoCancelamento;
  const estado = ESTADOS.includes(pedido) ? pedido : "invalido";
  return <CanceladaClient estado={estado} email={primeiro(p.email)} token={primeiro(p.token)} />;
}
