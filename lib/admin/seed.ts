import type {
  Utilizador, Encomenda, Denuncia, Subscritor, Mensagem,
  PaginaLegal, Definicoes, RegistoAtividade,
} from "./types";

const CORES = ["#e10600", "#ffb800", "#16a34a", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
export const corPara = (s: string) =>
  CORES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % CORES.length];

export const utilizadoresSeed: Utilizador[] = [
  { id: "u-001", nome: "Gonçalo Bessa", email: "goncalo@motoboxangola.ao", telefone: "+244 923 000 001", papel: "admin", estado: "ativo", provincia: "Luanda", avatarCor: corPara("Gonçalo Bessa"), registado: "2025-01-12", ultimoAcesso: "2026-09-07", verificado: true, newsletter: true, notas: "Fundador da Motobox Angola." },
  { id: "u-002", nome: "Marta Chissola", email: "marta@motoboxangola.ao", telefone: "+244 923 000 002", papel: "editor", estado: "ativo", provincia: "Luanda", avatarCor: corPara("Marta Chissola"), registado: "2025-03-04", ultimoAcesso: "2026-09-06", verificado: true, newsletter: true },
  { id: "u-003", nome: "Nuno Cabral", email: "nuno@motoboxangola.ao", papel: "moderador", estado: "ativo", provincia: "Benguela", avatarCor: corPara("Nuno Cabral"), registado: "2025-05-19", ultimoAcesso: "2026-09-05", verificado: true, newsletter: false },
  { id: "u-004", nome: "Isabel Ndala", email: "isabel@motoboxangola.ao", papel: "financeiro", estado: "ativo", provincia: "Luanda", avatarCor: corPara("Isabel Ndala"), registado: "2025-06-02", ultimoAcesso: "2026-09-07", verificado: true, newsletter: true },
  { id: "u-005", nome: "Alberto Kimbanda", email: "alberto.k@gmail.com", telefone: "+244 924 551 200", papel: "leitor", estado: "ativo", provincia: "Huíla", avatarCor: corPara("Alberto Kimbanda"), registado: "2026-01-15", ultimoAcesso: "2026-09-01", verificado: true, newsletter: true },
  { id: "u-006", nome: "Sandra Mucanza", email: "sandra.m@hotmail.com", papel: "leitor", estado: "pendente", provincia: "Huambo", avatarCor: corPara("Sandra Mucanza"), registado: "2026-08-28", verificado: false, newsletter: true },
  { id: "u-007", nome: "Pedro Tavares", email: "ptavares@outlook.com", telefone: "+244 926 118 044", papel: "leitor", estado: "suspenso", provincia: "Namibe", avatarCor: corPara("Pedro Tavares"), registado: "2025-11-08", ultimoAcesso: "2026-07-14", verificado: true, newsletter: false, notas: "Suspenso por publicidade repetida no fórum." },
  { id: "u-008", nome: "Célia Domingos", email: "celia.domingos@gmail.com", papel: "leitor", estado: "ativo", provincia: "Cabinda", avatarCor: corPara("Célia Domingos"), registado: "2026-04-22", ultimoAcesso: "2026-09-03", verificado: true, newsletter: true },
  { id: "u-009", nome: "Hélder Sousa", email: "helder.sousa@gmail.com", papel: "leitor", estado: "banido", provincia: "Luanda", avatarCor: corPara("Hélder Sousa"), registado: "2025-09-30", ultimoAcesso: "2026-02-11", verificado: false, newsletter: false, notas: "Banido: venda fraudulenta no marketplace." },
  { id: "u-010", nome: "Joana Ferraz", email: "joana.ferraz@motoboxangola.ao", papel: "editor", estado: "ativo", provincia: "Benguela", avatarCor: corPara("Joana Ferraz"), registado: "2026-02-17", ultimoAcesso: "2026-09-07", verificado: true, newsletter: true },
];

