// components/dateUtils.js — Date & Time formatting helpers (Asia/Kolkata timezone support)

const TIMEZONE = 'Asia/Kolkata';

export function formatRequestedAt(dateStr) {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Just now';

  const now = new Date();
  
  // Format options for Asia/Kolkata
  const timeStr = d.toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dDate = d.toLocaleDateString('en-US', { timeZone: TIMEZONE });
  const nowDate = now.toLocaleDateString('en-US', { timeZone: TIMEZONE });

  // Calculate day difference in Asia/Kolkata
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yestDate = yesterday.toLocaleDateString('en-US', { timeZone: TIMEZONE });

  if (dDate === nowDate) {
    return `Today, ${timeStr}`;
  } else if (dDate === yestDate) {
    return `Yesterday, ${timeStr}`;
  } else {
    const monthDay = d.toLocaleDateString('en-US', {
      timeZone: TIMEZONE,
      month: 'short',
      day: 'numeric',
    });
    return `${monthDay}, ${timeStr}`;
  }
}

export function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Just now';

  const now = new Date();
  const diffSecs = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSecs < 60) return 'Just now';
  const mins = Math.floor(diffSecs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function format(dateStr) {
  return formatRequestedAt(dateStr);
}
