import { Logger } from '@nestjs/common';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const DEFAULT_CONTEXT = 'nestjs-service';
const SAFE_LOG_FIELDS = new Set([
  'port',
  'method',
  'statusCode',
  'errorName',
  'errorCode',
]);
const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};
const MAX_ERROR_MESSAGE_LENGTH = 1_000;
const SENSITIVE_VALUE_REPLACEMENT = '[REDACTED]';
const logger = new Logger(DEFAULT_CONTEXT);

let configured = false;
let minimumLevel: LogLevel = 'info';

export function configureAppLogger(): void {
  minimumLevel = getLogLevel(process.env.LOG_LEVEL, process.env.NODE_ENV);
  configured = true;
}

export const appLogger = {
  debug(message: string, extra?: Record<string, unknown>): void {
    log('debug', message, extra);
  },

  info(message: string, extra?: Record<string, unknown>): void {
    log('info', message, extra);
  },

  warn(message: string, extra?: Record<string, unknown>): void {
    log('warn', message, extra);
  },

  error(message: string, extra?: Record<string, unknown>): void {
    log('error', message, extra);
  },

  fatal(message: string, extra?: Record<string, unknown>): void {
    log('fatal', message, extra);
  },
};

function log(
  level: LogLevel,
  message: string,
  extra?: Record<string, unknown>,
): void {
  ensureConfigured();
  if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[minimumLevel]) {
    return;
  }

  const safeMessage = formatLogMessage(message, extra);
  if (level === 'debug') {
    logger.debug(safeMessage);
  } else if (level === 'info') {
    logger.log(safeMessage);
  } else if (level === 'warn') {
    logger.warn(safeMessage);
  } else {
    logger.error(safeMessage);
  }
}

function formatLogMessage(
  message: string,
  extra?: Record<string, unknown>,
): string {
  const safeExtra: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (!SAFE_LOG_FIELDS.has(key)) {
      continue;
    }
    if (typeof value === 'string') {
      safeExtra[key] = sanitizeErrorMessage(value);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      safeExtra[key] = value;
    }
  }

  const safeMessage = sanitizeErrorMessage(message);
  return Object.keys(safeExtra).length === 0
    ? safeMessage
    : `${safeMessage} ${JSON.stringify(safeExtra)}`;
}

export function getSafeErrorLogFields(
  error: unknown,
): Record<string, string | undefined> {
  return {
    errorName: getErrorName(error),
    errorCode: getErrorCode(error),
    errorMessage: getSafeErrorMessage(error),
  };
}

function ensureConfigured(): void {
  if (!configured) {
    configureAppLogger();
  }
}

function getLogLevel(
  value: string | undefined,
  nodeEnv: string | undefined,
): LogLevel {
  if (
    value === 'debug' ||
    value === 'info' ||
    value === 'warn' ||
    value === 'error' ||
    value === 'fatal'
  ) {
    return value;
  }

  if (nodeEnv === 'test') {
    return 'fatal';
  }

  return 'info';
}

function getErrorName(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }

  return typeof error;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code);
  }

  return undefined;
}

function getSafeErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error) || !error.message) {
    return undefined;
  }

  return sanitizeErrorMessage(error.message);
}

function sanitizeErrorMessage(message: string): string {
  return truncateMessage(
    message
      .replace(/[\r\n\t]+/g, ' ')
      .replace(
        /([\w.-]+):\/\/([^/\s:@]+):([^@\s/]+)@/g,
        `$1://${SENSITIVE_VALUE_REPLACEMENT}:${SENSITIVE_VALUE_REPLACEMENT}@`,
      )
      .replace(
        /(["']?(?:accessToken|authorization|authorizationHeader|cookie|credential|credentials|password|refreshToken|secret|set-cookie|token)["']?\s*[:=]\s*["']?)([^"',;\s}]+)/gi,
        `$1${SENSITIVE_VALUE_REPLACEMENT}`,
      )
      .trim(),
  );
}

function truncateMessage(message: string): string {
  if (message.length <= MAX_ERROR_MESSAGE_LENGTH) {
    return message;
  }

  return `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH)}...`;
}
