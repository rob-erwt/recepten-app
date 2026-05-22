export const PAGINA_GROOTTE = 25

/**
 * Geeft de te tonen paginanummers terug, inclusief '…' als tussenvoeger
 * bij grote aantallen pagina's.
 *
 * Voorbeelden:
 *   (5, 3)  → [1, 2, 3, 4, 5]
 *   (10, 1) → [1, 2, '…', 10]
 *   (10, 5) → [1, '…', 4, 5, 6, '…', 10]
 *   (10, 10)→ [1, '…', 9, 10]
 */
export function paginaNummers(
  aantalPaginas: number,
  huidigePagina: number
): (number | '…')[] {
  if (aantalPaginas <= 7) {
    return Array.from({ length: aantalPaginas }, (_, i) => i + 1)
  }

  const items: (number | '…')[] = [1]

  if (huidigePagina > 3) items.push('…')

  for (
    let p = Math.max(2, huidigePagina - 1);
    p <= Math.min(aantalPaginas - 1, huidigePagina + 1);
    p++
  ) {
    items.push(p)
  }

  if (huidigePagina < aantalPaginas - 2) items.push('…')

  items.push(aantalPaginas)
  return items
}
