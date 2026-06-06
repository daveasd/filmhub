-- Phase 5: Production Hardening Database Updates
-- Safe version

-- 1. Add missing fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. Make public profile viewing possible
-- This allows public/other users to read only profiles marked public.
-- Note: Dropping the original 'profiles_select' which allowed all reads.
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON profiles;

CREATE POLICY "profiles_public_select"
ON profiles
FOR SELECT
USING (
  auth.uid() = id
  OR is_public = true
);

-- 3. Public watchlist visibility only if owner profile is public
DROP POLICY IF EXISTS "watchlist_select" ON watchlist;

CREATE POLICY "watchlist_select"
ON watchlist
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = watchlist.user_id
    AND profiles.is_public = true
  )
);

-- 4. Public watched movies visibility only if owner profile is public
DROP POLICY IF EXISTS "watched_select" ON watched_movies;

CREATE POLICY "watched_select"
ON watched_movies
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = watched_movies.user_id
    AND profiles.is_public = true
  )
);

-- 5. Public favorites visibility only if owner profile is public
DROP POLICY IF EXISTS "favorites_select" ON favorites;

CREATE POLICY "favorites_select"
ON favorites
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = favorites.user_id
    AND profiles.is_public = true
  )
);
