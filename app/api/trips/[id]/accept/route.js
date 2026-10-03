// app/api/trips/[id]/accept/route.js
// Rider accepts a pending trip → confirmed; clash any other pending trip at same time

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Trip from '@/lib/models/Trip';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req, { params }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'rider') return NextResponse.json({ error: 'Only riders can accept trips' }, { status: 403 });

  await connectDB();
  const trip = await Trip.findById(params.id);
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  if (trip.status !== 'pending') {
    return NextResponse.json({ error: `Trip is already ${trip.status}` }, { status: 400 });
  }

  // Check if rider already has an active trip (confirmed or in_progress)
  const activeTrip = await Trip.findOne({
    rider: user.id,
    status: { $in: ['confirmed', 'in_progress'] },
  });
  if (activeTrip) {
    return NextResponse.json({
      error: 'You already have an active trip. Complete it first.',
    }, { status: 400 });
  }

  // Accept this trip
  const scheduledAt = trip.scheduledAt;

  // Find all other PENDING trips that overlap this time window (within ±30 minutes)
  const windowStart = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(scheduledAt.getTime() + 30 * 60 * 1000);

  const clashingTrips = await Trip.find({
    _id: { $ne: trip._id },
    status: 'pending',
    scheduledAt: { $gte: windowStart, $lte: windowEnd },
  });

  // Mark clashing trips
  if (clashingTrips.length > 0) {
    await Trip.updateMany(
      { _id: { $in: clashingTrips.map(t => t._id) } },
      { $set: { status: 'clashed' } }
    );
  }

  // Confirm this trip
  trip.status = 'confirmed';
  trip.rider = user.id;
  trip.acceptedAt = new Date();
  await trip.save();

  return NextResponse.json({
    trip,
    clashed: clashingTrips.length,
    message: `Trip confirmed. ${clashingTrips.length} clash${clashingTrips.length !== 1 ? 'es' : ''} detected.`,
  });
}
