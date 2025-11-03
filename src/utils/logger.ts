/**
 * Production-Safe Logger Utility
 *
 * Provides conditional logging that only outputs in development mode.
 * In production builds, all logs are suppressed to:
 * - Prevent sensitive data exposure
 * - Improve performance
 * - Reduce bundle size
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

/**
 * Creates a namespaced logger that only logs in development
 * @param namespace - The namespace/module name for the logger (e.g., 'PrayerService', 'HomeScreen')
 * @returns Logger instance with log, info, warn, error, debug methods
 *
 * @example
 * const logger = createLogger('PrayerService');
 * logger.log('Prayer times calculated'); // Only logs in __DEV__
 * logger.error('Failed to fetch', error); // Always logs (errors)
 */
export const createLogger = (namespace: string): Logger => {
  const prefix = `[${namespace}]`;

  const createLogFunction = (level: LogLevel, force = false) => {
    return (...args: any[]) => {
      // Always log errors and warnings, even in production
      if (force || level === 'error' || level === 'warn') {
        console[level](prefix, ...args);
        return;
      }

      // Only log debug/info/log in development
      if (__DEV__) {
        console[level](prefix, ...args);
      }
    };
  };

  return {
    log: createLogFunction('log'),
    info: createLogFunction('info'),
    warn: createLogFunction('warn', true), // Always log warnings
    error: createLogFunction('error', true), // Always log errors
    debug: createLogFunction('debug'),
  };
};

/**
 * Default app-wide logger
 * Use this for general application logs
 */
export const logger = createLogger('App');

/**
 * Performance timing utility for development
 * @param label - Label for the timing measurement
 * @returns Function to call when operation completes
 *
 * @example
 * const endTimer = logger.time('API Call');
 * await fetchData();
 * endTimer(); // Logs: "[Performance] API Call: 123ms"
 */
export const time = (label: string): (() => void) => {
  if (!__DEV__) {
    return () => {}; // No-op in production
  }

  const start = Date.now();
  console.time(`[Performance] ${label}`);

  return () => {
    const duration = Date.now() - start;
    console.timeEnd(`[Performance] ${label}`);
    logger.debug(`[Performance] ${label}: ${duration}ms`);
  };
};

/**
 * Conditional group logging for complex debug scenarios
 * @param label - Group label
 * @param callback - Function containing console statements
 *
 * @example
 * logger.group('Prayer Calculation', () => {
 *   logger.debug('Coordinates:', coords);
 *   logger.debug('Times:', times);
 * });
 */
export const group = (label: string, callback: () => void): void => {
  if (!__DEV__) return;

  console.group(label);
  callback();
  console.groupEnd();
};

export default { createLogger, logger, time, group };
