create extension if not exists pgcrypto;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce((auth.jwt() ->> 'email'), ''));
$$;

create table if not exists public.app_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nome text not null,
  role text not null check (role in ('admin', 'cliente')),
  ativo boolean not null default true,
  scope_type text not null check (scope_type in ('all', 'cliente_cod', 'fornecedor_prefix')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.account_access_scopes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.app_accounts(id) on delete cascade,
  loja text not null,
  cliente_cod text,
  fornecedor_prefix text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.catalog_directory_entries (
  id uuid primary key default gen_random_uuid(),
  loja text not null,
  cliente_cod text not null,
  fornecedor_prefix text not null,
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint catalog_directory_entries_unique unique (loja, cliente_cod, fornecedor_prefix)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_app_accounts_updated_at on public.app_accounts;
create trigger trg_app_accounts_updated_at
before update on public.app_accounts
for each row
execute function public.set_updated_at();

drop trigger if exists trg_catalog_directory_entries_updated_at on public.catalog_directory_entries;
create trigger trg_catalog_directory_entries_updated_at
before update on public.catalog_directory_entries
for each row
execute function public.set_updated_at();

create or replace function public.is_admin_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.app_accounts
    where lower(email) = public.current_user_email()
      and role = 'admin'
      and ativo = true
  );
$$;

create or replace function public.account_status_by_email(target_email text)
returns table (
  email text,
  nome text,
  role text,
  ativo boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    app_accounts.email,
    app_accounts.nome,
    app_accounts.role,
    app_accounts.ativo
  from public.app_accounts
  where lower(app_accounts.email) = lower(target_email)
  limit 1;
$$;

alter table public.app_accounts enable row level security;
alter table public.account_access_scopes enable row level security;
alter table public.catalog_directory_entries enable row level security;

drop policy if exists "accounts_select_own_or_admin" on public.app_accounts;
create policy "accounts_select_own_or_admin"
on public.app_accounts
for select
using (
  public.is_admin_account()
  or lower(email) = public.current_user_email()
);

drop policy if exists "accounts_insert_admin_only" on public.app_accounts;
create policy "accounts_insert_admin_only"
on public.app_accounts
for insert
with check (public.is_admin_account());

drop policy if exists "accounts_update_admin_only" on public.app_accounts;
create policy "accounts_update_admin_only"
on public.app_accounts
for update
using (public.is_admin_account())
with check (public.is_admin_account());

drop policy if exists "account_scopes_select_own_or_admin" on public.account_access_scopes;
create policy "account_scopes_select_own_or_admin"
on public.account_access_scopes
for select
using (
  public.is_admin_account()
  or exists (
    select 1
    from public.app_accounts
    where public.app_accounts.id = account_access_scopes.account_id
      and lower(public.app_accounts.email) = public.current_user_email()
  )
);

drop policy if exists "account_scopes_insert_admin_only" on public.account_access_scopes;
create policy "account_scopes_insert_admin_only"
on public.account_access_scopes
for insert
with check (public.is_admin_account());

drop policy if exists "account_scopes_update_admin_only" on public.account_access_scopes;
create policy "account_scopes_update_admin_only"
on public.account_access_scopes
for update
using (public.is_admin_account())
with check (public.is_admin_account());

drop policy if exists "account_scopes_delete_admin_only" on public.account_access_scopes;
create policy "account_scopes_delete_admin_only"
on public.account_access_scopes
for delete
using (public.is_admin_account());

drop policy if exists "directory_select_authenticated" on public.catalog_directory_entries;
create policy "directory_select_authenticated"
on public.catalog_directory_entries
for select
using (auth.role() = 'authenticated');

drop policy if exists "directory_insert_admin_only" on public.catalog_directory_entries;
create policy "directory_insert_admin_only"
on public.catalog_directory_entries
for insert
with check (public.is_admin_account());

drop policy if exists "directory_update_admin_only" on public.catalog_directory_entries;
create policy "directory_update_admin_only"
on public.catalog_directory_entries
for update
using (public.is_admin_account())
with check (public.is_admin_account());

insert into public.app_accounts (email, nome, role, ativo, scope_type)
values ('admin@m3rcadeo.com', 'Operacao M3rcadeo', 'admin', true, 'all')
on conflict (email) do nothing;
