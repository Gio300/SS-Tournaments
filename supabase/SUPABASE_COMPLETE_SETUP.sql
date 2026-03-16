-- ========== SMASHHUB: COMPLETE SUPABASE SETUP ==========
-- Erase SQL Editor, paste this entire block, click Run
-- FIX: DROP POLICY only takes policy_name ON table; no "for insert/update/delete" clause

create extension if not exists "uuid-ossp";

-- ========== 1. BASE SCHEMA ==========
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

drop policy if exists "Profiles viewable by everyone" on public.profiles;
create policy "Profiles viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Clips viewable by everyone" on public.clips;
create policy "Clips viewable by everyone" on public.clips for select using (true);
drop policy if exists "Users insert own clips" on public.clips;
create policy "Users insert own clips" on public.clips for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own clips" on public.clips;
create policy "Users update own clips" on public.clips for update using (auth.uid() = user_id);
drop policy if exists "Users delete own clips" on public.clips;
create policy "Users delete own clips" on public.clips for delete using (auth.uid() = user_id);

drop policy if exists "Reels viewable by everyone" on public.reels;
create policy "Reels viewable by everyone" on public.reels for select using (true);
drop policy if exists "Users insert own reels" on public.reels;
create policy "Users insert own reels" on public.reels for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own reels" on public.reels;
create policy "Users update own reels" on public.reels for update using (auth.uid() = user_id);
drop policy if exists "Users delete own reels" on public.reels;
create policy "Users delete own reels" on public.reels for delete using (auth.uid() = user_id);

drop policy if exists "Matches viewable by everyone" on public.matches;
create policy "Matches viewable by everyone" on public.matches for select using (true);
drop policy if exists "Users insert matches" on public.matches;
create policy "Users insert matches" on public.matches for insert with check (auth.uid() is not null);
drop policy if exists "Users update matches" on public.matches;
create policy "Users update matches" on public.matches for update using (auth.uid() is not null);
drop policy if exists "Users delete matches" on public.matches;
create policy "Users delete matches" on public.matches for delete using (auth.uid() = user_id);

drop policy if exists "Servers viewable by everyone" on public.servers;
create policy "Servers viewable by everyone" on public.servers for select using (true);
drop policy if exists "Users create servers" on public.servers;
create policy "Users create servers" on public.servers for insert with check (auth.uid() is not null);
drop policy if exists "Users update servers" on public.servers;
create policy "Users update servers" on public.servers for update using (auth.uid() = user_id);

do $$ begin alter table public.matches add column if not exists live_stream_url text; exception when others then null; end $$;
do $$ begin alter table public.servers add column if not exists clan_tag text; exception when others then null; end $$;

drop policy if exists "Server members viewable" on public.server_members;
create policy "Server members viewable" on public.server_members for select using (true);
drop policy if exists "Users join servers" on public.server_members;
create policy "Users join servers" on public.server_members for insert with check (auth.uid() = user_id);
drop policy if exists "Users leave servers" on public.server_members;
create policy "Users leave servers" on public.server_members for delete using (auth.uid() = user_id);

drop policy if exists "Channels viewable" on public.channels;
create policy "Channels viewable" on public.channels for select using (true);
drop policy if exists "Users create channels" on public.channels;
create policy "Users create channels" on public.channels for insert with check (auth.uid() is not null);
drop policy if exists "Users update channels" on public.channels;
create policy "Users update channels" on public.channels for update using (auth.uid() = user_id);

drop policy if exists "Messages viewable" on public.messages;
create policy "Messages viewable" on public.messages for select using (true);
drop policy if exists "Users insert messages" on public.messages;
create policy "Users insert messages" on public.messages for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own messages" on public.messages;
create policy "Users update own messages" on public.messages for update using (auth.uid() = user_id);
drop policy if exists "Users delete own messages" on public.messages;
create policy "Users delete own messages" on public.messages for delete using (auth.uid() = user_id);

drop policy if exists "Reactions viewable" on public.reactions;
create policy "Reactions viewable" on public.reactions for select using (true);
drop policy if exists "Users add reactions" on public.reactions;
create policy "Users add reactions" on public.reactions for insert with check (auth.uid() = user_id);
drop policy if exists "Users remove own reactions" on public.reactions;
create policy "Users remove own reactions" on public.reactions for delete using (auth.uid() = user_id);

