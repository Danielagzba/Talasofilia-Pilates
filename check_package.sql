-- Check what package was purchased
SELECT * FROM class_packages WHERE id = '33543611-d325-4838-a210-ca5cf84dbe31';

-- Check the user's purchase
SELECT up.*, cp.name as package_name, cp.number_of_classes 
FROM user_purchases up
JOIN class_packages cp ON up.package_id = cp.id
WHERE up.user_id = '981c44e2-0475-4657-88ff-f04c1c4e365f'
ORDER BY up.purchase_date DESC;
EOF < /dev/null