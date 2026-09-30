// Daily time slots in the Owner's timezone. Pure functions so they can be tested without waiting for the clock.

export function localClock(date = new Date(), tz = 'America/New_York') {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(date).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

// "08:30" -> 510; "off"/empty/garbage -> null
export function parseTime(s) {
  const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(String(s ?? ''));
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

// Slots that should run now: time has passed, still inside the catch-up window (covers a restart), and not done today.
export function dueSlots({ clock, slots, done = {}, windowMin = 90 }) {
  return Object.entries(slots)
    .filter(([name, at]) => at != null && done[name] !== clock.day && clock.minutes >= at && clock.minutes < at + windowMin)
    .map(([name]) => name);
}