drop policy if exists "Follows viewable" on public.follows;
create policy "Follows viewable" on public.follows for select using (true);
drop policy if exists "Users follow" on public.follows;
create policy "Users follow" on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists "Users unfollow" on public.follows;
create policy "Users unfollow" on public.follows for delete using (auth.uid() = follower_id);

drop policy if exists "Reel likes viewable" on public.reel_likes;
create policy "Reel likes viewable" on public.reel_likes for select using (true);
drop policy if exists "Users like reels" on public.reel_likes;
create policy "Users like reels" on public.reel_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Users unlike reels" on public.reel_likes;
create policy "Users unlike reels" on public.reel_likes for delete using (auth.uid() = user_id);

drop policy if exists "Live streams viewable" on public.live_streams;
create policy "Live streams viewable" on public.live_streams for select using (true);
drop policy if exists "Users insert live streams" on public.live_streams;
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

-- FIX: DROP POLICY syntax is "DROP POLICY name ON table" - no FOR clause
drop policy if exists "StrikerClips videos viewable" on storage.objects;
create policy "StrikerClips videos viewable" on storage.objects for select using (bucket_id = 'videos');
drop policy if exists "StrikerClips users upload videos" on storage.objects;
create policy "StrikerClips users upload videos" on storage.objects for insert with check (bucket_id = 'videos' and auth.uid() is not null);
drop policy if exists "StrikerClips users update own videos" on storage.objects;
create policy "StrikerClips users update own videos" on storage.objects for update using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "StrikerClips users delete own videos" on storage.objects;
create policy "StrikerClips users delete own videos" on storage.objects for delete using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "StrikerClips avatars viewable" on storage.objects;
create policy "StrikerClips avatars viewable" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "StrikerClips users upload avatars" on storage.objects;
create policy "StrikerClips users upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
drop policy if exists "StrikerClips users update own avatars" on storage.objects;
create policy "StrikerClips users update own avatars" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "StrikerClips users delete own avatars" on storage.objects;
create policy "StrikerClips users delete own avatars" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

do $$ begin alter table public.channels add constraint channels_server_name_unique unique (server_id, name); exception when duplicate_object then null; end $$;

insert into public.servers (id, name, clan_tag) values ('00000000-0000-0000-0000-000000000001', 'SmashHub Highlights', null) on conflict (id) do update set name = excluded.name, clan_tag = excluded.clan_tag;
insert into public.channels (server_id, name, type) values ('00000000-0000-0000-0000-000000000001', 'general', 'text'), ('00000000-0000-0000-0000-000000000001', 'highlights', 'clips'), ('00000000-0000-0000-0000-000000000001', 'clips', 'clips') on conflict (server_id, name) do nothing;

-- ========== 2. LIVE GROUPS + YOUTUBE LINKS ==========
create table if not exists public.live_groups (id uuid primary key default uuid_generate_v4(), name text not null, creator_id uuid references public.profiles(id) on delete cascade, created_at timestamptz default now());
create table if not exists public.live_group_members (id uuid primary key default uuid_generate_v4(), group_id uuid references public.live_groups(id) on delete cascade not null, user_id uuid references public.profiles(id) on delete cascade not null, stream_id uuid references public.live_streams(id) on delete set null, accepted boolean default false, unique(group_id, user_id));
create table if not exists public.user_youtube_links (id uuid primary key default uuid_generate_v4(), user_id uuid references public.profiles(id) on delete cascade not null, url text not null, title text, created_at timestamptz default now());

alter table public.live_groups enable row level security;
alter table public.live_group_members enable row level security;
alter table public.user_youtube_links enable row level security;

