// lib/status.js — Single Source of Truth for Trip and Passenger Statuses

export const TRIP_STATUSES = Object.freeze({
  REQUESTED: 'Requested',
  ACCEPTED: 'Accepted',
  PICKUP: 'Pickup',
  DONE: 'Done',
  CLASH: 'Clash',
});

export const ALL_TRIP_STATUSES = Object.freeze([
  TRIP_STATUSES.REQUESTED,
  TRIP_STATUSES.ACCEPTED,
  TRIP_STATUSES.PICKUP,
  TRIP_STATUSES.DONE,
  TRIP_STATUSES.CLASH,
]);

export const PASSENGER_STATUSES = Object.freeze({
  PENDING: 'Pending',
  BOARDED: 'Boarded',
  MISSED: 'Missed',
});

export const ALL_PASSENGER_STATUSES = Object.freeze([
  PASSENGER_STATUSES.PENDING,
  PASSENGER_STATUSES.BOARDED,
  PASSENGER_STATUSES.MISSED,
]);

export function isValidTripStatus(status) {
  return ALL_TRIP_STATUSES.includes(status);
}

export function isValidPassengerStatus(status) {
  return ALL_PASSENGER_STATUSES.includes(status);
}

export const TRIP_STATUS_DETAILS = Object.freeze({
  [TRIP_STATUSES.REQUESTED]: {
    label: 'Requested',
    pillClass: 'status-pill--requested',
    cardClass: 'trip-card--requested',
    message: 'Waiting for the rider.',
    emptyText: 'No requested trips yet',
  },
  [TRIP_STATUSES.ACCEPTED]: {
    label: 'Accepted',
    pillClass: 'status-pill--accepted',
    cardClass: 'trip-card--accepted',
    message: 'The Toto is yours. Head to the pickup point.',
    emptyText: 'No accepted trips yet',
  },
  [TRIP_STATUSES.PICKUP]: {
    label: 'Pickup',
    pillClass: 'status-pill--pickup',
    cardClass: 'trip-card--pickup',
    message: 'Pickup in progress.',
    emptyText: 'No pickup trips yet',
  },
  [TRIP_STATUSES.DONE]: {
    label: 'Done',
    pillClass: 'status-pill--done',
    cardClass: 'trip-card--done',
    message: 'Trip finished.',
    emptyText: 'No completed trips yet',
  },
  [TRIP_STATUSES.CLASH]: {
    label: 'Clash',
    pillClass: 'status-pill--clash',
    cardClass: 'trip-card--clash',
    message: 'The Toto was busy. Try again.',
    emptyText: 'No clashed trips yet',
  },
});
