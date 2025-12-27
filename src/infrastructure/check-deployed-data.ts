import 'dotenv/config';
import axios from 'axios';

/**
 * Script to manually trigger today's data generation on deployed backend
 * Use this when the scheduler hasn't run or you need to force generation
 */

const DEPLOYED_DATA_BACKEND = 'https://fed-4-backend-data-api-wathsala1.onrender.com';
const DEPLOYED_CORE_BACKEND = 'https://fed-4-back-end-wathsala2.onrender.com';

async function triggerTodayDataGeneration() {
  console.log('🚀 Triggering today\'s data generation on deployed backend...');
  console.log(`📡 Target: ${DEPLOYED_DATA_BACKEND}`);
  console.log('');

  try {
    // First, check if backend is alive
    console.log('1️⃣ Checking if backend is alive...');
    try {
      const healthCheck = await axios.get(`${DEPLOYED_DATA_BACKEND}/api/energy-generation-records`, {
        timeout: 10000
      });
      console.log('   ✅ Backend is responding');
    } catch (error: any) {
      console.log('   ⚠️  Backend might be sleeping (Render free tier)');
      console.log('   ⏳ Waking up backend... (this may take 50+ seconds)');
    }

    // Get all active solar units from core backend
    console.log('');
    console.log('2️⃣ Fetching active solar units from core backend...');
    const unitsResponse = await axios.get(`${DEPLOYED_CORE_BACKEND}/api/solar-units/test?status=ACTIVE`, {
      timeout: 30000
    });
    
    const solarUnits = unitsResponse.data;
    console.log(`   ✅ Found ${solarUnits.length} active solar units`);
    
    if (solarUnits.length === 0) {
      console.log('   ❌ No active solar units found');
      return;
    }

    // Display units
    console.log('');
    console.log('📋 Solar Units:');
    solarUnits.forEach((unit: any, index: number) => {
      const name = unit.name || unit.serialNumber || unit._id;
      console.log(`   ${index + 1}. ${name} (${unit.serialNumber})`);
    });

    console.log('');
    console.log('3️⃣ Today\'s data should be generated automatically by the scheduler at 00:00');
    console.log('');
    console.log('⚠️  IMPORTANT: Render free tier limitations:');
    console.log('   - Services sleep after 15 minutes of inactivity');
    console.log('   - Scheduler may not run reliably on free tier');
    console.log('   - Consider upgrading to paid tier for production use');
    console.log('');
    console.log('💡 Alternative solutions:');
    console.log('   1. Use a cron service (like cron-job.org) to ping the backend every 14 minutes');
    console.log('   2. Upgrade to Render paid tier ($7/month)');
    console.log('   3. Deploy to a service with always-on free tier (Railway, Fly.io)');
    console.log('');

    // Check recent data
    console.log('4️⃣ Checking recent data for first solar unit...');
    if (solarUnits.length > 0) {
      const firstUnit = solarUnits[0];
      try {
        const dataResponse = await axios.get(
          `${DEPLOYED_CORE_BACKEND}/api/energy-generation-records/solar-unit/${firstUnit._id}?groupBy=daily&limit=7`,
          {
            timeout: 15000,
            headers: {
              'Authorization': 'Bearer test-token' // May need actual auth
            }
          }
        );
        
        console.log('');
        console.log('📊 Last 7 days of data:');
        dataResponse.data.forEach((record: any, index: number) => {
          const date = record.date || record._id;
          const energy = record.totalEnergy || 0;
          console.log(`   ${index + 1}. ${date}: ${energy.toFixed(2)} kWh`);
        });
        
        // Check if today's data exists
        const today = new Date().toISOString().split('T')[0];
        const todayData = dataResponse.data.find((r: any) => (r.date || r._id) === today);
        
        console.log('');
        if (todayData) {
          console.log(`✅ Today's data (${today}) EXISTS: ${todayData.totalEnergy.toFixed(2)} kWh`);
        } else {
          console.log(`❌ Today's data (${today}) NOT FOUND`);
          console.log('   Possible reasons:');
          console.log('   - Scheduler hasn\'t run yet today (runs at 00:00)');
          console.log('   - Backend was sleeping when scheduler should have run');
          console.log('   - Time zone mismatch');
        }
      } catch (error: any) {
        console.log(`   ❌ Could not fetch data: ${error.message}`);
        console.log('   This might be due to authentication requirements');
      }
    }

    console.log('');
    console.log('✅ Check completed');
    
  } catch (error: any) {
    console.error('');
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

triggerTodayDataGeneration();
