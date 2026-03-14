-- SmashHub: Run this entire file in Supabase SQL Editor
-- https://supabase.com/dashboard/project/siwcdegiavwcvgjegiww/sql/new
-- Copy all, paste, click Run

-- ========== 1. Base schema (strikerclips_schema.sql) ==========
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  social_links jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.clips (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  source_type text check (source_type in ('youtube', 'upload')) not null,
  url_or_path text not null,
  start_sec integer,
  end_sec integer,
  thumbnail text,
  title text,
  created_at timestamptz default now()
);

create table if not exists public.reels (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  clip_ids uuid[] default '{}',
  combined_video_url text,
  thumbnail text,
  created_at timestamptz default now()
);

create table if not exists public.matches (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  reel_ids uuid[] default '{}',
  live_stream_url text,
  created_at timestamptz default now()
);

create table if not exists public.live_streams (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  youtube_url text not null,
  title text,
  match_id uuid references public.matches(id) on delete set null,
  is_live boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.servers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  clan_tag text,
  icon_url text,
  created_at timestamptz default now()
);

create table if not exists public.server_members (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member',
  created_at timestamptz default now(),
  unique(server_id, user_id)
);

create table if not exists public.channels (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  name text not null,
  type text check (type in ('text', 'clips')) default 'text',
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null default '',
  clip_id uuid references public.clips(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.reactions (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(message_id, user_id, emoji)
);

create table if not exists public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

create table if not exists public.reel_likes (
  id uuid default uuid_generate_v4() primary key,
  reel_id uuid references public.reels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(reel_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.clips enable row level security;
alter table public.reels enable row level security;
alter table public.matches enable row level security;
alter table public.servers enable row level security;
alter table public.server_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;
alter table public.follows enable row level security;
alter table public.reel_likes enable row level security;
alter table public.live_streams enable row level security;

create policy "Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Clips viewable by everyone" on public.clips for select using (true);
create policy "Users insert own clips" on public.clips for insert with check (auth.uid() = user_id);
create policy "Users update own clips" on public.clips for update using (auth.uid() = user_id);
create policy "Users delete own clips" on public.clips for delete using (auth.uid() = user_id);

create policy "Reels viewable by everyone" on public.reels for select using (true);
create policy "Users insert own reels" on public.reels for insert with check (auth.uid() = user_id);
create policy "Users update own reels" on public.reels for update using (auth.uid() = user_id);
create policy "Users delete own reels" on public.reels for delete using (auth.uid() = user_id);

create policy "Matches viewable by everyone" on public.matches for select using (true);
create policy "Users insert matches" on public.matches for insert with check (auth.uid() is not null);
create policy "Users update matches" on public.matches for update using (auth.uid() is not null);
create policy "Users delete matches" on public.matches for delete using (auth.uid() is not null);

create policy "Servers viewable by everyone" on public.servers for select using (true);
create policy "Users create servers" on public.servers for insert with check (auth.uid() is not null);
create policy "Users update servers" on public.servers for update using (auth.uid() is not null);

do $$ begin alter table public.matches add column if not exists live_stream_url text; exception when others then null; end $$;
do $$ begin alter table public.servers add column if not exists clan_tag text; exception when others then null; end $$;

create policy "Server members viewable" on public.server_members for select using (true);
create policy "Users join servers" on public.server_members for insert with check (auth.uid() = user_id);
create policy "Users leave servers" on public.server_members for delete using (auth.uid() = user_id);

create policy "Channels viewable" on public.channels for select using (true);
create policy "Users create channels" on public.channels for insert with check (auth.uid() is not null);
create policy "Users update channels" on public.channels for update using (auth.uid() is not null);

create policy "Messages viewable" on public.messages for select using (true);
create policy "Users insert messages" on public.messages for insert with check (auth.uid() = user_id);
create policy "Users update own messages" on public.messages for update using (auth.uid() = user_id);
create policy "Users delete own messages" on public.messages for delete using (auth.uid() = user_id);

create policy "Reactions viewable" on public.reactions for select using (true);
create policy "Users add reactions" on public.reactions for insert with check (auth.uid() = user_id);
create policy "Users remove own reactions" on public.reactions for delete using (auth.uid() = user_id);

create policy "Follows viewable" on public.follows for select using (true);
create policy "Users follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users unfollow" on public.follows for delete using (auth.uid() = follower_id);

create policy "Reel likes viewable" on public.reel_likes for select using (true);
create policy "Users like reels" on public.reel_likes for insert with check (auth.uid() = user_id);
create policy "Users unlike reels" on public.reel_likes for delete using (auth.uid() = user_id);

create policy "Live streams viewable" on public.live_streams for select using (true);
create policy "Users insert live streams" on public.live_streams for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
declare base_username text; final_username text;
begin
  base_username := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1), 'user_' || substr(new.id::text, 1, 8));
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '_', 'g');
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := base_username || '_' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into public.profiles (id, username) values (new.id, final_username);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public) select 'videos', 'videos', true where not exists (select 1 from storage.buckets where id = 'videos');
insert into storage.buckets (id, name, public) select 'avatars', 'avatars', true where not exists (select 1 from storage.buckets where id = 'avatars');

