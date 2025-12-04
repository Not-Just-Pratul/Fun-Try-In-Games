import { ErrorHandler, ErrorType } from './ErrorHandler';

/**
 * RetryHandler - Handles retry logic for failed operations
 */
export class RetryHandler {
  /**
   * Retries an async operation with exponential backoff
   */
  public static async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      onRetry,
      shouldRetry = () => true
    } = options;

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempt === maxAttempts || !shouldRetry(error as Error, attempt)) {
          throw error;
        }

        // Log retry attempt
        ErrorHandler.logError(
          ErrorType.NETWORK,
          `Retry attempt ${attempt}/${maxAttempts}`,
          { attempt, delay, error: lastError.message }
        );

        // Call retry callback
        if (onRetry) {
          onRetry(attempt, delay);
        }

        // Wait before retry
        await this.sleep(delay);

        // Increase delay with exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Retries a save operation
   */
  public static async retrySave<T>(
    saveOperation: () => Promise<T>
  ): Promise<T> {
    return this.retry(saveOperation, {
      maxAttempts: 5,
      initialDelay: 500,
      maxDelay: 5000,
      onRetry: (attempt, delay) => {
        console.log(`Retrying save operation (attempt ${attempt}, delay ${delay}ms)`);
      },
      shouldRetry: (error) => {
        // Retry on network errors, not on validation errors
        return !error.message.includes('validation');
      }
    });
  }

  /**
   * Retries a load operation
   */
  public static async retryLoad<T>(
    loadOperation: () => Promise<T>
  ): Promise<T> {
    return this.retry(loadOperation, {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      onRetry: (attempt) => {
        console.log(`Retrying load operation (attempt ${attempt})`);
      }
    });
  }

  /**
   * Retries an analytics operation (fail silently)
   */
  public static async retryAnalytics<T>(
    analyticsOperation: () => Promise<T>
  ): Promise<T | null> {
    try {
      return await this.retry(analyticsOperation, {
        maxAttempts: 2,
        initialDelay: 500,
        maxDelay: 2000
      });
    } catch (error) {
      // Analytics failures should not break the game
      ErrorHandler.logError(
        ErrorType.ANALYTICS,
        'Analytics operation failed after retries',
        { error: (error as Error).message }
      );
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Retry options
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, delay: number) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}
