import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger';

let initialized = false;

// Errors that are routine for crawlers (rate-limited sites, navigation
// timeouts, transient network blips). Reporting all of them would burn quota
// and bury real bugs. Set SENTRY_REPORT_NOISY=true to disable filtering.
const NOISY_ERROR_PATTERNS = [
  /Navigation timeout/i,
  /net::ERR_/,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /ECONNREFUSED/i,
  /socket hang up/i,
  /Protocol error.*Target closed/i
];
const NOISY_HTTP_STATUSES = new Set([429, 503]);

const isNoisyError = (hint?: Sentry.EventHint): boolean => {
  const err: any = hint?.originalException;
  if (!err) return false;
  const status = err?.response?.status ?? err?.status;
  if (typeof status === 'number' && NOISY_HTTP_STATUSES.has(status)) return true;
  const msg = typeof err === 'string' ? err : (err?.message ?? '');
  return NOISY_ERROR_PATTERNS.some((re) => re.test(msg));
};

/**
 * Initialize Sentry. No-op if SENTRY_DSN is not set, so the app runs
 * unchanged when Sentry isn't configured.
 *
 * Env vars:
 *  - SENTRY_DSN           — required to enable
 *  - SENTRY_ENV           — optional, defaults to NODE_ENV or 'production'
 *  - SENTRY_RELEASE       — optional, for source-map / release grouping
 *  - SENTRY_REPORT_NOISY  — optional, set 'true' to disable noisy-error filtering
 */
export const initSentry = () => {
  if (initialized) return;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry disabled (SENTRY_DSN not set)');
    return;
  }

  const reportNoisy = process.env.SENTRY_REPORT_NOISY === 'true';

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'production',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0, // errors only, no perf tracing
    sendDefaultPii: false,
    beforeSend: (event, hint) => {
      if (!reportNoisy && isNoisyError(hint)) return null;
      return event;
    }
  });

  initialized = true;
  logger.info('Sentry initialized');
};

interface CaptureOptions {
  tags?: Record<string, string | number | boolean | undefined>
  extra?: Record<string, any>
}

const buildScopeArgs = (opts?: CaptureOptions | Record<string, any>) => {
  if (!opts) return undefined;
  // Back-compat: if caller passed a flat record (legacy callers), put it in extra.
  if (!('tags' in opts) && !('extra' in opts)) {
    return { extra: opts as Record<string, any> };
  }
  const { tags, extra } = opts as CaptureOptions;
  return { tags, extra };
};

export const captureException = (err: unknown, context?: CaptureOptions | Record<string, any>) => {
  if (!initialized) return;
  try {
    Sentry.captureException(err, buildScopeArgs(context));
  } catch (e) {
    // Never let Sentry failures break the app
    logger.warn({ err: e }, 'Sentry captureException failed');
  }
};

/**
 * Log + report a swallowed error in one call. Use at `.catch` boundaries that
 * intentionally return a fallback value (typically `null`) so the failure is
 * still visible in Sentry without changing the caller contract.
 *
 * Pass `store` and `usecase` in `tags` so errors are filterable in the UI.
 * Anything URL/payload-shaped goes in `extra`.
 */
export const captureSwallowed = <T = null>(
  err: unknown,
  message: string,
  options: CaptureOptions & { level?: 'warn' | 'error', fallback?: T } = {}
): T => {
  const { tags, extra, level = 'warn', fallback } = options;
  const logCtx = { err, ...tags, ...extra };
  if (level === 'error') logger.error(logCtx, message);
  else logger.warn(logCtx, message);
  captureException(err, { tags, extra: { ...extra, message } });
  return (fallback ?? null) as T;
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'error',
  context?: Record<string, any>
) => {
  if (!initialized) return;
  try {
    Sentry.captureMessage(message, { level, extra: context });
  } catch (e) {
    logger.warn({ err: e }, 'Sentry captureMessage failed');
  }
};

/** Flush pending events during graceful shutdown. Safe to call when disabled. */
export const closeSentry = async (timeoutMs = 2000) => {
  if (!initialized) return;
  try {
    await Sentry.close(timeoutMs);
  } catch (e) {
    logger.warn({ err: e }, 'Sentry close failed');
  }
};

export const isSentryEnabled = () => initialized;
