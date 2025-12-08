/**
 * React Query configuration
 * Optimized caching and data fetching strategies
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      // Data won't refetch if it's still fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time (gcTime): How long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes

      // Retry configuration
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch behavior
      refetchOnWindowFocus: false, // Don't refetch on window focus (reduces API calls)
      refetchOnMount: true, // Refetch on mount if data is stale
      refetchOnReconnect: true, // Refetch on reconnect

      // Network mode
      networkMode: "online" as const,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
};

/**
 * Create a new QueryClient with optimized configuration
 */
export function createQueryClient() {
  return new QueryClient(queryClientConfig);
}

/**
 * Query key factories for consistent cache key management
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    session: () => ["auth", "session"] as const,
    user: () => ["auth", "user"] as const,
  },

  // Listings
  listings: {
    all: ["listings"] as const,
    lists: () => ["listings", "list"] as const,
    list: (filters?: Record<string, unknown>) => ["listings", "list", filters] as const,
    detail: (id: string | number) => ["listings", "detail", id] as const,
    search: (params?: Record<string, unknown>) => ["listings", "search", params] as const,
  },

  // Bookings
  bookings: {
    all: ["bookings"] as const,
    lists: () => ["bookings", "list"] as const,
    list: (filters?: Record<string, unknown>) => ["bookings", "list", filters] as const,
    detail: (id: string | number) => ["bookings", "detail", id] as const,
    host: (hostId: string | number) => ["bookings", "host", hostId] as const,
  },

  // Reviews
  reviews: {
    all: ["reviews"] as const,
    listing: (listingId: string | number) => ["reviews", "listing", listingId] as const,
    user: (userId: string | number) => ["reviews", "user", userId] as const,
  },

  // Messages
  messages: {
    all: ["messages"] as const,
    conversations: () => ["messages", "conversations"] as const,
    conversation: (id: string | number) => ["messages", "conversation", id] as const,
    messages: (conversationId: string | number) => ["messages", "messages", conversationId] as const,
  },

  // Notifications
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: Record<string, unknown>) => ["notifications", "list", filters] as const,
  },
} as const;