drop policy if exists "Live groups viewable" on public.live_groups;
create policy "Live groups viewable" on public.live_groups for select using (true);
drop policy if exists "Users create live groups" on public.live_groups;
create policy "Users create live groups" on public.live_groups for insert with check (auth.uid() is not null);
drop policy if exists "Creators update live groups" on public.live_groups;
create policy "Creators update live groups" on public.live_groups for update using (creator_id = auth.uid());
drop policy if exists "Creators delete live groups" on public.live_groups;
create policy "Creators delete live groups" on public.live_groups for delete using (creator_id = auth.uid());
drop policy if exists "Live group members viewable" on public.live_group_members;
create policy "Live group members viewable" on public.live_group_members for select using (true);
drop policy if exists "Users insert live group members" on public.live_group_members;
create policy "Users insert live group members" on public.live_group_members for insert with check (auth.uid() = user_id or exists (select 1 from public.live_groups g where g.id = group_id and g.creator_id = auth.uid()));
drop policy if exists "Users update own live group members" on public.live_group_members;
create policy "Users update own live group members" on public.live_group_members for update using (auth.uid() = user_id);
drop policy if exists "Users delete own live group members" on public.live_group_members;
create policy "Users delete own live group members" on public.live_group_members for delete using (auth.uid() = user_id);
drop policy if exists "User youtube links viewable by owner" on public.user_youtube_links;
create policy "User youtube links viewable by owner" on public.user_youtube_links for select using (auth.uid() = user_id);
drop policy if exists "Users insert youtube links" on public.user_youtube_links;
create policy "Users insert youtube links" on public.user_youtube_links for insert with check (auth.uid() = user_id);
drop policy if exists "Users delete own youtube links" on public.user_youtube_links;
create policy "Users delete own youtube links" on public.user_youtube_links for delete using (auth.uid() = user_id);

-- ========== 3. SUBSCRIPTIONS + CLAN ==========
create table if not exists public.subscriptions (id uuid primary key default uuid_generate_v4(), user_id uuid references public.profiles(id) on delete cascade not null, tier text check (tier in ('pro', 'elite')) not null, stripe_subscription_id text, stripe_customer_id text, status text default 'active' check (status in ('active', 'canceled', 'past_due')), current_period_end timestamptz, created_at timestamptz default now(), unique(user_id));
create table if not exists public.clan_subscriptions (id uuid primary key default uuid_generate_v4(), server_id uuid references public.servers(id) on delete cascade not null, stripe_subscription_id text, status text default 'active' check (status in ('active', 'canceled', 'past_due')), current_period_end timestamptz, created_at timestamptz default now(), unique(server_id));
create table if not exists public.server_applications (id uuid primary key default uuid_generate_v4(), server_id uuid references public.servers(id) on delete cascade not null, user_id uuid references public.profiles(id) on delete cascade not null, status text check (status in ('pending', 'approved', 'rejected')) default 'pending', message text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, created_at timestamptz default now(), unique(server_id, user_id));

do $$ begin alter table public.servers add column if not exists join_mode text default 'open' check (join_mode in ('open', 'apply', 'invite')); alter table public.servers add column if not exists criteria jsonb default '{}'; alter table public.servers add column if not exists owner_id uuid references public.profiles(id) on delete set null; alter table public.servers add column if not exists ultra_tier_expires_at timestamptz; exception when others then null; end $$;
do $$ begin alter table public.server_members drop constraint if exists server_members_role_check; alter table public.server_members add constraint server_members_role_check check (role in ('owner', 'admin', 'mod', 'member')); exception when others then null; end $$;

alter table public.subscriptions enable row level security;
alter table public.clan_subscriptions enable row level security;
alter table public.server_applications enable row level security;

drop policy if exists "Subscriptions view own" on public.subscriptions;
create policy "Subscriptions view own" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "Clan subscriptions viewable" on public.clan_subscriptions;
create policy "Clan subscriptions viewable" on public.clan_subscriptions for select using (true);
drop policy if exists "Server applications viewable by members" on public.server_applications;
create policy "Server applications viewable by members" on public.server_applications for select using (exists (select 1 from public.server_members sm where sm.server_id = server_applications.server_id and sm.user_id = auth.uid()) or auth.uid() = server_applications.user_id);
drop policy if exists "Users apply to servers" on public.server_applications;
create policy "Users apply to servers" on public.server_applications for insert with check (auth.uid() = user_id);
drop policy if exists "Owners admins review applications" on public.server_applications;
create policy "Owners admins review applications" on public.server_applications for update using (exists (select 1 from public.server_members sm join public.servers s on s.id = sm.server_id where sm.server_id = server_applications.server_id and (sm.user_id = auth.uid() and sm.role in ('owner', 'admin') or s.owner_id = auth.uid())));

create table if not exists public.live_stream_switch_log (id uuid primary key default uuid_generate_v4(), group_id uuid references public.live_groups(id) on delete cascade, stream_id uuid references public.live_streams(id) on delete cascade, started_at timestamptz not null, ended_at timestamptz);
do $$ begin alter table public.live_streams add column if not exists server_id uuid references public.servers(id) on delete set null; exception when others then null; end $$;

