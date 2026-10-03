// app/api/history/passenger/[name]/route.js
// Get full trip history for a specific passenger name

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Trip from '@/lib/models/Trip';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req, { params }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const name = decodeURIComponent(params.name).trim();

  // Find all trips that include this passenger name
  const trips = await Trip.find({
    'passengers.name': { $regex: new RegExp(`^${name}$`, 'i') },
  })
    .populate('requester', 'name')
    .populate('rider', 'name')
    .sort({ requestedAt: -1 });

  const history = trips.map(trip => {
    const passenger = trip.passengers.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );
    return {
      tripId: trip._id,
      from: trip.from,
      to: trip.to,
      requestedAt: trip.requestedAt,
      status: trip.status,
      passengerStatus: passenger?.status || 'Pending',
      requester: trip.requester?.name || trip.requesterName,
      rider: trip.rider?.name,
      completedAt: trip.completedAt,
    };
  });

  return NextResponse.json({ passenger: name, trips: history });
}