export const encomendasSeed: Encomenda[] = [
  { id: "e-001", referencia: "MB-2026-0001", eventoSlug: "gp-namibe-dunas", eventoTitulo: "GP do Namibe — Corrida das Dunas", tipoBilheteId: "geral", tipoBilheteNome: "Geral", quantidade: 2, precoUnitario: 5000, taxa: 500, total: 10500, estado: "pago", comprador: { nome: "Alberto Kimbanda", email: "alberto.k@gmail.com", telefone: "+244 924 551 200" }, metodo: "Multicaixa Express", criado: "2026-08-14", pago: "2026-08-14", codigoQR: "MBX-0001-NAM" },
  { id: "e-002", referencia: "MB-2026-0002", eventoSlug: "gp-namibe-dunas", eventoTitulo: "GP do Namibe — Corrida das Dunas", tipoBilheteId: "tribuna", tipoBilheteNome: "Tribuna Coberta", quantidade: 1, precoUnitario: 12000, taxa: 600, total: 12600, estado: "pago", comprador: { nome: "Célia Domingos", email: "celia.domingos@gmail.com", telefone: "+244 927 400 118" }, metodo: "Transferência", criado: "2026-08-16", pago: "2026-08-17", codigoQR: "MBX-0002-NAM" },
  { id: "e-003", referencia: "MB-2026-0003", eventoSlug: "gp-huambo-final", eventoTitulo: "GP do Huambo — Final do Campeonato", tipoBilheteId: "geral", tipoBilheteNome: "Geral", quantidade: 4, precoUnitario: 3500, taxa: 700, total: 14700, estado: "pendente", comprador: { nome: "Sandra Mucanza", email: "sandra.m@hotmail.com", telefone: "+244 923 887 210" }, metodo: "Multicaixa Express", criado: "2026-09-02", codigoQR: "MBX-0003-HUA" },
  { id: "e-004", referencia: "MB-2026-0004", eventoSlug: "gp-huambo-final", eventoTitulo: "GP do Huambo — Final do Campeonato", tipoBilheteId: "familia", tipoBilheteNome: "Bilhete Família", quantidade: 1, precoUnitario: 10000, taxa: 500, total: 10500, estado: "usado", comprador: { nome: "Pedro Tavares", email: "ptavares@outlook.com", telefone: "+244 926 118 044" }, metodo: "Cartão", criado: "2026-07-30", pago: "2026-07-30", codigoQR: "MBX-0004-HUA" },
  { id: "e-005", referencia: "MB-2026-0005", eventoSlug: "gp-namibe-dunas", eventoTitulo: "GP do Namibe — Corrida das Dunas", tipoBilheteId: "paddock", tipoBilheteNome: "Paddock Pass", quantidade: 3, precoUnitario: 28000, taxa: 4200, total: 88200, estado: "cancelado", comprador: { nome: "Hélder Sousa", email: "helder.sousa@gmail.com", telefone: "+244 925 330 771" }, metodo: "Numerário", criado: "2026-06-11", codigoQR: "MBX-0005-NAM" },
  { id: "e-006", referencia: "MB-2026-0006", eventoSlug: "gp-huambo-final", eventoTitulo: "GP do Huambo — Final do Campeonato", tipoBilheteId: "vip", tipoBilheteNome: "VIP Paddock Club", quantidade: 2, precoUnitario: 35000, taxa: 3500, total: 73500, estado: "pago", comprador: { nome: "Isabel Ndala", email: "isabel@motoboxangola.ao", telefone: "+244 923 000 004" }, metodo: "Transferência", criado: "2026-09-05", pago: "2026-09-05", codigoQR: "MBX-0006-HUA" },
  { id: "e-007", referencia: "MB-2026-0007", eventoSlug: "gala-motobox-2026", eventoTitulo: "Gala Motobox — Prémios da Temporada", tipoBilheteId: "individual", tipoBilheteNome: "Convite Individual", quantidade: 6, precoUnitario: 25000, taxa: 7500, total: 157500, estado: "reembolsado", comprador: { nome: "Nuno Cabral", email: "nuno@motoboxangola.ao", telefone: "+244 923 000 003" }, metodo: "Multicaixa Express", criado: "2026-05-20", pago: "2026-05-20", codigoQR: "MBX-0007-GAL" },
];

