/**
 * Offline Support Module
 *
 * Provides comprehensive offline handling for JKKN Solution Studio:
 *
 * 1. Network Status Detection - Monitors online/offline state and connection quality
 * 2. Offline Queue - Stores actions to sync when network returns
 * 3. Offline-Aware Fetch - Caching and graceful degradation for API calls
 *
 * Usage:
 *
 * ```tsx
 * // Check network status
 * import { useOffline } from '@/lib/context/OfflineContext';
 * const { network, pendingActions } = useOffline();
 *
 * // Make offline-aware API calls
 * import { offlineAPI } from '@/lib/offline';
 * const { data, error, queued } = await offlineAPI.post('/api/vote', { score: 5 });
 *
 * // Queue custom actions
 * import { addToQueue } from '@/lib/offline';
 * addToQueue({ type: 'submit_vote', payload: { teamId, score }, maxRetries: 3 });
 * ```
 */

export { offlineFetch, offlineAPI } from './fetch';
export {
  getQueue,
  addToQueue,
  removeFromQueue,
  incrementRetry,
  clearQueue,
  getQueueCount,
  hasQueuedActions,
  type QueuedAction,
} from './queue';
