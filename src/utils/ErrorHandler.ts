/**
 * ErrorHandler - Centralized error handling and logging
 */
export class ErrorHandler {
  private static errorLog: ErrorLogEntry[] = [];
  private static maxLogSize: number = 100;
  private static errorCallbacks: Map<ErrorType, ErrorCallback[]> = new Map();

  /**
   * Logs an error with context
   */
  public static logError(
    type: ErrorType,
    message: string,
    context?: ErrorContext,
    error?: Error
  ): void {
    const entry: ErrorLogEntry = {
      type,
      message,
      context: context || {},
      timestamp: Date.now(),
      stack: error?.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    // Add to log
    this.errorLog.push(entry);
    
    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console output
    console.error(`[${type}] ${message}`, context, error);

    // Trigger callbacks
    this.triggerCallbacks(type, entry);

    // Send to analytics if available
    this.sendToAnalytics(entry);
  }

  /**
   * Handles a caught error
   */
  public static handleError(error: Error, context?: ErrorContext): void {
    const type = this.categorizeError(error);
    this.logError(type, error.message, context, error);
  }

  /**
   * Creates a user-friendly error message
   */
  public static getUserMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Network connection lost. Please check your internet connection.',
      [ErrorType.SAVE]: 'Failed to save your progress. Your data is safe and will retry automatically.',
      [ErrorType.LOAD]: 'Failed to load game data. Please try refreshing the page.',
      [ErrorType.VALIDATION]: 'Invalid game state detected. Attempting to recover...',
      [ErrorType.MAZE_GENERATION]: 'Failed to generate maze. Retrying with different parameters...',
      [ErrorType.ANALYTICS]: 'Analytics service unavailable. Game will continue normally.',
      [ErrorType.ASSET]: 'Failed to load game assets. Some features may be unavailable.',
      [ErrorType.CRITICAL]: 'A critical error occurred. Your progress has been saved. Please refresh the page.'
    };

    return messages[type] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Registers an error callback
   */
  public static onError(type: ErrorType, callback: ErrorCallback): void {
    if (!this.errorCallbacks.has(type)) {
      this.errorCallbacks.set(type, []);
    }
    this.errorCallbacks.get(type)!.push(callback);
  }

  /**
   * Gets error log
   */
  public static getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Clears error log
   */
  public static clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Exports error log for debugging
   */
  public static exportLog(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }

  /**
   * Categorizes an error by type
   */
  private static categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('save') || message.includes('storage')) {
      return ErrorType.SAVE;
    }
    if (message.includes('load')) {
      return ErrorType.LOAD;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('maze')) {
      return ErrorType.MAZE_GENERATION;
    }
    
    return ErrorType.CRITICAL;
  }

  /**
   * Triggers registered callbacks
   */
  private static triggerCallbacks(type: ErrorType, entry: ErrorLogEntry): void {
    const callbacks = this.errorCallbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(entry);
        } catch (error) {
          console.error('Error in error callback:', error);
        }
      });
    }
  }

  /**
   * Sends error to analytics
   */
  private static sendToAnalytics(entry: ErrorLogEntry): void {
    // In production, send to analytics service
    // For now, just log
    if (entry.type === ErrorType.CRITICAL) {
      console.warn('Critical error logged:', entry);
    }
  }
}

/**
 * Error types
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  SAVE = 'SAVE',
  LOAD = 'LOAD',
  VALIDATION = 'VALIDATION',
  MAZE_GENERATION = 'MAZE_GENERATION',
  ANALYTICS = 'ANALYTICS',
  ASSET = 'ASSET',
  CRITICAL = 'CRITICAL'
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  type: ErrorType;
  message: string;
  context: ErrorContext;
  timestamp: number;
  stack?: string;
  userAgent: string;
}

/**
 * Error context
 */
export interface ErrorContext {
  levelId?: string;
  action?: string;
  userId?: string;
  gameState?: any;
  [key: string]: any;
}

/**
 * Error callback type
 */
export type ErrorCallback = (entry: ErrorLogEntry) => void;
