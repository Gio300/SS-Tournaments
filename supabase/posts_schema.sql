-- Posts, polls, and attachments for SmashHub feed
-- Run in Supabase SQL Editor after strikerclips_schema.sql

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

create policy "Posts viewable by everyone" on public.posts for select using (true);
create policy "Users insert own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users update own posts" on public.posts for update using (auth.uid() = user_id);
create policy "Users delete own posts" on public.posts for delete using (auth.uid() = user_id);

create policy "Post attachments viewable" on public.post_attachments for select using (true);
create policy "Users insert attachments for own posts" on public.post_attachments for insert
  with check (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
create policy "Users delete attachments for own posts" on public.post_attachments for delete
  using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

create policy "Post polls viewable" on public.post_polls for select using (true);
create policy "Users insert polls for own posts" on public.post_polls for insert
  with check (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
create policy "Users update polls for own posts" on public.post_polls for update
  using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));
create policy "Users delete polls for own posts" on public.post_polls for delete
  using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

create policy "Post poll options viewable" on public.post_poll_options for select using (true);
create policy "Users insert poll options for own posts" on public.post_poll_options for insert
  with check (exists (
    select 1 from public.post_polls pp
    join public.posts p on p.id = pp.post_id
    where pp.id = poll_id and p.user_id = auth.uid()
  ));

create policy "Post poll votes viewable" on public.post_poll_votes for select using (true);
create policy "Users vote on polls" on public.post_poll_votes for insert with check (auth.uid() = user_id);
create policy "Users remove own votes" on public.post_poll_votes for delete using (auth.uid() = user_id);

create index if not exists posts_user_id on public.posts(user_id);
create index if not exists posts_created_at on public.posts(created_at desc);
create index if not exists post_attachments_post_id on public.post_attachments(post_id);
create index if not exists post_poll_options_poll_id on public.post_poll_options(poll_id);
create index if not exists post_poll_votes_option_id on public.post_poll_votes(option_id);

-- post-images storage bucket
insert into storage.buckets (id, name, public)
select 'post-images', 'post-images', true where not exists (select 1 from storage.buckets where id = 'post-images');

create policy "Post images viewable" on storage.objects for select using (bucket_id = 'post-images');
create policy "Users upload post images" on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.uid() is not null);
create policy "Users update own post images" on storage.objects for update
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own post images" on storage.objects for delete
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
