import { describe, it, expect } from 'vitest'
import { paginaNummers } from './paginering'

describe('paginaNummers', () => {
  describe('7 pagina\'s of minder — geeft alle nummers terug', () => {
    it('1 pagina', () => {
      expect(paginaNummers(1, 1)).toEqual([1])
    })

    it('3 pagina\'s, huidig = 2', () => {
      expect(paginaNummers(3, 2)).toEqual([1, 2, 3])
    })

    it('7 pagina\'s, huidig = 4', () => {
      expect(paginaNummers(7, 4)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })
  })

  describe('meer dan 7 pagina\'s — voegt ellipsis toe', () => {
    it('eerste pagina: ellipsis aan het einde', () => {
      expect(paginaNummers(10, 1)).toEqual([1, 2, '…', 10])
    })

    it('tweede pagina: ellipsis aan het einde', () => {
      expect(paginaNummers(10, 2)).toEqual([1, 2, 3, '…', 10])
    })

    it('derde pagina: nog geen ellipsis aan het begin', () => {
      expect(paginaNummers(10, 3)).toEqual([1, 2, 3, 4, '…', 10])
    })

    it('midden: ellipsis aan beide kanten', () => {
      expect(paginaNummers(10, 5)).toEqual([1, '…', 4, 5, 6, '…', 10])
    })

    it('op twee na laatste pagina: geen ellipsis aan het einde', () => {
      expect(paginaNummers(10, 8)).toEqual([1, '…', 7, 8, 9, 10])
    })

    it('laatste pagina: ellipsis aan het begin', () => {
      expect(paginaNummers(10, 10)).toEqual([1, '…', 9, 10])
    })
  })

  describe('structuurgaranties', () => {
    it('begint altijd met pagina 1', () => {
      expect(paginaNummers(20, 10)[0]).toBe(1)
    })

    it('eindigt altijd met de laatste pagina', () => {
      const result = paginaNummers(20, 10)
      expect(result[result.length - 1]).toBe(20)
    })

    it('bevat altijd de huidige pagina', () => {
      const result = paginaNummers(20, 10)
      expect(result).toContain(10)
    })

    it('bevat maximaal 2 ellipsis-items', () => {
      const result = paginaNummers(20, 10)
      expect(result.filter(r => r === '…').length).toBeLessThanOrEqual(2)
    })
  })
})
