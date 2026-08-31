const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eptifegytprrzumltjce.supabase.co';
const supabaseKey = 'sb_publishable_XLuFxps4qyoqqrb7bLF4GQ_MWy26wHf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase project:', supabaseUrl);

  const tables = [
    'profiles',
    'roles',
    'permissions',
    'role_permissions',
    'categories',
    'units',
    'products',
    'inventory',
    'inventory_movements',
    'suppliers',
    'customers',
    'purchases',
    'purchase_items',
    'sales',
    'sale_items',
    'payments',
    'expenses',
    'audit_logs',
    'settings',
  ];

  console.log('\n--- Checking Tables ---');
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table [${table}]: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`✅ Table [${table}]: accessible (records: ${data?.length})`);
      }
    } catch (e) {
      console.log(`⚠️ Exception on [${table}]:`, e.message);
    }
  }

  console.log('\n--- Checking RPC Endpoints ---');
  try {
    const { data, error } = await supabase.rpc('get_dashboard_metrics');
    if (error) {
      console.log(`❌ RPC [get_dashboard_metrics]: ${error.message}`);
    } else {
      console.log(`✅ RPC [get_dashboard_metrics]: working`, data);
    }
  } catch (e) {
    console.log(`⚠️ Exception on RPC:`, e.message);
  }
}

testConnection();