export const denunciasSeed: Denuncia[] = [
  { id: "d-001", tipo: "marketplace", alvoId: "mkt-004", alvoTitulo: "KTM 450 SX-F 2023 — preço suspeito", motivo: "Possível fraude", detalhe: "Vendedor pede transferência antecipada e recusa encontro presencial.", denunciante: "Célia Domingos", criado: "2026-09-04", estado: "pendente" },
  { id: "d-002", tipo: "forum", alvoId: "t-005", alvoTitulo: "Onde comprar peças baratas?", motivo: "Spam", detalhe: "Mesma ligação comercial publicada seis vezes no tópico.", denunciante: "Alberto Kimbanda", criado: "2026-09-03", estado: "pendente" },
  { id: "d-003", tipo: "comentario", alvoId: "c-118", alvoTitulo: "Comentário em «Campeonato decide-se no Huambo»", motivo: "Linguagem ofensiva", detalhe: "Insultos dirigidos a um piloto.", denunciante: "Sandra Mucanza", criado: "2026-08-30", estado: "aprovado", resolucao: "Comentário removido e utilizador avisado." },
  { id: "d-004", tipo: "perfil", alvoId: "u-009", alvoTitulo: "Perfil de Hélder Sousa", motivo: "Conta falsa", detalhe: "Perfil usa fotografia de piloto conhecido.", denunciante: "Nuno Cabral", criado: "2026-02-09", estado: "aprovado", resolucao: "Conta banida permanentemente." },
  { id: "d-005", tipo: "forum", alvoId: "t-002", alvoTitulo: "Melhor pneu para o Kilamba", motivo: "Fora de tópico", detalhe: "Discussão desviou-se para política.", denunciante: "Pedro Tavares", criado: "2026-07-22", estado: "rejeitado", resolucao: "Sem violação das regras; tópico mantido." },
];

export const subscritoresSeed: Subscritor[] = [
  { id: "s-001", email: "alberto.k@gmail.com", nome: "Alberto Kimbanda", origem: "rodapé", subscrito: "2026-01-15", ativo: true },
  { id: "s-002", email: "celia.domingos@gmail.com", nome: "Célia Domingos", origem: "faixa", subscrito: "2026-04-22", ativo: true },
  { id: "s-003", email: "sandra.m@hotmail.com", nome: "Sandra Mucanza", origem: "cartão", subscrito: "2026-08-28", ativo: true },
  { id: "s-004", email: "joaquim.neto@gmail.com", origem: "checkout", subscrito: "2026-08-14", ativo: true },
  { id: "s-005", email: "ana.paula@yahoo.com", nome: "Ana Paula", origem: "rodapé", subscrito: "2026-03-11", ativo: true },
  { id: "s-006", email: "motoclube.benguela@gmail.com", nome: "Motoclube Benguela", origem: "manual", subscrito: "2025-12-02", ativo: true },
  { id: "s-007", email: "antigo@exemplo.com", origem: "rodapé", subscrito: "2025-08-19", ativo: false },
];

export const mensagensSeed: Mensagem[] = [
  { id: "m-001", nome: "Rui Manuel", email: "rui.manuel@gmail.com", telefone: "+244 923 771 004", assunto: "Inscrição em prova", mensagem: "Bom dia. Gostaria de saber como inscrever-me no Enduro da Tundavala. Sou piloto amador da Huíla.", recebido: "2026-09-06", lida: false, arquivada: false },
  { id: "m-002", nome: "Banco BAI", email: "patrocinios@bai.ao", assunto: "Proposta de patrocínio", mensagem: "Temos interesse em discutir patrocínio da temporada 2027. Podemos agendar reunião?", recebido: "2026-09-05", lida: false, arquivada: false },
  { id: "m-003", nome: "Teresa Lopes", email: "teresa.l@hotmail.com", assunto: "Bilhete não recebido", mensagem: "Comprei um bilhete ontem mas não recebi o código QR por email.", recebido: "2026-09-04", lida: true, arquivada: false, resposta: "Bilhete reenviado para o email registado." },
  { id: "m-004", nome: "Escola Kilamba", email: "geral@escolakilamba.ao", assunto: "Visita de estudo", mensagem: "Podemos levar alunos a assistir aos treinos do GP de Luanda?", recebido: "2026-08-29", lida: true, arquivada: true, resposta: "Confirmado para a sessão de sábado de manhã." },
];

