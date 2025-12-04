import { AnalyticsService, AnalyticsEvent } from './AnalyticsService';
import { AbilityType } from '../types/ability';
import { LevelStats } from '../types/level';

/**
 * Mock Analytics adapter for testing and development
 * Stores events in memory without sending to external service
 */
export class MockAnalyticsAdapter implements AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private maxStoredEvents: number;

  constructor(maxStoredEvents: number = 1000) {
    this.maxStoredEvents = maxStoredEvents;
  }

  /**
   * Track a generic event
   */
  trackEvent(event: AnalyticsEvent): void {
    this.events.push(event);

    // Trim old events if we exceed max
    if (this.events.length > this.maxStoredEvents) {
      this.events = this.events.slice(-this.maxStoredEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event.eventType, event.properties);
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
   * Flush queued events (no-op for mock)
   */
  async flush(): Promise<void> {
    console.log(`[Analytics] Mock flush: ${this.events.length} events in memory`);
  }

  /**
   * Get all stored events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): AnalyticsEvent[] {
    return this.events.filter(e => e.eventType === eventType);
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Get events in time range
   */
  getEventsInRange(startTime: number, endTime: number): AnalyticsEvent[] {
    return this.events.filter(
      e => e.timestamp >= startTime && e.timestamp <= endTime
    );
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
}
