-- Migration script to update class_templates table structure

-- First, check if the table exists and has the old structure
DO $$ 
BEGIN
    -- Check if duration_minutes column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'class_templates' 
        AND column_name = 'duration_minutes'
    ) THEN
        -- Add new columns if they don't exist
        ALTER TABLE class_templates 
        ADD COLUMN IF NOT EXISTS start_time TIME,
        ADD COLUMN IF NOT EXISTS end_time TIME;
        
        -- Set default values for existing records (9:00 AM to 10:00 AM)
        UPDATE class_templates 
        SET start_time = '09:00'::TIME,
            end_time = (TIME '09:00' + (duration_minutes || ' minutes')::INTERVAL)::TIME
        WHERE start_time IS NULL;
        
        -- Make the new columns NOT NULL
        ALTER TABLE class_templates 
        ALTER COLUMN start_time SET NOT NULL,
        ALTER COLUMN end_time SET NOT NULL;
        
        -- Drop the old duration_minutes column
        ALTER TABLE class_templates 
        DROP COLUMN IF EXISTS duration_minutes;
        
        RAISE NOTICE 'Table migrated successfully from duration to start/end times';
    ELSE
        -- Table doesn't have duration_minutes, check if it needs to be created
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
        
        RAISE NOTICE 'Table created with new structure';
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE class_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Admins can view templates" ON class_templates;
DROP POLICY IF EXISTS "Admins can create templates" ON class_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON class_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON class_templates;

-- Create policies
CREATE POLICY "Admins can view templates" ON class_templates
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ));

CREATE POLICY "Admins can create templates" ON class_templates
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ));

CREATE POLICY "Admins can update templates" ON class_templates
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ));

CREATE POLICY "Admins can delete templates" ON class_templates
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  ));

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_class_templates_created_at ON class_templates(created_at DESC);