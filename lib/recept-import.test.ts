import { describe, it, expect } from 'vitest'
import {
  parseIsoDuration,
  parseAantalPersonen,
  parseIngredient,
  parseStap,
  vindRecipeInJsonLd,
  extractFotoUrl,
} from './recept-import'

describe('parseIsoDuration', () => {
  it('parseert minuten', () => {
    expect(parseIsoDuration('PT30M')).toBe('30')
  })

  it('parseert uren en minuten gecombineerd', () => {
    expect(parseIsoDuration('PT1H30M')).toBe('90')
  })

  it('parseert alleen uren', () => {
    expect(parseIsoDuration('PT2H')).toBe('120')
  })

  it('geeft lege string bij undefined', () => {
    expect(parseIsoDuration(undefined)).toBe('')
  })

  it('geeft lege string bij ongeldig formaat', () => {
    expect(parseIsoDuration('30 minuten')).toBe('')
  })

  it('geeft lege string bij PT0M', () => {
    expect(parseIsoDuration('PT0M')).toBe('')
  })
})

describe('parseAantalPersonen', () => {
  it('extraheert getal uit een string met tekst', () => {
    expect(parseAantalPersonen('4 personen')).toBe('4')
  })

  it('verwerkt een getal direct', () => {
    expect(parseAantalPersonen(6)).toBe('6')
  })

  it('geeft lege string bij undefined', () => {
    expect(parseAantalPersonen(undefined)).toBe('')
  })

  it('extraheert het eerste getal bij een bereik', () => {
    expect(parseAantalPersonen('4-6 personen')).toBe('4')
  })

  it('geeft lege string bij tekst zonder getal', () => {
    expect(parseAantalPersonen('voor het gezin')).toBe('')
  })
})

describe('parseIngredient', () => {
  it('parseert hoeveelheid + bekende eenheid + naam', () => {
    expect(parseIngredient('200 gram bloem')).toEqual({
      hoeveelheid: '200',
      eenheid: 'gram',
      naam: 'bloem',
    })
  })

  it('parseert hoeveelheid zonder eenheid', () => {
    expect(parseIngredient('3 eieren')).toEqual({
      hoeveelheid: '3',
      eenheid: '',
      naam: 'eieren',
    })
  })

  it('parseert ingredient zonder getal of eenheid', () => {
    expect(parseIngredient('zout naar smaak')).toEqual({
      hoeveelheid: '',
      eenheid: '',
      naam: 'zout naar smaak',
    })
  })

  it('normaliseert komma naar punt in hoeveelheid', () => {
    expect(parseIngredient('1,5 kg aardappelen')).toEqual({
      hoeveelheid: '1.5',
      eenheid: 'kg',
      naam: 'aardappelen',
    })
  })

  it('herkent eetlepels als eenheid', () => {
    const result = parseIngredient('2 eetlepels olijfolie')
    expect(result.eenheid).toBe('eetlepels')
    expect(result.hoeveelheid).toBe('2')
    expect(result.naam).toBe('olijfolie')
  })

  it('herkent milliliter als eenheid', () => {
    const result = parseIngredient('250 ml melk')
    expect(result.eenheid).toBe('ml')
    expect(result.hoeveelheid).toBe('250')
  })

  it('verwijdert overbodige spaties', () => {
    const result = parseIngredient('  100  gram   suiker  ')
    expect(result.naam).toBe('suiker')
  })
})

describe('parseStap', () => {
  it('geeft een string ongewijzigd terug (getrimd)', () => {
    expect(parseStap('  Verwarm de oven op 180°C.  ')).toBe('Verwarm de oven op 180°C.')
  })

  it('extraheert de text-property uit een HowToStep-object', () => {
    expect(parseStap({ text: 'Meng de bloem met de boter.' })).toBe('Meng de bloem met de boter.')
  })

  it('valt terug op name als text ontbreekt', () => {
    expect(parseStap({ name: 'Stap: deeg kneden' })).toBe('Stap: deeg kneden')
  })

  it('geeft lege string bij null', () => {
    expect(parseStap(null)).toBe('')
  })

  it('geeft lege string bij een object zonder text of name', () => {
    expect(parseStap({ url: 'https://example.com' })).toBe('')
  })
})

describe('vindRecipeInJsonLd', () => {
  it('vindt een Recipe op het rootniveau', () => {
    const data = { '@type': 'Recipe', name: 'Appeltaart' }
    expect(vindRecipeInJsonLd(data)).toEqual(data)
  })

  it('vindt een Recipe genest in @graph', () => {
    const recipe = { '@type': 'Recipe', name: 'Appeltaart' }
    const data = { '@graph': [{ '@type': 'WebPage', url: 'https://x.nl' }, recipe] }
    expect(vindRecipeInJsonLd(data)).toEqual(recipe)
  })

  it('vindt een Recipe in een array op rootniveau', () => {
    const recipe = { '@type': 'Recipe', name: 'Appeltaart' }
    expect(vindRecipeInJsonLd([{ '@type': 'Article' }, recipe])).toEqual(recipe)
  })

  it('ondersteunt array-notatie voor @type', () => {
    const recipe = { '@type': ['Thing', 'Recipe'], name: 'Appeltaart' }
    expect(vindRecipeInJsonLd(recipe)).toEqual(recipe)
  })

  it('geeft null terug als er geen Recipe aanwezig is', () => {
    expect(vindRecipeInJsonLd({ '@type': 'Article', name: 'Blog' })).toBeNull()
  })

  it('geeft null terug bij null of primitieven', () => {
    expect(vindRecipeInJsonLd(null)).toBeNull()
    expect(vindRecipeInJsonLd('tekst')).toBeNull()
    expect(vindRecipeInJsonLd(42)).toBeNull()
  })
})

describe('extractFotoUrl', () => {
  it('extraheert een directe URL-string', () => {
    expect(extractFotoUrl({ image: 'https://example.com/foto.jpg' }))
      .toBe('https://example.com/foto.jpg')
  })

  it('extraheert url uit een ImageObject', () => {
    expect(extractFotoUrl({ image: { url: 'https://example.com/foto.jpg' } }))
      .toBe('https://example.com/foto.jpg')
  })

  it('extraheert contentUrl als fallback in een ImageObject', () => {
    expect(extractFotoUrl({ image: { contentUrl: 'https://example.com/foto.jpg' } }))
      .toBe('https://example.com/foto.jpg')
  })

  it('extraheert de eerste URL uit een array', () => {
    expect(extractFotoUrl({
      image: [
        'https://example.com/groot.jpg',
        'https://example.com/klein.jpg',
      ],
    })).toBe('https://example.com/groot.jpg')
  })

  it('geeft null terug als image ontbreekt', () => {
    expect(extractFotoUrl({})).toBeNull()
  })

  it('negeert relatieve of ongeldige URLs', () => {
    expect(extractFotoUrl({ image: '/relatief/pad.jpg' })).toBeNull()
    expect(extractFotoUrl({ image: { url: '/relatief.jpg' } })).toBeNull()
  })
})
