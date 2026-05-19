-- RealEstate OS — Supabase Schema
-- Run this in your Supabase SQL editor

-- ─────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  telefono      text,
  email         text,
  fuente        text check (fuente in ('Facebook','WhatsApp','Referral','Walk-in','Instagram','Zillow','Otro')),
  presupuesto   numeric,
  fecha_mudanza date,
  habitaciones  smallint,
  estado        text not null default 'Nuevo'
                  check (estado in ('Nuevo','Calificando','Visita','Aplicacion','Cerrado','Perdido')),
  notas         text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- FILTROS / CALIFICACIÓN
-- ─────────────────────────────────────────────
create table if not exists filtros_lead (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              uuid not null references leads(id) on delete cascade,
  credito_score        smallint,
  estados_banco        boolean,
  comprobante_ingresos boolean,
  realtor_previo       boolean,
  mascotas             boolean,
  evictions            boolean,
  aprobado             boolean,
  notas                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (lead_id)
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger filtros_lead_updated_at
  before update on filtros_lead
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────
-- PROPIEDADES
-- ─────────────────────────────────────────────
create table if not exists propiedades (
  id           uuid primary key default gen_random_uuid(),
  direccion    text not null,
  precio       numeric,
  habitaciones smallint,
  banos        numeric,
  descripcion  text,
  estado       text not null default 'Disponible'
                 check (estado in ('Disponible','En Proceso','Rentada','Vendida')),
  fotos_urls   text[],
  created_at   timestamptz not null default now()
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
-- ROW LEVEL SECURITY (optional — for production)
-- ─────────────────────────────────────────────
-- alter table leads enable row level security;
-- alter table filtros_lead enable row level security;
-- alter table propiedades enable row level security;
-- alter table visitas enable row level security;
-- alter table cierres enable row level security;

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
create index if not exists leads_estado_idx on leads(estado);
create index if not exists leads_created_at_idx on leads(created_at desc);
create index if not exists visitas_fecha_idx on visitas(fecha);
create index if not exists cierres_fecha_cierre_idx on cierres(fecha_cierre);
