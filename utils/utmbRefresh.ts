/** Latest Tuesday/Saturday 04:00 boundary, expressed as a Slovenian local date. */
export function utmbRefreshSlot(at = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Ljubljana',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value)
  const day = new Date(Date.UTC(part('year'), part('month') - 1, part('day')))
  if (part('hour') < 4) day.setUTCDate(day.getUTCDate() - 1)
  while (day.getUTCDay() !== 2 && day.getUTCDay() !== 6) day.setUTCDate(day.getUTCDate() - 1)
  return day.toISOString().slice(0, 10)
}
