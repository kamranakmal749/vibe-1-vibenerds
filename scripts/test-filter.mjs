// scripts/test-filter.mjs — Test Filter Logic with One Clash Trip in Database

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { TRIP_STATUSES, isValidTripStatus } from '../lib/status.js';

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

async function testFilter() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const Trip = mongoose.models.Trip || mongoose.model('Trip', new mongoose.Schema({
    requester: mongoose.Schema.Types.ObjectId,
    requesterName: String,
    from: String,
    to: String,
    requestedAt: Date,
    passengers: [{ name: String, status: String }],
    headcount: Number,
    status: String,
    holdKey: String,
  }, { timestamps: true }), 'trips');

  console.log('====================================================');
  console.log('🧪 FILTER TEST: 1 CLASH TRIP IN DATABASE');
  console.log('====================================================\n');

  // Ensure clean test setup with 1 Clash trip
  const testUserId = new mongoose.Types.ObjectId();
  const testUserName = 'FilterTester';

  await Trip.deleteMany({ requesterName: testUserName });

  const clashTrip = await Trip.create({
    requester: testUserId,
    requesterName: testUserName,
    from: 'College',
    to: 'Station',
    requestedAt: new Date(),
    passengers: [{ name: testUserName, status: 'Pending' }],
    headcount: 1,
    status: TRIP_STATUSES.CLASH,
  });

  console.log(`Created 1 test trip with status: ${clashTrip.status} (ID: ${clashTrip._id})\n`);

  // Query helper simulating /api/trips GET logic
  async function queryTrips(statusParam) {
    // Validate statusParam
    if (statusParam && statusParam !== 'all' && !isValidTripStatus(statusParam)) {
      return { status: 400, error: `Invalid status filter: ${statusParam}` };
    }

    const query = {
      requester: testUserId,
    };
    if (statusParam && statusParam !== 'all') {
      query.status = statusParam;
    }

    const trips = await Trip.find(query).sort({ requestedAt: -1 });
    return { status: 200, trips };
  }

  const filtersToTest = [
    { filter: 'all', expectedCount: 1, expectTrip: true },
    { filter: TRIP_STATUSES.CLASH, expectedCount: 1, expectTrip: true },
    { filter: TRIP_STATUSES.REQUESTED, expectedCount: 0, expectTrip: false },
    { filter: TRIP_STATUSES.ACCEPTED, expectedCount: 0, expectTrip: false },
    { filter: TRIP_STATUSES.PICKUP, expectedCount: 0, expectTrip: false },
    { filter: TRIP_STATUSES.DONE, expectedCount: 0, expectTrip: false },
    { filter: 'invalid_status_xyz', expectedStatus: 400 },
  ];

  let allPassed = true;

  for (const t of filtersToTest) {
    const res = await queryTrips(t.filter);

    if (t.expectedStatus === 400) {
      if (res.status === 400) {
        console.log(`✅ Filter '${t.filter}': Correctly rejected with 400 Bad Request error.`);
      } else {
        console.error(`❌ Filter '${t.filter}': Expected 400 but received ${res.status}`);
        allPassed = false;
      }
      continue;
    }

    const count = res.trips?.length || 0;
    const passed = count === t.expectedCount;

    if (passed) {
      if (count > 0) {
        console.log(`✅ Filter '${t.filter}': Shows ${count} trip(s) (Status: ${res.trips[0].status}).`);
      } else {
        console.log(`✅ Filter '${t.filter}': Shows 0 trips -> renders empty state.`);
      }
    } else {
      console.error(`❌ Filter '${t.filter}': FAILED. Expected ${t.expectedCount} trips, got ${count}.`);
      allPassed = false;
    }
  }

  // Cleanup test trip
  await Trip.deleteOne({ _id: clashTrip._id });

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 ALL FILTER TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ FILTER TESTS FAILED.');
    process.exit(1);
  }
  console.log('====================================================\n');

  await mongoose.disconnect();
}

testFilter().catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});
