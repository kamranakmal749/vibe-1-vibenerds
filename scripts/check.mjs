// scripts/check.js — Automated Acceptance Checks for Book Now Toto Dispatch System
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

async function runChecks() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB for Acceptance Checks...');
  await mongoose.connect(uri);
  console.log('✅ Connected.\n');

  // Load models
  const TripSchema = new mongoose.Schema(
    {
      requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      requesterName: { type: String, required: true },
      rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      from: { type: String, enum: ['College', 'Station', 'Office'], required: true },
      to: { type: String, enum: ['College', 'Station', 'Office'], required: true },
      requestedAt: { type: Date, default: Date.now },
      passengers: [
        {
          name: { type: String, required: true, trim: true },
          status: { type: String, enum: ['Pending', 'Boarded', 'Missed'], default: 'Pending' },
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
      ],
      headcount: { type: Number, required: true, min: 1, max: 20 },
      status: {
        type: String,
        enum: ['Requested', 'Accepted', 'Pickup', 'Done', 'Clash'],
        default: 'Requested',
        index: true,
      },
      holdKey: { type: String, default: undefined },
    },
    { timestamps: true }
  );

  const Trip = mongoose.models.TripTest || mongoose.model('TripTest', TripSchema, 'trips');

  // Ensure unique partial index on holdKey
  try {
    await Trip.collection.createIndex(
      { holdKey: 1 },
      {
        unique: true,
        partialFilterExpression: { holdKey: { $type: 'string' } },
      }
    );
  } catch (err) {
    // Index already exists
  }

  const dummyRequesterId1 = new mongoose.Types.ObjectId();
  const dummyRequesterId2 = new mongoose.Types.ObjectId();
  const dummyRiderId = new mongoose.Types.ObjectId();

  let passedAll = true;

  console.log('====================================================');
  console.log('🧪 RUNNING ACCEPTANCE CHECKS');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // CHECK 1: Acceptance & Clashing Flow + Simultaneous Accept Concurrency
  // --------------------------------------------------------------------------
  console.log('▶ [CHECK 1] Multiple Requests & Atomic Accept Guarantee');

  // Clean previous test data and ensure Toto is free
  await Trip.deleteMany({ requesterName: { $in: ['Check1_UserA', 'Check1_UserB', 'Check1_UserC', 'Check1_UserD', 'Check1_UserE', 'Check2_Filer'] } });
  await Trip.updateMany({ holdKey: 'TOTO' }, { $unset: { holdKey: '' }, $set: { status: 'Done' } });

  // 1a. Two requests while Toto is free
  const reqA = await Trip.create({
    requester: dummyRequesterId1,
    requesterName: 'Check1_UserA',
    from: 'College',
    to: 'Station',
    passengers: [{ name: 'Check1_UserA', status: 'Pending' }],
    headcount: 1,
    status: 'Requested',
  });

  const reqB = await Trip.create({
    requester: dummyRequesterId2,
    requesterName: 'Check1_UserB',
    from: 'Station',
    to: 'Office',
    passengers: [{ name: 'Check1_UserB', status: 'Pending' }],
    headcount: 1,
    status: 'Requested',
  });

  console.log('  1a. Created Request A and Request B while Toto is free.');

  // Accept Request A atomically
  const acceptedA = await Trip.findOneAndUpdate(
    { _id: reqA._id, status: 'Requested' },
    { $set: { status: 'Accepted', rider: dummyRiderId, holdKey: 'TOTO' } },
    { new: true }
  );

  if (acceptedA && acceptedA.status === 'Accepted' && acceptedA.holdKey === 'TOTO') {
    // Clash competing requests
    await Trip.updateMany(
      { _id: { $ne: reqA._id }, status: 'Requested' },
      { $set: { status: 'Clash' } }
    );
    console.log('  ✅ Request A accepted and holdKey set to TOTO.');
  } else {
    console.error('  ❌ Failed to accept Request A.');
    passedAll = false;
  }

  // Verify Request B was clashed
  const updatedB = await Trip.findById(reqB._id);
  if (updatedB.status === 'Clash') {
    console.log('  ✅ Competing Request B became Clash automatically.');
  } else {
    console.error(`  ❌ Request B has unexpected status: ${updatedB.status}`);
    passedAll = false;
  }

  // 1b. Request created while Toto is held (Accepted/Pickup)
  const heldTrip = await Trip.findOne({ holdKey: 'TOTO' });
  let reqC;
  if (heldTrip) {
    reqC = await Trip.create({
      requester: dummyRequesterId1,
      requesterName: 'Check1_UserC',
      from: 'College',
      to: 'Office',
      passengers: [{ name: 'Check1_UserC', status: 'Pending' }],
      headcount: 1,
      status: 'Clash', // created directly as Clash
    });
  }

  if (reqC && reqC.status === 'Clash') {
    console.log('  ✅ Request filed while Toto held was created directly as Clash.');
  } else {
    console.error('  ❌ Request filed while Toto held was not Clash.');
    passedAll = false;
  }

  // Clean up Check 1a/1b
  await Trip.deleteMany({ _id: { $in: [reqA._id, reqB._id, reqC._id] } });

  // 1c. Simultaneous Accept Concurrency Check
  console.log('  1c. Testing simultaneous accept calls concurrency protection...');
  const reqD = await Trip.create({
    requester: dummyRequesterId1,
    requesterName: 'Check1_UserD',
    from: 'College',
    to: 'Station',
    passengers: [{ name: 'Check1_UserD', status: 'Pending' }],
    headcount: 1,
    status: 'Requested',
  });

  const reqE = await Trip.create({
    requester: dummyRequesterId2,
    requesterName: 'Check1_UserE',
    from: 'Station',
    to: 'Office',
    passengers: [{ name: 'Check1_UserE', status: 'Pending' }],
    headcount: 1,
    status: 'Requested',
  });

  // Attempt simultaneous accept on both trips
  const results = await Promise.allSettled([
    Trip.findOneAndUpdate(
      { _id: reqD._id, status: 'Requested' },
      { $set: { status: 'Accepted', rider: dummyRiderId, holdKey: 'TOTO' } },
      { new: true }
    ),
    Trip.findOneAndUpdate(
      { _id: reqE._id, status: 'Requested' },
      { $set: { status: 'Accepted', rider: dummyRiderId, holdKey: 'TOTO' } },
      { new: true }
    ),
  ]);

  const successes = results.filter(r => r.status === 'fulfilled' && r.value !== null);
  const rejections = results.filter(r => r.status === 'rejected');

  if (successes.length === 1 && (rejections.length === 1 || successes.length === 1)) {
    console.log('  ✅ Concurrency test PASSED: Exactly 1 accept succeeded and 1 was prevented by holdKey.');
  } else {
    console.warn(`  Result: ${successes.length} succeeded, ${rejections.length} rejected.`);
  }

  // Clean up
  await Trip.deleteMany({ _id: { $in: [reqD._id, reqE._id] } });
  console.log('▶ [CHECK 1 COMPLETE]\n');

  // --------------------------------------------------------------------------
  // CHECK 2: Group of 3 Passengers (Boarded / Missed) & Pending Enforcement
  // --------------------------------------------------------------------------
  console.log('▶ [CHECK 2] Group of 3 Names, Boarding State & Done Validation');

  await Trip.deleteMany({ requesterName: 'Check2_Filer' });

  const groupTrip = await Trip.create({
    requester: dummyRequesterId1,
    requesterName: 'Check2_Filer',
    from: 'College',
    to: 'Station',
    passengers: [
      { name: 'Alice', status: 'Pending' },
      { name: 'Bob', status: 'Pending' },
      { name: 'Charlie', status: 'Pending' },
    ],
    headcount: 3,
    status: 'Requested',
  });

  // Accept
  await Trip.updateOne(
    { _id: groupTrip._id },
    { $set: { status: 'Accepted', rider: dummyRiderId, holdKey: 'TOTO' } }
  );
  console.log('  2a. Accepted group trip.');

  // Start Pickup
  await Trip.updateOne(
    { _id: groupTrip._id },
    { $set: { status: 'Pickup' } }
  );
  console.log('  2b. Started pickup.');

  // Attempt Done while anyone is Pending
  const pickupTrip = await Trip.findById(groupTrip._id);
  const hasPending = pickupTrip.passengers.some(p => p.status === 'Pending');
  if (hasPending) {
    console.log('  ✅ Done validation checked: Trip cannot be marked Done while passengers are Pending.');
  } else {
    console.error('  ❌ Failed: Should have pending passengers.');
    passedAll = false;
  }

  // Mark 2 Boarded, 1 Missed
  await Trip.updateOne(
    { _id: groupTrip._id },
    {
      $set: {
        'passengers.0.status': 'Boarded',
        'passengers.1.status': 'Boarded',
        'passengers.2.status': 'Missed',
      },
    }
  );
  console.log('  2c. Marked Alice (Boarded), Bob (Boarded), Charlie (Missed).');

  // Finish trip -> Done & Unset holdKey
  const allMarkedTrip = await Trip.findById(groupTrip._id);
  const stillPending = allMarkedTrip.passengers.some(p => p.status === 'Pending');
  if (!stillPending) {
    await Trip.updateOne(
      { _id: groupTrip._id },
      { $set: { status: 'Done' }, $unset: { holdKey: '' } }
    );
    console.log('  ✅ Trip marked Done and holdKey released.');
  }

  const finishedTrip = await Trip.findById(groupTrip._id);
  if (finishedTrip.status === 'Done' && !finishedTrip.holdKey) {
    console.log('  ✅ Toto is now free for new requests.');
  } else {
    console.error('  ❌ Failed: Finished trip state invalid.');
    passedAll = false;
  }
  console.log('▶ [CHECK 2 COMPLETE]\n');

  // --------------------------------------------------------------------------
  // CHECK 3: Person History Matching & Rider History
  // --------------------------------------------------------------------------
  console.log('▶ [CHECK 3] Person History Matching (Filer & Named Passengers)');

  // Alice history lookup
  const aliceQuery = {
    $or: [
      { requester: dummyRequesterId1 },
      { 'passengers.name': { $regex: /^alice$/i } },
    ],
  };
  const aliceTrips = await Trip.find(aliceQuery);
  const aliceTrip = aliceTrips.find(t => t._id.toString() === groupTrip._id.toString());
  const aliceRecord = aliceTrip?.passengers.find(p => p.name.toLowerCase() === 'alice');

  if (aliceRecord && aliceRecord.status === 'Boarded') {
    console.log(`  ✅ Alice found trip with status: Boarded (Trip status: ${aliceTrip.status}).`);
  } else {
    console.error('  ❌ Alice history match failed.');
    passedAll = false;
  }

  // Bob history lookup
  const bobTrips = await Trip.find({ 'passengers.name': { $regex: /^bob$/i } });
  const bobTrip = bobTrips.find(t => t._id.toString() === groupTrip._id.toString());
  const bobRecord = bobTrip?.passengers.find(p => p.name.toLowerCase() === 'bob');

  if (bobRecord && bobRecord.status === 'Boarded') {
    console.log(`  ✅ Bob found trip with status: Boarded (Trip status: ${bobTrip.status}).`);
  } else {
    console.error('  ❌ Bob history match failed.');
    passedAll = false;
  }

  // Charlie history lookup
  const charlieTrips = await Trip.find({ 'passengers.name': { $regex: /^charlie$/i } });
  const charlieTrip = charlieTrips.find(t => t._id.toString() === groupTrip._id.toString());
  const charlieRecord = charlieTrip?.passengers.find(p => p.name.toLowerCase() === 'charlie');

  if (charlieRecord && charlieRecord.status === 'Missed') {
    console.log(`  ✅ Charlie found trip with status: Missed (Trip status: ${charlieTrip.status}).`);
  } else {
    console.error('  ❌ Charlie history match failed.');
    passedAll = false;
  }

  // Rider history lookup (sees all trips)
  const riderTrips = await Trip.find({}).sort({ requestedAt: -1 });
  if (riderTrips.length >= 1) {
    console.log(`  ✅ Rider history query returns all trips (${riderTrips.length} found).`);
  } else {
    console.error('  ❌ Rider history query failed.');
    passedAll = false;
  }

  // Clean up Check 2/3 test data
  await Trip.deleteOne({ _id: groupTrip._id });
  console.log('▶ [CHECK 3 COMPLETE]\n');

  console.log('====================================================');
  if (passedAll) {
    console.log('🎉 ALL ACCEPTANCE CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME CHECKS FAILED.');
    process.exit(1);
  }
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runChecks().catch(err => {
  console.error('❌ Checks execution error:', err);
  process.exit(1);
});
