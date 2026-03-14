-- Auto-follow patternAft3r: new users and patternAft3r become mutual follows
-- Run after patternAft3r has signed up. Backfill adds patternAft3r as friend to existing users.

create or replace function public.auto_follow_patternaft3r()
returns trigger as $$
declare
  p_id uuid;
begin
  if new.username = 'patternAft3r' then return new; end if;
  select id into p_id from public.profiles where username = 'patternAft3r' limit 1;
  if p_id is null then return new; end if;
  insert into public.follows (follower_id, following_id) values (p_id, new.id)
    on conflict (follower_id, following_id) do nothing;
  insert into public.follows (follower_id, following_id) values (new.id, p_id)
    on conflict (follower_id, following_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_auto_follow on public.profiles;
create trigger on_profile_created_auto_follow
  after insert on public.profiles
  for each row execute procedure public.auto_follow_patternaft3r();

-- Backfill: add patternAft3r as mutual follow for all existing users
do $$
declare
  p_id uuid;
  r record;
begin
  select id into p_id from public.profiles where username = 'patternAft3r' limit 1;
  if p_id is null then return; end if;
  for r in select id from public.profiles where id != p_id
  loop
    insert into public.follows (follower_id, following_id) values (p_id, r.id)
      on conflict (follower_id, following_id) do nothing;
    insert into public.follows (follower_id, following_id) values (r.id, p_id)
      on conflict (follower_id, following_id) do nothing;
  end loop;
end $$;
