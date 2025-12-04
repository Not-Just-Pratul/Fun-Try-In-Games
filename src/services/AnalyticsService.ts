import { AbilityType } from '../types/ability';
import { LevelStats } from '../types/level';

/**
 * Analytics event structure
 */
export interface AnalyticsEvent {
  eventType: string;
  timestamp: number;
  properties: Record<string, any>;
}

/**
 * AnalyticsService interface for tracking player behavior
 */
export interface AnalyticsService {
  /**
   * Track a generic event
   */
  trackEvent(event: AnalyticsEvent): void;

  /**
   * Track level completion or failure
   */
  trackLevelComplete(levelId: string, stats: LevelStats): void;

  /**
   * Track ability usage
   */
  trackAbilityUsage(abilityType: AbilityType, context: string): void;

  /**
   * Track hint request
   */
  trackHintRequest(levelId: string, hintType: string): void;

  /**
   * Flush queued events to remote service
   */
  flush(): Promise<void>;
}
