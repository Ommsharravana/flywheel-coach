/**
 * Methodology Registry
 *
 * Central registry for all innovation methodologies supported by JKKN Solutions Studio.
 * Each event can specify which methodology it uses via event.config.methodology_id.
 */

export * from './types';
export * from './flywheel-8';

import type { Methodology, MethodologyRegistry, MethodologyStep } from './types';
import { FLYWHEEL_8, getFlywheelMethodology } from './flywheel-8';

/**
 * All available methodologies
 */
export const METHODOLOGIES: MethodologyRegistry = {
  'flywheel-8': FLYWHEEL_8,
  'flywheel-8-appathon': getFlywheelMethodology(true),
};

/**
 * Get methodology by ID
 */
export function getMethodology(id: string): Methodology | null {
  return METHODOLOGIES[id] || null;
}

/**
 * Get methodology for an event
 *
 * @param eventConfig - The event's config object (from events.config JSONB)
 * @returns The methodology for this event, or flywheel-8 as default
 */
export function getMethodologyForEvent(
  eventConfig: Record<string, unknown> | null
): Methodology {
  if (!eventConfig) {
    return FLYWHEEL_8;
  }

  const methodologyId = eventConfig.methodology_id as string | undefined;

  if (methodologyId && METHODOLOGIES[methodologyId]) {
    return METHODOLOGIES[methodologyId];
  }

  // Legacy support: check for appathon_mode flag
  if (eventConfig.appathon_mode === true) {
    return getFlywheelMethodology(true);
  }

  return FLYWHEEL_8;
}

/**
 * Get steps for a methodology
 */
export function getMethodologySteps(methodologyId: string): MethodologyStep[] {
  const methodology = getMethodology(methodologyId);
  return methodology?.steps || FLYWHEEL_8.steps;
}

/**
 * Check if a step is accessible based on current progress
 */
export function canAccessStep(
  methodologyId: string,
  currentStep: number,
  targetStep: number
): boolean {
  const methodology = getMethodology(methodologyId);
  if (!methodology) return false;

  // Can access any step up to and including current step
  return targetStep <= currentStep;
}

/**
 * Get the completion step for a methodology
 */
export function getCompletionStep(methodologyId: string): number {
  const methodology = getMethodology(methodologyId);
  return methodology?.completionStep || 8;
}

/**
 * Check if methodology supports a specific feature
 */
export function methodologyHasFeature(
  methodologyId: string,
  feature: keyof NonNullable<Methodology['features']>
): boolean {
  const methodology = getMethodology(methodologyId);
  return methodology?.features?.[feature] === true;
}

/**
 * List all available methodology IDs
 */
export function listMethodologyIds(): string[] {
  return Object.keys(METHODOLOGIES);
}

/**
 * Get methodology summary for UI display
 */
export function getMethodologySummary(methodologyId: string): {
  id: string;
  name: string;
  stepCount: number;
  description: string;
} | null {
  const methodology = getMethodology(methodologyId);
  if (!methodology) return null;

  return {
    id: methodology.id,
    name: methodology.name,
    stepCount: methodology.steps.length,
    description: methodology.description,
  };
}
