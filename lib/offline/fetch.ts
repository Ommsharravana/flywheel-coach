'use client';

import { addToQueue } from './queue';

/**
 * Offline-aware fetch wrapper
 * - Returns cached data when offline (if available)
 * - Queues write operations for later sync
 * - Provides graceful degradation for poor connectivity
 */

interface OfflineFetchOptions extends RequestInit {
  /** Cache key for storing/retrieving cached responses */
  cacheKey?: string;
  /** Maximum age of cached data in milliseconds (default: 5 minutes) */
  maxCacheAge?: number;
  /** If true, queue the request for later when offline (for mutations) */
  queueIfOffline?: boolean;
  /** Action type for queued requests */
  queueActionType?: string;
  /** Maximum retries for queued requests */
  maxRetries?: number;
}

interface CachedResponse {
  data: unknown;
  timestamp: number;
}

const CACHE_PREFIX = 'jkkn_api_cache_';

/**
 * Get cached response if available and not expired
 */
function getCachedResponse<T>(key: string, maxAge: number): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const parsed: CachedResponse = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age > maxAge) {
      // Cache expired, remove it
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return parsed.data as T;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Store response in cache
 */
function setCachedResponse(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedResponse = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
  } catch (error) {
    // Likely storage quota exceeded, try to clear old cache entries
    console.error('Error writing cache:', error);
    clearOldCache();
  }
}

/**
 * Clear cache entries older than 1 hour
 */
function clearOldCache(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;

    try {
      const cached: CachedResponse = JSON.parse(localStorage.getItem(key) || '');
      if (now - cached.timestamp > maxAge) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key || '');
    }
  }
}

/**
 * Offline-aware fetch function
 */
export async function offlineFetch<T>(
  url: string,
  options: OfflineFetchOptions = {}
): Promise<{ data: T | null; fromCache: boolean; queued: boolean; error: string | null }> {
  const {
    cacheKey,
    maxCacheAge = 5 * 60 * 1000, // 5 minutes default
    queueIfOffline = false,
    queueActionType,
    maxRetries = 3,
    ...fetchOptions
  } = options;

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isGetRequest = !fetchOptions.method || fetchOptions.method.toUpperCase() === 'GET';

  // If offline and it's a GET request, try to return cached data
  if (!isOnline && isGetRequest && cacheKey) {
    const cached = getCachedResponse<T>(cacheKey, maxCacheAge);
    if (cached) {
      return { data: cached, fromCache: true, queued: false, error: null };
    }
    return {
      data: null,
      fromCache: false,
      queued: false,
      error: 'You are offline and no cached data is available.',
    };
  }

  // If offline and it's a mutation, queue it if requested
  if (!isOnline && !isGetRequest && queueIfOffline) {
    const actionType = queueActionType || `fetch_${url}`;
    addToQueue({
      type: actionType,
      payload: { url, options: fetchOptions },
      maxRetries,
    });

    return {
      data: null,
      fromCache: false,
      queued: true,
      error: 'You are offline. This action has been queued and will sync when you reconnect.',
    };
  }

  // If offline and can't cache/queue, return error
  if (!isOnline) {
    return {
      data: null,
      fromCache: false,
      queued: false,
      error: 'You are offline. Please check your connection and try again.',
    };
  }

  // Online - make the actual request
  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        fromCache: false,
        queued: false,
        error: errorText || `Request failed with status ${response.status}`,
      };
    }

    const data = await response.json();

    // Cache GET responses if cacheKey provided
    if (isGetRequest && cacheKey) {
      setCachedResponse(cacheKey, data);
    }

    return { data, fromCache: false, queued: false, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network request failed';

    // If the request failed and we have cached data, return it
    if (isGetRequest && cacheKey) {
      const cached = getCachedResponse<T>(cacheKey, maxCacheAge * 2); // Allow stale cache on error
      if (cached) {
        return { data: cached, fromCache: true, queued: false, error: null };
      }
    }

    return {
      data: null,
      fromCache: false,
      queued: false,
      error: errorMessage,
    };
  }
}

/**
 * Simple wrapper for common API patterns
 */
export const offlineAPI = {
  async get<T>(url: string, cacheKey?: string): Promise<{ data: T | null; error: string | null }> {
    const result = await offlineFetch<T>(url, { cacheKey, method: 'GET' });
    return { data: result.data, error: result.error };
  },

  async post<T>(
    url: string,
    body: unknown,
    queueIfOffline = true
  ): Promise<{ data: T | null; queued: boolean; error: string | null }> {
    const result = await offlineFetch<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      queueIfOffline,
      queueActionType: `post_${url}`,
    });
    return { data: result.data, queued: result.queued, error: result.error };
  },

  async put<T>(
    url: string,
    body: unknown,
    queueIfOffline = true
  ): Promise<{ data: T | null; queued: boolean; error: string | null }> {
    const result = await offlineFetch<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      queueIfOffline,
      queueActionType: `put_${url}`,
    });
    return { data: result.data, queued: result.queued, error: result.error };
  },

  async delete(
    url: string,
    queueIfOffline = true
  ): Promise<{ success: boolean; queued: boolean; error: string | null }> {
    const result = await offlineFetch(url, {
      method: 'DELETE',
      queueIfOffline,
      queueActionType: `delete_${url}`,
    });
    return {
      success: result.error === null && !result.queued,
      queued: result.queued,
      error: result.error,
    };
  },
};
