-- ==========================================
-- Database Schema for ServeMate by Resence
-- Setup: Copy and execute this inside Supabase SQL Editor
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Maps to auth.users.id
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'ngo', 'admin')),
  avatar TEXT,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COMMUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  total_donated NUMERIC DEFAULT 0.00,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. COMMUNITY MEMBERS MAP TABLE
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(community_id, user_id)
);

-- 4. NGOS TABLE
CREATE TABLE IF NOT EXISTS public.ngos (
  id UUID PRIMARY KEY, -- Maps to auth.users.id when NGO logs in
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  ngo_darpan_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  trust_rating NUMERIC DEFAULT 4.5,
  total_received NUMERIC DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL,
  raised_amount NUMERIC DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DONATIONS TABLE
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'verified', 'failed')),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. VOLUNTEERS TABLE
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  assigned_project TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PROOF UPLOADS TABLE
CREATE TABLE IF NOT EXISTS public.proof_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
  youtube_url TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- 9. BADGES TABLE
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  xp_required INTEGER DEFAULT 0,
  icon_url TEXT
);

-- 10. USER BADGES MAP TABLE
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. ADMIN LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- PostgreSQL Triggers for Auth Integration
-- ==========================================

-- Function to handle copying users registered in Supabase auth to our public profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone, role, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that executes handle_new_user after signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 1. USERS policies
CREATE POLICY "Allow public read access to users profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profiles" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 2. COMMUNITIES policies
CREATE POLICY "Allow public read access to communities" ON public.communities
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow leaders to update their own communities" ON public.communities
  FOR UPDATE USING (auth.uid() = leader_id);

-- 3. COMMUNITY MEMBERS policies
CREATE POLICY "Allow public read access to community members" ON public.community_members
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to leave their joined communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

-- 4. NGOS policies
CREATE POLICY "Allow public read access to NGOs" ON public.ngos
  FOR SELECT USING (true);

CREATE POLICY "Allow NGOs to edit their own profiles" ON public.ngos
  FOR UPDATE USING (auth.uid() = id);

-- 5. CAMPAIGNS policies
CREATE POLICY "Allow public read access to campaigns" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated NGOs to create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = ngo_id);

CREATE POLICY "Allow NGOs to update their own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = ngo_id);

-- 6. DONATIONS policies
CREATE POLICY "Allow users to view their own donations" ON public.donations
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ngo_id);

CREATE POLICY "Allow public select on complete donations" ON public.donations
  FOR SELECT USING (status = 'completed' OR status = 'verified');

CREATE POLICY "Allow insert donation on authenticated user session" ON public.donations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. VOLUNTEERS policies
CREATE POLICY "Allow NGOs to manage their volunteers" ON public.volunteers
  FOR ALL USING (auth.uid() = ngo_id);

-- 8. PROOF UPLOADS policies
CREATE POLICY "Allow public read access to verified proofs" ON public.proof_uploads
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow NGOs to manage their proofs" ON public.proof_uploads
  FOR ALL USING (auth.uid() = ngo_id);

-- 9. BADGES policies
CREATE POLICY "Allow public read access to badges" ON public.badges
  FOR SELECT USING (true);

-- 10. USER BADGES policies
CREATE POLICY "Allow public read access to user badges" ON public.user_badges
  FOR SELECT USING (true);

-- 11. NOTIFICATIONS policies
CREATE POLICY "Allow users to view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update (read state) their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 12. ADMIN LOGS policies
CREATE POLICY "Allow admin role to manage admin logs" ON public.admin_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );
