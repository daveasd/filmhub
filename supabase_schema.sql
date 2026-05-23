-- ============================================================
-- FilmHub — Complete Supabase Schema
-- Run this entire file in: https://app.supabase.com
--   → Your project → SQL Editor → New query → Paste → Run
--
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
--    One row per auth user. Auto-created by trigger below.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT        UNIQUE NOT NULL,
  avatar_url  TEXT,
  bio         TEXT        DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select"        ON profiles;
DROP POLICY IF EXISTS "profiles_insert"        ON profiles;
DROP POLICY IF EXISTS "profiles_update"        ON profiles;
DROP POLICY IF EXISTS "profiles_delete"        ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = id);

-- Trigger: auto-create profile on user signup (matches profiles columns exactly)
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

  -- Keep only safe characters; fall back if empty after sanitizing
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Ensure username uniqueness (profiles.username is UNIQUE)
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
    -- Last-resort: suffix with user id fragment
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

-- ────────────────────────────────────────────────────────────
-- 2. WATCHLIST
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS watchlist (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id      INTEGER     NOT NULL,
  title         TEXT,
  poster_path   TEXT,
  backdrop_path TEXT,
  release_date  TEXT,
  vote_average  NUMERIC,
  overview      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlist_select" ON watchlist;
DROP POLICY IF EXISTS "watchlist_insert" ON watchlist;
DROP POLICY IF EXISTS "watchlist_delete" ON watchlist;

CREATE POLICY "watchlist_select" ON watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "watchlist_insert" ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "watchlist_delete" ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 3. WATCHED MOVIES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS watched_movies (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id      INTEGER     NOT NULL,
  title         TEXT,
  poster_path   TEXT,
  backdrop_path TEXT,
  release_date  TEXT,
  vote_average  NUMERIC,
  overview      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watched_select" ON watched_movies;
DROP POLICY IF EXISTS "watched_insert" ON watched_movies;
DROP POLICY IF EXISTS "watched_delete" ON watched_movies;

CREATE POLICY "watched_select" ON watched_movies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "watched_insert" ON watched_movies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "watched_delete" ON watched_movies FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 4. REVIEWS  (public read, author-only write)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT        PRIMARY KEY,           -- "{author_id}_{movie_id}"
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author      TEXT        NOT NULL,
  movie_id    INTEGER     NOT NULL,
  movie_title TEXT,
  rating      INTEGER     CHECK (rating >= 1 AND rating <= 5),
  content     TEXT,
  is_spoiler  BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_update" ON reviews;
DROP POLICY IF EXISTS "reviews_delete" ON reviews;

CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (auth.uid() = author_id);

-- ────────────────────────────────────────────────────────────
-- 5. RATINGS  (public read, one per user per movie)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   INTEGER     NOT NULL,
  rating     INTEGER     CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_select" ON ratings;
DROP POLICY IF EXISTS "ratings_insert" ON ratings;
DROP POLICY IF EXISTS "ratings_update" ON ratings;
DROP POLICY IF EXISTS "ratings_delete" ON ratings;

CREATE POLICY "ratings_select" ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_update" ON ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ratings_delete" ON ratings FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 6. FAVORITES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id    INTEGER     NOT NULL,
  title       TEXT,
  poster_path TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select" ON favorites;
DROP POLICY IF EXISTS "favorites_insert" ON favorites;
DROP POLICY IF EXISTS "favorites_delete" ON favorites;

CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 7. LISTS  (custom curated lists)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lists (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT        DEFAULT '',
  is_public   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lists_select" ON lists;
DROP POLICY IF EXISTS "lists_insert" ON lists;
DROP POLICY IF EXISTS "lists_update" ON lists;
DROP POLICY IF EXISTS "lists_delete" ON lists;

CREATE POLICY "lists_select" ON lists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "lists_insert" ON lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lists_update" ON lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lists_delete" ON lists FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 8. LIST ITEMS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS list_items (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  list_id     BIGINT      NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  movie_id    INTEGER     NOT NULL,
  title       TEXT,
  poster_path TEXT,
  added_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, movie_id)
);

ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "list_items_select" ON list_items;
DROP POLICY IF EXISTS "list_items_insert" ON list_items;
DROP POLICY IF EXISTS "list_items_delete" ON list_items;

CREATE POLICY "list_items_select" ON list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
        AND (lists.is_public = true OR lists.user_id = auth.uid())
    )
  );
CREATE POLICY "list_items_insert" ON list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id AND lists.user_id = auth.uid()
    )
  );
CREATE POLICY "list_items_delete" ON list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id AND lists.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 9. REVIEW LIKES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_likes (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id  TEXT        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, review_id)
);

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_likes_select" ON review_likes;
DROP POLICY IF EXISTS "review_likes_insert" ON review_likes;
DROP POLICY IF EXISTS "review_likes_delete" ON review_likes;

CREATE POLICY "review_likes_select" ON review_likes FOR SELECT USING (true);
CREATE POLICY "review_likes_insert" ON review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "review_likes_delete" ON review_likes FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 10. COMMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id  TEXT        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_update" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;

CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- DONE ✓
-- ────────────────────────────────────────────────────────────
-- Tables created: profiles, watchlist, watched_movies, reviews,
--   ratings, favorites, lists, list_items, review_likes, comments
-- RLS enabled on all tables
-- Trigger: auto-creates profile row on signup
-- ────────────────────────────────────────────────────────────
