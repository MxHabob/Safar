import { DEFAULT_SERVER_ERROR_MESSAGE, createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server/session";
/**
 * Enhanced Action Error class for better error handling
 * Follows Next.js 16.0.1 best practices
 */
export class ActionError extends Error {
  constructor(
    message: string, 
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ActionError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ActionError);
    }
  }
}

/**
 * Basic action client without metadata
 * Use this for simple server actions that don't need metadata
 */
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) {
      return e.message;
    }
    // Log unexpected errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Action Error]', e);
    }
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

/**
 * Enhanced action client with metadata support
 * Next.js 16.0.1: Supports metadata for better action tracking and rate limiting
 */
export const actionClientWithMeta = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) {
      return e.message;
    }
    // Log unexpected errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Action Error]', e);
    }
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      name: z.string().describe('Action name for logging and tracking'),
      requiresAuth: z.boolean().default(false).describe('Whether this action requires authentication'),
      rateLimit: z.object({
        requests: z.number().int().positive().describe('Number of requests allowed'),
        window: z.string().describe('Time window (e.g., "10s", "1m", "1h")'),
      }).optional().describe('Rate limiting configuration'),
      cacheTags: z.array(z.string()).optional().describe('Cache tags for invalidation (Next.js 16.0.1)'),
    });
  },
});

// Simple in-memory rate limiter
class MemoryRateLimiter {
  private limits = new Map<string, { count: number; expiresAt: number }>();

  async limit(key: string, requests: number, window: string) {
    const now = Date.now();
    const windowMs = this.parseWindow(window);
    const entry = this.limits.get(key);

    if (!entry || entry.expiresAt <= now) {
      this.limits.set(key, { count: 1, expiresAt: now + windowMs });
      return { success: true, remaining: requests - 1 };
    }

    if (entry.count >= requests) {
      return { success: false, remaining: 0 };
    }

    this.limits.set(key, { ...entry, count: entry.count + 1 });
    return { success: true, remaining: requests - entry.count - 1 };
  }

  private parseWindow(window: string): number {
    const value = parseInt(window);
    if (window.endsWith("s")) return value * 1000;
    if (window.endsWith("m")) return value * 60 * 1000;
    if (window.endsWith("h")) return value * 60 * 60 * 1000;
    return 1000; // default to 1 second
  }
}

const memoryRateLimiter = new MemoryRateLimiter();

// Auth client with rate limiting
export const authActionClient = actionClientWithMeta
  .use(async ({ next, clientInput, metadata }) => {
    if (process.env.NODE_ENV === "development") {
      console.log("Input:", clientInput);
      console.log("Metadata:", metadata);
    }
    return next({ ctx: {} });
  })
  .use(async ({ next, metadata }) => {
    if (metadata?.rateLimit) {
      const headersList = await headers(); // Await the headers promise
      const ip = headersList.get("x-forwarded-for") ?? "local";
      const { success, remaining } = await memoryRateLimiter.limit(
        `${ip}-${metadata.name}`,
        metadata.rateLimit.requests,
        metadata.rateLimit.window
      );

      if (!success) {
        throw new ActionError("Too many requests", "RATE_LIMITED");
      }

      return next({
        ctx: {
          ratelimit: { remaining },
        },
      });
    }
    return next();
  })
  .use(async ({ next, metadata }) => {
    if (metadata?.requiresAuth) {
      const user = await getCurrentUser();
      
      if (!user) {
        throw new ActionError("Unauthorized", "UNAUTHORIZED");
      }

      return next({
        ctx: {
          user,
        },
      });
    }
    return next();
  });
