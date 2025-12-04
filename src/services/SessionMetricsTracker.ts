import { AnalyticsService, AnalyticsEvent } from './AnalyticsService';
import { AbilityType } from '../types/ability';

/**
 * Session metrics data
 */
export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime: number;
  totalPlayTime: number;
  levelsAttempted: number;
  levelsCompleted: number;
  totalDeaths: number;
  totalHintsUsed: number;
  abilitiesUsed: Record<AbilityType, number>;
  averageCompletionTime: number;
}

/**
 * Level attempt data
 */
interface LevelAttempt {
  levelId: string;
  startTime: number;
  endTime?: number;
  completed: boolean;
  deaths: number;
  hintsUsed: number;
}

/**
 * SessionMetricsTracker tracks gameplay metrics for analytics
 */
export class SessionMetricsTracker {
  private analyticsService: AnalyticsService;
  private sessionId: string;
  private sessionStartTime: number;
  private currentLevelAttempt: LevelAttempt | null = null;
  private levelAttempts: LevelAttempt[] = [];
  private abilityUsageCount: Map<AbilityType, number> = new Map();
  private totalHintsUsed: number = 0;

  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    // Track session start
    this.trackSessionStart();
  }

  /**
   * Start tracking a level attempt
   */
  startLevelAttempt(levelId: string): void {
    // End previous attempt if exists
    if (this.currentLevelAttempt && !this.currentLevelAttempt.endTime) {
      this.endLevelAttempt(false);
    }

    this.currentLevelAttempt = {
      levelId,
      startTime: Date.now(),
      completed: false,
      deaths: 0,
      hintsUsed: 0,
    };
  }

  /**
   * End the current level attempt
   */
  endLevelAttempt(completed: boolean): void {
    if (!this.currentLevelAttempt) {
      return;
    }

    this.currentLevelAttempt.endTime = Date.now();
    this.currentLevelAttempt.completed = completed;
    this.levelAttempts.push(this.currentLevelAttempt);

    // Track level attempt event
    const duration = this.currentLevelAttempt.endTime - this.currentLevelAttempt.startTime;
    this.analyticsService.trackEvent({
      eventType: completed ? 'level_completed' : 'level_failed',
      timestamp: Date.now(),
      properties: {
        sessionId: this.sessionId,
        levelId: this.currentLevelAttempt.levelId,
        duration,
        deaths: this.currentLevelAttempt.deaths,
        hintsUsed: this.currentLevelAttempt.hintsUsed,
      },
    });

    this.currentLevelAttempt = null;
  }

  /**
   * Track a death in the current level
   */
  trackDeath(): void {
    if (this.currentLevelAttempt) {
      this.currentLevelAttempt.deaths++;
    }
  }

  /**
   * Track hint usage
   */
  trackHintUsed(): void {
    this.totalHintsUsed++;
    if (this.currentLevelAttempt) {
      this.currentLevelAttempt.hintsUsed++;
    }
  }

  /**
   * Track ability usage
   */
  trackAbilityUsed(abilityType: AbilityType): void {
    const current = this.abilityUsageCount.get(abilityType) || 0;
    this.abilityUsageCount.set(abilityType, current + 1);
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics(): SessionMetrics {
    const now = Date.now();
    const totalPlayTime = now - this.sessionStartTime;
    const completedAttempts = this.levelAttempts.filter(a => a.completed);
    const totalDeaths = this.levelAttempts.reduce((sum, a) => sum + a.deaths, 0);

    // Calculate average completion time
    const completionTimes = completedAttempts
      .filter(a => a.endTime)
      .map(a => a.endTime! - a.startTime);
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Convert ability usage map to object
    const abilitiesUsed: Record<AbilityType, number> = {} as Record<AbilityType, number>;
    for (const [type, count] of this.abilityUsageCount.entries()) {
      abilitiesUsed[type] = count;
    }

    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime: now,
      totalPlayTime,
      levelsAttempted: this.levelAttempts.length,
      levelsCompleted: completedAttempts.length,
      totalDeaths,
      totalHintsUsed: this.totalHintsUsed,
      abilitiesUsed,
      averageCompletionTime,
    };
  }

  /**
   * End the session and send final metrics
   */
  endSession(): void {
    // End current level attempt if exists
    if (this.currentLevelAttempt && !this.currentLevelAttempt.endTime) {
      this.endLevelAttempt(false);
    }

    const metrics = this.getSessionMetrics();

    // Track session end event
    this.analyticsService.trackEvent({
      eventType: 'session_end',
      timestamp: Date.now(),
      properties: {
        sessionId: this.sessionId,
        duration: metrics.totalPlayTime,
        levelsAttempted: metrics.levelsAttempted,
        levelsCompleted: metrics.levelsCompleted,
        totalDeaths: metrics.totalDeaths,
        totalHintsUsed: metrics.totalHintsUsed,
        abilitiesUsed: metrics.abilitiesUsed,
        averageCompletionTime: metrics.averageCompletionTime,
      },
    });

    // Flush analytics
    this.analyticsService.flush().catch(error => {
      console.error('Failed to flush analytics on session end:', error);
    });
  }

  /**
   * Track session start
   */
  private trackSessionStart(): void {
    this.analyticsService.trackEvent({
      eventType: 'session_start',
      timestamp: this.sessionStartTime,
      properties: {
        sessionId: this.sessionId,
      },
    });
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get total play time in milliseconds
   */
  getTotalPlayTime(): number {
    return Date.now() - this.sessionStartTime;
  }

  /**
   * Get number of levels attempted
   */
  getLevelsAttempted(): number {
    return this.levelAttempts.length;
  }

  /**
   * Get number of levels completed
   */
  getLevelsCompleted(): number {
    return this.levelAttempts.filter(a => a.completed).length;
  }
}
