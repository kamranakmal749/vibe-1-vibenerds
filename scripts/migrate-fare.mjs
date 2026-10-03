// scripts/migrate-fare.mjs — Backfill fareTotal for existing Done trips
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fareTotal } from '../lib/fare.js';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = val;
      }
    }
  }
}

async function run() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB for Fare Migration...');
  await mongoose.connect(uri);
  console.log('✅ Connected.\n');

  const db = mongoose.connection.db;
  const collection = db.collection('trips');

  const doneTrips = await collection.find({ status: 'Done' }).toArray();
  console.log(`Found ${doneTrips.length} Done trips to backfill fareTotal.`);

  let updatedCount = 0;
  for (const trip of doneTrips) {
    const boardedCount = Array.isArray(trip.passengers)
      ? trip.passengers.filter(p => p.status === 'Boarded').length
      : (trip.headcount || 1);

    const calculatedFare = fareTotal(trip.from, trip.to, boardedCount);
    await collection.updateOne(
      { _id: trip._id },
      { $set: { fareTotal: calculatedFare } }
    );
    updatedCount++;
  }

  console.log(`✅ Successfully backfilled fareTotal for ${updatedCount} Done trips.\n`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Fare migration failed:', err);
  process.exit(1);
});
