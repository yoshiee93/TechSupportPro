export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  source?: string;
}

export class Logger {
  private level: LogLevel;
  private source: string;

  constructor(source: string, level: LogLevel = LogLevel.INFO) {
    this.source = source;
    this.level = level;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (level > this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      source: this.source,
    };

    const levelName = LogLevel[level];
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    let logMessage = `${formattedTime} [${this.source}] ${levelName}: ${message}`;
    
    if (context) {
      logMessage += ` ${JSON.stringify(context)}`;
    }

    if (level === LogLevel.ERROR) {
      console.error(logMessage);
    } else if (level === LogLevel.WARN) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }
}

export const createLogger = (source: string) => {
  const level = process.env.LOG_LEVEL ? 
    LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] : 
    LogLevel.INFO;
  
  return new Logger(source, level);
};