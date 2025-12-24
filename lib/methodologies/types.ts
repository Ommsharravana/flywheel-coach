/**
 * Methodology Type Definitions
 *
 * Supports multiple innovation methodologies (Flywheel, Lean Canvas, Design Thinking, etc.)
 * Each methodology defines its own steps, components, and data requirements.
 */

export interface MethodologyStep {
  id: number;
  name: string;
  shortName: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  component: string; // Component name to render
  dataTable?: string; // Optional: which table stores this step's data
  requiredFields?: string[]; // Fields needed to complete this step
  optional?: boolean; // If true, step can be skipped
}

export interface Methodology {
  id: string; // e.g., 'flywheel-8', 'lean-canvas-6'
  name: string;
  description: string;
  version: string;
  steps: MethodologyStep[];

  // Step that marks completion (usually last step or submission)
  completionStep: number;

  // Optional features
  features?: {
    problemBank?: boolean; // Can save to problem bank
    teamMode?: boolean; // Supports teams
    submission?: boolean; // Has submission step
    impactTracking?: boolean; // Tracks impact metrics
  };

  // Branding
  branding?: {
    primaryColor?: string;
    accentColor?: string;
    logo?: string;
  };
}

export interface MethodologyRegistry {
  [id: string]: Methodology;
}
