import { describe, it, expect } from 'vitest'
import {
  getInstitutionIcon,
  getInstitutionColor,
  type Institution,
} from '../../../lib/institutions/types'

describe('institutions utility functions', () => {
  const createMockInstitution = (
    overrides: Partial<Institution> = {}
  ): Institution => ({
    id: '1',
    slug: 'test-institution',
    name: 'Test Institution',
    short_name: 'TI',
    type: 'college',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  })

  describe('getInstitutionIcon', () => {
    describe('specific institution icons', () => {
      it('should return gear icon for jkkn-engineering', () => {
        const institution = createMockInstitution({ slug: 'jkkn-engineering' })
        expect(getInstitutionIcon(institution)).toBe('\u2699\uFE0F')
      })

      it('should return books icon for jkkn-arts-science', () => {
        const institution = createMockInstitution({ slug: 'jkkn-arts-science' })
        expect(getInstitutionIcon(institution)).toBe('\uD83D\uDCDA')
      })

      it('should return hospital icon for jkkn-nursing', () => {
        const institution = createMockInstitution({ slug: 'jkkn-nursing' })
        expect(getInstitutionIcon(institution)).toBe('\uD83C\uDFE5')
      })

      it('should return tooth icon for jkkn-dental', () => {
        const institution = createMockInstitution({ slug: 'jkkn-dental' })
        expect(getInstitutionIcon(institution)).toBe('\uD83E\uDDB7')
      })

      it('should return pill icon for jkkn-pharmacy', () => {
        const institution = createMockInstitution({ slug: 'jkkn-pharmacy' })
        expect(getInstitutionIcon(institution)).toBe('\uD83D\uDC8A')
      })

      it('should return stethoscope icon for jkkn-ahs', () => {
        const institution = createMockInstitution({ slug: 'jkkn-ahs' })
        expect(getInstitutionIcon(institution)).toBe('\uD83E\uDE7A')
      })

      it('should return graduation cap icon for jkkn-education', () => {
        const institution = createMockInstitution({ slug: 'jkkn-education' })
        expect(getInstitutionIcon(institution)).toBe('\uD83C\uDF93')
      })

      it('should return school icon for jkkn-matric', () => {
        const institution = createMockInstitution({ slug: 'jkkn-matric' })
        expect(getInstitutionIcon(institution)).toBe('\uD83C\uDFEB')
      })

      it('should return school icon for nattraja-vidhyalaya', () => {
        const institution = createMockInstitution({ slug: 'nattraja-vidhyalaya' })
        expect(getInstitutionIcon(institution)).toBe('\uD83C\uDFEB')
      })
    })

    describe('default icons based on type', () => {
      it('should return school icon for school type', () => {
        const institution = createMockInstitution({ slug: 'unknown-school', type: 'school' })
        expect(getInstitutionIcon(institution)).toBe('\uD83C\uDFEB')
      })

      it('should return classical building icon for college type', () => {
        const institution = createMockInstitution({ slug: 'unknown-college', type: 'college' })
        expect(getInstitutionIcon(institution)).toBe('\uD83C\uDFDB\uFE0F')
      })

      it('should return classical building icon for external type', () => {
        const institution = createMockInstitution({ slug: 'unknown-external', type: 'external' })
        expect(getInstitutionIcon(institution)).toBe('\uD83C\uDFDB\uFE0F')
      })
    })
  })

  describe('getInstitutionColor', () => {
    describe('specific institution colors', () => {
      it('should return blue colors for jkkn-engineering', () => {
        const colors = getInstitutionColor('jkkn-engineering')
        expect(colors.bg).toBe('bg-blue-500/10')
        expect(colors.border).toBe('border-blue-500')
        expect(colors.text).toBe('text-blue-400')
      })

      it('should return purple colors for jkkn-arts-science', () => {
        const colors = getInstitutionColor('jkkn-arts-science')
        expect(colors.bg).toBe('bg-purple-500/10')
        expect(colors.border).toBe('border-purple-500')
        expect(colors.text).toBe('text-purple-400')
      })

      it('should return pink colors for jkkn-nursing', () => {
        const colors = getInstitutionColor('jkkn-nursing')
        expect(colors.bg).toBe('bg-pink-500/10')
        expect(colors.border).toBe('border-pink-500')
        expect(colors.text).toBe('text-pink-400')
      })

      it('should return cyan colors for jkkn-dental', () => {
        const colors = getInstitutionColor('jkkn-dental')
        expect(colors.bg).toBe('bg-cyan-500/10')
        expect(colors.border).toBe('border-cyan-500')
        expect(colors.text).toBe('text-cyan-400')
      })

      it('should return green colors for jkkn-pharmacy', () => {
        const colors = getInstitutionColor('jkkn-pharmacy')
        expect(colors.bg).toBe('bg-green-500/10')
        expect(colors.border).toBe('border-green-500')
        expect(colors.text).toBe('text-green-400')
      })

      it('should return red colors for jkkn-ahs', () => {
        const colors = getInstitutionColor('jkkn-ahs')
        expect(colors.bg).toBe('bg-red-500/10')
        expect(colors.border).toBe('border-red-500')
        expect(colors.text).toBe('text-red-400')
      })

      it('should return amber colors for jkkn-education', () => {
        const colors = getInstitutionColor('jkkn-education')
        expect(colors.bg).toBe('bg-amber-500/10')
        expect(colors.border).toBe('border-amber-500')
        expect(colors.text).toBe('text-amber-400')
      })

      it('should return orange colors for jkkn-matric', () => {
        const colors = getInstitutionColor('jkkn-matric')
        expect(colors.bg).toBe('bg-orange-500/10')
        expect(colors.border).toBe('border-orange-500')
        expect(colors.text).toBe('text-orange-400')
      })

      it('should return lime colors for nattraja-vidhyalaya', () => {
        const colors = getInstitutionColor('nattraja-vidhyalaya')
        expect(colors.bg).toBe('bg-lime-500/10')
        expect(colors.border).toBe('border-lime-500')
        expect(colors.text).toBe('text-lime-400')
      })
    })

    describe('default colors for unknown slugs', () => {
      it('should return stone colors for unknown slug', () => {
        const colors = getInstitutionColor('unknown-institution')
        expect(colors.bg).toBe('bg-stone-500/10')
        expect(colors.border).toBe('border-stone-500')
        expect(colors.text).toBe('text-stone-400')
      })

      it('should return stone colors for empty string', () => {
        const colors = getInstitutionColor('')
        expect(colors.bg).toBe('bg-stone-500/10')
        expect(colors.border).toBe('border-stone-500')
        expect(colors.text).toBe('text-stone-400')
      })
    })

    describe('color object structure', () => {
      it('should always return object with bg, border, and text properties', () => {
        const slugs = [
          'jkkn-engineering',
          'jkkn-arts-science',
          'unknown-slug',
          '',
        ]

        slugs.forEach((slug) => {
          const colors = getInstitutionColor(slug)
          expect(colors).toHaveProperty('bg')
          expect(colors).toHaveProperty('border')
          expect(colors).toHaveProperty('text')
        })
      })
    })
  })
})
