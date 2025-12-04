import { AnalyticsService, AnalyticsEvent } from './AnalyticsService';
import { AbilityType } from '../types/ability';
import { LevelStats } from '../types/level';

/**
 * Firebase Analytics adapter
 * Note: This requires firebase to be installed and configured
 * For web-only builds without Firebase, use the MockAnalyticsAdapter
 */
export class FirebaseAnalyticsAdapter implements AnalyticsService {
  private analytics: any;
  private eventQueue: AnalyticsEvent[] = [];
  private maxQueueSize: number;
  private flushIntervalMs: number;
  private flushTimer: number | null = null;

  constructor(
    maxQueueSize: number = 50,
    flushIntervalMs: number = 30000 // 30 seconds
  ) {
    this.maxQueueSize = maxQueueSize;
    this.flushIntervalMs = flushIntervalMs;

    try {
      // Dynamically import Firebase Analytics if available
      const firebase = require('firebase/app');
      require('firebase/analytics');
      this.analytics = firebase.analytics();
    } catch (error) {
      console.warn('Firebase Analytics not available. Events will be queued but not sent.');
      this.analytics = null;
    }

    // Start periodic flush
    this.startPeriodicFlush();
  }

  /**
   * Track a generic event
   */
  trackEvent(event: AnalyticsEvent): void {
    // Sanitize properties to remove PII
    const sanitizedEvent = this.sanitizeEvent(event);

    // Add to queue
    this.eventQueue.push(sanitizedEvent);

    // Log event immediately if Firebase is available
    if (this.analytics) {
      this.logToFirebase(sanitizedEvent);
    }

    // Flush if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush().catch(error => {
        console.error('Failed to flush analytics queue:', error);
      });
    }
  }

  /**
   * Track level completion
   */
  trackLevelComplete(levelId: string, stats: LevelStats): void {
    const event: AnalyticsEvent = {
      eventType: 'level_complete',
      timestamp: Date.now(),
      properties: {
        levelId,
        completionTime: stats.completionTime,
        hintsUsed: stats.hintsUsed,
        deaths: stats.deaths,
        abilitiesUsed: this.mapToObject(stats.abilitiesUsed),
      },
    };

    this.trackEvent(event);
  }

  /**
   * Track ability usage
   */
  trackAbilityUsage(abilityType: AbilityType, context: string): void {
    const event: AnalyticsEvent = {
      eventType: 'ability_used',
      timestamp: Date.now(),
      properties: {
        abilityType,
        context,
      },
    };

    this.trackEvent(event);
  }

  /**
   * Track hint request
   */
  trackHintRequest(levelId: string, hintType: string): void {
    const event: AnalyticsEvent = {
      eventType: 'hint_requested',
      timestamp: Date.now(),
      properties: {
        levelId,
        hintType,
      },
    };

    this.trackEvent(event);
  }

  /**
   * Flush queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    if (!this.analytics) {
      console.warn('Firebase Analytics not available. Cannot flush events.');
      return;
    }

    try {
      // Firebase Analytics logs events immediately, so we just clear the queue
      // In a real implementation with a custom backend, you'd batch send here
      console.log(`Flushing ${this.eventQueue.length} analytics events`);
      this.eventQueue = [];
    } catch (error) {
      console.error('Error flushing analytics:', error);
      throw error;
    }
  }

  /**
   * Log event to Firebase
   */
  private logToFirebase(event: AnalyticsEvent): void {
    if (!this.analytics) return;

    try {
      this.analytics.logEvent(event.eventType, {
        ...event.properties,
        timestamp: event.timestamp,
      });
    } catch (error) {
      console.error('Error logging to Firebase:', error);
    }
  }

  /**
   * Sanitize event to remove PII
   */
  private sanitizeEvent(event: AnalyticsEvent): AnalyticsEvent {
    const sanitized = { ...event };
    const properties = { ...event.properties };

    // Remove any potential PII fields
    const piiFields = ['email', 'name', 'phone', 'address', 'userId'];
    for (const field of piiFields) {
      if (field in properties) {
        delete properties[field];
      }
    }

    sanitized.properties = properties;
    return sanitized;
  }

  /**
   * Convert Map to plain object for serialization
   */
  private mapToObject<K extends string | number, V>(map: Map<K, V>): Record<string, V> {
    const obj: Record<string, V> = {};
    for (const [key, value] of map.entries()) {
      obj[String(key)] = value;
    }
    return obj;
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush().catch(error => {
        console.error('Periodic flush failed:', error);
      });
    }, this.flushIntervalMs);
  }

  /**
   * Stop periodic flush timer
   */
  stopPeriodicFlush(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Clear the event queue
   */
  clearQueue(): void {
    this.eventQueue = [];
  }
}
