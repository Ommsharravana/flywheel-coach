'use client';

/**
 * Offline Action Queue
 * Stores actions that should be executed when network returns
 * Designed for areas with intermittent connectivity
 */

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

const QUEUE_KEY = 'jkkn_offline_queue';
const MAX_QUEUE_SIZE = 50; // Prevent localStorage bloat

/**
 * Get all queued actions
 */
export function getQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading offline queue:', error);
    return [];
  }
}

/**
 * Add an action to the offline queue
 */
export function addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): QueuedAction {
  const queue = getQueue();

  const newAction: QueuedAction = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  // Add to front of queue, limit size
  const updatedQueue = [newAction, ...queue].slice(0, MAX_QUEUE_SIZE);

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error saving to offline queue:', error);
  }

  return newAction;
}

/**
 * Remove an action from the queue (after successful execution)
 */
export function removeFromQueue(actionId: string): void {
  const queue = getQueue();
  const updatedQueue = queue.filter(a => a.id !== actionId);

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error updating offline queue:', error);
  }
}

/**
 * Update retry count for an action
 */
export function incrementRetry(actionId: string): QueuedAction | null {
  const queue = getQueue();
  const index = queue.findIndex(a => a.id === actionId);

  if (index === -1) return null;

  const action = queue[index];
  action.retryCount += 1;

  // Remove if max retries exceeded
  if (action.retryCount > action.maxRetries) {
    removeFromQueue(actionId);
    return null;
  }

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error updating offline queue:', error);
  }

  return action;
}

/**
 * Clear the entire queue
 */
export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
}

/**
 * Get count of pending actions
 */
export function getQueueCount(): number {
  return getQueue().length;
}

/**
 * Check if there are pending actions
 */
export function hasQueuedActions(): boolean {
  return getQueueCount() > 0;
}
