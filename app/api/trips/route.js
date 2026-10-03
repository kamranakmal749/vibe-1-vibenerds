// app/api/trips/route.js
// GET  — list trips (filtered by role)
// POST — create new trip request

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Trip from '@/lib/models/Trip';

const FARE_PER_KM = parseFloat(process.env.NEXT_PUBLIC_FARE_PER_KM || '5');
const DISTANCE_KM = parseFloat(process.env.NEXT_PUBLIC_ROUTE_DISTANCE_KM || '8');

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  let query = {};

  if (user.role === 'rider') {
    // Rider sees all trips
    query = {};
  } else {
    // Student/employee sees own trips
    query = { requester: user.id };
  }

  // Optional status filter
  const status = searchParams.get('status');
  if (status) query.status = status;

  const [trips, total] = await Promise.all([
    Trip.find(query)
      .populate('requester', 'name email role')
      .populate('rider', 'name')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(query),
  ]);

  return NextResponse.json({ trips, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role === 'rider') {
    return NextResponse.json({ error: 'Riders cannot create requests' }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const { from, to, scheduledAt, passengers } = body;

  // Validate
  if (!from || !to || !scheduledAt || !passengers?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: 'From and To must be different' }, { status: 400 });
  }
  const validRoutes = ['College', 'Station', 'Office', 'College Station'];
  if (!validRoutes.includes(from) || !validRoutes.includes(to)) {
    return NextResponse.json({ error: 'Invalid route' }, { status: 400 });
  }

  // Validate passengers (array of {name})
  if (!Array.isArray(passengers) || passengers.length === 0 || passengers.length > 20) {
    return NextResponse.json({ error: 'Passengers must be 1–20' }, { status: 400 });
  }
  for (const p of passengers) {
    if (!p.name || typeof p.name !== 'string' || !p.name.trim()) {
      return NextResponse.json({ error: 'Each passenger must have a name' }, { status: 400 });
    }
  }

  // Calculate fare
  const farePerPerson = FARE_PER_KM * DISTANCE_KM;
  const totalFare = farePerPerson * passengers.length;

  const scheduled = new Date(scheduledAt);
  if (isNaN(scheduled.getTime())) {
    return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 });
  }
  if (scheduled < new Date()) {
    return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
  }

  const trip = await Trip.create({
    requester: user.id,
    requesterName: user.name,
    from,
    to,
    scheduledAt: scheduled,
    passengers: passengers.map(p => ({ name: p.name.trim(), status: 'pending' })),
    farePerPerson,
    totalFare,
    status: 'pending',
  });

  return NextResponse.json({ trip }, { status: 201 });
}
