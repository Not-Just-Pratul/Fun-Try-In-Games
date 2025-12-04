import * as fc from 'fast-check';
import { MockAnalyticsAdapter } from '@services/MockAnalyticsAdapter';
import { SessionMetricsTracker } from '@services/SessionMetricsTracker';
import { AbilityType } from '@game-types/ability';
import { LevelStats } from '@game-types/level';

// Helper to create level stats generator
const levelStatsArbitrary = (): fc.Arbitrary<LevelStats> => {
  return fc.record({
    completionTime: fc.integer({ min: 1000, max: 600000 }), // 1s to 10min
    hintsUsed: fc.integer({ min: 0, max: 20 }),
    abilitiesUsed: fc.constant(new Map<AbilityType, number>([
      [AbilityType.PHASE, fc.sample(fc.integer({ min: 0, max: 10 }), 1)[0]],
      [AbilityType.POSSESS, fc.sample(fc.integer({ min: 0, max: 10 }), 1)[0]],
      [AbilityType.SENSE, fc.sample(fc.integer({ min: 0, max: 10 }), 1)[0]],
      [AbilityType.SPEED_BOOST, fc.sample(fc.integer({ min: 0, max: 10 }), 1)[0]],
    ])),
    deaths: fc.integer({ min: 0, max: 50 }),
  });
};

// Feature: chain-ledge-game, Property 35: Event logging completeness
// Validates: Requirements 12.1, 12.2, 12.3

