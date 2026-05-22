import { describe, it, expect } from 'vitest'
import {
  naamGelijkenis,
  ingredientenOverlap,
  dubbeleScore,
  DREMPELWAARDE,
} from './duplicaten'

describe('naamGelijkenis', () => {
  it('geeft 1 bij identieke namen', () => {
    expect(naamGelijkenis('Pasta Carbonara', 'Pasta Carbonara')).toBe(1)
  })

  it('is niet hoofdlettergevoelig', () => {
    expect(naamGelijkenis('pasta carbonara', 'PASTA CARBONARA')).toBe(1)
  })

  it('geeft 0.9 als de ene naam de andere bevat', () => {
    expect(naamGelijkenis('Pasta Carbonara', 'Carbonara')).toBe(0.9)
    expect(naamGelijkenis('Carbonara', 'Pasta Carbonara')).toBe(0.9)
  })

  it('geeft 0 bij een lege invoer', () => {
    expect(naamGelijkenis('', 'Pasta')).toBe(0)
    expect(naamGelijkenis('Pasta', '')).toBe(0)
  })

  it('geeft 0 bij volledig verschillende namen', () => {
    expect(naamGelijkenis('Appeltaart', 'Coq au Vin')).toBe(0)
  })

  it('berekent woordoverlap voor deels overeenkomende namen', () => {
    const score = naamGelijkenis('Pasta met kaas', 'Pasta met ham')
    // 'pasta' matcht, 'kaas' en 'ham' niet — score > 0 maar < 0.9
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(0.9)
  })

  it('negeert stopwoorden (met, van, de, etc.)', () => {
    // 'met' is een stopwoord en telt niet mee
    const score = naamGelijkenis('soep met brood', 'soep van brood')
    // 'soep' en 'brood' matchen allebei → 2/2 = 1
    expect(score).toBe(1)
  })

  it('filtert woorden korter dan 3 tekens', () => {
    // 'ui' en 'ei' zijn te kort (2 tekens) en worden genegeerd
    // Alleen 'stoofpot' telt mee → perfecte match
    const score = naamGelijkenis('stoofpot ui', 'stoofpot ei')
    expect(score).toBe(1)
  })
})

describe('ingredientenOverlap', () => {
  it('geeft 1 bij volledige overlap', () => {
    expect(ingredientenOverlap(['ui', 'knoflook'], ['ui', 'knoflook'])).toBe(1)
  })

  it('geeft 0 bij geen overlap', () => {
    expect(ingredientenOverlap(['ui', 'knoflook'], ['bloem', 'melk'])).toBe(0)
  })

  it('geeft 0 als een van de lijsten leeg is', () => {
    expect(ingredientenOverlap([], ['ui'])).toBe(0)
    expect(ingredientenOverlap(['ui'], [])).toBe(0)
  })

  it('is niet hoofdlettergevoelig', () => {
    expect(ingredientenOverlap(['Ui', 'KNOFLOOK'], ['ui', 'knoflook'])).toBe(1)
  })

  it('berekent deels overlap correct', () => {
    const score = ingredientenOverlap(
      ['ui', 'knoflook', 'tomaat'],
      ['ui', 'knoflook', 'courgette']
    )
    expect(score).toBeCloseTo(2 / 3)
  })

  it('deelt door de kortste lijst (symmetrisch minimum)', () => {
    // A=[ui, knoflook, tomaat, paprika] ∩ B=[ui, knoflook] → 2/min(4,2) = 1
    expect(ingredientenOverlap(
      ['ui', 'knoflook', 'tomaat', 'paprika'],
      ['ui', 'knoflook']
    )).toBe(1)
  })
})

describe('dubbeleScore', () => {
  it('geeft 1 bij perfecte naam- én ingrediëntenmatch', () => {
    const score = dubbeleScore(
      'Pasta Carbonara',
      ['pasta', 'ei', 'spek', 'kaas'],
      { id: '1', naam: 'Pasta Carbonara', ingredienten: ['pasta', 'ei', 'spek', 'kaas'] }
    )
    expect(score).toBe(1)
  })

  it('score ligt boven drempelwaarde bij bijna-identiek recept', () => {
    const score = dubbeleScore(
      'Pasta Carbonara',
      ['pasta', 'ei', 'spek', 'kaas'],
      { id: '1', naam: 'Pasta Carbonara', ingredienten: ['pasta', 'ei', 'spek', 'parmezaan'] }
    )
    expect(score).toBeGreaterThan(DREMPELWAARDE)
  })

  it('score ligt onder drempelwaarde bij een volledig ander recept', () => {
    const score = dubbeleScore(
      'Appeltaart',
      ['appels', 'bloem', 'boter', 'suiker'],
      { id: '1', naam: 'Spaghetti Bolognese', ingredienten: ['gehakt', 'tomaat', 'pasta', 'ui'] }
    )
    expect(score).toBeLessThan(DREMPELWAARDE)
  })

  it('naam weegt zwaarder dan ingrediënten (70/30 verhouding)', () => {
    // Identieke naam, geen ingrediënten → score = 0.7
    const naamScore = dubbeleScore('Lasagne', [], {
      id: '1', naam: 'Lasagne', ingredienten: [],
    })
    // Identieke ingrediënten, totaal andere naam → score = 0.3
    const ingScore = dubbeleScore('Appeltaart', ['pasta', 'kaas'], {
      id: '1', naam: 'Groentesoep', ingredienten: ['pasta', 'kaas'],
    })
    expect(naamScore).toBeCloseTo(0.7)
    expect(ingScore).toBeCloseTo(0.3)
    expect(naamScore).toBeGreaterThan(ingScore)
  })
})
