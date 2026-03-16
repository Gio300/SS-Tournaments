-- Post reactions (Facebook-style emoji) and comments
create table if not exists public.post_reactions (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null check (emoji in ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists idx_post_reactions_post on public.post_reactions(post_id);
create index if not exists idx_post_comments_post on public.post_comments(post_id);

alter table public.post_reactions enable row level security;
alter table public.post_comments enable row level security;

drop policy if exists "Post reactions viewable" on public.post_reactions;
create policy "Post reactions viewable" on public.post_reactions for select using (true);
drop policy if exists "Users add post reactions" on public.post_reactions;
create policy "Users add post reactions" on public.post_reactions for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own post reactions" on public.post_reactions;
create policy "Users update own post reactions" on public.post_reactions for update using (auth.uid() = user_id);
drop policy if exists "Users remove own post reactions" on public.post_reactions;
create policy "Users remove own post reactions" on public.post_reactions for delete using (auth.uid() = user_id);

drop policy if exists "Post comments viewable" on public.post_comments;
create policy "Post comments viewable" on public.post_comments for select using (true);
drop policy if exists "Users add post comments" on public.post_comments;
create policy "Users add post comments" on public.post_comments for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own post comments" on public.post_comments;
create policy "Users update own post comments" on public.post_comments for update using (auth.uid() = user_id);
drop policy if exists "Users delete own post comments" on public.post_comments;
create policy "Users delete own post comments" on public.post_comments for delete using (auth.uid() = user_id);
