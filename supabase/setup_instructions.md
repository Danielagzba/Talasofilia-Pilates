# Supabase Database Setup Instructions

Follow these steps to set up your database tables in Supabase:

## 1. Access SQL Editor
1. Log in to your Supabase dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

## 2. Run Migration Scripts

Run these scripts in order:

### Step 1: Initial Schema
Copy and paste the contents of `migrations/001_initial_schema.sql` and click **Run**

This creates:
- `user_profiles` - Extended user information
- `class_packages` - Available packages for purchase
- `user_purchases` - User's purchased packages
- `class_schedules` - Available class times
- `class_bookings` - User bookings

### Step 2: Row Level Security
Copy and paste the contents of `migrations/002_row_level_security.sql` and click **Run**

This sets up security policies to ensure users can only access their own data.

### Step 3: Seed Data
Copy and paste the contents of `migrations/003_seed_data.sql` and click **Run**

This adds:
- Default class packages (1, 4, 8, 12 classes)
- Sample class schedules for the next 30 days

## 3. Set Up Storage

### Step 1: Run Storage Setup
Copy and paste the contents of `storage_setup.sql` and click **Run**

### Step 2: Verify Storage Bucket
1. Go to **Storage** in the left sidebar
2. You should see an `avatars` bucket
3. If not, create it manually:
   - Click **New bucket**
   - Name: `avatars`
   - Public: Yes

## 4. Database Structure Overview

### Tables:
1. **user_profiles**
   - Extends auth.users with display name and avatar
   - Auto-created on user signup

2. **class_packages**
   - Defines purchasable packages
   - Includes price, number of classes, validity period

3. **user_purchases**
   - Records of packages purchased by users
   - Tracks remaining classes and expiry date

4. **class_schedules**
   - Available class times
   - Tracks capacity and current bookings

5. **class_bookings**
   - Individual class bookings
   - Links users, schedules, and purchases

### Key Features:
- Automatic booking count updates
- Classes remaining automatically decremented
- Timestamp tracking for all records
- Row Level Security for data protection

## 5. Testing

To verify everything is working:

1. Sign up a new user on your website
2. Check that a user_profile was created:
   ```sql
   SELECT * FROM user_profiles;
   ```

3. Check that class packages are visible:
   ```sql
   SELECT * FROM class_packages;
   ```

4. Check that class schedules were created:
   ```sql
   SELECT * FROM class_schedules ORDER BY class_date, start_time;
   ```

## Next Steps

Now you can:
1. Integrate payment processing (Stripe/PayPal)
2. Build the booking calendar interface
3. Add email notifications
4. Create admin panel for managing classes

## Troubleshooting

If you encounter errors:
1. Make sure you're running scripts in order
2. Check that UUID extension is enabled
3. Verify you're in the correct project
4. Check the Supabase logs for detailed error messages