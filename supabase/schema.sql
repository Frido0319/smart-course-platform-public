create extension if not exists pgcrypto;

create table if not exists courses (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references courses(id) on delete cascade,
  version text not null,
  title text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(course_id, version)
);

create table if not exists course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references courses(id) on delete cascade,
  version_id uuid references course_versions(id) on delete set null,
  resource_type text not null check (resource_type in ('manifest', 'chapter', 'problem', 'image', 'html')),
  title text not null,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text not null default '',
  course_id text not null references courses(id) on delete cascade,
  status text not null default 'unused' check (status in ('unused', 'active', 'disabled', 'expired')),
  bound_device_id text,
  activated_at timestamptz,
  expires_at timestamptz,
  reset_count integer not null default 0,
  max_resets integer not null default 1,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists access_logs (
  id bigserial primary key,
  activation_code_id uuid references activation_codes(id) on delete set null,
  course_id text references courses(id) on delete set null,
  device_id text,
  ip text,
  user_agent text,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table courses enable row level security;
alter table course_versions enable row level security;
alter table course_resources enable row level security;
alter table activation_codes enable row level security;
alter table access_logs enable row level security;

insert into courses (id, title, subtitle)
values (
  'smart-manufacturing',
  'Smart Manufacturing Foundations',
  'Protected bilingual course shell with activation-code access control.'
)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  updated_at = now();

insert into course_versions (course_id, version, title, is_active)
values ('smart-manufacturing', 'demo', 'Smart Manufacturing Foundations Demo', true)
on conflict (course_id, version) do update set
  title = excluded.title,
  is_active = excluded.is_active;
