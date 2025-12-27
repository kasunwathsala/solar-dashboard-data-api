import { connectDB } from './db';
import { EnergyGenerationRecord } from './entities/EnergyGenerationRecord';

/**
 * Check what energy generation data exists in the database
 */
async function checkData() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();
    
    // Get all distinct dates
    const distinctDates = await EnergyGenerationRecord.distinct('timestamp');
    
    if (distinctDates.length === 0) {
      console.log('❌ No energy generation records found in database');
      return;
    }
    
    // Group by date and count records
    const pipeline: any[] = [
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 },
          totalEnergy: { $sum: "$energyGenerated" },
          units: { $addToSet: "$serialNumber" }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ];
    
    const dateGroups = await EnergyGenerationRecord.aggregate(pipeline);
    
    console.log('\n📊 Energy Generation Records by Date:');
    console.log('=====================================');
    dateGroups.forEach((group: any) => {
      console.log(`\n📅 Date: ${group._id}`);
      console.log(`   Records: ${group.count}`);
      console.log(`   Total Energy: ${group.totalEnergy.toFixed(2)} kWh`);
      console.log(`   Units: ${group.units.join(', ')}`);
    });
    
    console.log('\n✅ Data check completed');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error checking data:', error.message);
    process.exit(1);
  }
}

checkData();