create policy "StrikerClips videos viewable" on storage.objects for select using (bucket_id = 'videos');
create policy "StrikerClips users upload videos" on storage.objects for insert with check (bucket_id = 'videos' and auth.uid() is not null);
create policy "StrikerClips users update own videos" on storage.objects for update using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "StrikerClips users delete own videos" on storage.objects for delete using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "StrikerClips avatars viewable" on storage.objects for select using (bucket_id = 'avatars');
create policy "StrikerClips users upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
create policy "StrikerClips users update own avatars" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "StrikerClips users delete own avatars" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

do $$ begin alter table public.channels add constraint channels_server_name_unique unique (server_id, name); exception when duplicate_object then null; end $$;

insert into public.servers (id, name, clan_tag) values ('00000000-0000-0000-0000-000000000001', 'SmashHub Highlights', 'SML') on conflict (id) do update set name = excluded.name, clan_tag = coalesce(excluded.clan_tag, servers.clan_tag);
insert into public.channels (server_id, name, type) values ('00000000-0000-0000-0000-000000000001', 'general', 'text'), ('00000000-0000-0000-0000-000000000001', 'highlights', 'clips'), ('00000000-0000-0000-0000-000000000001', 'clips', 'clips') on conflict (server_id, name) do nothing;

-- ========== 2. Live groups + user_youtube_links (003) ==========
create table if not exists public.live_groups (id uuid primary key default uuid_generate_v4(), name text not null, creator_id uuid references public.profiles(id) on delete cascade, created_at timestamptz default now());
create table if not exists public.live_group_members (id uuid primary key default uuid_generate_v4(), group_id uuid references public.live_groups(id) on delete cascade not null, user_id uuid references public.profiles(id) on delete cascade not null, stream_id uuid references public.live_streams(id) on delete set null, accepted boolean default false, unique(group_id, user_id));
create table if not exists public.user_youtube_links (id uuid primary key default uuid_generate_v4(), user_id uuid references public.profiles(id) on delete cascade not null, url text not null, title text, created_at timestamptz default now());

alter table public.live_groups enable row level security;
alter table public.live_group_members enable row level security;
alter table public.user_youtube_links enable row level security;

create policy "Live groups viewable" on public.live_groups for select using (true);
create policy "Users create live groups" on public.live_groups for insert with check (auth.uid() is not null);
create policy "Creators update live groups" on public.live_groups for update using (creator_id = auth.uid());
create policy "Creators delete live groups" on public.live_groups for delete using (creator_id = auth.uid());
create policy "Live group members viewable" on public.live_group_members for select using (true);
create policy "Users insert live group members" on public.live_group_members for insert with check (auth.uid() = user_id or exists (select 1 from public.live_groups g where g.id = group_id and g.creator_id = auth.uid()));
create policy "Users update own live group members" on public.live_group_members for update using (auth.uid() = user_id);
create policy "Users delete own live group members" on public.live_group_members for delete using (auth.uid() = user_id);
create policy "User youtube links viewable by owner" on public.user_youtube_links for select using (auth.uid() = user_id);
create policy "Users insert youtube links" on public.user_youtube_links for insert with check (auth.uid() = user_id);
create policy "Users delete own youtube links" on public.user_youtube_links for delete using (auth.uid() = user_id);

-- ========== 3. Subscriptions + clan (004) ==========
create table if not exists public.subscriptions (id uuid primary key default uuid_generate_v4(), user_id uuid references public.profiles(id) on delete cascade not null, tier text check (tier in ('pro', 'elite')) not null, stripe_subscription_id text, stripe_customer_id text, status text default 'active' check (status in ('active', 'canceled', 'past_due')), current_period_end timestamptz, created_at timestamptz default now(), unique(user_id));
create table if not exists public.clan_subscriptions (id uuid primary key default uuid_generate_v4(), server_id uuid references public.servers(id) on delete cascade not null, stripe_subscription_id text, status text default 'active' check (status in ('active', 'canceled', 'past_due')), current_period_end timestamptz, created_at timestamptz default now(), unique(server_id));
create table if not exists public.server_applications (id uuid primary key default uuid_generate_v4(), server_id uuid references public.servers(id) on delete cascade not null, user_id uuid references public.profiles(id) on delete cascade not null, status text check (status in ('pending', 'approved', 'rejected')) default 'pending', message text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, created_at timestamptz default now(), unique(server_id, user_id));

