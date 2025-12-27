import express from 'express';
import { DataGenerationScheduler } from '../infrastructure/data-generation-scheduler';

const adminRouter = express.Router();

/**
 * Manual endpoint to trigger daily data generation
 * Use this endpoint with cron-job.org to generate data at midnight daily
 * 
 * POST /api/admin/generate-today-data
 */
adminRouter.post('/generate-today-data', async (req, res) => {
  try {
    console.log('📊 Manual data generation triggered via API');
    await DataGenerationScheduler.generateTodayData();
    return res.status(200).json({ 
      success: true,
      message: 'Today\'s energy data generated successfully' 
    });
  } catch (error: any) {
    console.error('❌ Manual data generation failed:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Data generation failed', 
      error: error?.message || String(error) 
    });
  }
});

/**
 * Generate historical data for past N days
 * Useful for backfilling missing data
 * 
 * POST /api/admin/generate-historical-data
 * Body: { days: 7 }
 */
adminRouter.post('/generate-historical-data', async (req, res) => {
  try {
    const days = req.body?.days || 7;
    console.log(`📚 Generating historical data for ${days} days`);
    await DataGenerationScheduler.generateHistoricalData(days);
    return res.status(200).json({ 
      success: true,
      message: `Historical data generated for past ${days} days` 
    });
  } catch (error: any) {
    console.error('❌ Historical data generation failed:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Historical data generation failed', 
      error: error?.message || String(error) 
    });
  }
});

export default adminRouter;
