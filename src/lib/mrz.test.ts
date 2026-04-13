import { describe, it, expect } from 'vitest'
import { generateMRZ } from './mrz'

describe('generateMRZ', () => {
  describe('line 1 (name field)', () => {
    // The implementation treats the first word as surname, remaining words as given.
    it('formats first-word<<rest', () => {
      const { line1 } = generateMRZ('Jane Smith', 0, 0, 2024)
      expect(line1).toBe('P<TPLJANE<<SMITH')
    })

    it('uppercases the name', () => {
      const { line1 } = generateMRZ('jane smith', 0, 0, 2024)
      expect(line1).toContain('JANE<<SMITH')
    })

    it('uses just the name when there is only one word', () => {
      const { line1 } = generateMRZ('Cher', 0, 0, 2024)
      expect(line1).toBe('P<TPLCHER')
    })

    it('falls back to TRAVELLER when name is empty', () => {
      const { line1 } = generateMRZ('', 0, 0, 2024)
      expect(line1).toMatch(/^P<TPLTRAVELLER/)
    })

    it('strips non-alpha characters', () => {
      const { line1 } = generateMRZ("O'Brien 123", 0, 0, 2024)
      expect(line1).toContain('OBRIEN')
      expect(line1).not.toContain("'")
      expect(line1).not.toMatch(/\d/)
    })

    it('truncates to 30 characters', () => {
      const { line1 } = generateMRZ('Wolfeschlegelsteinhausenbergerdorff Jr', 0, 0, 2024)
      expect(line1).toHaveLength(30)
    })
  })

  describe('line 2 (passport data)', () => {
    it('starts with TPL and zero-padded visit count', () => {
      const { line2 } = generateMRZ('Jane Smith', 7, 0, 2024)
      expect(line2).toMatch(/^TPL00007/)
    })

    it('pads visit count to 5 digits', () => {
      const { line2 } = generateMRZ('Jane Smith', 100, 0, 2024)
      expect(line2).toMatch(/^TPL00100/)
    })

    it('includes CAN nationality code', () => {
      const { line2 } = generateMRZ('Jane Smith', 0, 0, 2024)
      expect(line2).toContain('CAN')
    })

    it('encodes issue year as two-digit YY0101', () => {
      const { line2 } = generateMRZ('Jane Smith', 0, 0, 2024)
      expect(line2).toContain('240101')
    })

    it('encodes year 2000 as 000101', () => {
      const { line2 } = generateMRZ('Jane Smith', 0, 0, 2000)
      expect(line2).toContain('000101')
    })

    it('includes gender field M', () => {
      const { line2 } = generateMRZ('Jane Smith', 0, 0, 2024)
      expect(line2).toContain('M')
    })

    it('zero-pads progress percentage to 3 digits', () => {
      const { line2 } = generateMRZ('Jane Smith', 0, 5, 2024)
      expect(line2).toContain('005PCT')
    })

    it('encodes 100% correctly', () => {
      const { line2 } = generateMRZ('Jane Smith', 0, 100, 2024)
      expect(line2).toContain('100PCT')
    })

    it('full line 2 format is correct', () => {
      const { line2 } = generateMRZ('Jane Smith', 42, 18, 2024)
      expect(line2).toBe('TPL00042CAN240101M018PCT')
    })
  })
})
