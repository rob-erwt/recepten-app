export const DAGNAMEN = [
  'Zaterdag', 'Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag',
]

export const DAG_KORT = ['Za', 'Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr']

/** Formateert een Date naar 'YYYY-MM-DD' in lokale tijd (geen UTC-verschuiving). */
export function datumString(d: Date): string {
  const j = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${j}-${m}-${dag}`
}

/**
 * Geeft de zaterdag van de week terug, verschoven met `offset` weken.
 * Accepteert een optionele `vandaag`-datum voor testbaarheid.
 */
export function startVanWeek(offset: number, vandaag: Date = new Date()): Date {
  const dagVdWeek = vandaag.getDay() // 0 = zo, 6 = za
  const diffNaarZa = dagVdWeek === 6 ? 0 : -(dagVdWeek + 1)
  const za = new Date(vandaag)
  za.setDate(vandaag.getDate() + diffNaarZa + offset * 7)
  za.setHours(0, 0, 0, 0)
  return za
}

/** Leesbaar label voor de weeknavigatie. */
export function weekLabel(offset: number): string {
  if (offset === -1) return 'Vorige week'
  if (offset === 0) return 'Deze week'
  if (offset === 1) return 'Volgende week'
  const start = startVanWeek(offset)
  const eind = new Date(start)
  eind.setDate(start.getDate() + 6)
  return `${start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${eind.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
}
