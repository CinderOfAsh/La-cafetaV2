// Server-side date helper (uses local Europe/Madrid timezone)
export function localDateStrServer(d: Date): string {
  // Format as YYYY-MM-DD in Madrid timezone
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  // sv-SE locale gives YYYY-MM-DD format
  return fmt.format(d)
}
