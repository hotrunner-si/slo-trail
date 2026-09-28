export function formatDate(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('sl-SI')
}
