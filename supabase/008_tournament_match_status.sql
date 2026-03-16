-- Add status and ends_at for tournaments (open vs closed)
-- Add status for matches (open vs closed)
alter table public.tournaments add column if not exists status text default 'open' check (status in ('open', 'closed'));
alter table public.tournaments add column if not exists ends_at timestamptz;

alter table public.matches add column if not exists status text default 'open' check (status in ('open', 'closed'));
