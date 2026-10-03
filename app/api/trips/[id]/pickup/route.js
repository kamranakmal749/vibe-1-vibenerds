// app/api/trips/[id]/pickup/route.js
// Rider starts pickup: marks each passenger as boarded or missed
// Body: { passengers: [{ name, status: 'boarded'|'missed' }] }

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
  if (user.role !== 'rider') return NextResponse.json({ error: 'Only riders can update pickup' }, { status: 403 });

  await connectDB();
  const trip = await Trip.findById(params.id);
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  if (trip.rider?.toString() !== user.id) {
    return NextResponse.json({ error: 'You are not the rider for this trip' }, { status: 403 });
  }
  if (!['confirmed', 'in_progress'].includes(trip.status)) {
    return NextResponse.json({ error: 'Trip must be confirmed or in_progress to update pickup' }, { status: 400 });
  }

  const { passengers: updates } = await req.json();
  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'passengers must be an array' }, { status: 400 });
  }

  // Update each passenger status
  for (const update of updates) {
    const passenger = trip.passengers.find(
      p => p.name.toLowerCase() === update.name?.toLowerCase()
    );
    if (passenger && ['boarded', 'missed'].includes(update.status)) {
      passenger.status = update.status;
    }
  }

  // Move status to in_progress when pickup starts
  if (trip.status === 'confirmed') {
    trip.status = 'in_progress';
    trip.pickupStartedAt = new Date();
  }

  // Dynamic fare recalculation based on boarded passengers
  const boardedCount = trip.passengers.filter(p => p.status === 'boarded').length;
  trip.totalFare = trip.farePerPerson * boardedCount;

  await trip.save();
  return NextResponse.json({ trip, message: 'Pickup updated' });
}
