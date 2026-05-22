import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ReceptInvoer } from '@/lib/types'

// ── Helpers: tekstvelden ─────────────────────────────────────

function parseIsoDuration(iso: string | undefined): string {
  if (!iso) return ''
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return ''
  const uren = parseInt(match[1] ?? '0')
  const minuten = parseInt(match[2] ?? '0')
  const totaal = uren * 60 + minuten
  return totaal > 0 ? String(totaal) : ''
}

function parseAantalPersonen(val: string | number | undefined): string {
  if (!val) return ''
  const match = String(val).match(/\d+/)
  return match ? match[0] : ''
}

function parseIngredient(str: string): { naam: string; hoeveelheid: string; eenheid: string } {
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
    return { hoeveelheid: m[1].replace(',', '.').trim(), eenheid: m[2].toLowerCase(), naam: m[3].trim() }
  }

  const getalVoorop = s.match(/^(\d+(?:[,.]\d+)?)\s+(.+)$/)
  if (getalVoorop) {
    return { hoeveelheid: getalVoorop[1].replace(',', '.'), eenheid: '', naam: getalVoorop[2].trim() }
  }

  return { naam: s, hoeveelheid: '', eenheid: '' }
}

function parseStap(stap: unknown): string {
  if (typeof stap === 'string') return stap.trim()
  if (typeof stap === 'object' && stap !== null) {
    const s = stap as Record<string, unknown>
    if (typeof s.text === 'string') return s.text.trim()
    if (typeof s.name === 'string') return s.name.trim()
  }
  return ''
}

function vindRecipeInJsonLd(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  const type = obj['@type']
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return obj

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

// ── Foto ─────────────────────────────────────────────────────

/**
 * Haal de beste foto-URL op uit het schema.org Recipe-object.
 * Ondersteunt: string, string[], ImageObject, ImageObject[]
 */
function extractFotoUrl(schema: Record<string, unknown>): string | null {
  const image = schema.image
  if (!image) return null

  const kandidaten: string[] = []

  function verwerkItem(item: unknown) {
    if (typeof item === 'string' && item.startsWith('http')) {
      kandidaten.push(item)
    } else if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>
      // ImageObject heeft 'url'
      if (typeof obj.url === 'string' && obj.url.startsWith('http')) {
        kandidaten.push(obj.url)
      }
      // Sommige sites zetten de URL in 'contentUrl'
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

  // Kies de eerste (of de grootste op basis van 'width' als dat beschikbaar is)
  return kandidaten[0] ?? null
}

const TOEGESTANE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_GROOTTE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Probeer de foto server-side op te halen en op te slaan in Supabase Storage.
 * Vereist SUPABASE_SERVICE_ROLE_KEY in de omgeving.
 * Valt terug op de externe URL als uploaden mislukt of niet geconfigureerd is.
 */
async function slaFotoOp(externeUrl: string): Promise<string> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Zonder service-role-key → externe URL opslaan als fallback
  if (!serviceRoleKey || !supabaseUrl) return externeUrl

  try {
    const response = await fetch(externeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReceptenApp/1.0)',
        'Accept': 'image/*',
        'Referer': externeUrl,
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (!response.ok) return externeUrl

    const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim()
    if (!TOEGESTANE_TYPES.has(contentType)) return externeUrl

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > MAX_GROOTTE_BYTES) return externeUrl

    // Bestandsextensie bepalen
    const ext = contentType.replace('image/', '').replace('jpeg', 'jpg')
    const bestandsnaam = `import/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { error } = await admin.storage
      .from('recepten-fotos')
      .upload(bestandsnaam, buffer, { contentType, upsert: false })

    if (error) {
      console.warn('[import-recept] Storage upload mislukt:', error.message)
      return externeUrl
    }

    return admin.storage.from('recepten-fotos').getPublicUrl(bestandsnaam).data.publicUrl
  } catch (err) {
    console.warn('[import-recept] Foto ophalen mislukt:', err)
    return externeUrl
  }
}

// ── Handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let url: string

  try {
    const body = await req.json()
    url = body.url?.trim()
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 })
  }

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return NextResponse.json(
      { error: 'Voer een geldige URL in (begint met http of https).' },
      { status: 400 }
    )
  }

  // HTML ophalen
  let html: string
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReceptenApp/1.0; recipe-importer)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl,en;q=0.8',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `De pagina kon niet worden geladen (HTTP ${response.status}).` },
        { status: 422 }
      )
    }

    html = await response.text()
  } catch (err) {
    const bericht =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'De website reageert te langzaam (timeout na 10 seconden).'
        : 'De URL is niet bereikbaar. Controleer het adres en probeer opnieuw.'
    return NextResponse.json({ error: bericht }, { status: 422 })
  }

  // JSON-LD blokken zoeken
  const jsonLdRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  let receptSchema: Record<string, unknown> | null = null

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      const gevonden = vindRecipeInJsonLd(parsed)
      if (gevonden) {
        receptSchema = gevonden
        break
      }
    } catch {
      // ongeldige JSON, volgende proberen
    }
  }

  if (!receptSchema) {
    return NextResponse.json(
      {
        error:
          'Geen receptinformatie gevonden op deze pagina. ' +
          'Niet alle websites worden ondersteund — vul het recept handmatig in.',
      },
      { status: 422 }
    )
  }

  // Bereidingstijd
  const tijdRaw =
    (receptSchema.totalTime as string | undefined) ||
    (receptSchema.cookTime as string | undefined) ||
    (receptSchema.prepTime as string | undefined)

  // Ingrediënten
  const ingredientenRaw = Array.isArray(receptSchema.recipeIngredient)
    ? (receptSchema.recipeIngredient as string[])
    : []

  // Stappen (incl. HowToSection uitklappen)
  const stappenRaw = Array.isArray(receptSchema.recipeInstructions)
    ? (receptSchema.recipeInstructions as unknown[])
    : []

  const stappenPlat: unknown[] = []
  for (const item of stappenRaw) {
    if (
      typeof item === 'object' &&
      item !== null &&
      (item as Record<string, unknown>)['@type'] === 'HowToSection'
    ) {
      const itemSteps = (item as Record<string, unknown>).itemListElement
      if (Array.isArray(itemSteps)) stappenPlat.push(...itemSteps)
    } else {
      stappenPlat.push(item)
    }
  }

  // Foto ophalen en opslaan (parallel met de rest)
  const externeUrl = extractFotoUrl(receptSchema)
  const foto_url = externeUrl ? await slaFotoOp(externeUrl) : null

  const recept: ReceptInvoer = {
    naam: String(receptSchema.name ?? '').trim(),
    beschrijving: String(receptSchema.description ?? '').trim(),
    aantal_personen: parseAantalPersonen(
      receptSchema.recipeYield as string | number | undefined
    ),
    bereidingstijd_min: parseIsoDuration(tijdRaw),
    ingredienten: ingredientenRaw.map(parseIngredient),
    stappen: stappenPlat
      .map(s => ({ omschrijving: parseStap(s) }))
      .filter(s => s.omschrijving.length > 0),
    foto_url,
  }

  return NextResponse.json({ recept })
}
