/**
 * Adaptive Difficulty System
 * Tracks player performance and offers optional difficulty adjustments
 */

export interface PerformanceMetrics {
  completionTime: number;
  hintsUsed: number;
  attempts: number;
  abilitiesUsed: number;
}

export interface LevelPerformance {
  levelId: string;
  failures: number;
  completions: number;
  averageTime: number;
  totalHintsUsed: number;
  lastAttemptTimestamp: number;
  metrics: PerformanceMetrics[];
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum DifficultyAdjustment {
  EASIER = 'easier',
  HARDER = 'harder',
  NONE = 'none'
}

export interface DifficultyOffer {
  levelId: string;
  adjustment: DifficultyAdjustment;
  reason: string;
  accepted: boolean;
}

export class AdaptiveDifficultySystem {
  private levelPerformance: Map<string, LevelPerformance> = new Map();
  private failureThreshold: number = 3;
  private difficultyOffers: Map<string, DifficultyOffer> = new Map();
  private globalSkillLevel: SkillLevel = SkillLevel.BEGINNER;

  constructor(failureThreshold: number = 3) {
    this.failureThreshold = failureThreshold;
  }

  /**
   * Record a level failure
   */
  recordFailure(levelId: string): void {
    const performance = this.getOrCreatePerformance(levelId);
    performance.failures++;
    performance.lastAttemptTimestamp = Date.now();
  }

  /**
   * Record a level completion with metrics
   */
  recordCompletion(levelId: string, metrics: PerformanceMetrics): void {
    const performance = this.getOrCreatePerformance(levelId);
    performance.completions++;
    performance.metrics.push(metrics);
    performance.lastAttemptTimestamp = Date.now();

    // Update average time
    const totalTime = performance.metrics.reduce((sum, m) => sum + m.completionTime, 0);
    performance.averageTime = totalTime / performance.metrics.length;

    // Update total hints
    performance.totalHintsUsed += metrics.hintsUsed;

    // Reset failures after successful completion
    performance.failures = 0;

    // Update global skill level
    this.updateSkillLevel();
  }

