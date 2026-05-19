-- RealEstate OS v2 — Miami Rental CRM
-- Run in: Supabase → SQL Editor → Run All

-- ─────────────────────────────────────────────
-- PROPIEDADES (v2)
-- ─────────────────────────────────────────────
create table if not exists propiedades (
  id            uuid primary key default gen_random_uuid(),
  direccion     text not null,
  edificio      text,
  zona          text,
  precio_renta  numeric,
  habitaciones  smallint,
  banos         numeric,
  sqft          integer,
  piso          smallint,
  amenidades    jsonb default '{}',
  descripcion_es text,
  descripcion_en text,
  estado        text not null default 'Disponible',
  fotos_urls    text[] default '{}',
  video_url     text,
  mls_number    text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- LEADS (v2 — qualification fields embedded)
-- ─────────────────────────────────────────────
create table if not exists leads (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  telefono              text,
  email                 text,
  fuente                text,
  -- Search criteria
  fecha_mudanza         date,
  personas_vivir        smallint,
  presupuesto           numeric,
  habitaciones          smallint,
  -- Qualification
  tiene_credito         boolean,
  credito_score         smallint,
  estados_cuenta        boolean,
  comprobante_ingresos  boolean,
  realtor_previo        boolean,
  mascotas              boolean,
  tipo_mascotas         text,
  evictions             boolean,
  fondos_disponibles    boolean,
  -- Auto-computed
  qualification_score   smallint,
  qualification_status  text,
  -- Pipeline
  estado                text not null default 'Nuevo',
  propiedad_interes     uuid references propiedades(id) on delete set null,
  notas                 text,
  created_at            timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- VISITAS
-- ─────────────────────────────────────────────
create table if not exists visitas (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references leads(id) on delete set null,
  propiedad_id  uuid references propiedades(id) on delete set null,
  fecha         date not null,
  hora          time,
  notas         text,
  resultado     text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- CIERRES
-- ─────────────────────────────────────────────
create table if not exists cierres (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references leads(id) on delete set null,
  propiedad_id  uuid references propiedades(id) on delete set null,
  fecha_cierre  date not null,
  comision      numeric,
  notas         text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
create index if not exists leads_estado_idx           on leads(estado);
create index if not exists leads_created_at_idx       on leads(created_at desc);
create index if not exists leads_qual_status_idx      on leads(qualification_status);
create index if not exists propiedades_zona_idx       on propiedades(zona);
create index if not exists propiedades_estado_idx     on propiedades(estado);
create index if not exists visitas_fecha_idx          on visitas(fecha);
create index if not exists cierres_fecha_cierre_idx   on cierres(fecha_cierre);

-- ─────────────────────────────────────────────
-- STORAGE BUCKET
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('propiedades', 'propiedades', true)
on conflict (id) do nothing;

-- Allow all operations on the bucket (internal tool)
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'propiedades_public' and tablename = 'objects'
  ) then
    execute 'create policy "propiedades_public" on storage.objects for all using (bucket_id = ''propiedades'') with check (bucket_id = ''propiedades'')';
  end if;
end $$;

-- ─────────────────────────────────────────────
-- V1 → V2 MIGRATION (if upgrading, uncomment)
-- ─────────────────────────────────────────────
-- alter table leads add column if not exists personas_vivir smallint;
-- alter table leads add column if not exists tiene_credito boolean;
-- alter table leads add column if not exists credito_score smallint;
-- alter table leads add column if not exists estados_cuenta boolean;
-- alter table leads add column if not exists comprobante_ingresos boolean;
-- alter table leads add column if not exists realtor_previo boolean;
-- alter table leads add column if not exists mascotas boolean;
-- alter table leads add column if not exists tipo_mascotas text;
-- alter table leads add column if not exists evictions boolean;
-- alter table leads add column if not exists fondos_disponibles boolean;
-- alter table leads add column if not exists qualification_score smallint;
-- alter table leads add column if not exists qualification_status text;
-- alter table leads add column if not exists propiedad_interes uuid;
-- alter table propiedades add column if not exists edificio text;
-- alter table propiedades add column if not exists zona text;
-- alter table propiedades add column if not exists sqft integer;
-- alter table propiedades add column if not exists piso smallint;
-- alter table propiedades add column if not exists amenidades jsonb default '{}';
-- alter table propiedades add column if not exists descripcion_es text;
-- alter table propiedades add column if not exists descripcion_en text;
-- alter table propiedades add column if not exists video_url text;
-- alter table propiedades add column if not exists mls_number text;
-- alter table propiedades rename column precio to precio_renta;