do $$ begin alter table public.servers add column if not exists join_mode text default 'open' check (join_mode in ('open', 'apply', 'invite')); alter table public.servers add column if not exists criteria jsonb default '{}'; alter table public.servers add column if not exists owner_id uuid references public.profiles(id) on delete set null; alter table public.servers add column if not exists ultra_tier_expires_at timestamptz; exception when others then null; end $$;
do $$ begin alter table public.server_members drop constraint if exists server_members_role_check; alter table public.server_members add constraint server_members_role_check check (role in ('owner', 'admin', 'mod', 'member')); exception when others then null; end $$;

alter table public.subscriptions enable row level security;
alter table public.clan_subscriptions enable row level security;
alter table public.server_applications enable row level security;

create policy "Subscriptions view own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Clan subscriptions viewable" on public.clan_subscriptions for select using (true);
create policy "Server applications viewable by members" on public.server_applications for select using (exists (select 1 from public.server_members sm where sm.server_id = server_applications.server_id and sm.user_id = auth.uid()) or auth.uid() = server_applications.user_id);
create policy "Users apply to servers" on public.server_applications for insert with check (auth.uid() = user_id);
create policy "Owners admins review applications" on public.server_applications for update using (exists (select 1 from public.server_members sm join public.servers s on s.id = sm.server_id where sm.server_id = server_applications.server_id and (sm.user_id = auth.uid() and sm.role in ('owner', 'admin')) or s.owner_id = auth.uid()));

create table if not exists public.live_stream_switch_log (id uuid primary key default uuid_generate_v4(), group_id uuid references public.live_groups(id) on delete cascade, stream_id uuid references public.live_streams(id) on delete cascade, started_at timestamptz not null, ended_at timestamptz);
do $$ begin alter table public.live_streams add column if not exists server_id uuid references public.servers(id) on delete set null; exception when others then null; end $$;

drop policy if exists "Users leave servers" on public.server_members;
create policy "Users leave own or owners kick" on public.server_members for delete using (auth.uid() = user_id or exists (select 1 from public.server_members sm join public.servers s on s.id = sm.server_id where sm.server_id = server_members.server_id and sm.user_id = auth.uid() and (sm.role in ('owner', 'admin') or s.owner_id = auth.uid())));
create policy "Owners admins update members" on public.server_members for update using (exists (select 1 from public.server_members sm join public.servers s on s.id = sm.server_id where sm.server_id = server_members.server_id and sm.user_id = auth.uid() and (sm.role in ('owner', 'admin') or s.owner_id = auth.uid())));

-- ========== 4. Tournaments (005) ==========
create table if not exists public.tournaments (id uuid primary key default uuid_generate_v4(), name text not null, description text, server_id uuid references public.servers(id) on delete set null, created_at timestamptz default now(), created_by uuid references public.profiles(id) on delete set null);
alter table public.tournaments enable row level security;
create policy "Tournaments viewable" on public.tournaments for select using (true);
create policy "Users create tournaments" on public.tournaments for insert with check (auth.uid() is not null);
create policy "Users update tournaments" on public.tournaments for update using (auth.uid() is not null);
create policy "Users delete tournaments" on public.tournaments for delete using (auth.uid() is not null);

-- ========== 5. patternAft3r auto-follow (006) ==========
create or replace function public.auto_follow_patternaft3r()
returns trigger as $$
declare p_id uuid;
begin
  if new.username = 'patternAft3r' then return new; end if;
  select id into p_id from public.profiles where username = 'patternAft3r' limit 1;
  if p_id is null then return new; end if;
  insert into public.follows (follower_id, following_id) values (p_id, new.id) on conflict (follower_id, following_id) do nothing;
  insert into public.follows (follower_id, following_id) values (new.id, p_id) on conflict (follower_id, following_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_profile_created_auto_follow on public.profiles;
create trigger on_profile_created_auto_follow after insert on public.profiles for each row execute procedure public.auto_follow_patternaft3r();
do $$
declare p_id uuid; r record;
begin
  select id into p_id from public.profiles where username = 'patternAft3r' limit 1;
  if p_id is null then return; end if;
  for r in select id from public.profiles where id != p_id loop
    insert into public.follows (follower_id, following_id) values (p_id, r.id) on conflict (follower_id, following_id) do nothing;
    insert into public.follows (follower_id, following_id) values (r.id, p_id) on conflict (follower_id, following_id) do nothing;
  end loop;
end $$;

-- ========== 6. YouTube + Facebook columns (007) ==========
do $$ begin alter table public.profiles add column if not exists youtube_channel_id text; exception when others then null; end $$;
do $$ begin alter table public.profiles add column if not exists facebook_id text; exception when others then null; end $$;
