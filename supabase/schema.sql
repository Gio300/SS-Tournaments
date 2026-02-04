-- Run this in Supabase SQL Editor to create the community board table.

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  body text not null,
  created_at timestamptz default now(),
  parent_id uuid references community_posts(id) on delete cascade,
  locked boolean default false
);

-- Allow anyone to read and insert (anon key). Moderation: use Dashboard to delete/lock.
alter table community_posts enable row level security;

create policy "Allow public read"
  on community_posts for select
  using (true);

create policy "Allow public insert"
  on community_posts for insert
  with check (true);

-- Optional: allow delete only from service role (Dashboard / admin scripts).
-- No policy for delete = only service role can delete.

create index if not exists community_posts_created_at on community_posts(created_at);
create index if not exists community_posts_parent_id on community_posts(parent_id);
