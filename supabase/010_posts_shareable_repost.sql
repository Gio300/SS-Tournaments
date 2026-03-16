-- Shareable posts and reposts
alter table public.posts add column if not exists shareable boolean default true;
alter table public.posts add column if not exists repost_of_id uuid references public.posts(id) on delete set null;
create index if not exists posts_repost_of on public.posts(repost_of_id);
