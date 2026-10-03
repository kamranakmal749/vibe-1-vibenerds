// app/api/trips/[id]/reject/route.js
// Rider rejects a Requested trip → Clash

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
    return NextResponse.json({ error: 'Only riders can decline requests' }, { status: 403 });
  }

  await connectDB();

  const trip = await Trip.findOneAndUpdate(
    { _id: params.id, status: 'Requested' },
    { $set: { status: 'Clash' }, $unset: { holdKey: 1 } },
    { new: true }
  );

  if (!trip) {
    return NextResponse.json({
      error: 'Only Requested trips can be declined.',
    }, { status: 409 });
  }

  return NextResponse.json({
    trip,
    message: 'Request declined.',
  });
}
