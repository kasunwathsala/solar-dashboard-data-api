import * as cron from 'node-cron';
import axios from 'axios';
import { EnergyGenerationRecord } from './entities/EnergyGenerationRecord';

/**
 * Daily Energy Data Generation Scheduler
 * Runs every day at midnight (00:00) to generate energy records for all active solar units
 * Generates data in data backend and syncs to core backend
 */
export class DataGenerationScheduler {
  private static job: cron.ScheduledTask | null = null;
  private static coreBackendUrl = process.env.CORE_BACKEND_URL || 'http://localhost:8002';

  /**
   * Start the scheduler
   */
  static start() {
    if (this.job) {
      console.log('⚠️  Data generation scheduler already running');
      return;
    }

    // Run every day at midnight (00:00)
    this.job = cron.schedule('0 0 * * *', async () => {
      console.log('📊 Running daily energy data generation...');
      try {
        await this.generateDailyData();
        console.log('✅ Daily energy data generation completed');
      } catch (error: any) {
        console.error('❌ Daily energy data generation failed:', error.message);
      }
    });

    console.log('📅 Starting daily data generation scheduler...');
    console.log('✅ Data generation scheduler started (runs daily at 00:00)');
  }

  /**
   * Stop the scheduler
   */
  static stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('🛑 Data generation scheduler stopped');
    }
  }

  /**
   * Generate energy records for all active solar units for today
   */
  static async generateDailyData() {
    try {
      // Get all active solar units from core backend (using test endpoint - no auth required)
      const response = await axios.get(`${this.coreBackendUrl}/api/solar-units/test`, {
        params: { status: 'ACTIVE' }
      });
      
      const solarUnits = response.data;
      console.log(`   Found ${solarUnits.length} active solar units`);

      if (solarUnits.length === 0) {
        console.log('   No active solar units found');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      // Generate records for each solar unit
      for (const unit of solarUnits) {
        try {
          await this.generateRecordsForUnit(unit, today);
        } catch (error: any) {
          console.error(`   Error generating data for unit ${unit._id}:`, error.message);
        }
      }

      console.log('   Data generation completed for all units');
    } catch (error: any) {
      console.error('   Error in generateDailyData:', error.message);
      throw error;
    }
  }

  /**
   * Generate energy records for a specific solar unit for a given day
   * Creates 12 records (one every 2 hours)
   */
  private static async generateRecordsForUnit(unit: any, date: Date) {
    const capacity = unit.capacity || 5000; // Default 5kW if not set
    const serialNumber = unit.serialNumber;
    const records = [];

    // Generate 12 records (every 2 hours: 00:00, 02:00, 04:00, ..., 22:00)
    for (let hour = 0; hour < 24; hour += 2) {
      const timestamp = new Date(date);
      timestamp.setHours(hour, 0, 0, 0);

      // Calculate realistic energy generation based on time of day
      const energyGenerated = this.calculateEnergyGeneration(hour, capacity);

      records.push({
        serialNumber,
        solarUnitId: unit._id,
        timestamp,
        energyGenerated,
        peakPower: energyGenerated > 0 ? energyGenerated * 1.2 : 0, // Peak is ~20% higher
        efficiency: energyGenerated > 0 ? 85 + Math.random() * 10 : 0, // 85-95% during generation
        temperature: 25 + Math.random() * 15, // 25-40°C
      });
    }

    // Check if records for this date already exist
    const existingCount = await EnergyGenerationRecord.countDocuments({
      serialNumber,
      timestamp: {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingCount > 0) {
      console.log(`   ⏭️  Skipping unit ${unit.name} - data already exists for ${date.toDateString()}`);
      return;
    }

    // Insert all records
    await EnergyGenerationRecord.insertMany(records);
    console.log(`   ✅ Generated ${records.length} records for unit: ${unit.name}`);
  }

  /**
   * Calculate realistic energy generation based on hour of day
   * Simulates solar generation pattern (0 at night, peak at noon)
   */
  private static calculateEnergyGeneration(hour: number, capacity: number): number {
    // No generation at night (10 PM - 6 AM)
    if (hour >= 22 || hour < 6) {
      return 0;
    }

    // Morning ramp up (6 AM - 12 PM)
    if (hour >= 6 && hour < 12) {
      const factor = (hour - 6) / 6; // 0 to 1
      const baseGeneration = capacity * 0.7 * factor; // Up to 70% of capacity
      const variation = Math.random() * 0.2 - 0.1; // ±10% variation
      return Math.max(0, baseGeneration * (1 + variation));
    }

    // Peak hours (12 PM - 2 PM)
    if (hour >= 12 && hour < 14) {
      const baseGeneration = capacity * 0.75; // 75% of capacity at peak
      const variation = Math.random() * 0.15 - 0.075; // ±7.5% variation
      return baseGeneration * (1 + variation);
    }

    // Afternoon decline (2 PM - 8 PM)
    if (hour >= 14 && hour < 20) {
      const factor = 1 - (hour - 14) / 6; // 1 to 0
      const baseGeneration = capacity * 0.7 * factor;
      const variation = Math.random() * 0.2 - 0.1; // ±10% variation
      return Math.max(0, baseGeneration * (1 + variation));
    }

    // Evening decline (8 PM - 10 PM)
    if (hour >= 20 && hour < 22) {
      const baseGeneration = capacity * 0.1 * Math.random();
      return Math.max(0, baseGeneration);
    }

    return 0;
  }

  /**
   * Manual trigger for testing - generate data for today
   */
  static async generateTodayData() {
    console.log('🔄 Manually generating today\'s data...');
    await this.generateDailyData();
  }

  /**
   * Generate historical data for past N days (for testing/backfill)
   */
  static async generateHistoricalData(days: number = 7) {
    console.log(`📚 Generating historical data for past ${days} days...`);
    
    try {
      const response = await axios.get(`${this.coreBackendUrl}/api/solar-units/test`, {
        params: { status: 'ACTIVE' }
      });
      
      const solarUnits = response.data;
      console.log(`   Found ${solarUnits.length} active solar units`);

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        console.log(`   Generating data for ${date.toDateString()}`);

        for (const unit of solarUnits) {
          try {
            await this.generateRecordsForUnit(unit, date);
          } catch (error: any) {
            console.error(`   Error generating data for unit ${unit._id}:`, error.message);
          }
        }
      }

      console.log('✅ Historical data generation completed');
    } catch (error: any) {
      console.error('❌ Error generating historical data:', error.message);
      throw error;
    }
  }
}
