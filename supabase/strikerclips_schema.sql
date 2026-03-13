-- StrikerClips schema for SS-Tournaments
-- Run in Supabase SQL Editor (same project as community_posts)

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

-- Add live_stream_url to matches if missing (for existing installs)
do $$ begin
  alter table public.matches add column if not exists live_stream_url text;
exception when others then null;
end $$;

-- Add clan_tag to servers if missing (for existing installs)
do $$ begin
  alter table public.servers add column if not exists clan_tag text;
exception when others then null;
end $$;

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
declare
  base_username text;
  final_username text;
begin
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '_', 'g');
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := base_username || '_' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into public.profiles (id, username)
  values (new.id, final_username);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage (create buckets if not exist)
insert into storage.buckets (id, name, public) 
select 'videos', 'videos', true where not exists (select 1 from storage.buckets where id = 'videos');
insert into storage.buckets (id, name, public) 
select 'avatars', 'avatars', true where not exists (select 1 from storage.buckets where id = 'avatars');

create policy "StrikerClips videos viewable" on storage.objects for select using (bucket_id = 'videos');
create policy "StrikerClips users upload videos" on storage.objects for insert with check (bucket_id = 'videos' and auth.uid() is not null);
create policy "StrikerClips users update own videos" on storage.objects for update using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "StrikerClips users delete own videos" on storage.objects for delete using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "StrikerClips avatars viewable" on storage.objects for select using (bucket_id = 'avatars');
create policy "StrikerClips users upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
create policy "StrikerClips users update own avatars" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "StrikerClips users delete own avatars" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Seed default server and channels
do $$ begin
  alter table public.channels add constraint channels_server_name_unique unique (server_id, name);
exception when duplicate_object then null;
end $$;

insert into public.servers (id, name, clan_tag) 
values ('00000000-0000-0000-0000-000000000001', 'SmashHub Highlights', 'SML')
on conflict (id) do update set name = excluded.name, clan_tag = coalesce(excluded.clan_tag, servers.clan_tag);

insert into public.channels (server_id, name, type) 
values ('00000000-0000-0000-0000-000000000001', 'general', 'text'),
       ('00000000-0000-0000-0000-000000000001', 'highlights', 'clips'),
       ('00000000-0000-0000-0000-000000000001', 'clips', 'clips')
on conflict (server_id, name) do nothing;
