create table prospects (
  id                 uuid default gen_random_uuid() primary key,
  type               text,
  category           text,
  name               text not null,
  country            text default 'France',
  website            text,
  description        text,
  strategic_interest text,
  relevance_score    integer default 0,
  emails             text[] default '{}',
  contacts           jsonb default '[]',
  status             text default 'a_traiter',
  last_contact_at    timestamptz,
  internal_notes     text,
  generated_subject  text,
  generated_email    text,
  contact_history    jsonb default '[]',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Statuts valides : a_traiter | enrichi | email_genere | contacte | relance | en_discussion | accepte | refuse | a_revoir

alter table prospects enable row level security;

create index if not exists idx_prospects_status    on prospects(status);
create index if not exists idx_prospects_category  on prospects(category);
create index if not exists idx_prospects_relevance on prospects(relevance_score desc);

insert into prospects (type, category, name, website, country, status, relevance_score) values
  ('fabricant',    'froid',        'Dometic',              'https://www.dometic.com/fr-fr',        'France',    'a_traiter', 95),
  ('fabricant',    'énergie',      'Victron Energy',       'https://www.victronenergy.com',         'France',    'a_traiter', 95),
  ('fabricant',    'énergie',      'EcoFlow',              'https://www.ecoflow.com/fr',            'France',    'a_traiter', 92),
  ('fabricant',    'chauffage',    'Truma',                'https://www.truma.com/fr',              'France',    'a_traiter', 90),
  ('fabricant',    'chauffage',    'Webasto',              'https://www.webasto.com/fr',            'France',    'a_traiter', 88),
  ('fabricant',    'sanitaire',    'Thetford',             'https://www.thetford.com/fr-fr',        'France',    'a_traiter', 88),
  ('fabricant',    'extérieur',    'Thule',                'https://www.thule.com/fr-fr',           'France',    'a_traiter', 85),
  ('fabricant',    'extérieur',    'Fiamma',               'https://www.fiamma.com',               'France',    'a_traiter', 82),
  ('fabricant',    'tendance',     'Trelino',              'https://www.trelino.de/fr',             'France',    'a_traiter', 80),
  ('fabricant',    'tendance',     'Trobolo',              'https://www.trobolo.com/fr',            'France',    'a_traiter', 78),
  ('distributeur', 'distributeur', 'Mon Fourgon Shop',     'https://www.monfourgonshop.fr',         'France',    'a_traiter', 85),
  ('distributeur', 'distributeur', 'H2R Équipements',      'https://www.h2r-equipements.com',       'France',    'a_traiter', 83),
  ('distributeur', 'énergie',      'Energie Mobile',       'https://www.energiemobile.com',         'France',    'a_traiter', 80),
  ('distributeur', 'distributeur', 'Narbonne Accessoires', 'https://www.narbonne.fr',              'France',    'a_traiter', 78),
  ('distributeur', 'distributeur', 'Reimo',                'https://www.reimo.com/fr',              'France',    'a_traiter', 75),
  ('distributeur', 'distributeur', 'Obelink',              'https://www.obelink.fr',               'Pays-Bas',  'a_traiter', 72);
