import { DataGenerationScheduler } from './data-generation-scheduler';
import 'dotenv/config';
import { connectDB } from './db';

/**
 * Manual script to generate today's data for all active solar units
 */
async function generateTodayData() {
  console.log('🚀 Starting manual data generation for today...');
  
  try {
    // Connect to database
    await connectDB();
    
    // Generate today's data
    await DataGenerationScheduler.generateTodayData();
    
    console.log('✅ Data generation completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error generating data:', error.message);
    process.exit(1);
  }
}

generateTodayData();
