# Supabase Setup for SmashHub

## 1. Run Database Migrations (fixes 404 / "Failed to create reel")

**One-step option:** Open `supabase/RUN_ALL_MIGRATIONS.sql`, copy the entire file, paste into the [Supabase SQL Editor](https://supabase.com/dashboard/project/siwcdegiavwcvgjegiww/sql/new), and click **Run**.

**Steps:**
1. Sign in at https://supabase.com/dashboard (if needed)
2. Go to https://supabase.com/dashboard/project/siwcdegiavwcvgjegiww/sql/new
3. Open `supabase/RUN_ALL_MIGRATIONS.sql` in your editor
4. Select all (Ctrl+A), copy
5. Paste into the SQL editor
6. Click **Run** (or Ctrl+Enter)

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
