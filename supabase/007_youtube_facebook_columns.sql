-- Add columns for YouTube and Meta integrations
do $$ begin
  alter table public.profiles add column if not exists youtube_channel_id text;
  alter table public.profiles add column if not exists facebook_id text;
exception when others then null;
end $$;
