// app/api/trips/[id]/pickup/route.js
// Rider starts pickup (Accepted → Pickup) and marks passengers Boarded or Missed

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
  if (user.role !== 'rider') {
    return NextResponse.json({ error: 'Only riders can update pickup' }, { status: 403 });
  }

  await connectDB();
  const trip = await Trip.findById(params.id);
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  if (!['Accepted', 'Pickup'].includes(trip.status)) {
    return NextResponse.json({
      error: 'Trip must be in Accepted or Pickup status to update boarding',
    }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const { passengers: updates } = body;

  if (Array.isArray(updates) && updates.length > 0) {
    for (const update of updates) {
      const passenger = trip.passengers.find(
        p => p.name.toLowerCase() === update.name?.toLowerCase()
      );
      if (passenger && ['Boarded', 'Missed', 'Pending'].includes(update.status)) {
        passenger.status = update.status;
      }
    }
  }

  if (trip.status === 'Accepted') {
    trip.status = 'Pickup';
    trip.pickupStartedAt = new Date();
  }

  trip.holdKey = 'TOTO';
  await trip.save();

  return NextResponse.json({ trip, message: 'Pickup updated.' });
}
