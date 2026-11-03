import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppdaqgwhsurendvsiwnp.supabase.co';
const supabaseKey = 'sb_publishable_Ex-BA3olIBBozJAjSkwLHQ_5G9BJbYS';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase tables on:', supabaseUrl);

  const checks = [
    { table: 'events', desc: 'Events catalog' },
    { table: 'profiles', desc: 'User profiles' },
    { table: 'registrations', desc: 'Event registrations & attendees' },
  ];

  let allReady = true;

  for (const item of checks) {
    const { data, error } = await supabase
      .from(item.table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Table [${item.table}] (${item.desc}): NOT FOUND`);
      allReady = false;
    } else {
      console.log(`✅ Table [${item.table}] (${item.desc}): READY! (Rows: ${data.length})`);
    }
  }

  if (allReady) {
    console.log('\n🎉 SUCCESS: All Supabase database tables are live and ready!');
  } else {
    console.log('\n⚠️ Tables not detected yet. Please paste the SQL into the opened browser tab and click RUN.');
  }
}

checkDatabase();
