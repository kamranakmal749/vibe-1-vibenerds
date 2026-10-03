// app/api/trips/[id]/done/route.js
// Rider completes trip (Pickup → Done), unsets holdKey and frees the Toto

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Trip from '@/lib/models/Trip';
import { fareTotal } from '@/lib/fare';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req, { params }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'rider') {
    return NextResponse.json({ error: 'Only riders can complete trips' }, { status: 403 });
  }

  await connectDB();
  const trip = await Trip.findById(params.id);
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  if (trip.status !== 'Pickup') {
    return NextResponse.json({
      error: 'Trip must be in Pickup status to complete.',
    }, { status: 409 });
  }

  // Verify that no passenger is still Pending
  const hasPending = trip.passengers.some(p => p.status === 'Pending');
  if (hasPending) {
    return NextResponse.json({
      error: 'Mark every passenger as Boarded or Missed before finishing the trip.',
    }, { status: 409 });
  }

  const boardedCount = trip.passengers.filter(p => p.status === 'Boarded').length;

  trip.status = 'Done';
  trip.completedAt = new Date();
  trip.holdKey = undefined;
  trip.fareTotal = fareTotal(trip.from, trip.to, boardedCount);
  await trip.save();

  return NextResponse.json({
    trip,
    message: 'Trip finished. Toto is now free for new requests.',
  });
}