  /**
   * Check if difficulty assistance should be offered
   */
  shouldOfferAssistance(levelId: string): boolean {
    const performance = this.levelPerformance.get(levelId);
    
    if (!performance) {
      return false;
    }

    // Offer assistance after threshold failures
    if (performance.failures >= this.failureThreshold) {
      // Don't offer again if already offered and not accepted
      const existingOffer = this.difficultyOffers.get(levelId);
      if (existingOffer && !existingOffer.accepted) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Create a difficulty offer for a level
   */
  createDifficultyOffer(levelId: string): DifficultyOffer | null {
    if (!this.shouldOfferAssistance(levelId)) {
      return null;
    }

    const performance = this.levelPerformance.get(levelId)!;
    
    const offer: DifficultyOffer = {
      levelId,
      adjustment: DifficultyAdjustment.EASIER,
      reason: `You've attempted this level ${performance.failures} times. Would you like to make it easier?`,
      accepted: false
    };

    this.difficultyOffers.set(levelId, offer);
    return offer;
  }

  /**
   * Accept a difficulty offer
   */
  acceptDifficultyOffer(levelId: string): boolean {
    const offer = this.difficultyOffers.get(levelId);
    
    if (!offer) {
      return false;
    }

    offer.accepted = true;
    return true;
  }

  /**
   * Decline a difficulty offer
   */
  declineDifficultyOffer(levelId: string): void {
    const offer = this.difficultyOffers.get(levelId);
    
    if (offer) {
      offer.accepted = false;
    }
  }

  /**
   * Check if a level has an active difficulty adjustment
   */
  hasActiveDifficultyAdjustment(levelId: string): boolean {
    const offer = this.difficultyOffers.get(levelId);
    return offer !== undefined && offer.accepted;
  }

  /**
   * Get difficulty adjustment for a level
   */
  getDifficultyAdjustment(levelId: string): DifficultyAdjustment {
    const offer = this.difficultyOffers.get(levelId);
    
    if (offer && offer.accepted) {
      return offer.adjustment;
    }

    return DifficultyAdjustment.NONE;
  }

  /**
   * Calculate skill level based on overall performance
   */
  calculateSkillLevel(): SkillLevel {
    if (this.levelPerformance.size === 0) {
      return SkillLevel.BEGINNER;
    }

    let totalScore = 0;
    let levelCount = 0;

    for (const [_, performance] of this.levelPerformance) {
      if (performance.completions === 0) {
        continue;
      }

      levelCount++;

      // Calculate score based on multiple factors
      const avgMetrics = this.calculateAverageMetrics(performance.metrics);
      
      // Lower time is better (normalized to 0-1 scale, assuming 300s is max)
      const timeScore = Math.max(0, 1 - (avgMetrics.completionTime / 300));
      
      // Fewer hints is better
      const hintScore = Math.max(0, 1 - (avgMetrics.hintsUsed / 5));
      
      // Fewer attempts is better
      const attemptScore = Math.max(0, 1 - (avgMetrics.attempts / 10));
      
      // Combined score
      const levelScore = (timeScore * 0.4) + (hintScore * 0.3) + (attemptScore * 0.3);
      totalScore += levelScore;
    }

    if (levelCount === 0) {
      return SkillLevel.BEGINNER;
    }

    const averageScore = totalScore / levelCount;

    // Determine skill level based on average score
    if (averageScore >= 0.8) {
      return SkillLevel.EXPERT;
    } else if (averageScore >= 0.6) {
      return SkillLevel.ADVANCED;
    } else if (averageScore >= 0.4) {
      return SkillLevel.INTERMEDIATE;
    } else {
      return SkillLevel.BEGINNER;
    }
  }

  /**
   * Update global skill level
   */
  private updateSkillLevel(): void {
    this.globalSkillLevel = this.calculateSkillLevel();
  }

  /**
   * Get current skill level
   */
  getSkillLevel(): SkillLevel {
    return this.globalSkillLevel;
  }

  /**
   * Calculate average metrics from a list
   */
  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    if (metrics.length === 0) {
      return {
        completionTime: 0,
        hintsUsed: 0,
        attempts: 0,
        abilitiesUsed: 0
      };
    }

    const sum = metrics.reduce(
      (acc, m) => ({
        completionTime: acc.completionTime + m.completionTime,
        hintsUsed: acc.hintsUsed + m.hintsUsed,
        attempts: acc.attempts + m.attempts,
        abilitiesUsed: acc.abilitiesUsed + m.abilitiesUsed
      }),
      { completionTime: 0, hintsUsed: 0, attempts: 0, abilitiesUsed: 0 }
    );

    return {
      completionTime: sum.completionTime / metrics.length,
      hintsUsed: sum.hintsUsed / metrics.length,
      attempts: sum.attempts / metrics.length,
      abilitiesUsed: sum.abilitiesUsed / metrics.length
    };
  }

  /**
   * Get or create performance record for a level
   */
  private getOrCreatePerformance(levelId: string): LevelPerformance {
    let performance = this.levelPerformance.get(levelId);
    
    if (!performance) {
      performance = {
        levelId,
        failures: 0,
        completions: 0,
        averageTime: 0,
        totalHintsUsed: 0,
        lastAttemptTimestamp: Date.now(),
        metrics: []
      };
      this.levelPerformance.set(levelId, performance);
    }

    return performance;
  }

  /**
   * Get performance data for a specific level
   */
  getLevelPerformance(levelId: string): LevelPerformance | null {
    return this.levelPerformance.get(levelId) || null;
  }

  /**
   * Get all performance data
   */
  getAllPerformance(): Map<string, LevelPerformance> {
    return new Map(this.levelPerformance);
  }

  /**
   * Check if difficulty adjustments are level-specific
   */
  isDifficultyAdjustmentLevelSpecific(levelId: string): boolean {
    // Adjustments only apply to the specific level they were offered for
    const offer = this.difficultyOffers.get(levelId);
    return offer !== undefined && offer.accepted;
  }

  /**
   * Reset difficulty adjustment for a level
   */
  resetDifficultyAdjustment(levelId: string): void {
    this.difficultyOffers.delete(levelId);
  }

  /**
   * Load difficulty data from save
   */
  loadDifficultyData(data: {
    performance: Array<[string, LevelPerformance]>;
    offers: Array<[string, DifficultyOffer]>;
    skillLevel: SkillLevel;
  }): void {
    this.levelPerformance = new Map(data.performance);
    this.difficultyOffers = new Map(data.offers);
    this.globalSkillLevel = data.skillLevel;
  }

  /**
   * Get difficulty data for save
   */
  getDifficultyData(): {
    performance: Array<[string, LevelPerformance]>;
    offers: Array<[string, DifficultyOffer]>;
    skillLevel: SkillLevel;
  } {
    return {
      performance: Array.from(this.levelPerformance.entries()),
      offers: Array.from(this.difficultyOffers.entries()),
      skillLevel: this.globalSkillLevel
    };
  }
}