drop policy if exists "Users leave own or owners kick" on public.server_members;
drop policy if exists "Users leave servers" on public.server_members;
create policy "Users leave own or owners kick" on public.server_members for delete using (auth.uid() = user_id or exists (select 1 from public.server_members sm join public.servers s on s.id = sm.server_id where sm.server_id = server_members.server_id and sm.user_id = auth.uid() and (sm.role in ('owner', 'admin') or s.owner_id = auth.uid())));
drop policy if exists "Owners admins update members" on public.server_members;
create policy "Owners admins update members" on public.server_members for update using (exists (select 1 from public.server_members sm join public.servers s on s.id = sm.server_id where sm.server_id = server_members.server_id and sm.user_id = auth.uid() and (sm.role in ('owner', 'admin') or s.owner_id = auth.uid())));

-- ========== 4. TOURNAMENTS ==========
create table if not exists public.tournaments (id uuid primary key default uuid_generate_v4(), name text not null, description text, server_id uuid references public.servers(id) on delete set null, created_at timestamptz default now(), created_by uuid references public.profiles(id) on delete set null);
alter table public.tournaments enable row level security;
drop policy if exists "Tournaments viewable" on public.tournaments;
create policy "Tournaments viewable" on public.tournaments for select using (true);
drop policy if exists "Users create tournaments" on public.tournaments;
create policy "Users create tournaments" on public.tournaments for insert with check (auth.uid() is not null);
drop policy if exists "Users update tournaments" on public.tournaments;
create policy "Users update tournaments" on public.tournaments for update using (auth.uid() is not null);
drop policy if exists "Users delete tournaments" on public.tournaments;
create policy "Users delete tournaments" on public.tournaments for delete using (auth.uid() is not null);

-- ========== 5. PATTERNAFT3R AUTO-FOLLOW ==========
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

-- ========== 6. YOUTUBE + FACEBOOK COLUMNS ==========
do $$ begin alter table public.profiles add column if not exists youtube_channel_id text; exception when others then null; end $$;
do $$ begin alter table public.profiles add column if not exists facebook_id text; exception when others then null; end $$;

-- ========== 7. COMMUNITY POSTS ==========
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  body text not null,
  created_at timestamptz default now(),
  parent_id uuid references community_posts(id) on delete cascade,
  locked boolean default false
);
alter table community_posts enable row level security;
drop policy if exists "Allow public read" on community_posts;
create policy "Allow public read" on community_posts for select using (true);
drop policy if exists "Allow public insert" on community_posts;
create policy "Allow public insert" on community_posts for insert with check (true);
create index if not exists community_posts_created_at on community_posts(created_at);
create index if not exists community_posts_parent_id on community_posts(parent_id);

