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
  const name = decodeURIComponent(params.name);

  // Find all trips that include this passenger name
  const trips = await Trip.find({
    'passengers.name': { $regex: new RegExp(`^${name}$`, 'i') },
    status: { $in: ['completed', 'in_progress', 'confirmed'] },
  })
    .populate('requester', 'name')
    .populate('rider', 'name')
    .sort({ scheduledAt: -1 });

  // Extract passenger-specific data from each trip
  const history = trips.map(trip => {
    const passenger = trip.passengers.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );
    return {
      tripId: trip._id,
      from: trip.from,
      to: trip.to,
      scheduledAt: trip.scheduledAt,
      status: trip.status,
      passengerStatus: passenger?.status || 'unknown',
      requester: trip.requester?.name,
      rider: trip.rider?.name,
      farePerPerson: trip.farePerPerson,
      completedAt: trip.completedAt,
    };
  });

  return NextResponse.json({ passenger: name, trips: history });
}
