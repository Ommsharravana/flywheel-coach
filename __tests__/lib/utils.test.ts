import { describe, it, expect } from 'vitest'
import { generateCycleNameFromProblem, getUniqueCycleName } from '../../lib/utils'

describe('generateCycleNameFromProblem', () => {
  describe('when given valid input', () => {
    it('should return a name from refined statement', () => {
      const result = generateCycleNameFromProblem('Students struggle to find study materials', null)
      expect(result).toBe('Students struggle to find study materials')
    })

    it('should return a name from selected question when refined statement is null', () => {
      const result = generateCycleNameFromProblem(null, 'How can we improve attendance tracking?')
      expect(result).toBe('How can we improve attendance tracking?')
    })

    it('should prefer refined statement over selected question', () => {
      const result = generateCycleNameFromProblem(
        'Refined problem statement',
        'Selected question'
      )
      expect(result).toBe('Refined problem statement')
    })
  })

  describe('when removing common prefixes', () => {
    it('should remove "I want to" prefix', () => {
      const result = generateCycleNameFromProblem('I want to improve student engagement', null)
      expect(result).toBe('Improve student engagement')
    })

    it('should remove "We need to" prefix', () => {
      const result = generateCycleNameFromProblem('We need to fix the scheduling system', null)
      expect(result).toBe('Fix the scheduling system')
    })

    it('should remove "The problem is" prefix', () => {
      const result = generateCycleNameFromProblem('The problem is students are late', null)
      expect(result).toBe('Students are late')
    })

    it('should remove "Users are frustrated by" prefix', () => {
      const result = generateCycleNameFromProblem('Users are frustrated by slow loading times', null)
      expect(result).toBe('Slow loading times')
    })

    it('should remove "The issue is" prefix', () => {
      const result = generateCycleNameFromProblem('The issue is lack of feedback', null)
      expect(result).toBe('Lack of feedback')
    })
  })

  describe('when truncating long text', () => {
    it('should truncate at word boundary for long text', () => {
      const longText = 'This is a very long problem statement that exceeds the maximum allowed character limit and should be truncated appropriately'
      const result = generateCycleNameFromProblem(longText, null)
      expect(result).not.toBeNull()
      expect(result!.length).toBeLessThanOrEqual(60)
      // Should not end mid-word
      expect(result!.endsWith(' ')).toBe(false)
    })

    it('should handle strings under 50 characters without truncation', () => {
      const shortText = 'A forty-character string here!'
      const result = generateCycleNameFromProblem(shortText, null)
      expect(result).toBe(shortText)
    })
  })

  describe('when handling edge cases', () => {
    it('should return null for null inputs', () => {
      const result = generateCycleNameFromProblem(null, null)
      expect(result).toBeNull()
    })

    it('should return null for undefined inputs', () => {
      const result = generateCycleNameFromProblem(undefined, undefined)
      expect(result).toBeNull()
    })

    it('should return null for empty strings', () => {
      const result = generateCycleNameFromProblem('', '')
      expect(result).toBeNull()
    })

    it('should return null for whitespace-only strings', () => {
      const result = generateCycleNameFromProblem('   ', '   ')
      expect(result).toBeNull()
    })

    it('should return null for very short strings after cleanup', () => {
      const result = generateCycleNameFromProblem('I want to a', null)
      // After removing prefix, only "a" remains which is < 5 chars
      expect(result).toBeNull()
    })

    it('should remove trailing punctuation', () => {
      const result = generateCycleNameFromProblem('Students need help,', null)
      expect(result).toBe('Students need help')
    })

    it('should capitalize first letter', () => {
      const result = generateCycleNameFromProblem('lowercase start', null)
      expect(result).toBe('Lowercase start')
    })
  })
})

describe('getUniqueCycleName', () => {
  it('should return base name if no duplicates exist', () => {
    const result = getUniqueCycleName('My Cycle', ['Other Cycle', 'Another Cycle'])
    expect(result).toBe('My Cycle')
  })

  it('should append (2) if base name exists once', () => {
    const result = getUniqueCycleName('My Cycle', ['My Cycle', 'Other Cycle'])
    expect(result).toBe('My Cycle (2)')
  })

  it('should append (3) if (2) already exists', () => {
    const result = getUniqueCycleName('My Cycle', ['My Cycle', 'My Cycle (2)'])
    expect(result).toBe('My Cycle (3)')
  })

  it('should handle case-insensitive matching when initial check finds exact match', () => {
    // Note: Initial check uses includes() which is case-sensitive
    // Only the loop uses case-insensitive comparison
    const result = getUniqueCycleName('My Cycle', ['My Cycle', 'MY CYCLE (2)'])
    expect(result).toBe('My Cycle (3)')
  })

  it('should handle empty existing names array', () => {
    const result = getUniqueCycleName('My Cycle', [])
    expect(result).toBe('My Cycle')
  })

  it('should handle gaps in numbering', () => {
    const result = getUniqueCycleName('My Cycle', ['My Cycle', 'My Cycle (5)'])
    expect(result).toBe('My Cycle (6)')
  })
})
