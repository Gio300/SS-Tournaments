-- Seed reels for patternAft3r from @AwakenGiovanni1000
-- Run in Supabase SQL Editor AFTER patternAft3r has signed up.
-- Edit the urls array below with your actual video URLs from https://www.youtube.com/@AwakenGiovanni1000/videos

do $$
declare
  uid uuid;
  cid uuid;
  clip_ids uuid[] := '{}';
  urls text[] := array[
    'https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_VIDEO_ID_1',
    'https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_VIDEO_ID_2',
    'https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_VIDEO_ID_3'
  ];
  i int;
begin
  select id into uid from public.profiles where username = 'patternAft3r' limit 1;
  if uid is null then
    raise notice 'patternAft3r not found. Sign up first as patternAft3r, then run this.';
    return;
  end if;

  -- Create clips and a reel
  for i in 1..array_length(urls, 1) loop
    if urls[i] not like '%REPLACE_WITH%' then
      insert into public.clips (user_id, source_type, url_or_path, start_sec, end_sec)
      values (uid, 'youtube', urls[i], 0, 30)
      returning id into cid;
      clip_ids := clip_ids || cid;
    end if;
  end loop;

  if array_length(clip_ids, 1) > 0 then
    insert into public.reels (user_id, title, clip_ids)
    values (uid, 'AwakenGiovanni Highlights', clip_ids);
  end if;
end $$;
