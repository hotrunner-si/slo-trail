const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parse a date-only ISO value at UTC midnight to avoid local timezone shifts. */
export function parseIsoDate(dateIso?: string | null): Date | null {
  const match = dateIso && ISO_DATE.exec(dateIso)
  if (!match) return null

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
    ? date
    : null
}

export function formatDate(
  dateIso: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
) {
  const date = parseIsoDate(dateIso)
  return date
    ? new Intl.DateTimeFormat('sl-SI', { ...options, timeZone: 'UTC' }).format(date)
    : '—'
}

export function todayIsoDate(timeZone = 'Europe/Ljubljana') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}
