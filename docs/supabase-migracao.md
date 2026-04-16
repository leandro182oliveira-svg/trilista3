# Migracao para Supabase

## Como o projeto funciona hoje

Hoje os dados ficam no navegador:

- `trilista_users`: usuarios
- `trilista_current_user`: sessao atual
- `trilista_db_<id>`: JSON completo da loja

## O que foi preparado

- Cliente central: `src/javascript/supabase-client.js`
- SQL inicial: `supabase/schema.sql`
- Sincronizacao inicial normalizada para perfil, tema, template, links, galeria, pix e videos

## Primeiro passo no Supabase

1. Abra o `SQL Editor`.
2. Cole o conteudo de `supabase/schema.sql`.
3. Execute.

## Regras de unicidade

No Supabase, o ideal agora e manter estas regras:

- `app_users.email`: unico
- `app_users.nome_empresa`: unico
- `store_profiles.store_name`: unico
- `app_users.recovery_email`: pode repetir

Se o projeto ja estiver criado, rode tambem este ajuste no `SQL Editor`:

```sql
create extension if not exists unaccent;

create unique index if not exists idx_app_users_email_normalized_unique
on public.app_users (lower(btrim(email)));

create unique index if not exists idx_app_users_nome_empresa_normalized_unique
on public.app_users (lower(unaccent(btrim(nome_empresa))));

create unique index if not exists idx_store_profiles_store_name_normalized_unique
on public.store_profiles (lower(unaccent(btrim(store_name))))
where store_name is not null and btrim(store_name) <> '';
```

Se houver dados antigos duplicados, o Supabase vai pedir para corrigir esses registros antes de criar os indices.

## Segundo passo no projeto

Abra `src/javascript/supabase-client.js` e troque:

- `https://YOUR_PROJECT.supabase.co`
- `YOUR_ANON_KEY`

Pelos valores reais do seu projeto em `Project Settings > API`.

## Observacao importante

Isso prepara o banco, mas o login do projeto ainda continua local.
O passo seguinte sera sincronizar os dados atuais do `localStorage` com essas tabelas.

## Tabelas normalizadas adicionadas

Depois da atualizacao do schema, o projeto tambem pode separar os dados em:

- `store_profiles`
- `store_themes`
- `store_templates`
- `store_links`
- `store_gallery_items`
- `store_videos`
- `store_pix_settings`

O JSON em `store_pages` continua existindo como compatibilidade e backup do estado completo.