-- ========== 8. POSTS (fixes "Failed to post") ==========
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.post_attachments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  type text check (type in ('image', 'reel')) not null,
  url_or_id text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.post_polls (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null unique,
  question text not null,
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.post_poll_options (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.post_polls(id) on delete cascade not null,
  label text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.post_poll_votes (
  id uuid default uuid_generate_v4() primary key,
  option_id uuid references public.post_poll_options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(option_id, user_id)
);

alter table public.posts enable row level security;
alter table public.post_attachments enable row level security;
alter table public.post_polls enable row level security;
alter table public.post_poll_options enable row level security;
alter table public.post_poll_votes enable row level security;

drop policy if exists "Posts viewable by everyone" on public.posts;
create policy "Posts viewable by everyone" on public.posts for select using (true);
drop policy if exists "Users insert own posts" on public.posts;
create policy "Users insert own posts" on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own posts" on public.posts;
create policy "Users update own posts" on public.posts for update using (auth.uid() = user_id);
drop policy if exists "Users delete own posts" on public.posts;
create policy "Users delete own posts" on public.posts for delete using (auth.uid() = user_id);

drop policy if exists "Post attachments viewable" on public.post_attachments;
create policy "Post attachments viewable" on public.post_attachments for select using (true);
drop policy if exists "Users insert attachments for own posts" on public.post_attachments;
create policy "Users insert attachments for own posts" on public.post_attachments for insert with check (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
drop policy if exists "Users delete attachments for own posts" on public.post_attachments;
create policy "Users delete attachments for own posts" on public.post_attachments for delete using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

drop policy if exists "Post polls viewable" on public.post_polls;
create policy "Post polls viewable" on public.post_polls for select using (true);
drop policy if exists "Users insert polls for own posts" on public.post_polls;
create policy "Users insert polls for own posts" on public.post_polls for insert with check (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
drop policy if exists "Users update polls for own posts" on public.post_polls;
create policy "Users update polls for own posts" on public.post_polls for update using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
drop policy if exists "Users delete polls for own posts" on public.post_polls;
create policy "Users delete polls for own posts" on public.post_polls for delete using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

drop policy if exists "Post poll options viewable" on public.post_poll_options;
create policy "Post poll options viewable" on public.post_poll_options for select using (true);
drop policy if exists "Users insert poll options for own posts" on public.post_poll_options;
create policy "Users insert poll options for own posts" on public.post_poll_options for insert with check (exists (select 1 from public.post_polls pp join public.posts p on p.id = pp.post_id where pp.id = poll_id and p.user_id = auth.uid()));

drop policy if exists "Post poll votes viewable" on public.post_poll_votes;
create policy "Post poll votes viewable" on public.post_poll_votes for select using (true);
drop policy if exists "Users vote on polls" on public.post_poll_votes;
create policy "Users vote on polls" on public.post_poll_votes for insert with check (auth.uid() = user_id);
drop policy if exists "Users remove own votes" on public.post_poll_votes;
create policy "Users remove own votes" on public.post_poll_votes for delete using (auth.uid() = user_id);

create index if not exists posts_user_id on public.posts(user_id);
create index if not exists posts_created_at on public.posts(created_at desc);
create index if not exists post_attachments_post_id on public.post_attachments(post_id);
create index if not exists post_poll_options_poll_id on public.post_poll_options(poll_id);
create index if not exists post_poll_votes_option_id on public.post_poll_votes(option_id);

insert into storage.buckets (id, name, public) select 'post-images', 'post-images', true where not exists (select 1 from storage.buckets where id = 'post-images');
drop policy if exists "Post images viewable" on storage.objects;
create policy "Post images viewable" on storage.objects for select using (bucket_id = 'post-images');
drop policy if exists "Users upload post images" on storage.objects;
create policy "Users upload post images" on storage.objects for insert with check (bucket_id = 'post-images' and auth.uid() is not null);
drop policy if exists "Users update own post images" on storage.objects;
create policy "Users update own post images" on storage.objects for update using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "Users delete own post images" on storage.objects;
create policy "Users delete own post images" on storage.objects for delete using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ========== 9. SCREENSHOT RANKINGS + STAT CHECK ==========
do $$ begin alter table public.profiles add column if not exists power_level integer default 0; alter table public.profiles add column if not exists country text; alter table public.profiles add column if not exists dashboard_override jsonb default '{}'; exception when others then null; end $$;

create table if not exists public.match_results (
  id uuid default uuid_generate_v4() primary key,
  uploader_id uuid references public.profiles(id) on delete cascade not null,
  screenshot_url text not null,
  match_type text check (match_type in ('survival', 'quick_match', 'red_white', 'ninja_world_league', 'tournament')) not null,
  status text check (status in ('pending', 'verified', 'rejected')) default 'pending',
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.match_result_players (
  id uuid default uuid_generate_v4() primary key,
  result_id uuid references public.match_results(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('winner', 'loser', 'participant')) not null,
  score integer,
  team text check (team in ('red', 'white')),
  created_at timestamptz default now()
);

create table if not exists public.power_ratings (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  match_type text check (match_type in ('survival', 'quick_match', 'red_white', 'ninja_world_league', 'tournament')) not null,
  rating integer default 1000,
  wins integer default 0,
  losses integer default 0,
  updated_at timestamptz default now(),
  unique(profile_id, match_type)
);

create table if not exists public.trophies (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  trophy_type text not null,
  earned_at timestamptz default now(),
  metadata jsonb default '{}'
);

create table if not exists public.stat_check_submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  character_name text,
  description text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.match_results enable row level security;
alter table public.match_result_players enable row level security;
alter table public.power_ratings enable row level security;
alter table public.trophies enable row level security;
alter table public.stat_check_submissions enable row level security;

drop policy if exists "Match results viewable" on public.match_results;
create policy "Match results viewable" on public.match_results for select using (true);
drop policy if exists "Users insert own match results" on public.match_results;
create policy "Users insert own match results" on public.match_results for insert with check (auth.uid() = uploader_id);
drop policy if exists "Users update own match results" on public.match_results;
create policy "Users update own match results" on public.match_results for update using (auth.uid() = uploader_id);

drop policy if exists "Match result players viewable" on public.match_result_players;
create policy "Match result players viewable" on public.match_result_players for select using (true);
drop policy if exists "Users insert players for own results" on public.match_result_players;
create policy "Users insert players for own results" on public.match_result_players for insert with check (exists (select 1 from public.match_results where id = result_id and uploader_id = auth.uid()));

drop policy if exists "Power ratings viewable" on public.power_ratings;
create policy "Power ratings viewable" on public.power_ratings for select using (true);
drop policy if exists "Power ratings insert" on public.power_ratings;
create policy "Power ratings insert" on public.power_ratings for insert with check (auth.uid() is not null);
drop policy if exists "Power ratings update" on public.power_ratings;
create policy "Power ratings update" on public.power_ratings for update using (auth.uid() is not null);

drop policy if exists "Trophies viewable" on public.trophies;
create policy "Trophies viewable" on public.trophies for select using (true);
drop policy if exists "Trophies insert" on public.trophies;
create policy "Trophies insert" on public.trophies for insert with check (auth.uid() is not null);

drop policy if exists "Stat check viewable" on public.stat_check_submissions;
create policy "Stat check viewable" on public.stat_check_submissions for select using (true);
drop policy if exists "Users insert own stat check" on public.stat_check_submissions;
create policy "Users insert own stat check" on public.stat_check_submissions for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own stat check" on public.stat_check_submissions;
create policy "Users update own stat check" on public.stat_check_submissions for update using (auth.uid() = user_id);

create index if not exists match_results_uploader on public.match_results(uploader_id);
create index if not exists match_results_status on public.match_results(status);
create index if not exists match_results_match_type on public.match_results(match_type);
create index if not exists match_result_players_result on public.match_result_players(result_id);
create index if not exists match_result_players_profile on public.match_result_players(profile_id);
create index if not exists power_ratings_profile on public.power_ratings(profile_id);
create index if not exists power_ratings_match_type on public.power_ratings(match_type);
create index if not exists power_ratings_rating on public.power_ratings(rating desc);
create index if not exists trophies_profile on public.trophies(profile_id);
create index if not exists stat_check_user on public.stat_check_submissions(user_id);
create index if not exists stat_check_status on public.stat_check_submissions(status);

insert into storage.buckets (id, name, public) select 'screenshots', 'screenshots', true where not exists (select 1 from storage.buckets where id = 'screenshots');
drop policy if exists "Screenshots viewable" on storage.objects;
create policy "Screenshots viewable" on storage.objects for select using (bucket_id = 'screenshots');
drop policy if exists "Users upload screenshots" on storage.objects;
create policy "Users upload screenshots" on storage.objects for insert with check (bucket_id = 'screenshots' and auth.uid() is not null);
drop policy if exists "Users update own screenshots" on storage.objects;
create policy "Users update own screenshots" on storage.objects for update using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "Users delete own screenshots" on storage.objects;
create policy "Users delete own screenshots" on storage.objects for delete using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

insert into storage.buckets (id, name, public) select 'stat-check-videos', 'stat-check-videos', true where not exists (select 1 from storage.buckets where id = 'stat-check-videos');
drop policy if exists "Stat check videos viewable" on storage.objects;
create policy "Stat check videos viewable" on storage.objects for select using (bucket_id = 'stat-check-videos');
drop policy if exists "Users upload stat check videos" on storage.objects;
create policy "Users upload stat check videos" on storage.objects for insert with check (bucket_id = 'stat-check-videos' and auth.uid() is not null);
drop policy if exists "Users update own stat check videos" on storage.objects;
create policy "Users update own stat check videos" on storage.objects for update using (bucket_id = 'stat-check-videos' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "Users delete own stat check videos" on storage.objects;
create policy "Users delete own stat check videos" on storage.objects for delete using (bucket_id = 'stat-check-videos' and auth.uid()::text = (storage.foldername(name))[1]);