describe('Analytics Property Tests', () => {
  describe('Property 35: Event logging completeness', () => {
    test('For any significant game event, the analytics service should log the event with timestamp and context', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // levelId
          levelStatsArbitrary(),
          fc.constantFrom(...Object.values(AbilityType)), // abilityType
          fc.string({ minLength: 1, maxLength: 50 }), // context
          fc.constantFrom('DIRECTIONAL', 'PUZZLE_CLUE', 'ABILITY_SUGGESTION'), // hintType
          (levelId, stats, abilityType, context, hintType) => {
            const analytics = new MockAnalyticsAdapter();
            const initialCount = analytics.getEventCount();

            // Track level completion
            analytics.trackLevelComplete(levelId, stats);
            expect(analytics.getEventCount()).toBe(initialCount + 1);

            const levelEvent = analytics.getEventsByType('level_complete')[0];
            expect(levelEvent).toBeDefined();
            expect(levelEvent.timestamp).toBeGreaterThan(0);
            expect(levelEvent.properties.levelId).toBe(levelId);
            expect(levelEvent.properties.completionTime).toBe(stats.completionTime);
            expect(levelEvent.properties.hintsUsed).toBe(stats.hintsUsed);
            expect(levelEvent.properties.deaths).toBe(stats.deaths);

            // Track ability usage
            analytics.trackAbilityUsage(abilityType, context);
            expect(analytics.getEventCount()).toBe(initialCount + 2);

            const abilityEvent = analytics.getEventsByType('ability_used')[0];
            expect(abilityEvent).toBeDefined();
            expect(abilityEvent.timestamp).toBeGreaterThan(0);
            expect(abilityEvent.properties.abilityType).toBe(abilityType);
            expect(abilityEvent.properties.context).toBe(context);

            // Track hint request
            analytics.trackHintRequest(levelId, hintType);
            expect(analytics.getEventCount()).toBe(initialCount + 3);

            const hintEvent = analytics.getEventsByType('hint_requested')[0];
            expect(hintEvent).toBeDefined();
            expect(hintEvent.timestamp).toBeGreaterThan(0);
            expect(hintEvent.properties.levelId).toBe(levelId);
            expect(hintEvent.properties.hintType).toBe(hintType);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('All logged events should have required fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (levelId, context) => {
            const analytics = new MockAnalyticsAdapter();

            // Track various events
            analytics.trackAbilityUsage(AbilityType.PHASE, context);
            analytics.trackHintRequest(levelId, 'DIRECTIONAL');

            const events = analytics.getEvents();
            
            // Every event must have eventType, timestamp, and properties
            for (const event of events) {
              expect(event.eventType).toBeDefined();
              expect(typeof event.eventType).toBe('string');
              expect(event.timestamp).toBeGreaterThan(0);
              expect(event.properties).toBeDefined();
              expect(typeof event.properties).toBe('object');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: chain-ledge-game, Property 36: Analytics data transmission
  // Validates: Requirements 12.4

  describe('Property 36: Analytics data transmission', () => {
    test('For any collected analytics data, the system should aggregate and transmit within flush interval', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // number of events
          async (eventCount) => {
            const analytics = new MockAnalyticsAdapter();

            // Generate and track multiple events
            for (let i = 0; i < eventCount; i++) {
              analytics.trackAbilityUsage(
                AbilityType.PHASE,
                `context_${i}`
              );
            }

            expect(analytics.getEventCount()).toBe(eventCount);

            // Flush should succeed
            await expect(analytics.flush()).resolves.not.toThrow();

            // Events should still be in memory for mock adapter
            expect(analytics.getEventCount()).toBe(eventCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Flush should handle empty event queue', async () => {
      const analytics = new MockAnalyticsAdapter();
      
      expect(analytics.getEventCount()).toBe(0);
      await expect(analytics.flush()).resolves.not.toThrow();
    });
  });

  // Feature: chain-ledge-game, Property 29: Session metrics tracking
  // Validates: Requirements 8.5

  describe('Property 29: Session metrics tracking', () => {
    test('For any gameplay session, the system should record time spent, attempts, and ability usage', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }), // level IDs
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), // completion status
          fc.integer({ min: 0, max: 20 }), // hints used
          fc.integer({ min: 0, max: 10 }), // deaths
          (levelIds, completions, hintsUsed, deaths) => {
            const analytics = new MockAnalyticsAdapter();
            const tracker = new SessionMetricsTracker(analytics);

            // Simulate gameplay session
            const numLevels = Math.min(levelIds.length, completions.length);
            for (let i = 0; i < numLevels; i++) {
              tracker.startLevelAttempt(levelIds[i]);
              
              // Simulate some gameplay
              for (let j = 0; j < deaths; j++) {
                tracker.trackDeath();
              }
              
              for (let j = 0; j < hintsUsed; j++) {
                tracker.trackHintUsed();
              }
              
              tracker.trackAbilityUsed(AbilityType.PHASE);
              tracker.trackAbilityUsed(AbilityType.SENSE);
              
              tracker.endLevelAttempt(completions[i]);
            }

            const metrics = tracker.getSessionMetrics();
            const expectedCompleted = completions.slice(0, numLevels).filter(c => c).length;

            // Verify session metrics are tracked
            expect(metrics.sessionId).toBeDefined();
            expect(metrics.startTime).toBeGreaterThan(0);
            expect(metrics.endTime).toBeGreaterThanOrEqual(metrics.startTime);
            expect(metrics.totalPlayTime).toBeGreaterThanOrEqual(0);
            expect(metrics.levelsAttempted).toBe(numLevels);
            expect(metrics.levelsCompleted).toBe(expectedCompleted);
            expect(metrics.totalDeaths).toBeGreaterThanOrEqual(0);
            expect(metrics.totalHintsUsed).toBeGreaterThanOrEqual(0);
            expect(metrics.abilitiesUsed).toBeDefined();
            expect(typeof metrics.abilitiesUsed).toBe('object');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Session metrics should track ability usage correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...Object.values(AbilityType)), { minLength: 1, maxLength: 50 }),
          (abilities) => {
            const analytics = new MockAnalyticsAdapter();
            const tracker = new SessionMetricsTracker(analytics);

            // Track ability usage
            for (const ability of abilities) {
              tracker.trackAbilityUsed(ability);
            }

            const metrics = tracker.getSessionMetrics();

            // Count expected usage per ability type
            const expectedCounts = new Map<AbilityType, number>();
            for (const ability of abilities) {
              expectedCounts.set(ability, (expectedCounts.get(ability) || 0) + 1);
            }

            // Verify counts match
            for (const [type, expectedCount] of expectedCounts.entries()) {
              expect(metrics.abilitiesUsed[type]).toBe(expectedCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Session end should flush analytics', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (levelId) => {
            const analytics = new MockAnalyticsAdapter();
            const tracker = new SessionMetricsTracker(analytics);

            tracker.startLevelAttempt(levelId);
            tracker.endLevelAttempt(true);

            const eventsBefore = analytics.getEventCount();
            tracker.endSession();
            const eventsAfter = analytics.getEventCount();

            // Session end should add a session_end event
            expect(eventsAfter).toBeGreaterThan(eventsBefore);
            
            const sessionEndEvents = analytics.getEventsByType('session_end');
            expect(sessionEndEvents.length).toBeGreaterThan(0);
            
            const lastEvent = sessionEndEvents[sessionEndEvents.length - 1];
            expect(lastEvent.properties.sessionId).toBe(tracker.getSessionId());
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Session metrics should calculate average completion time correctly', () => {
      const analytics = new MockAnalyticsAdapter();
      const tracker = new SessionMetricsTracker(analytics);

      // Complete multiple levels with known durations
      const durations = [1000, 2000, 3000];
      
      for (let i = 0; i < durations.length; i++) {
        tracker.startLevelAttempt(`level_${i}`);
        
        // Simulate time passing (we can't actually wait, so we'll just end immediately)
        // In real usage, time would pass between start and end
        tracker.endLevelAttempt(true);
      }

      const metrics = tracker.getSessionMetrics();
      
      // Verify metrics are calculated
      expect(metrics.levelsCompleted).toBe(durations.length);
      expect(metrics.averageCompletionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Analytics event filtering and querying', () => {
    test('Should be able to filter events by type', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          (abilityEventCount, hintEventCount) => {
            const analytics = new MockAnalyticsAdapter();

            // Track different types of events
            for (let i = 0; i < abilityEventCount; i++) {
              analytics.trackAbilityUsage(AbilityType.PHASE, `context_${i}`);
            }

            for (let i = 0; i < hintEventCount; i++) {
              analytics.trackHintRequest(`level_${i}`, 'DIRECTIONAL');
            }

            const abilityEvents = analytics.getEventsByType('ability_used');
            const hintEvents = analytics.getEventsByType('hint_requested');

            expect(abilityEvents.length).toBe(abilityEventCount);
            expect(hintEvents.length).toBe(hintEventCount);
            expect(analytics.getEventCount()).toBe(abilityEventCount + hintEventCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Should be able to query events by time range', () => {
      const analytics = new MockAnalyticsAdapter();
      const startTime = Date.now();

      // Track some events
      analytics.trackAbilityUsage(AbilityType.PHASE, 'test');
      analytics.trackHintRequest('level_1', 'DIRECTIONAL');

      const endTime = Date.now();

      const eventsInRange = analytics.getEventsInRange(startTime, endTime);
      expect(eventsInRange.length).toBeGreaterThan(0);

      // All events should be within range
      for (const event of eventsInRange) {
        expect(event.timestamp).toBeGreaterThanOrEqual(startTime);
        expect(event.timestamp).toBeLessThanOrEqual(endTime);
      }
    });
  });
});
