-- Create multi-team support (Issue 27)
-- This migration enables users to belong to multiple teams
-- and switch between them while maintaining RLS security

-- ========================================
-- 1. Create departments table
-- ========================================

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_departments_owner_id ON public.departments(owner_id);

-- ========================================
-- 2. Create user_departments table (many-to-many)
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, department_id)
);

-- Enable RLS
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_user_departments_user_id ON public.user_departments(user_id);
CREATE INDEX idx_user_departments_department_id ON public.user_departments(department_id);

-- ========================================
-- 3. Create invitations table
-- ========================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_department_id ON public.invitations(department_id);

-- ========================================
-- 4. Create invitation_uses table
-- ========================================

CREATE TABLE IF NOT EXISTS public.invitation_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invitation_uses ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_invitation_uses_invitation_id ON public.invitation_uses(invitation_id);
CREATE INDEX idx_invitation_uses_user_id ON public.invitation_uses(user_id);

-- ========================================
-- 5. Add current_department_id to profiles
-- ========================================

-- Add column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'current_department_id'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN current_department_id UUID REFERENCES public.departments(id);
  END IF;
END $$;

-- ========================================
-- 6. Migrate existing data
-- ========================================

-- Create a default department for existing users
DO $$
DECLARE
  default_dept_id UUID;
  default_dept_uuid TEXT;
BEGIN
  -- Get the DEFAULT_DEPARTMENT_ID from environment (fallback to a known UUID)
  default_dept_uuid := current_setting('app.default_department_id', true);

  IF default_dept_uuid IS NULL OR default_dept_uuid = '' THEN
    -- Use a fixed UUID for the default department
    default_dept_uuid := '00000000-0000-0000-0000-000000000001';
  END IF;

  default_dept_id := default_dept_uuid::UUID;

  -- Create default department if it doesn't exist
  INSERT INTO public.departments (id, name, owner_id, created_at)
  SELECT
    default_dept_id,
    'Default Team',
    (SELECT id FROM auth.users LIMIT 1), -- Use first user as owner
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.departments WHERE id = default_dept_id
  );

  -- Migrate existing profiles to user_departments
  INSERT INTO public.user_departments (user_id, department_id, role)
  SELECT
    id,
    COALESCE(department_id, default_dept_id),
    'member'
  FROM public.profiles
  WHERE id NOT IN (
    SELECT user_id FROM public.user_departments
  );

  -- Set current_department_id for existing profiles
  UPDATE public.profiles
  SET current_department_id = COALESCE(department_id, default_dept_id)
  WHERE current_department_id IS NULL;
END $$;

-- ========================================
-- 7. Update RLS policies for minutes
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read minutes in their department" ON public.minutes;
DROP POLICY IF EXISTS "Users can insert minutes in their department" ON public.minutes;

-- SELECT: Users can read minutes in any of their departments
CREATE POLICY "Users can read minutes in their departments"
  ON public.minutes
  FOR SELECT
  USING (
    department_id IN (
      SELECT department_id FROM public.user_departments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create minutes in their current department
CREATE POLICY "Users can insert minutes in their current department"
  ON public.minutes
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND department_id = (
      SELECT current_department_id FROM public.profiles
      WHERE id = auth.uid()
    )
    AND department_id IN (
      SELECT department_id FROM public.user_departments
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE and DELETE policies remain the same (owner only)

-- ========================================
-- 8. RLS policies for departments
-- ========================================

-- SELECT: Users can read departments they belong to
CREATE POLICY "Users can read their departments"
  ON public.departments
  FOR SELECT
  USING (
    id IN (
      SELECT department_id FROM public.user_departments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create departments
CREATE POLICY "Authenticated users can create departments"
  ON public.departments
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only owners can update departments
CREATE POLICY "Owners can update their departments"
  ON public.departments
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Only owners can delete departments
CREATE POLICY "Owners can delete their departments"
  ON public.departments
  FOR DELETE
  USING (owner_id = auth.uid());

-- ========================================
-- 9. RLS policies for user_departments
-- ========================================

-- SELECT: Users can read their own memberships
CREATE POLICY "Users can read their own memberships"
  ON public.user_departments
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can join departments (via invitation)
CREATE POLICY "Users can join departments"
  ON public.user_departments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can leave departments
CREATE POLICY "Users can leave departments"
  ON public.user_departments
  FOR DELETE
  USING (user_id = auth.uid());

-- ========================================
-- 10. RLS policies for invitations
-- ========================================

-- SELECT: Users can read invitations for their departments (admin/owner)
CREATE POLICY "Department admins can read invitations"
  ON public.invitations
  FOR SELECT
  USING (
    department_id IN (
      SELECT department_id FROM public.user_departments
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- INSERT: Owners and admins can create invitations
CREATE POLICY "Department admins can create invitations"
  ON public.invitations
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND department_id IN (
      SELECT department_id FROM public.user_departments
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- DELETE: Creators can delete invitations
CREATE POLICY "Creators can delete invitations"
  ON public.invitations
  FOR DELETE
  USING (created_by = auth.uid());

-- ========================================
-- 11. RLS policies for invitation_uses
-- ========================================

-- SELECT: Users can read their own invitation uses
CREATE POLICY "Users can read their own invitation uses"
  ON public.invitation_uses
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can log their own invitation use
CREATE POLICY "Users can insert their own invitation uses"
  ON public.invitation_uses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ========================================
-- 12. Update profiles RLS to allow current_department_id update
-- ========================================

-- The existing UPDATE policy should allow users to update their current_department_id
-- No changes needed, but let's verify it exists
DO $$
BEGIN
  -- Check if policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- ========================================
-- 13. Create trigger to update updated_at on departments
-- ========================================

CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_updated_at_trigger
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION update_departments_updated_at();

-- ========================================
-- 14. Create function to atomically increment invitation use_count
-- ========================================

CREATE OR REPLACE FUNCTION increment_invitation_use_count(invitation_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.invitations
  SET use_count = use_count + 1
  WHERE id = invitation_id_param;
END;
$$;
