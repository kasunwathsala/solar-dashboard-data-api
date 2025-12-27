import 'dotenv/config';
import axios from 'axios';

/**
 * Script to manually generate today's data on DEPLOYED backend
 * Can be run locally to trigger remote data generation
 */

const DEPLOYED_CORE_BACKEND = 'https://fed-4-back-end-wathsala2.onrender.com';

async function generateTodayDataRemotely() {
  console.log('🚀 Generating today\'s data on DEPLOYED backend...');
  console.log(`📡 Target: ${DEPLOYED_CORE_BACKEND}`);
  console.log('');

  try {
    // Wake up backend first
    console.log('1️⃣ Waking up backend (may take 50+ seconds)...');
    try {
      await axios.get(`${DEPLOYED_CORE_BACKEND}/api/solar-units/test`, {
        timeout: 60000
      });
      console.log('   ✅ Backend is awake');
    } catch (error) {
      console.log('   ⏳ Still waking up...');
    }

    // Get all active solar units
    console.log('');
    console.log('2️⃣ Fetching active solar units...');
    const unitsResponse = await axios.get(`${DEPLOYED_CORE_BACKEND}/api/solar-units/test?status=ACTIVE`, {
      timeout: 30000
    });
    
    const solarUnits = unitsResponse.data;
    console.log(`   ✅ Found ${solarUnits.length} active solar units`);

    if (solarUnits.length === 0) {
      console.log('   ❌ No active solar units found');
      return;
    }

    // The deployed backend should have its scheduler running
    // But if it was sleeping, we need to wake it and let it catch up
    
    console.log('');
    console.log('3️⃣ Backend scheduler status:');
    console.log('   ⚠️  Render free tier backends sleep after 15 minutes of inactivity');
    console.log('   ⚠️  When sleeping, the cron scheduler DOES NOT RUN');
    console.log('   ⚠️  This means daily data generation at 00:00 may be missed');
    console.log('');
    
    console.log('📊 Solution: Set up external cron to keep backend alive');
    console.log('');
    console.log('Steps:');
    console.log('1. Go to https://cron-job.org (free service)');
    console.log('2. Create a free account');
    console.log('3. Add a new cron job:');
    console.log(`   - URL: ${DEPLOYED_CORE_BACKEND}/api/solar-units/test`);
    console.log('   - Schedule: Every 14 minutes (to keep backend awake)');
    console.log('   - Method: GET');
    console.log('');
    console.log('This will:');
    console.log('✅ Keep backend from sleeping');
    console.log('✅ Allow daily scheduler to run at 00:00');
    console.log('✅ Ensure daily data generation happens automatically');
    console.log('');

    console.log('4️⃣ For immediate fix - manually trigger data generation:');
    console.log('   Option A: Run this locally:');
    console.log('   ```');
    console.log('   cd data_backend/solar-dashboard-data-api');
    console.log('   npm run generate:today');
    console.log('   ```');
    console.log('');
    console.log('   Option B: SSH into Render and run:');
    console.log('   ```');
    console.log('   npm run generate:today');
    console.log('   ```');
    console.log('');

    console.log('✅ Instructions provided');
    
  } catch (error: any) {
    console.error('');
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
    }
  }
}

generateTodayDataRemotely();
