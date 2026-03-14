-- Subscriptions, clan subscriptions, server applications, server extensions
-- Run after strikerclips_schema.sql and 003_live_groups_youtube.sql

-- User subscriptions (Pro, Elite)
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  tier text check (tier in ('pro', 'elite')) not null,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text default 'active' check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  unique(user_id)
);

-- Clan Ultra (server-level subscription)
create table if not exists public.clan_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  server_id uuid references public.servers(id) on delete cascade not null,
  stripe_subscription_id text,
  status text default 'active' check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  unique(server_id)
);

-- Server applications (join/apply flow)
create table if not exists public.server_applications (
  id uuid primary key default uuid_generate_v4(),
  server_id uuid references public.servers(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  message text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique(server_id, user_id)
);

-- Server extensions
do $$ begin
  alter table public.servers add column if not exists join_mode text default 'open' check (join_mode in ('open', 'apply', 'invite'));
  alter table public.servers add column if not exists criteria jsonb default '{}';
  alter table public.servers add column if not exists owner_id uuid references public.profiles(id) on delete set null;
  alter table public.servers add column if not exists ultra_tier_expires_at timestamptz;
exception when others then null;
end $$;

-- server_members.role: ensure check for owner, admin, mod, member
do $$ begin
  alter table public.server_members drop constraint if exists server_members_role_check;
  alter table public.server_members add constraint server_members_role_check check (role in ('owner', 'admin', 'mod', 'member'));
exception when others then null;
end $$;

-- RLS for new tables
alter table public.subscriptions enable row level security;
alter table public.clan_subscriptions enable row level security;
alter table public.server_applications enable row level security;

create policy "Subscriptions view own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Clan subscriptions viewable" on public.clan_subscriptions for select using (true);

create policy "Server applications viewable by members" on public.server_applications for select
  using (
    exists (select 1 from public.server_members sm where sm.server_id = server_applications.server_id and sm.user_id = auth.uid())
    or auth.uid() = server_applications.user_id
  );
create policy "Users apply to servers" on public.server_applications for insert with check (auth.uid() = user_id);
create policy "Owners admins review applications" on public.server_applications for update
  using (
    exists (
      select 1 from public.server_members sm
      join public.servers s on s.id = sm.server_id
      where sm.server_id = server_applications.server_id
        and (sm.user_id = auth.uid() and sm.role in ('owner', 'admin'))
        or s.owner_id = auth.uid()
    )
  );

-- Live stream switch log (timeline recorder for post-stream stitch)
create table if not exists public.live_stream_switch_log (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.live_groups(id) on delete cascade,
  stream_id uuid references public.live_streams(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz
);

-- Add server_id to live_streams for clan-only streams
do $$ begin
  alter table public.live_streams add column if not exists server_id uuid references public.servers(id) on delete set null;
exception when others then null;
end $$;

-- Allow owners/admins to kick members and promote
drop policy if exists "Users leave servers" on public.server_members;
create policy "Users leave own or owners kick" on public.server_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.server_members sm
      join public.servers s on s.id = sm.server_id
      where sm.server_id = server_members.server_id and sm.user_id = auth.uid()
        and (sm.role in ('owner', 'admin') or s.owner_id = auth.uid())
    )
  );

create policy "Owners admins update members" on public.server_members for update
  using (
    exists (
      select 1 from public.server_members sm
      join public.servers s on s.id = sm.server_id
      where sm.server_id = server_members.server_id and sm.user_id = auth.uid()
        and (sm.role in ('owner', 'admin') or s.owner_id = auth.uid())
    )
  );
