const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestPack() {
  try {
    // First check if test pack already exists
    const { data: existingPack } = await supabase
      .from('class_packages')
      .select('*')
      .eq('name', 'Test Pack - 1 MXN')
      .single();

    if (existingPack) {
      console.log('Test pack already exists:', existingPack);
      return;
    }

    // Add the test pack
    const { data, error } = await supabase
      .from('class_packages')
      .insert({
        name: 'Test Pack - 1 MXN',
        description: 'Test package for payment integration testing',
        number_of_classes: 1,
        price: 1,
        validity_days: 7,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding test pack:', error);
      return;
    }

    console.log('Test pack added successfully:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addTestPack();