// app/api/trips/[id]/route.js — GET single trip

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
  const trip = await Trip.findById(params.id)
    .populate('requester', 'name email role')
    .populate('rider', 'name currentLocation');

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  // Only rider or the requester can see the trip
  if (user.role !== 'rider' && trip.requester._id.toString() !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ trip });
}
