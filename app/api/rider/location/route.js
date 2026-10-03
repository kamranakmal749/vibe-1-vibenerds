// app/api/rider/location/route.js
// Rider updates their GPS location (called periodically by rider's browser)

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'rider') return NextResponse.json({ error: 'Only riders can update location' }, { status: 403 });

  await connectDB();
  const { lat, lng } = await req.json();

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat and lng must be numbers' }, { status: 400 });
  }

  await User.findByIdAndUpdate(user.id, {
    currentLocation: { lat, lng, updatedAt: new Date() },
  });

  return NextResponse.json({ message: 'Location updated' });
}

// GET rider's current location — used by passengers for live tracking
export async function GET(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const riderId = searchParams.get('riderId');

  if (!riderId) return NextResponse.json({ error: 'riderId required' }, { status: 400 });

  const rider = await User.findById(riderId).select('currentLocation name');
  if (!rider) return NextResponse.json({ error: 'Rider not found' }, { status: 404 });

  return NextResponse.json({ location: rider.currentLocation, name: rider.name });
}