export const paginasLegaisSeed: PaginaLegal[] = [
  {
    slug: "termos", titulo: "Termos e Condições",
    descricao: "Regras de utilização da plataforma Motobox Angola.",
    atualizado: "2026-09-01", publicado: true,
    seccoes: [
      { titulo: "1. Aceitação dos termos", corpo: ["Ao aceder e utilizar a plataforma Motobox Angola, o utilizador aceita integralmente os presentes Termos e Condições.", "Caso não concorde com alguma disposição, deverá abster-se de utilizar os serviços."] },
      { titulo: "2. Contas de utilizador", corpo: ["O registo exige informação verdadeira, completa e atualizada.", "O utilizador é responsável pela confidencialidade das suas credenciais e por toda a atividade realizada na sua conta.", "A Motobox reserva-se o direito de suspender contas que violem estes termos."] },
      { titulo: "3. Bilhetes e pagamentos", corpo: ["A compra de bilhetes é processada através dos meios de pagamento disponibilizados, incluindo Multicaixa Express e transferência bancária.", "Sobre cada transação incide uma taxa de serviço da Motobox, apresentada de forma discriminada antes da confirmação.", "Os bilhetes digitais são pessoais e intransmissíveis, validados por código QR à entrada do recinto."] },
      { titulo: "4. Reembolsos", corpo: ["Em caso de cancelamento da prova pela organização, o valor do bilhete é integralmente reembolsado.", "Pedidos de reembolso por desistência do comprador são avaliados até 7 dias antes do evento."] },
      { titulo: "5. Marketplace", corpo: ["Os anúncios são da responsabilidade dos respetivos vendedores.", "A Motobox verifica vendedores mas não é parte nas transações realizadas entre utilizadores.", "É proibido anunciar veículos sem documentação legal."] },
      { titulo: "6. Conteúdo do utilizador", corpo: ["O utilizador mantém a titularidade do conteúdo que publica, concedendo à Motobox licença para o exibir na plataforma.", "É proibido publicar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros."] },
      { titulo: "7. Limitação de responsabilidade", corpo: ["A prática de motociclismo comporta riscos assumidos pelos participantes.", "A Motobox não se responsabiliza por danos decorrentes da participação em eventos organizados por terceiros."] },
      { titulo: "8. Lei aplicável", corpo: ["Os presentes termos regem-se pela lei angolana.", "Para dirimir litígios é competente o foro da Comarca de Luanda."] },
    ],
  },
  {
    slug: "privacidade", titulo: "Política de Privacidade",
    descricao: "Como recolhemos, usamos e protegemos os dados pessoais.",
    atualizado: "2026-09-01", publicado: true,
    seccoes: [
      { titulo: "1. Responsável pelo tratamento", corpo: ["A Motobox Angola é responsável pelo tratamento dos dados pessoais recolhidos através desta plataforma.", "Contacto para questões de privacidade: privacidade@motoboxangola.ao"] },
      { titulo: "2. Dados recolhidos", corpo: ["Dados de registo: nome, email, telefone e província.", "Dados de transação: histórico de compras de bilhetes e método de pagamento utilizado.", "Dados de navegação: endereço IP, tipo de dispositivo e páginas visitadas."] },
      { titulo: "3. Finalidades", corpo: ["Gestão de contas e autenticação.", "Processamento de compras e emissão de bilhetes digitais.", "Envio de newsletter e comunicações, mediante consentimento.", "Melhoria da plataforma através de estatísticas agregadas."] },
      { titulo: "4. Partilha com terceiros", corpo: ["Os dados são partilhados apenas com prestadores de serviços de pagamento e com autoridades quando legalmente exigido.", "Não vendemos dados pessoais a terceiros."] },
      { titulo: "5. Conservação", corpo: ["Os dados de conta são conservados enquanto a conta estiver ativa.", "Os registos de transação são conservados pelo período legalmente exigido para efeitos fiscais."] },
      { titulo: "6. Direitos do titular", corpo: ["O titular pode solicitar acesso, retificação, apagamento ou portabilidade dos seus dados.", "Os pedidos devem ser dirigidos a privacidade@motoboxangola.ao e são respondidos no prazo de 30 dias."] },
      { titulo: "7. Segurança", corpo: ["Aplicamos medidas técnicas e organizativas adequadas à proteção dos dados, incluindo cifragem em trânsito."] },
    ],
  },
  {
    slug: "cookies", titulo: "Política de Cookies",
    descricao: "Que cookies utilizamos e como pode controlá-los.",
    atualizado: "2026-09-01", publicado: true,
    seccoes: [
      { titulo: "1. O que são cookies", corpo: ["Cookies são pequenos ficheiros de texto guardados no dispositivo do utilizador que permitem reconhecer o navegador e recordar preferências."] },
      { titulo: "2. Cookies essenciais", corpo: ["Necessários ao funcionamento da plataforma: sessão de utilizador, carrinho de bilhetes e preferências de idioma.", "Não podem ser desativados sem comprometer o funcionamento do site."] },
      { titulo: "3. Cookies analíticos", corpo: ["Recolhem informação agregada sobre a utilização do site para nos ajudar a melhorá-lo.", "Só são ativados mediante consentimento expresso."] },
      { titulo: "4. Cookies de marketing", corpo: ["Utilizados para apresentar conteúdo e campanhas relevantes.", "Desativados por predefinição."] },
      { titulo: "5. Gestão de preferências", corpo: ["O utilizador pode alterar as suas preferências a qualquer momento através do banner de cookies ou das definições do navegador."] },
    ],
  },
  {
    slug: "regulamento", titulo: "Regulamento da Comunidade",
    descricao: "Regras do fórum, comentários e marketplace.",
    atualizado: "2026-08-15", publicado: true,
    seccoes: [
      { titulo: "1. Respeito", corpo: ["Trate os restantes membros com respeito. Ataques pessoais, discurso de ódio e assédio resultam em suspensão imediata."] },
      { titulo: "2. Conteúdo permitido", corpo: ["O fórum destina-se a temas de motociclismo. Publicidade não autorizada e spam serão removidos."] },
      { titulo: "3. Marketplace", corpo: ["Anuncie apenas o que possui e pode vender legalmente.", "Descreva o estado real do artigo e indique preço em kwanzas."] },
      { titulo: "4. Segurança", corpo: ["Promovemos a condução responsável. Conteúdo que incentive condução perigosa em via pública será removido."] },
      { titulo: "5. Sanções", corpo: ["Aviso, suspensão temporária e banimento permanente, consoante a gravidade e a reincidência."] },
    ],
  },
];

