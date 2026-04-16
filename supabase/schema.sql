-- Schema inicial para migrar o Site 5 do localStorage para o Supabase.
-- Rode este arquivo no SQL Editor do projeto.

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create table if not exists public.app_users (
    id bigint primary key,
    nome_empresa text not null,
    nome_responsavel text,
    email text not null unique,
    password_hash text not null,
    google_id text unique,
    role text not null default 'user' check (role in ('admin', 'seller', 'user')),
    status text not null default 'active' check (status in ('active', 'blocked', 'disabled')),
    force_password_change boolean not null default false,
    created_by bigint,
    db_key text not null unique,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_users
    add column if not exists password_hash text,
    add column if not exists google_id text,
    add column if not exists force_password_change boolean not null default false;

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'app_users'
          and column_name = 'senha_hash'
    ) then
        execute $sql$
            update public.app_users
            set password_hash = coalesce(password_hash, senha_hash, encode(gen_random_bytes(32), 'hex'))
            where password_hash is null
        $sql$;

        execute 'alter table public.app_users drop column if exists senha_hash';
    else
        update public.app_users
        set password_hash = coalesce(password_hash, encode(gen_random_bytes(32), 'hex'))
        where password_hash is null;
    end if;

    execute 'alter table public.app_users drop column if exists recovery_email';
    execute 'alter table public.app_users alter column password_hash set not null';
end
$$;

create unique index if not exists idx_app_users_google_id_unique
on public.app_users (google_id)
where google_id is not null;

create table if not exists public.store_pages (
    id uuid primary key default gen_random_uuid(),
    user_id bigint not null unique references public.app_users(id) on delete cascade,
    db_key text not null unique,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_store_pages_updated_at on public.store_pages;
create trigger trg_store_pages_updated_at
before update on public.store_pages
for each row
execute function public.set_updated_at();

create table if not exists public.store_profiles (
    user_id bigint primary key references public.app_users(id) on delete cascade,
    db_key text not null unique,
    store_name text,
    bio text,
    profile_photo text,
    cover_photo text,
    show_view_counter boolean not null default false,
    categoria1 text,
    categoria2 text,
    categoria3 text,
    categoria4 text,
    address text,
    neighborhood text,
    city text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_app_users_email_normalized_unique
on public.app_users (lower(btrim(email)));

create unique index if not exists idx_app_users_nome_empresa_normalized_unique
on public.app_users (lower(unaccent(btrim(nome_empresa))));

create unique index if not exists idx_store_profiles_store_name_normalized_unique
on public.store_profiles (lower(unaccent(btrim(store_name))))
where store_name is not null and btrim(store_name) <> '';

create table if not exists public.store_themes (
    user_id bigint primary key references public.app_users(id) on delete cascade,
    db_key text not null unique,
    name text,
    primary_color text,
    secondary_color text,
    text_color text,
    font text,
    raw_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_templates (
    user_id bigint primary key references public.app_users(id) on delete cascade,
    db_key text not null unique,
    name text,
    raw_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_links (
    id bigint primary key,
    user_id bigint not null references public.app_users(id) on delete cascade,
    db_key text not null,
    type text,
    label text,
    title text,
    value text,
    url text,
    icon text,
    position integer,
    active boolean default true,
    raw_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_gallery_items (
    id text primary key,
    user_id bigint not null references public.app_users(id) on delete cascade,
    db_key text not null,
    image_url text,
    caption text,
    alt_text text,
    position integer,
    raw_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_videos (
    id text primary key,
    user_id bigint not null references public.app_users(id) on delete cascade,
    db_key text not null,
    title text,
    url text,
    thumbnail text,
    position integer,
    raw_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_pix_settings (
    user_id bigint primary key references public.app_users(id) on delete cascade,
    db_key text not null unique,
    enabled boolean not null default false,
    key_type text,
    key_value text,
    raw_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_store_profiles_updated_at on public.store_profiles;
create trigger trg_store_profiles_updated_at
before update on public.store_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_store_themes_updated_at on public.store_themes;
create trigger trg_store_themes_updated_at
before update on public.store_themes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_store_templates_updated_at on public.store_templates;
create trigger trg_store_templates_updated_at
before update on public.store_templates
for each row
execute function public.set_updated_at();

drop trigger if exists trg_store_links_updated_at on public.store_links;
create trigger trg_store_links_updated_at
before update on public.store_links
for each row
execute function public.set_updated_at();

drop trigger if exists trg_store_gallery_items_updated_at on public.store_gallery_items;
create trigger trg_store_gallery_items_updated_at
before update on public.store_gallery_items
for each row
execute function public.set_updated_at();

drop trigger if exists trg_store_videos_updated_at on public.store_videos;
create trigger trg_store_videos_updated_at
before update on public.store_videos
for each row
execute function public.set_updated_at();

drop trigger if exists trg_store_pix_settings_updated_at on public.store_pix_settings;
create trigger trg_store_pix_settings_updated_at
before update on public.store_pix_settings
for each row
execute function public.set_updated_at();
