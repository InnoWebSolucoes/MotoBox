-- ============================================================
-- MOTOBOX — Migração de 28 de Setembro de 2026
-- Correr UMA vez no Supabase: SQL Editor → New query → colar → Run.
-- É seguro correr de novo: só cria o que falta.
--
-- Traz a tabela `clubes`: clubes de lazer e moto-turismo (Lady Riders,
-- grupos de passeio, clubes de marca…). Diferentes das equipas de
-- Desporto: não têm pilotos nem pontos.
-- ============================================================

create table if not exists clubes (
  slug         text primary key,
  nome         text not null,
  tipo         text not null default 'Moto-turismo',
  provincia    text not null default 'Luanda',
  cidade       text not null default '',
  fundacao     int,
  descricao    text not null default '',
  actividades  jsonb not null default '[]'::jsonb,
  encontros    text,
  logo         text not null default '',
  imagem       text,
  cor          text not null default '#e10600',
  redes        jsonb not null default '{}'::jsonb,
  contacto     text,
  fonte        text,
  destaque     boolean not null default false,
  publicado    boolean not null default true,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_clubes_tipo on clubes (tipo);

drop trigger if exists trg_clubes_atualizado on clubes;
create trigger trg_clubes_atualizado before update on clubes
  for each row execute function tocar_atualizado_em();

alter table clubes enable row level security;
drop policy if exists ler_clubes on clubes;
create policy ler_clubes on clubes for select using (publicado);

-- ------------------------------------------------------------
-- Clubes de partida (os mesmos de lib/data.ts). Vêm das páginas
-- públicas dos próprios clubes e de reportagens: ver a coluna
-- `fonte`. `on conflict do nothing` não toca em clubes que a
-- equipa já tenha editado no painel.
-- ------------------------------------------------------------

insert into clubes (slug, nome, tipo, provincia, cidade, fundacao, descricao, actividades,
  encontros, logo, imagem, cor, redes, contacto, fonte, destaque)
values
  ('amigos-da-picada',
   'Amigos da Picada',
   'Moto-turismo',
   'Luanda',
   'Luanda',
   2006,
   'Grupo de motociclistas de Luanda vocacionado para o turismo e a aventura sobre rodas. Tudo começou em 2006, com a primeira viagem em grupo até à Namíbia, e o nome vem do estado das estradas nessa viagem: as picadas. O programa do clube junta saídas de fim-de-semana a pontos turísticos do país, um raide longo por ano e viagens a outros países africanos. Tem uma forte componente solidária, com distribuição de refeições em hospitais e de material escolar nas comunidades por onde passa, e vai todos os anos à Muxima pedir a bênção para a época. É apontado como o mentor do movimento motard angolano. Lema: «Sunny or Raining».',
   '["Saídas de fim-de-semana a pontos turísticos","Raide anual pelo país","Viagens a outros países africanos","Café da Picada, encontro social mensal","Acções solidárias em hospitais e comunidades","Bênção anual na Muxima"]'::jsonb,
   'Café da Picada: um encontro social por mês, segundo o programa que o clube descreveu em 2020.',
   '',
   null,
   '#c2410c',
   '{"instagram":"https://www.instagram.com/amigosdapicada/","facebook":"https://www.facebook.com/groups/amigosdapicada/"}'::jsonb,
   null,
   'https://www.instagram.com/amigosdapicada/
https://www.facebook.com/groups/amigosdapicada/
https://bikersofafrica.com/2020/07/08/amigos-da-picada/
https://www.euronews.com/2021/03/10/the-bikers-making-angola-the-ride-of-their-lives',
   true),
  ('ladies-in-2-wheels-angola',
   'Ladies in 2 Wheels in Angola',
   'Lady Riders',
   'Luanda',
   '',
   null,
   'Motards femininas angolanas que viajam de mota, fazem turismo e acções filantrópicas, «and lots of fun». No perfil guardam viagens a Malanje e a países vizinhos, da Namíbia ao Botswana, à África do Sul e à RD Congo, e um raide ibérico. Levam a conversa sobre mulheres na estrada também à rádio. Lema: «Life is a ride kinda girls. Whatever we can do, you can too».',
   '["Viagens de mota em grupo","Turismo pelo país","Viagens à Namíbia, Botswana, África do Sul e RD Congo","Acções filantrópicas"]'::jsonb,
   null,
   '',
   null,
   '#db2777',
   '{"instagram":"https://www.instagram.com/ladies_riders_ao/"}'::jsonb,
   null,
   'https://www.instagram.com/ladies_riders_ao/
https://www.instagram.com/ladies_riders_ao/reel/DWRpks4DKxj/',
   true),
  ('motards-de-angola',
   'Motards de Angola',
   'Moto-turismo',
   'Luanda',
   'Belas',
   null,
   'Grupo de motards de Luanda que tem como objectivo, nas suas palavras, «dar o melhor de si para o engrandecimento do turismo em Angola». Foi pela sua página que se divulgou a programação do Dia Nacional do Motard Angolano, em Luanda, em Julho de 2026.',
   '["Passeios e viagens de turismo","Divulgação de encontros motard","Dia do Motard Angolano"]'::jsonb,
   null,
   '',
   null,
   '#0f766e',
   '{"facebook":"https://www.facebook.com/100079850005166","instagram":"https://www.instagram.com/motardsangola/"}'::jsonb,
   null,
   'https://www.facebook.com/100079850005166
https://www.facebook.com/100079850005166/about_places
https://www.instagram.com/motardsangola/ (mesmo nome; ligação entre as contas por confirmar)',
   true),
  ('amigos-do-capim',
   'Amigos do Capim',
   'Outro',
   'Luanda',
   'Luanda',
   null,
   'Clube motard de Luanda com vocação solidária: «Mais do que amigos, somos uma família que ajuda outras famílias». Em Agosto de 2020 juntou-se a um grupo filantrópico de oficiais do Ministério do Interior numa campanha de prevenção da Covid-19 no Futungo, em Talatona, com distribuição de máscaras. Lema: «Ser solidário cuia bué».',
   '["Acções solidárias","Campanhas de sensibilização","Passeios solidários"]'::jsonb,
   null,
   '',
   null,
   '#4d7c0f',
   '{"instagram":"https://www.instagram.com/amigosdocapim/"}'::jsonb,
   null,
   'https://www.instagram.com/amigosdocapim/
https://bikersofafrica.com/2020/08/24/angola-club-amigos-do-capim-charity-run/',
   false),
  ('performance-bikers-2015',
   'Performance Bikers 2015',
   'Moto-turismo',
   'Luanda',
   'Luanda',
   2015,
   'Nasceu num domingo em Luanda, a 7 de Fevereiro de 2015, quando um grupo de motociclistas descobriu junto «o prazer de andar em grupo». Partilha viagens e momentos na estrada e sai em raide com outros clubes, como no Raid Benguela de 2022.',
   '["Passeios em grupo","Viagens pelo país","Raides com outros clubes"]'::jsonb,
   null,
   '',
   null,
   '#1d4ed8',
   '{"instagram":"https://www.instagram.com/performancebikers2015/"}'::jsonb,
   null,
   'https://www.instagram.com/performancebikers2015/
https://www.instagram.com/elite_motard_angola/p/ClE2xbmBYXh/',
   false),
  ('african-nomadas',
   'African Nómadas',
   'Moto-turismo',
   'Benguela',
   'Lobito',
   null,
   'Clube de motociclistas do Lobito, com o lema «liberdade sobre rodas». Faz saídas em grupo ao longo do ano e vai recebendo novos membros na família.',
   '["Saídas em grupo","Convívio entre membros"]'::jsonb,
   null,
   '',
   null,
   '#b45309',
   '{"instagram":"https://www.instagram.com/africannomadas/","facebook":"https://www.facebook.com/africannomadas/"}'::jsonb,
   null,
   'https://www.facebook.com/africannomadas/
https://www.instagram.com/africannomadas/',
   false),
  ('300-km-a-norte',
   '300 km a Norte',
   'Moto-turismo',
   'Zaire',
   'Soyo',
   null,
   'Motards residentes no Soyo, em Luanda e em Moçambique, unidos pela «paixão sobre duas rodas, adrenalina, aventura e filantropia». O aniversário do clube, no Soyo, já recebeu outros clubes em raide, como o Elite Motard em 2022.',
   '["Raides","Aventura","Filantropia","Aniversário do clube no Soyo"]'::jsonb,
   null,
   '',
   null,
   '#15803d',
   '{"instagram":"https://www.instagram.com/300km_a_norte/"}'::jsonb,
   null,
   'https://www.instagram.com/300km_a_norte/
https://www.instagram.com/elite_motard_angola/p/ClE1cSDhjKC/',
   false),
  ('clube-anjos-bantu',
   'Clube Anjos Bantu',
   'Moto-turismo',
   'Luanda',
   '',
   2018,
   'Clube motard presidido por uma motociclista, que celebrou oito anos de existência em Julho de 2026. Os destaques do perfil guardam raides a Malanje e ao Soyo, e o clube assinala datas como o Dia da Mulher Africana e o Dia da Criança Africana.',
   '["Raides pelo país","Convívio entre membros","Datas solidárias e comemorativas"]'::jsonb,
   null,
   '',
   null,
   '#7c3aed',
   '{"instagram":"https://www.instagram.com/clube.anjos.bantu/","facebook":"https://www.facebook.com/clubeanjosbantu/"}'::jsonb,
   'clube.anjos.bantu@hotmail.com',
   'https://www.instagram.com/clube.anjos.bantu/
https://www.instagram.com/clube.anjos.bantu/p/DbBb_fRlVOl/
https://www.instagram.com/clube.anjos.bantu/reel/DZWkL6UitFR/
https://www.facebook.com/clubeanjosbantu/',
   false),
  ('tuaregs-motard-angola',
   'Tuaregs Motard Angola',
   'Moto-turismo',
   'Luanda',
   '',
   null,
   'Associação de jovens e adultos de várias idades cujo objectivo principal é o «turismo sobre rodas»: explorar pontos naturais e de relevância histórica em Angola e além-fronteiras, em duas e quatro rodas. Esteve no Dia do Motard Angolano, no Autódromo de Luanda, em Julho de 2026, e junta-se a campanhas como o Outubro Rosa. Lema: «União sem limites».',
   '["Turismo sobre rodas","Visitas a locais naturais e históricos","Viagens além-fronteiras","Campanhas solidárias"]'::jsonb,
   null,
   '',
   null,
   '#a16207',
   '{"instagram":"https://www.instagram.com/tuaregs_motard_angola/","facebook":"https://www.facebook.com/tuaregsmotardangola/"}'::jsonb,
   'tuaregs.motardangola@gmail.com',
   'https://www.facebook.com/tuaregsmotardangola/
https://www.instagram.com/tuaregs_motard_angola/
https://www.instagram.com/tuaregs_motard_angola/p/DavZJwkjAQW/',
   false)
on conflict (slug) do nothing;
