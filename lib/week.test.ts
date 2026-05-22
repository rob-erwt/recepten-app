import { describe, it, expect } from 'vitest'
import { datumString, startVanWeek, weekLabel } from './week'

// Vaste testdatums (jan 2024)
const ZA  = new Date(2024, 0, 6)   // zaterdag
const ZO  = new Date(2024, 0, 7)   // zondag
const MA  = new Date(2024, 0, 8)   // maandag
const VR  = new Date(2024, 0, 12)  // vrijdag
// Grensgeval: donderdag 4 jan 2024 → de week begint op zat 30 dec 2023
const DO_BEGIN_JAAR = new Date(2024, 0, 4)

describe('datumString', () => {
  it('formatteert als YYYY-MM-DD', () => {
    expect(datumString(new Date(2024, 0, 6))).toBe('2024-01-06')
  })

  it('voegt voorloopnullen toe bij dag en maand < 10', () => {
    expect(datumString(new Date(2024, 0, 1))).toBe('2024-01-01')
  })

  it('werkt correct voor december', () => {
    expect(datumString(new Date(2024, 11, 31))).toBe('2024-12-31')
  })
})

describe('startVanWeek', () => {
  it('geeft dezelfde zaterdag terug als vandaag een zaterdag is', () => {
    const result = startVanWeek(0, ZA)
    expect(result.getDay()).toBe(6)
    expect(datumString(result)).toBe('2024-01-06')
  })

  it('gaat terug naar de vorige zaterdag als vandaag een zondag is', () => {
    const result = startVanWeek(0, ZO)
    expect(result.getDay()).toBe(6)
    expect(datumString(result)).toBe('2024-01-06')
  })

  it('gaat terug naar de vorige zaterdag als vandaag een maandag is', () => {
    const result = startVanWeek(0, MA)
    expect(result.getDay()).toBe(6)
    expect(datumString(result)).toBe('2024-01-06')
  })

  it('gaat terug naar de vorige zaterdag als vandaag een vrijdag is', () => {
    const result = startVanWeek(0, VR)
    expect(result.getDay()).toBe(6)
    expect(datumString(result)).toBe('2024-01-06')
  })

  it('geeft altijd middernacht terug (geen tijdcomponent)', () => {
    const result = startVanWeek(0, ZO)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
  })

  it('offset +1 geeft de volgende zaterdag', () => {
    expect(datumString(startVanWeek(1, ZA))).toBe('2024-01-13')
  })

  it('offset -1 geeft de vorige zaterdag', () => {
    expect(datumString(startVanWeek(-1, ZA))).toBe('2023-12-30')
  })

  it('werkt correct over de jaargrens (do 4 jan → zat 30 dec)', () => {
    expect(datumString(startVanWeek(0, DO_BEGIN_JAAR))).toBe('2023-12-30')
  })
})

describe('weekLabel', () => {
  it('geeft "Vorige week" voor offset -1', () => {
    expect(weekLabel(-1)).toBe('Vorige week')
  })

  it('geeft "Deze week" voor offset 0', () => {
    expect(weekLabel(0)).toBe('Deze week')
  })

  it('geeft "Volgende week" voor offset +1', () => {
    expect(weekLabel(1)).toBe('Volgende week')
  })

  it('geeft een datumreeks voor andere offsets', () => {
    // Exact formaat is taalafhankelijk; controleer alleen de structuur
    const label = weekLabel(3)
    expect(label).toContain('–')
    expect(label.length).toBeGreaterThan(5)
  })
})