export const definicoesSeed: Definicoes = {
  nomeSite: "Motobox Angola",
  descricao: "A casa digital do motociclismo angolano.",
  emailContacto: "geral@motoboxangola.ao",
  telefone: "+244 923 000 000",
  morada: "Luanda, Angola",
  temporada: 2026,
  taxaMotobox: 5,
  moeda: "Kz",
  instagram: "https://www.instagram.com/motobox_angola",
  facebook: "https://www.facebook.com/motoboxangola",
  youtube: "",
  manutencao: false,
  registosAbertos: true,
  marketplaceAberto: true,
  forumAberto: true,
  bilheteiraAberta: true,
  cookieBanner: true,
  analytics: "",
};

export const atividadeSeed: RegistoAtividade[] = [
  { id: "a-001", quando: "2026-09-07T18:40:00Z", utilizador: "Gonçalo Bessa", accao: "publicou", entidade: "Notícia", detalhe: "Campeonato decide-se no Huambo" },
  { id: "a-002", quando: "2026-09-07T16:12:00Z", utilizador: "Isabel Ndala", accao: "confirmou pagamento", entidade: "Encomenda", detalhe: "MB-2026-0006" },
  { id: "a-003", quando: "2026-09-06T11:05:00Z", utilizador: "Marta Chissola", accao: "editou", entidade: "Evento", detalhe: "GP de Luanda 2026" },
  { id: "a-004", quando: "2026-09-05T09:30:00Z", utilizador: "Nuno Cabral", accao: "moderou", entidade: "Denúncia", detalhe: "Comentário removido" },
  { id: "a-005", quando: "2026-09-04T14:22:00Z", utilizador: "Joana Ferraz", accao: "criou", entidade: "Vídeo", detalhe: "Resumo do GP de Luanda" },
  { id: "a-006", quando: "2026-09-03T08:15:00Z", utilizador: "Gonçalo Bessa", accao: "atualizou", entidade: "Definições", detalhe: "Taxa Motobox para 5%" },
];
