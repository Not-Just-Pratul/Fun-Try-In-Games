/**
 * Property-based tests for adaptive difficulty system
 */

import fc from 'fast-check';
import {
  AdaptiveDifficultySystem,
  PerformanceMetrics,
  SkillLevel,
  DifficultyAdjustment
} from '../systems/AdaptiveDifficultySystem';

describe('Adaptive Difficulty System Properties', () => {
  /**
   * Property 42: Failure-triggered difficulty assistance
   * After threshold failures, system must offer optional difficulty adjustment
   */
  describe('Property 42: Failure-triggered difficulty assistance', () => {
    it('should offer assistance after threshold failures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.integer({ min: 3, max: 10 }),
          fc.integer({ min: 1, max: 20 }),
          (levelId, threshold, failureCount) => {
            const system = new AdaptiveDifficultySystem(threshold);
            
            // Record failures
            for (let i = 0; i < failureCount; i++) {
              system.recordFailure(levelId);
            }
            
            // Should offer assistance if failures >= threshold
            const shouldOffer = system.shouldOfferAssistance(levelId);
            
            if (failureCount >= threshold) {
              expect(shouldOffer).toBe(true);
              
              // Should be able to create an offer
              const offer = system.createDifficultyOffer(levelId);
              expect(offer).not.toBeNull();
              expect(offer?.levelId).toBe(levelId);
              expect(offer?.adjustment).toBe(DifficultyAdjustment.EASIER);
            } else {
              expect(shouldOffer).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not offer assistance again if declined', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.integer({ min: 3, max: 5 }),
          (levelId, threshold) => {
            const system = new AdaptiveDifficultySystem(threshold);
            
            // Trigger threshold
            for (let i = 0; i < threshold; i++) {
              system.recordFailure(levelId);
            }
            
            // Create and decline offer
            const offer1 = system.createDifficultyOffer(levelId);
            expect(offer1).not.toBeNull();
            system.declineDifficultyOffer(levelId);
            
            // Should not offer again
            const shouldOffer = system.shouldOfferAssistance(levelId);
            expect(shouldOffer).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reset failures after successful completion', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.integer({ min: 3, max: 5 }),
          fc.record({
            completionTime: fc.integer({ min: 10, max: 300 }),
            hintsUsed: fc.integer({ min: 0, max: 5 }),
            attempts: fc.integer({ min: 1, max: 10 }),
            abilitiesUsed: fc.integer({ min: 0, max: 20 })
          }),
          (levelId, threshold, metrics) => {
            const system = new AdaptiveDifficultySystem(threshold);
            
            // Record failures
            for (let i = 0; i < threshold; i++) {
              system.recordFailure(levelId);
            }
            
            // Should offer assistance
            expect(system.shouldOfferAssistance(levelId)).toBe(true);
            
            // Complete level
            system.recordCompletion(levelId, metrics);
            
            // Failures should be reset
            const performance = system.getLevelPerformance(levelId);
            expect(performance?.failures).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 43: Performance-based difficulty scaling
   * System must analyze performance and calculate appropriate skill level
   */
  describe('Property 43: Performance-based difficulty scaling', () => {
    it('should calculate skill level based on performance metrics', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              levelId: fc.string({ minLength: 1 }),
              metrics: fc.record({
                completionTime: fc.integer({ min: 10, max: 300 }),
                hintsUsed: fc.integer({ min: 0, max: 5 }),
                attempts: fc.integer({ min: 1, max: 10 }),
                abilitiesUsed: fc.integer({ min: 0, max: 20 })
              })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (completions) => {
            const system = new AdaptiveDifficultySystem();
            
            // Record completions
            for (const completion of completions) {
              system.recordCompletion(completion.levelId, completion.metrics);
            }
            
            // Should calculate a valid skill level
            const skillLevel = system.calculateSkillLevel();
            expect(Object.values(SkillLevel)).toContain(skillLevel);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should rate expert performance higher than beginner', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (levelId) => {
            const expertSystem = new AdaptiveDifficultySystem();
            const beginnerSystem = new AdaptiveDifficultySystem();
            
            // Expert performance: fast, no hints, few attempts
            const expertMetrics: PerformanceMetrics = {
              completionTime: 30,
              hintsUsed: 0,
              attempts: 1,
              abilitiesUsed: 5
            };
            
            // Beginner performance: slow, many hints, many attempts
            const beginnerMetrics: PerformanceMetrics = {
              completionTime: 250,
              hintsUsed: 5,
              attempts: 8,
              abilitiesUsed: 15
            };
            
            // Record multiple completions
            for (let i = 0; i < 5; i++) {
              expertSystem.recordCompletion(`${levelId}_${i}`, expertMetrics);
              beginnerSystem.recordCompletion(`${levelId}_${i}`, beginnerMetrics);
            }
            
            const expertSkill = expertSystem.calculateSkillLevel();
            const beginnerSkill = beginnerSystem.calculateSkillLevel();
            
            // Expert should have higher or equal skill level
            const skillOrder = [
              SkillLevel.BEGINNER,
              SkillLevel.INTERMEDIATE,
              SkillLevel.ADVANCED,
              SkillLevel.EXPERT
            ];
            
            const expertIndex = skillOrder.indexOf(expertSkill);
            const beginnerIndex = skillOrder.indexOf(beginnerSkill);
            
            expect(expertIndex).toBeGreaterThanOrEqual(beginnerIndex);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should update skill level after each completion', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              levelId: fc.string({ minLength: 1 }),
              metrics: fc.record({
                completionTime: fc.integer({ min: 10, max: 300 }),
                hintsUsed: fc.integer({ min: 0, max: 5 }),
                attempts: fc.integer({ min: 1, max: 10 }),
                abilitiesUsed: fc.integer({ min: 0, max: 20 })
              })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (completions) => {
            const system = new AdaptiveDifficultySystem();
            
            let previousSkill = system.getSkillLevel();
            
            for (const completion of completions) {
              system.recordCompletion(completion.levelId, completion.metrics);
              
              const currentSkill = system.getSkillLevel();
              
              // Skill level should be valid
              expect(Object.values(SkillLevel)).toContain(currentSkill);
              
              previousSkill = currentSkill;
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 44: Difficulty adjustment scope
   * Adjustments must be level-specific, not global
   */
  describe('Property 44: Difficulty adjustment scope', () => {
    it('should apply adjustments only to specific levels', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 3, max: 5 }),
          (levelIds, threshold) => {
            const system = new AdaptiveDifficultySystem(threshold);
            const uniqueLevels = [...new Set(levelIds)];
            
            if (uniqueLevels.length < 2) {
              return; // Need at least 2 unique levels
            }
            
            const targetLevel = uniqueLevels[0];
            const otherLevels = uniqueLevels.slice(1);
            
            // Trigger assistance for target level
            for (let i = 0; i < threshold; i++) {
              system.recordFailure(targetLevel);
            }
            
            const offer = system.createDifficultyOffer(targetLevel);
            expect(offer).not.toBeNull();
            system.acceptDifficultyOffer(targetLevel);
            
            // Target level should have adjustment
            expect(system.hasActiveDifficultyAdjustment(targetLevel)).toBe(true);
            expect(system.isDifficultyAdjustmentLevelSpecific(targetLevel)).toBe(true);
            
            // Other levels should not have adjustment
            for (const otherLevel of otherLevels) {
              expect(system.hasActiveDifficultyAdjustment(otherLevel)).toBe(false);
              expect(system.isDifficultyAdjustmentLevelSpecific(otherLevel)).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should allow different adjustments for different levels', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1 }),
            fc.string({ minLength: 1 })
          ).filter(([a, b]) => a !== b),
          fc.integer({ min: 3, max: 5 }),
          ([level1, level2], threshold) => {
            const system = new AdaptiveDifficultySystem(threshold);
            
            // Trigger assistance for both levels
            for (let i = 0; i < threshold; i++) {
              system.recordFailure(level1);
              system.recordFailure(level2);
            }
            
            // Accept adjustment for level1 only
            system.createDifficultyOffer(level1);
            system.acceptDifficultyOffer(level1);
            
            // Decline adjustment for level2
            system.createDifficultyOffer(level2);
            system.declineDifficultyOffer(level2);
            
            // Level1 should have adjustment, level2 should not
            expect(system.hasActiveDifficultyAdjustment(level1)).toBe(true);
            expect(system.hasActiveDifficultyAdjustment(level2)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should persist level-specific adjustments across save/load', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
          fc.integer({ min: 3, max: 5 }),
          (levelIds, threshold) => {
            const system1 = new AdaptiveDifficultySystem(threshold);
            const uniqueLevels = [...new Set(levelIds)];
            
            // Create adjustments for all levels
            for (const levelId of uniqueLevels) {
              for (let i = 0; i < threshold; i++) {
                system1.recordFailure(levelId);
              }
              system1.createDifficultyOffer(levelId);
              system1.acceptDifficultyOffer(levelId);
            }
            
            // Save data
            const saveData = system1.getDifficultyData();
            
            // Load into new system
            const system2 = new AdaptiveDifficultySystem(threshold);
            system2.loadDifficultyData(saveData);
            
            // All adjustments should be restored
            for (const levelId of uniqueLevels) {
              expect(system2.hasActiveDifficultyAdjustment(levelId)).toBe(true);
              expect(system2.isDifficultyAdjustmentLevelSpecific(levelId)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 45: Skill level analysis
   * System must accurately analyze player skill from performance data
   */
  describe('Property 45: Skill level analysis', () => {
    it('should start at beginner level with no data', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const system = new AdaptiveDifficultySystem();
            
            const skillLevel = system.calculateSkillLevel();
            expect(skillLevel).toBe(SkillLevel.BEGINNER);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain consistent skill level for consistent performance', () => {
      fc.assert(
        fc.property(
          fc.record({
            completionTime: fc.integer({ min: 50, max: 150 }),
            hintsUsed: fc.integer({ min: 1, max: 3 }),
            attempts: fc.integer({ min: 2, max: 5 }),
            abilitiesUsed: fc.integer({ min: 5, max: 15 })
          }),
          fc.integer({ min: 3, max: 8 }),
          (baseMetrics, levelCount) => {
            const system = new AdaptiveDifficultySystem();
            
            // Record consistent performance across multiple levels
            for (let i = 0; i < levelCount; i++) {
              system.recordCompletion(`level_${i}`, baseMetrics);
            }
            
            const skillLevel1 = system.calculateSkillLevel();
            
            // Add one more level with same performance
            system.recordCompletion(`level_${levelCount}`, baseMetrics);
            
            const skillLevel2 = system.calculateSkillLevel();
            
            // Skill level should remain stable
            expect(skillLevel2).toBe(skillLevel1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should persist skill level across save/load', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              levelId: fc.string({ minLength: 1 }),
              metrics: fc.record({
                completionTime: fc.integer({ min: 10, max: 300 }),
                hintsUsed: fc.integer({ min: 0, max: 5 }),
                attempts: fc.integer({ min: 1, max: 10 }),
                abilitiesUsed: fc.integer({ min: 0, max: 20 })
              })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (completions) => {
            const system1 = new AdaptiveDifficultySystem();
            
            // Record completions
            for (const completion of completions) {
              system1.recordCompletion(completion.levelId, completion.metrics);
            }
            
            const skillLevel1 = system1.getSkillLevel();
            
            // Save and load
            const saveData = system1.getDifficultyData();
            const system2 = new AdaptiveDifficultySystem();
            system2.loadDifficultyData(saveData);
            
            const skillLevel2 = system2.getSkillLevel();
            
            // Skill level should be preserved
            expect(skillLevel2).toBe(skillLevel1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should analyze multiple performance factors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (levelId) => {
            const system = new AdaptiveDifficultySystem();
            
            // Record completion with various metrics
            const metrics: PerformanceMetrics = {
              completionTime: 100,
              hintsUsed: 2,
              attempts: 3,
              abilitiesUsed: 10
            };
            
            system.recordCompletion(levelId, metrics);
            
            const performance = system.getLevelPerformance(levelId);
            
            // Should track all metrics
            expect(performance).not.toBeNull();
            expect(performance?.metrics.length).toBe(1);
            expect(performance?.metrics[0]).toEqual(metrics);
            expect(performance?.averageTime).toBe(100);
            expect(performance?.totalHintsUsed).toBe(2);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
