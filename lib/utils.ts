import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a cycle name from a problem statement
 * Extracts meaningful text (first 50 chars), cleans it up
 */
export function generateCycleNameFromProblem(
  refinedStatement?: string | null,
  selectedQuestion?: string | null
): string | null {
  // Try refined statement first, fall back to selected question
  const source = refinedStatement?.trim() || selectedQuestion?.trim();

  if (!source || source.length === 0) {
    return null;
  }

  // Clean up the text
  let name = source
    // Remove common prefixes
    .replace(/^(I want to|We need to|The problem is|Users are frustrated by|The issue is)/i, '')
    .trim()
    // Capitalize first letter
    .replace(/^./, (char) => char.toUpperCase())
    // Truncate to ~50 chars at word boundary
    .substring(0, 60);

  // If truncated mid-word, find the last space and cut there
  if (name.length >= 50) {
    const lastSpace = name.lastIndexOf(' ');
    if (lastSpace > 30) {
      name = name.substring(0, lastSpace);
    }
  }

  // Remove trailing punctuation if it's mid-sentence
  name = name.replace(/[,;:]$/, '').trim();

  // If it's too short after cleanup, return null to keep default
  if (name.length < 5) {
    return null;
  }

  return name;
}

/**
 * Generate a unique cycle name by appending (1), (2), etc. if duplicates exist
 */
export function getUniqueCycleName(baseName: string, existingNames: string[]): string {
  // Check if base name already exists
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  // Find the highest number suffix for this base name
  const baseNameLower = baseName.toLowerCase();
  let maxNumber = 0;

  for (const name of existingNames) {
    const nameLower = name.toLowerCase();

    // Check for exact match or match with number suffix
    if (nameLower === baseNameLower) {
      maxNumber = Math.max(maxNumber, 1);
    } else {
      // Check for pattern like "Base Name (1)", "Base Name (2)"
      const match = nameLower.match(new RegExp(`^${escapeRegExp(baseNameLower)}\\s*\\((\\d+)\\)$`));
      if (match) {
        maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
      }
    }
  }

  return `${baseName} (${maxNumber + 1})`;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
