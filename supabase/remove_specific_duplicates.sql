-- Check which packages have purchases associated with them
SELECT 
  cp.id,
  cp.name,
  cp.created_at,
  COUNT(up.id) as purchase_count,
  COALESCE(SUM(up.classes_remaining), 0) as total_classes_remaining
FROM class_packages cp
LEFT JOIN user_purchases up ON up.package_id = cp.id
GROUP BY cp.id, cp.name, cp.created_at
ORDER BY cp.name, cp.created_at;

-- Based on your data, we'll keep the original packages (created at 00:24:41) and remove the duplicates (created at 21:50:30)
-- First, let's check if any purchases are linked to the duplicate packages
SELECT 
  cp.id,
  cp.name,
  cp.created_at,
  COUNT(up.id) as purchases_linked
FROM class_packages cp
LEFT JOIN user_purchases up ON up.package_id = cp.id
WHERE cp.id IN (
  '2632b915-3c8d-4f97-baf2-c0eabb5e843c', -- Single Class duplicate
  '69569ca6-75fb-47c8-ba98-200a475bb8ae', -- 4 Class Package duplicate
  '98b25361-c436-4d9f-9d11-14ab6ec4b788', -- 8 Class Package duplicate
  '9806072b-4585-4a9c-b186-2cdb29493692'  -- 12 Class Package duplicate
)
GROUP BY cp.id, cp.name, cp.created_at;

-- If there are purchases linked to duplicates, reassign them to the original packages
-- Run this ONLY if the above query shows purchases linked to duplicates
UPDATE user_purchases 
SET package_id = CASE
  WHEN package_id = '2632b915-3c8d-4f97-baf2-c0eabb5e843c' THEN '18600b16-c964-4a57-881a-e2e4007b7f36' -- Single Class
  WHEN package_id = '69569ca6-75fb-47c8-ba98-200a475bb8ae' THEN '33543611-d325-4838-a210-ca5cf84dbe31' -- 4 Class Pack
  WHEN package_id = '98b25361-c436-4d9f-9d11-14ab6ec4b788' THEN '45e4eb5e-b686-45b6-aa70-5aa7a354a2d2' -- 8 Class Pack
  WHEN package_id = '9806072b-4585-4a9c-b186-2cdb29493692' THEN '504c2595-eb32-4753-a60b-a14c3ff831ff' -- 12 Class Pack
  ELSE package_id
END
WHERE package_id IN (
  '2632b915-3c8d-4f97-baf2-c0eabb5e843c',
  '69569ca6-75fb-47c8-ba98-200a475bb8ae',
  '98b25361-c436-4d9f-9d11-14ab6ec4b788',
  '9806072b-4585-4a9c-b186-2cdb29493692'
);

-- After reassigning purchases (or if no purchases exist), delete the duplicate packages
DELETE FROM class_packages
WHERE id IN (
  '2632b915-3c8d-4f97-baf2-c0eabb5e843c', -- Single Class duplicate
  '69569ca6-75fb-47c8-ba98-200a475bb8ae', -- 4 Class Package duplicate  
  '98b25361-c436-4d9f-9d11-14ab6ec4b788', -- 8 Class Package duplicate
  '9806072b-4585-4a9c-b186-2cdb29493692'  -- 12 Class Package duplicate
);

-- Verify the deletion was successful
SELECT * FROM class_packages ORDER BY name;