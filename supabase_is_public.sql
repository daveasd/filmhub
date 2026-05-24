-- Phase 2: Add privacy toggle to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
