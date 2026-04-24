/**
 * Damk 3alena — Test Account Setup Script
 *
 * Creates two demo accounts for competition judges:
 *   1. donor@damk3alena.jo  (password: Donor@2026)  — mobile app
 *   2. staff@damk3alena.jo  (password: Staff@2026)  — web dashboard
 *
 * HOW TO RUN:
 *   1. Get your service role key from:
 *      https://supabase.com/dashboard/project/fyushkwhotqyihzuekhr/settings/api
 *   2. Paste it below as SERVICE_ROLE_KEY
 *   3. cd damk-3alena/submission
 *      node create_test_accounts.js
 */

const SUPABASE_URL = 'https://fyushkwhotqyihzuekhr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dXNoa3dob3RxeWloenVla2hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA1MjM2MywiZXhwIjoyMDkwNjI4MzYzfQ.j-ECUcNcfAVWjtaWF2LDJM_n3EBBIlZ636hpZV3IR14'; // ← replace this

// ───────────────────────────────────────────────

async function adminPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

async function getOrCreateAuthUser(email, password) {
  // Try to create; if email already exists, find the user by listing and filtering
  try {
    return await adminPost('/auth/v1/admin/users', {
      email,
      password,
      email_confirm: true,
    });
  } catch (err) {
    const e = JSON.parse(err.message);
    if (e.error_code === 'email_exists') {
      // List users and find by email (Supabase doesn't expose get-by-email directly)
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
        headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'apikey': SERVICE_ROLE_KEY },
      });
      const data = await res.json();
      const users = data.users || [];
      const existing = users.find(u => u.email === email);
      if (!existing) throw new Error(`email_exists but could not find user: ${email}`);
      console.log(`   Auth user already exists: ${existing.id}`);
      return existing;
    }
    throw err;
  }
}

async function dbUpsert(table, row, conflictCol) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictCol}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(row),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return Array.isArray(json) ? json[0] : json;
}

async function dbGet(table, filter) {
  const params = Object.entries(filter).map(([k, v]) => `${k}=eq.${v}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}&limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  const json = await res.json();
  return Array.isArray(json) ? json[0] : null;
}

async function createDonorAccount() {
  console.log('\n🩸 Creating donor account...');

  // 1. Get or create auth user
  const authUser = await getOrCreateAuthUser('donor@damk3alena.jo', 'Donor@2026');
  const authId = authUser.id;
  console.log(`   Auth user: ${authId}`);

  // 2. Upsert users row (safe if already exists from a previous run)
  const userRow = await dbUpsert('users', {
    auth_id: authId,
    role: 'donor',
    first_name: 'Ahmad',
    last_name: 'Al-Khalidi',
    phone: '+96279000001',
    email: 'donor@damk3alena.jo',
  }, 'auth_id');
  console.log(`   users row: ${userRow.id}`);

  // 3. Upsert donors row
  await dbUpsert('donors', {
    user_id: userRow.id,
    national_id: '9800000001',
    blood_type: 'O+',
    gender: 'male',
    birth_date: '1998-06-15',
    latitude: 31.9539,
    longitude: 35.9106,
    location_name: 'Amman',
    is_eligible: true,
    total_donations: 3,
  }, 'user_id');
  console.log('   donors row: ✓');

  console.log('\n✅ Donor account ready:');
  console.log('   Email:    donor@damk3alena.jo');
  console.log('   Password: Donor@2026');
  console.log('   Blood:    O+  |  City: Amman');
  console.log('   Use this account on the mobile app (Android APK)');
}

async function createStaffAccount() {
  console.log('\n🏥 Creating staff account...');

  // 1. Get or create auth user
  const authUser = await getOrCreateAuthUser('staff@damk3alena.jo', 'Staff@2026');
  const authId = authUser.id;
  console.log(`   Auth user: ${authId}`);

  // 2. Upsert users row
  const userRow = await dbUpsert('users', {
    auth_id: authId,
    role: 'staff',
    first_name: 'Lara',
    last_name: 'Nour',
    phone: '+96279000002',
    email: 'staff@damk3alena.jo',
  }, 'auth_id');
  console.log(`   users row: ${userRow.id}`);

  // 3. Upsert staff row (links to first facility)
  const facilityRes2 = await fetch(`${SUPABASE_URL}/rest/v1/facilities?select=id&limit=1`, {
    headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'apikey': SERVICE_ROLE_KEY },
  });
  const facilities = await facilityRes2.json();
  if (facilities.length > 0) {
    await dbUpsert('staff', {
      user_id: userRow.id,
      facility_id: facilities[0].id,
      position: 'Blood Bank Coordinator',
      is_approved: true,
    }, 'user_id');
    console.log('   staff row: ✓');
  } else {
    console.log('   ⚠️  No facilities found — staff row skipped');
  }

  console.log('\n✅ Staff account ready:');
  console.log('   Email:    staff@damk3alena.jo');
  console.log('   Password: Staff@2026');
  console.log('   Role:     Staff (blood bank coordinator)');
  console.log('   Use this account on the web dashboard: https://damk-3alena.vercel.app');
}

async function main() {
  if (SERVICE_ROLE_KEY === 'PASTE_SERVICE_ROLE_KEY_HERE') {
    console.error('❌ Please paste your Supabase service role key into this script first.');
    console.error('   Find it at: https://supabase.com/dashboard/project/fyushkwhotqyihzuekhr/settings/api');
    process.exit(1);
  }

  try {
    await createDonorAccount();
    await createStaffAccount();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Test accounts summary (for judges):');
    console.log('  Mobile app (APK):');
    console.log('    Email:    donor@damk3alena.jo');
    console.log('    Password: Donor@2026');
    console.log('  Web dashboard:');
    console.log('    URL:      https://damk-3alena.vercel.app');
    console.log('    Email:    staff@damk3alena.jo');
    console.log('    Password: Staff@2026');
    console.log('═══════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('If the error says "User already registered", the account already exists — skip it.');
  }
}

main();
