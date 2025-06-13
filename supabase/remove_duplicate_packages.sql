-- First, let's see all class packages to identify duplicates
SELECT 
  id,
  name,
  number_of_classes,
  price,
  validity_days,
  is_active,
  created_at
FROM class_packages
ORDER BY name, created_at;

-- Identify duplicate packages (same name)
SELECT 
  name,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as package_ids,
  STRING_AGG(created_at::text, ', ') as created_dates
FROM class_packages
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;

-- To delete duplicates, keeping only the oldest (first created) of each package name
-- This query will show you what will be deleted
WITH duplicates AS (
  SELECT 
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM class_packages
)
SELECT 
  id,
  name,
  created_at,
  'Will be deleted' as status
FROM duplicates
WHERE rn > 1;

-- IMPORTANT: Before running the DELETE, check if any of these packages have associated purchases
-- This query checks for purchases linked to duplicate packages
WITH duplicates AS (
  SELECT 
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM class_packages
)
SELECT 
  cp.id as package_id,
  cp.name as package_name,
  COUNT(up.id) as purchase_count,
  SUM(up.classes_remaining) as total_classes_remaining
FROM duplicates cp
LEFT JOIN user_purchases up ON up.package_id = cp.id
WHERE cp.rn > 1
GROUP BY cp.id, cp.name
ORDER BY cp.name;

-- If there are NO purchases associated with the duplicate packages, you can safely delete them:
-- UNCOMMENT AND RUN THIS ONLY AFTER VERIFYING NO PURCHASES ARE LINKED TO DUPLICATES
/*
WITH duplicates AS (
  SELECT 
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM class_packages
)
DELETE FROM class_packages
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);
*/

-- Alternative: If there ARE purchases linked to duplicates, we need to reassign them first
-- This query will reassign purchases from duplicate packages to the original package
/*
WITH package_mapping AS (
  SELECT 
    dup.id as duplicate_id,
    orig.id as original_id,
    dup.name
  FROM class_packages dup
  JOIN (
    SELECT name, MIN(created_at) as min_created_at
    FROM class_packages
    GROUP BY name
    HAVING COUNT(*) > 1
  ) grouped ON dup.name = grouped.name
  JOIN class_packages orig ON orig.name = grouped.name AND orig.created_at = grouped.min_created_at
  WHERE dup.created_at > grouped.min_created_at
)
UPDATE user_purchases up
SET package_id = pm.original_id
FROM package_mapping pm
WHERE up.package_id = pm.duplicate_id;

-- Then delete the duplicate packages
WITH duplicates AS (
  SELECT 
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM class_packages
)
DELETE FROM class_packages
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);
*/