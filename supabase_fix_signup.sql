-- FilmHub: fix signup profile trigger
-- Run this in Supabase → SQL Editor → New query → Run

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  base_username := lower(trim(coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'user'
  )));

  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN
    final_username := base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    avatar_url,
    bio,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    final_username,
    null,
    '',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username   = excluded.username,
    updated_at = now();

  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.profiles (id, username, avatar_url, bio, created_at, updated_at)
    VALUES (
      new.id,
      base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 8),
      null,
      '',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET username = excluded.username, updated_at = now();
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
