# Supabase Setup for SmashHub

## 1. Run Database Migrations (fixes 404 / "Failed to create reel")

Your Supabase project needs these tables. Run each SQL file **in order** in the [Supabase SQL Editor](https://supabase.com/dashboard/project/siwcdegiavwcvgjegiww/sql/new):

1. **strikerclips_schema.sql** – Base tables (profiles, clips, reels, matches, servers, storage, etc.)
2. **003_live_groups_youtube.sql** – Live groups, `user_youtube_links` (for saved links & Auto-add)
3. **004_subscriptions_clans.sql** – Subscriptions, clan subscriptions, server applications
4. **005_tournaments.sql** – Tournaments table

**Steps:**
1. Go to https://supabase.com/dashboard/project/siwcdegiavwcvgjegiww/sql/new
2. Copy the contents of `supabase/strikerclips_schema.sql` → Run
3. Copy `supabase/003_live_groups_youtube.sql` → Run
4. Copy `supabase/004_subscriptions_clans.sql` → Run
5. Copy `supabase/005_tournaments.sql` → Run

## 2. Change Email Branding (Supabase → SmashHub)

Auth emails (confirm signup, reset password) show "Supabase" by default. To use "SmashHub":

1. Go to **Authentication** → **Email Templates**: https://supabase.com/dashboard/project/siwcdegiavwcvgjegiww/auth/templates
2. For **Confirm signup** (and others as needed):
   - **Subject:** Change to `Confirm your SmashHub account`
   - **Body:** Replace "Supabase" with "SmashHub" in the text
3. For full control of the sender name (e.g. "SmashHub" instead of "Supabase"), use **Custom SMTP**:
   - Go to **Project Settings** → **Auth** → **SMTP Settings**
   - Enable custom SMTP (e.g. Resend, SendGrid, Brevo)
   - Set the "From" address and sender name to your domain

## 3. Storage Buckets

The schema creates `videos` and `avatars` buckets. If they don’t exist, run the storage section in `strikerclips_schema.sql` (the `insert into storage.buckets` and policies).
