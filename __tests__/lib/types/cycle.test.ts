import { describe, it, expect } from 'vitest'
import {
  getStepStatus,
  canAccessStep,
  getFlywheelSteps,
  FLYWHEEL_STEPS,
  APPATHON_STEP,
  type Cycle,
} from '../../../lib/types/cycle'

describe('cycle utility functions', () => {
  const createMockCycle = (
    overrides: Partial<Cycle> = {}
  ): Cycle => ({
    id: '1',
    userId: 'user1',
    name: 'Test Cycle',
    status: 'active',
    currentStep: 1,
    startedAt: '2024-01-01',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  })

  describe('getStepStatus', () => {
    it('should return "completed" for all steps when cycle is completed', () => {
      const cycle = createMockCycle({ status: 'completed', currentStep: 8 })

      expect(getStepStatus(cycle, 1)).toBe('completed')
      expect(getStepStatus(cycle, 2)).toBe('completed')
      expect(getStepStatus(cycle, 3)).toBe('completed')
      expect(getStepStatus(cycle, 4)).toBe('completed')
      expect(getStepStatus(cycle, 5)).toBe('completed')
      expect(getStepStatus(cycle, 6)).toBe('completed')
      expect(getStepStatus(cycle, 7)).toBe('completed')
      expect(getStepStatus(cycle, 8)).toBe('completed')
    })

    it('should return "completed" for steps before current step', () => {
      const cycle = createMockCycle({ currentStep: 5 })

      expect(getStepStatus(cycle, 1)).toBe('completed')
      expect(getStepStatus(cycle, 2)).toBe('completed')
      expect(getStepStatus(cycle, 3)).toBe('completed')
      expect(getStepStatus(cycle, 4)).toBe('completed')
    })

    it('should return "in-progress" for current step', () => {
      const cycle = createMockCycle({ currentStep: 5 })
      expect(getStepStatus(cycle, 5)).toBe('in-progress')
    })

    it('should return "not-started" for steps after current step', () => {
      const cycle = createMockCycle({ currentStep: 5 })

      expect(getStepStatus(cycle, 6)).toBe('not-started')
      expect(getStepStatus(cycle, 7)).toBe('not-started')
      expect(getStepStatus(cycle, 8)).toBe('not-started')
    })

    it('should handle step 1 correctly', () => {
      const cycle = createMockCycle({ currentStep: 1 })
      expect(getStepStatus(cycle, 1)).toBe('in-progress')
    })

    it('should handle step 8 correctly', () => {
      const cycle = createMockCycle({ currentStep: 8 })
      expect(getStepStatus(cycle, 8)).toBe('in-progress')
      expect(getStepStatus(cycle, 7)).toBe('completed')
    })

    it('should not mark step 9+ as completed even when cycle is completed', () => {
      const cycle = createMockCycle({ status: 'completed', currentStep: 8 })
      // Step 9 is beyond the constraint, behavior depends on implementation
      expect(getStepStatus(cycle, 9)).toBe('not-started')
    })
  })

  describe('canAccessStep', () => {
    it('should always allow access to step 1', () => {
      const cycle = createMockCycle({ currentStep: 1 })
      expect(canAccessStep(cycle, 1)).toBe(true)
    })

    it('should allow access to current step', () => {
      const cycle = createMockCycle({ currentStep: 5 })
      expect(canAccessStep(cycle, 5)).toBe(true)
    })

    it('should allow access to previous steps', () => {
      const cycle = createMockCycle({ currentStep: 5 })

      expect(canAccessStep(cycle, 1)).toBe(true)
      expect(canAccessStep(cycle, 2)).toBe(true)
      expect(canAccessStep(cycle, 3)).toBe(true)
      expect(canAccessStep(cycle, 4)).toBe(true)
    })

    it('should not allow access to future steps', () => {
      const cycle = createMockCycle({ currentStep: 5 })

      expect(canAccessStep(cycle, 6)).toBe(false)
      expect(canAccessStep(cycle, 7)).toBe(false)
      expect(canAccessStep(cycle, 8)).toBe(false)
    })

    describe('step 9 (Appathon Submission)', () => {
      it('should allow access to step 9 when current step is 8', () => {
        const cycle = createMockCycle({ currentStep: 8 })
        expect(canAccessStep(cycle, 9)).toBe(true)
      })

      it('should not allow access to step 9 when current step is less than 8', () => {
        expect(canAccessStep(createMockCycle({ currentStep: 1 }), 9)).toBe(false)
        expect(canAccessStep(createMockCycle({ currentStep: 5 }), 9)).toBe(false)
        expect(canAccessStep(createMockCycle({ currentStep: 7 }), 9)).toBe(false)
      })
    })
  })

  describe('getFlywheelSteps', () => {
    it('should return 8 steps when not in Appathon mode', () => {
      const steps = getFlywheelSteps(false)
      expect(steps).toHaveLength(8)
    })

    it('should return 9 steps when in Appathon mode', () => {
      const steps = getFlywheelSteps(true)
      expect(steps).toHaveLength(9)
    })

    it('should include all base steps in non-Appathon mode', () => {
      const steps = getFlywheelSteps(false)
      expect(steps).toEqual(FLYWHEEL_STEPS)
    })

    it('should include Appathon step at the end in Appathon mode', () => {
      const steps = getFlywheelSteps(true)
      expect(steps[8]).toEqual(APPATHON_STEP)
    })

    it('should have correct step IDs in order', () => {
      const steps = getFlywheelSteps(false)
      steps.forEach((step, index) => {
        expect(step.id).toBe(index + 1)
      })
    })

    it('should have required properties for each step', () => {
      const steps = getFlywheelSteps(true)
      steps.forEach((step) => {
        expect(step).toHaveProperty('id')
        expect(step).toHaveProperty('name')
        expect(step).toHaveProperty('shortName')
        expect(step).toHaveProperty('description')
        expect(step).toHaveProperty('icon')
      })
    })
  })

  describe('FLYWHEEL_STEPS constant', () => {
    it('should have exactly 8 steps', () => {
      expect(FLYWHEEL_STEPS).toHaveLength(8)
    })

    it('should have Problem Discovery as step 1', () => {
      expect(FLYWHEEL_STEPS[0].name).toBe('Problem Discovery')
      expect(FLYWHEEL_STEPS[0].id).toBe(1)
    })

    it('should have Impact Discovery as step 8', () => {
      expect(FLYWHEEL_STEPS[7].name).toBe('Impact Discovery')
      expect(FLYWHEEL_STEPS[7].id).toBe(8)
    })

    it('should have all steps with unique IDs', () => {
      const ids = FLYWHEEL_STEPS.map((step) => step.id)
      const uniqueIds = [...new Set(ids)]
      expect(uniqueIds).toHaveLength(FLYWHEEL_STEPS.length)
    })
  })

  describe('APPATHON_STEP constant', () => {
    it('should have ID 9', () => {
      expect(APPATHON_STEP.id).toBe(9)
    })

    it('should be named Appathon Submission', () => {
      expect(APPATHON_STEP.name).toBe('Appathon Submission')
    })

    it('should have shortName Submit', () => {
      expect(APPATHON_STEP.shortName).toBe('Submit')
    })
  })
})
