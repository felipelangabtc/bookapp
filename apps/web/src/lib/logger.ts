type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel()];
};

const formatLog = (entry: LogEntry): string => {
  if (process.env.NODE_ENV === 'production') {
    // JSON format for production (structured logging)
    return JSON.stringify(entry);
  }

  // Pretty format for development
  const { timestamp, level, message, context, error } = entry;
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';
  const color = levelColors[level];

  let output = `${timestamp} ${color}[${level.toUpperCase()}]${reset} ${message}`;

  if (context && Object.keys(context).length > 0) {
    output += ` ${JSON.stringify(context)}`;
  }

  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }

  return output;
};

const createLogEntry = (
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  context,
  ...(error && {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  }),
});

const log = (level: LogLevel, message: string, context?: LogContext, error?: Error): void => {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, message, context, error);
  const formatted = formatLog(entry);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
};

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext, error?: Error) => log('warn', message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => log('error', message, context, error),

  // Create a child logger with preset context
  child: (baseContext: LogContext) => ({
    debug: (message: string, context?: LogContext) =>
      log('debug', message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log('info', message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext, error?: Error) =>
      log('warn', message, { ...baseContext, ...context }, error),
    error: (message: string, context?: LogContext, error?: Error) =>
      log('error', message, { ...baseContext, ...context }, error),
  }),
};

// Generate a unique request ID
export const generateRequestId = (): string => {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
};
