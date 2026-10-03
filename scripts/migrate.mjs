// scripts/migrate.mjs — One-off database migration script
// 1. Drops legacy slot/scheduledAt indexes and ensures holdKey unique partial index.
// 2. Normalizes legacy status names to the single source of truth:
//    pending -> Requested, confirmed -> Accepted, in_progress -> Pickup, completed -> Done, clashed/cancelled -> Clash.
// 3. Unsets legacy fields (slot, scheduledAt, routeDistanceKm, etc.).
// 4. Sets holdKey: "TOTO" for Accepted/Pickup trips and unsets for others.
// 5. Prints migration breakdown per status mapping.

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Load .env.local
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

async function migrate() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected.');

  const db = mongoose.connection.db;
  const collection = db.collection('trips');

  // 1. Manage indexes
  console.log('\n--- 1. Managing Indexes ---');
  try {
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes.map(i => i.name));

    for (const idx of indexes) {
      if (idx.name.includes('slot') || idx.name.includes('scheduledAt') || (idx.key && (idx.key.slot || idx.key.scheduledAt))) {
        console.log(`Dropping index: ${idx.name}`);
        await collection.dropIndex(idx.name);
      }
    }

    try {
      await collection.createIndex(
        { holdKey: 1 },
        {
          unique: true,
          partialFilterExpression: { holdKey: { $type: 'string' } },
        }
      );
      console.log('✅ holdKey unique partial index verified.');
    } catch (err) {
      // index already exists
      console.log('✅ holdKey index already active.');
    }
  } catch (err) {
    console.warn('⚠️ Index management warning:', err.message);
  }

  // 2. Normalize statuses & unset legacy fields
  console.log('\n--- 2. Cleaning Documents & Normalizing Statuses ---');
  const allTrips = await collection.find({}).toArray();
  console.log(`Found ${allTrips.length} trip documents to inspect.\n`);

  const mappingCounts = {
    'pending -> Requested': 0,
    'confirmed -> Accepted': 0,
    'in_progress -> Pickup': 0,
    'completed -> Done': 0,
    'clashed -> Clash': 0,
    'cancelled -> Clash': 0,
    'already_normalized': 0,
    'other': 0,
  };

  let totalUpdated = 0;

  for (const trip of allTrips) {
    const updates = {};
    const unsets = {
      slot: '',
      scheduledAt: '',
      routeDistanceKm: '',
      farePerPerson: '',
      totalFare: '',
    };

    // Check status mapping
    let newStatus = trip.status;
    const rawStatus = (trip.status || '').toLowerCase();

    if (rawStatus === 'pending') {
      newStatus = 'Requested';
      mappingCounts['pending -> Requested']++;
    } else if (rawStatus === 'confirmed') {
      newStatus = 'Accepted';
      mappingCounts['confirmed -> Accepted']++;
    } else if (rawStatus === 'in_progress' || rawStatus === 'in progress') {
      newStatus = 'Pickup';
      mappingCounts['in_progress -> Pickup']++;
    } else if (rawStatus === 'completed') {
      newStatus = 'Done';
      mappingCounts['completed -> Done']++;
    } else if (rawStatus === 'clashed') {
      newStatus = 'Clash';
      mappingCounts['clashed -> Clash']++;
    } else if (rawStatus === 'cancelled') {
      newStatus = 'Clash';
      mappingCounts['cancelled -> Clash']++;
    } else if (['Requested', 'Accepted', 'Pickup', 'Done', 'Clash'].includes(trip.status)) {
      mappingCounts['already_normalized']++;
    } else {
      newStatus = 'Requested';
      mappingCounts['other']++;
    }

    if (newStatus !== trip.status) {
      updates.status = newStatus;
    }

    // Normalize requestedAt
    if (!trip.requestedAt) {
      updates.requestedAt = trip.createdAt || trip.scheduledAt || new Date();
    }

    // Normalize headcount
    if (!trip.headcount) {
      updates.headcount = trip.passengers?.length || 1;
    }

    // Normalize passenger statuses
    if (Array.isArray(trip.passengers)) {
      let passengerChanged = false;
      const cleanPassengers = trip.passengers.map(p => {
        const rawPStatus = (p.status || 'Pending').toLowerCase();
        let pStatus = 'Pending';
        if (rawPStatus === 'boarded') pStatus = 'Boarded';
        else if (rawPStatus === 'missed') pStatus = 'Missed';
        else pStatus = 'Pending';

        if (pStatus !== p.status) passengerChanged = true;
        return {
          name: p.name,
          status: pStatus,
        };
      });
      if (passengerChanged) {
        updates.passengers = cleanPassengers;
      }
    }

    // Set or unset holdKey
    const finalStatus = updates.status || trip.status;
    if (finalStatus === 'Accepted' || finalStatus === 'Pickup') {
      updates.holdKey = 'TOTO';
    } else {
      unsets.holdKey = '';
    }

    const updateDoc = {};
    if (Object.keys(updates).length > 0) updateDoc.$set = updates;
    if (Object.keys(unsets).length > 0) updateDoc.$unset = unsets;

    if (Object.keys(updateDoc).length > 0) {
      await collection.updateOne({ _id: trip._id }, updateDoc);
      totalUpdated++;
    }
  }

  console.log('Status Mapping Breakdown:');
  for (const [key, count] of Object.entries(mappingCounts)) {
    console.log(` - ${key}: ${count}`);
  }
  console.log(`\nTotal documents updated: ${totalUpdated}`);

  // Print final indexes
  const finalIndexes = await collection.indexes();
  console.log('\nFinal indexes on trips:');
  finalIndexes.forEach(idx => console.log(` - ${idx.name}: ${JSON.stringify(idx.key)}`));

  console.log('\n🎉 Migration completed successfully.\n');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
