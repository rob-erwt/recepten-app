/**
 * Pure parse-functies voor het importeren van recepten via schema.org/Recipe JSON-LD.
 * Geen side effects, geen netwerkaanroepen — volledig testbaar.
 */

/** Parseert een ISO 8601-duur (bijv. 'PT1H30M') naar minuten als string. */
export function parseIsoDuration(iso: string | undefined): string {
  if (!iso) return ''
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return ''
  const uren = parseInt(match[1] ?? '0')
  const minuten = parseInt(match[2] ?? '0')
  const totaal = uren * 60 + minuten
  return totaal > 0 ? String(totaal) : ''
}

/** Extraheert het eerste getal uit een recipeYield-waarde. */
export function parseAantalPersonen(val: string | number | undefined): string {
  if (!val) return ''
  const match = String(val).match(/\d+/)
  return match ? match[0] : ''
}

/** Parseert een ingrediëntregel naar hoeveelheid, eenheid en naam. */
export function parseIngredient(
  str: string
): { naam: string; hoeveelheid: string; eenheid: string } {
  const s = str.trim().replace(/\s+/g, ' ')

  const bekendeEenheden = [
    'gram', 'g', 'kg', 'kilogram',
    'ml', 'cl', 'dl', 'l', 'liter', 'milliliter',
    'eetlepel', 'eetlepels', 'el',
    'theelepel', 'theelepels', 'tl', 'tsp', 'tbsp',
    'kopje', 'kopjes', 'cup', 'cups',
    'stuks', 'stuk', 'st',
    'teen', 'tenen',
    'blikje', 'blik', 'zakje', 'zak',
    'snufje', 'snuf', 'snufjes',
    'takje', 'takjes',
    'plak', 'plakken', 'plakje', 'plakjes',
  ]

  const patroon = new RegExp(
    `^(\\d+(?:[,.]\\d+)?(?:\\s*[/-]\\s*\\d+(?:[,.]\\d+)?)?)\\s*(${bekendeEenheden.join('|')})\\.?\\s+(.+)$`,
    'i'
  )
  const m = s.match(patroon)
  if (m) {
    return {
      hoeveelheid: m[1].replace(',', '.').trim(),
      eenheid: m[2].toLowerCase(),
      naam: m[3].trim(),
    }
  }

  const getalVoorop = s.match(/^(\d+(?:[,.]\d+)?)\s+(.+)$/)
  if (getalVoorop) {
    return {
      hoeveelheid: getalVoorop[1].replace(',', '.'),
      eenheid: '',
      naam: getalVoorop[2].trim(),
    }
  }

  return { naam: s, hoeveelheid: '', eenheid: '' }
}

/** Normaliseert een bereidingsstap naar een string. */
export function parseStap(stap: unknown): string {
  if (typeof stap === 'string') return stap.trim()
  if (typeof stap === 'object' && stap !== null) {
    const s = stap as Record<string, unknown>
    if (typeof s.text === 'string') return s.text.trim()
    if (typeof s.name === 'string') return s.name.trim()
  }
  return ''
}

/**
 * Zoekt recursief naar een schema.org/Recipe object in JSON-LD data.
 * Ondersteunt @graph, arrays en geneste structuren.
 */
export function vindRecipeInJsonLd(
  data: unknown
): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  const type = obj['@type']
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
    return obj
  }

  if (Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph']) {
      const gevonden = vindRecipeInJsonLd(item)
      if (gevonden) return gevonden
    }
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const gevonden = vindRecipeInJsonLd(item)
      if (gevonden) return gevonden
    }
  }

  return null
}

/**
 * Extraheert de beste foto-URL uit een schema.org Recipe-object.
 * Ondersteunt: string, string[], ImageObject { url }, ImageObject { contentUrl }.
 */
export function extractFotoUrl(
  schema: Record<string, unknown>
): string | null {
  const image = schema.image
  if (!image) return null

  const kandidaten: string[] = []

  function verwerkItem(item: unknown) {
    if (typeof item === 'string' && item.startsWith('http')) {
      kandidaten.push(item)
    } else if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>
      if (typeof obj.url === 'string' && obj.url.startsWith('http')) {
        kandidaten.push(obj.url)
      }
      if (typeof obj.contentUrl === 'string' && obj.contentUrl.startsWith('http')) {
        kandidaten.push(obj.contentUrl)
      }
    }
  }

  if (Array.isArray(image)) {
    image.forEach(verwerkItem)
  } else {
    verwerkItem(image)
  }

  return kandidaten[0] ?? null
}
