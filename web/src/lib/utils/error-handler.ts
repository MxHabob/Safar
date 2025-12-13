/**
 * Error handling utilities for consistent error management across the application
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs errors with context for debugging and monitoring
 */
export function logError(
  error: unknown,
  context: ErrorContext = {}
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logData = {
    message: errorMessage,
    stack: errorStack,
    ...context,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', logData);
  }

  // In production, send to error tracking service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   errorTrackingService.captureException(error, { extra: logData });
  // }
}

/**
 * Safely handles API errors with proper logging
 * Returns a fallback value instead of throwing
 */
export function handleApiError<T>(
  error: unknown,
  fallback: T,
  context: ErrorContext = {}
): T {
  logError(error, {
    ...context,
    action: context.action || 'api_call',
  });

  return fallback;
}

/**
 * Creates a safe error handler for async operations
 */
export function createErrorHandler(context: ErrorContext) {
  return <T>(fallback: T) => (error: unknown): T => {
    return handleApiError(error, fallback, context);
  };
}

