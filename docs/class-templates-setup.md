# Class Templates Setup

## Overview
The class template feature allows admins to save frequently used class configurations and quickly create new classes based on these templates.

## Database Setup
To enable class templates, run the following SQL in your Supabase SQL editor:

```sql
-- Create class templates table
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
CREATE INDEX idx_class_templates_created_at ON class_templates(created_at DESC);
```

## Features

### Creating Templates
1. Fill out the "Add Class" form with your desired class details
2. Click "Save as Template" button
3. Enter a memorable template name
4. Click "Save Template"

### Using Templates
1. Click "Add Class" button
2. Select a template from the "Load template..." dropdown
3. The form will be populated with the template's data
4. Adjust the date and times as needed
5. Click "Add Class" to create the class

### Managing Templates
- Templates appear at the bottom of the Manage Classes page
- Click "Use Template" to quickly create a new class from that template
- Click the trash icon to delete templates you no longer need

## Template Data
Templates store:
- Class name
- Instructor name
- Start time
- End time
- Maximum capacity

When using a template, you'll need to set:
- Class date (the times from the template will be automatically applied)