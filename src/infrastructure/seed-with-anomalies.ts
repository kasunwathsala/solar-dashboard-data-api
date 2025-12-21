import mongoose from "mongoose";
import { EnergyGenerationRecord } from "./entities/EnergyGenerationRecord";
import dotenv from "dotenv";
import { connectDB } from "./db";

dotenv.config();

// Anomaly pattern definitions
const ANOMALY_PATTERNS = [
  // Zero Generation - simulate 4-hour outage on Dec 1, 2025
  {
    type: "ZERO_GENERATION",
    date: "2025-12-01",
    startHour: 10,
    endHour: 14,
    apply: (record: any) => ({ ...record, energyGenerated: 0 }),
  },
  // Sudden Drop - 70% reduction on Dec 5, 2025 for 6 hours
  {
    type: "SUDDEN_DROP",
    date: "2025-12-05",
    startHour: 9,
    endHour: 15,
    apply: (record: any) => ({ ...record, energyGenerated: Math.round(record.energyGenerated * 0.3) }),
  },
  // Capacity Factor - consistently low output for a week (Dec 10-16)
  {
    type: "CAPACITY_FACTOR",
    dateRange: { start: "2025-12-10", end: "2025-12-16" },
    apply: (record: any) => ({ ...record, energyGenerated: Math.round(record.energyGenerated * 0.4) }),
  },
  // Irregular Pattern - random spikes on Dec 8
  {
    type: "IRREGULAR_PATTERN",
    date: "2025-12-08",
    apply: (record: any) => {
      const spike = Math.random() > 0.5 ? 2.5 : 0.4; // Random spike or drop
      return { ...record, energyGenerated: Math.round(record.energyGenerated * spike) };
    },
  },
  // Nighttime generation error on Dec 3
  {
    type: "IRREGULAR_PATTERN_NIGHT",
    date: "2025-12-03",
    nightOnly: true,
    apply: (record: any) => ({ ...record, energyGenerated: 50 + Math.random() * 100 }),
  },
];

async function seedWithAnomalies() {
  const serialNumber = "SU-TEST-2024";

  try {
    await connectDB();
    await EnergyGenerationRecord.deleteMany({});

    const records = [];
    const startDate = new Date("2025-08-01T08:00:00Z");
    const endDate = new Date("2025-12-20T08:00:00Z"); // Extended to include anomaly dates

    let currentDate = new Date(startDate);
    let normalRecords = 0;
    let anomalyRecords = 0;

    while (currentDate <= endDate) {
      const hour = currentDate.getUTCHours();
      const month = currentDate.getUTCMonth();
      const dateString = currentDate.toISOString().split("T")[0];

      // Base energy generation
      let baseEnergy = 200;
      if (month >= 5 && month <= 7) {
        baseEnergy = 300; // Summer
      } else if (month >= 2 && month <= 4) {
        baseEnergy = 250; // Spring
      } else if (month >= 8 && month <= 10) {
        baseEnergy = 200; // Fall
      } else {
        baseEnergy = 150; // Winter
      }

      // Time of day multiplier
      let timeMultiplier = 0;
      if (hour >= 6 && hour <= 18) {
        timeMultiplier = 1.2;
        if (hour >= 10 && hour <= 14) {
          timeMultiplier = 1.5; // Peak hours
        }
      }

      // Random variation
      const variation = 0.8 + Math.random() * 0.4;
      let energyGenerated = Math.round(baseEnergy * timeMultiplier * variation);

      // Create base record
      let record = {
        serialNumber,
        timestamp: new Date(currentDate),
        energyGenerated,
      };

      // Check if this record should have an anomaly pattern applied
      let isAnomaly = false;
      for (const pattern of ANOMALY_PATTERNS) {
        let shouldApplyPattern = false;

        // Check date-based patterns
        if (pattern.date && dateString === pattern.date) {
          if (pattern.startHour !== undefined && pattern.endHour !== undefined) {
            shouldApplyPattern = hour >= pattern.startHour && hour < pattern.endHour;
          } else if (pattern.nightOnly) {
            shouldApplyPattern = hour < 6 || hour > 20;
          } else {
            shouldApplyPattern = true;
          }
        }

        // Check date range patterns
        if (pattern.dateRange) {
          const inRange =
            dateString >= pattern.dateRange.start && dateString <= pattern.dateRange.end;
          if (inRange) {
            shouldApplyPattern = true;
          }
        }

        if (shouldApplyPattern) {
          record = pattern.apply(record);
          isAnomaly = true;
          break; // Apply only first matching pattern
        }
      }

      records.push(record);
      
      if (isAnomaly) {
        anomalyRecords++;
      } else {
        normalRecords++;
      }

      // Move to next 2-hour interval
      currentDate = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000);
    }

    await EnergyGenerationRecord.insertMany(records);

    console.log("✅ Database seeded successfully with anomaly patterns!");
    console.log(`   Total records: ${records.length}`);
    console.log(`   Normal records: ${normalRecords}`);
    console.log(`   Anomaly records: ${anomalyRecords}`);
    console.log(`   Anomaly percentage: ${((anomalyRecords / records.length) * 100).toFixed(1)}%`);
    console.log("\n🔍 Anomaly Patterns Injected:");
    console.log("   1. Zero Generation: Dec 1, 2025 (10 AM - 2 PM)");
    console.log("   2. Sudden Drop: Dec 5, 2025 (9 AM - 3 PM) - 70% reduction");
    console.log("   3. Low Capacity Factor: Dec 10-16, 2025 - Week of 60% reduction");
    console.log("   4. Irregular Pattern: Dec 8, 2025 - Random spikes/drops");
    console.log("   5. Nighttime Generation: Dec 3, 2025 - Sensor error simulation");
    console.log("\n💡 Tip: Run anomaly detection to identify these patterns!");
  } catch (err) {
    console.error("❌ Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seedWithAnomalies();
