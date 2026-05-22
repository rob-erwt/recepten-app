export type BestaandRecept = {
  id: string
  naam: string
  ingredienten: string[]
}

/** Drempelwaarde: scores boven dit getal triggeren een waarschuwing. */
export const DREMPELWAARDE = 0.72

/** Gelijkenis tussen twee receptnamen (0–1). */
export function naamGelijkenis(a: string, b: string): number {
  const na = a.toLowerCase().trim()
  const nb = b.toLowerCase().trim()
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9

  // Woordoverlap (woorden van ≥ 3 tekens, stopwoorden negeren)
  const stop = new Set(['met', 'van', 'de', 'het', 'een', 'en', 'in', 'op'])
  const wordenA = na.split(/\s+/).filter(w => w.length >= 3 && !stop.has(w))
  const setB = new Set(nb.split(/\s+/).filter(w => w.length >= 3 && !stop.has(w)))
  if (wordenA.length === 0 || setB.size === 0) return 0
  const overlap = wordenA.filter(w => setB.has(w)).length
  return overlap / Math.max(wordenA.length, setB.size)
}

/** Deel van ingrediënten dat overeenkomt (0–1). */
export function ingredientenOverlap(lijstA: string[], lijstB: string[]): number {
  if (lijstA.length === 0 || lijstB.length === 0) return 0
  const setB = new Set(lijstB.map(i => i.toLowerCase().trim()))
  const overeenkomst = lijstA.filter(i => setB.has(i.toLowerCase().trim())).length
  return overeenkomst / Math.min(lijstA.length, lijstB.length)
}

/** Gecombineerde score: 70% naam, 30% ingrediënten. */
export function dubbeleScore(
  invoerNaam: string,
  invoerIngredienten: string[],
  kandidaat: BestaandRecept
): number {
  const ns = naamGelijkenis(invoerNaam, kandidaat.naam)
  const is = ingredientenOverlap(invoerIngredienten, kandidaat.ingredienten)
  return ns * 0.7 + is * 0.3
}
