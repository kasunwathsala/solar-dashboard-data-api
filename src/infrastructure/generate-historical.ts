import { DataGenerationScheduler } from './data-generation-scheduler';
import 'dotenv/config';
import { connectDB } from './db';

/**
 * Manual script to generate historical data for past 7 days
 */
async function generateHistoricalData() {
  console.log('🚀 Starting historical data generation for past 7 days...');
  
  try {
    // Connect to database
    await connectDB();
    
    // Generate data for past 7 days
    await DataGenerationScheduler.generateHistoricalData(7);
    
    console.log('✅ Historical data generation completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error generating historical data:', error.message);
    process.exit(1);
  }
}

generateHistoricalData();
