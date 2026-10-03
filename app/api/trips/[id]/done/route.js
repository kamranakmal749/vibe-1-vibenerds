// app/api/trips/[id]/done/route.js
// Rider marks trip as complete — toto is now free

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
  if (user.role !== 'rider') return NextResponse.json({ error: 'Only riders can complete trips' }, { status: 403 });

  await connectDB();
  const trip = await Trip.findById(params.id);
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  if (trip.rider?.toString() !== user.id) {
    return NextResponse.json({ error: 'You are not the rider for this trip' }, { status: 403 });
  }
  if (trip.status !== 'in_progress') {
    return NextResponse.json({ error: 'Trip must be in_progress to complete' }, { status: 400 });
  }

  trip.status = 'completed';
  trip.completedAt = new Date();

  // Final dynamic fare check based on actual boarded passengers
  const boardedCount = trip.passengers.filter(p => p.status === 'boarded').length;
  trip.totalFare = trip.farePerPerson * boardedCount;

  await trip.save();

  return NextResponse.json({ trip, message: 'Trip completed. Toto is now free.' });
}
