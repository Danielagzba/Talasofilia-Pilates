-- Drop existing table if it exists (only if you haven't created any templates yet)
-- DROP TABLE IF EXISTS class_templates;

-- Create class templates table with start and end times
CREATE TABLE IF NOT EXISTS class_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE class_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can view templates
CREATE POLICY "Admins can view templates" ON class_templates
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ));

-- Only admins can create templates
CREATE POLICY "Admins can create templates" ON class_templates
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ));

-- Only admins can update templates
CREATE POLICY "Admins can update templates" ON class_templates
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ));

-- Only admins can delete templates
CREATE POLICY "Admins can delete templates" ON class_templates
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_class_templates_created_at ON class_templates(created_at DESC);