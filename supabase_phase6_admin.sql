-- Phase 6: Admin Dashboard + Analytics Database Updates
-- Run this in your Supabase SQL Editor

-- 1. Add role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Set Dave's account to admin (replace email if different)
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'daveasd86@gmail.com'
);

-- 2. Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT,
  email TEXT,
  category TEXT,
  message TEXT,
  status TEXT DEFAULT 'open', -- open (pending), reviewing, dismissed, resolved
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Reports Policies
DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "reports_admin_select" ON reports;
CREATE POLICY "reports_admin_select" ON reports FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "reports_admin_update" ON reports;
CREATE POLICY "reports_admin_update" ON reports FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Update Feedback Table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread'; -- unread, read, resolved, dismissed

-- Feedback Admin Policies (Insert policy already exists)
DROP POLICY IF EXISTS "feedback_admin_select" ON feedback;
CREATE POLICY "feedback_admin_select" ON feedback FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "feedback_admin_update" ON feedback;
CREATE POLICY "feedback_admin_update" ON feedback FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Create Analytics Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Analytics Policies
DROP POLICY IF EXISTS "analytics_insert" ON analytics_events;
CREATE POLICY "analytics_insert" ON analytics_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_admin_select" ON analytics_events;
CREATE POLICY "analytics_admin_select" ON analytics_events FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Add Admin Delete Policy for Reviews
DROP POLICY IF EXISTS "reviews_admin_delete" ON reviews;
CREATE POLICY "reviews_admin_delete" ON reviews FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- (Admin DELETE policies for reports, feedback, and profiles are defined in
-- section 7 below using the is_admin() helper to avoid RLS recursion.)

-- 6. Add Admin Select Policies for other tables so admin can see stats
-- Watchlist Admin Select
DROP POLICY IF EXISTS "watchlist_admin_select" ON watchlist;
CREATE POLICY "watchlist_admin_select" ON watchlist FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Watched Movies Admin Select
DROP POLICY IF EXISTS "watched_admin_select" ON watched_movies;
CREATE POLICY "watched_admin_select" ON watched_movies FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Ratings Admin Select
DROP POLICY IF EXISTS "ratings_admin_select" ON ratings;
CREATE POLICY "ratings_admin_select" ON ratings FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles Admin Select (Update existing public profile select)
DROP POLICY IF EXISTS "profiles_public_select" ON profiles;
CREATE POLICY "profiles_public_select" ON profiles FOR SELECT 
USING (
  auth.uid() = id 
  OR is_public = true 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles Admin Update (role changes by admins only)
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 7. Full admin control: helper + complete DELETE/UPDATE authority
-- ============================================================================

-- SECURITY DEFINER helper avoids infinite recursion when a profiles policy
-- needs to check the caller's role against the profiles table itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Admins can delete any profile (removes a user's content via FK cascades)
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE
USING (auth.uid() = id OR public.is_admin());

-- Admins can delete reports
DROP POLICY IF EXISTS "reports_admin_delete" ON reports;
CREATE POLICY "reports_admin_delete" ON reports FOR DELETE
USING (public.is_admin());

-- Admins can delete feedback
DROP POLICY IF EXISTS "feedback_admin_delete" ON feedback;
CREATE POLICY "feedback_admin_delete" ON feedback FOR DELETE
USING (public.is_admin());

-- Admins can update any review (in addition to existing admin delete)
DROP POLICY IF EXISTS "reviews_admin_update" ON reviews;
CREATE POLICY "reviews_admin_update" ON reviews FOR UPDATE
USING (public.is_admin());

-- Admins can delete analytics events (housekeeping)
DROP POLICY IF EXISTS "analytics_admin_delete" ON analytics_events;
CREATE POLICY "analytics_admin_delete" ON analytics_events FOR DELETE
USING (public.is_admin());
