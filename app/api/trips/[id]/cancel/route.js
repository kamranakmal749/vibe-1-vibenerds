// app/api/trips/[id]/cancel/route.js
// Requester or rider can cancel a pending/confirmed trip

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

  await connectDB();
  const trip = await Trip.findById(params.id);
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  const isRequester = trip.requester.toString() === user.id;
  const isRider = user.role === 'rider';

  if (!isRequester && !isRider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (['completed', 'cancelled'].includes(trip.status)) {
    return NextResponse.json({ error: `Cannot cancel a ${trip.status} trip` }, { status: 400 });
  }

  trip.status = 'cancelled';
  await trip.save();

  return NextResponse.json({ trip, message: 'Trip cancelled' });
}
