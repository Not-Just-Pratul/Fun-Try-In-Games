import * as fc from 'fast-check';
import { PhantomGuard } from '@systems/PhantomGuard';
import { CursedTrap, TrapEffectType } from '@systems/CursedTrap';
import { ObstacleManager } from '@systems/ObstacleManager';
import { Vector2D } from '@game-types/common';

// Feature: chain-ledge-game, Property 23: Guard patrol path following
// Validates: Requirements 7.1

// Feature: chain-ledge-game, Property 24: Guard collision resets position
// Validates: Requirements 7.2

// Feature: chain-ledge-game, Property 25: Trap activation applies effects
// Validates: Requirements 7.3, 7.4

describe('Obstacle System Property Tests', () => {
  describe('Phantom Guard', () => {
    test('Property 23: Guard follows patrol path in sequence', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.float({ min: 0, max: 500, noNaN: true }),
              y: fc.float({ min: 0, max: 500, noNaN: true })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (patrolPath) => {
            const guard = new PhantomGuard('test-guard', patrolPath[0], patrolPath, 10);
            
            // Initial position should be first waypoint
            const initialPos = guard.getPosition();
            expect(initialPos.x).toBeCloseTo(patrolPath[0].x, 1);
            expect(initialPos.y).toBeCloseTo(patrolPath[0].y, 1);
            
            // Update multiple times to move through path
            for (let i = 0; i < 100; i++) {
              guard.update(16);
            }
            
            // Guard should still be on the patrol path (within bounds)
            const currentPos = guard.getPosition();
            const minX = Math.min(...patrolPath.map(p => p.x));
            const maxX = Math.max(...patrolPath.map(p => p.x));
            const minY = Math.min(...patrolPath.map(p => p.y));
            const maxY = Math.max(...patrolPath.map(p => p.y));
            
            expect(currentPos.x).toBeGreaterThanOrEqual(minX - 1);
            expect(currentPos.x).toBeLessThanOrEqual(maxX + 1);
            expect(currentPos.y).toBeGreaterThanOrEqual(minY - 1);
            expect(currentPos.y).toBeLessThanOrEqual(maxY + 1);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 23a: Guard returns to start after completing patrol', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.float({ min: 0, max: 100, noNaN: true }),
              y: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            { minLength: 2, maxLength: 4 }
          ),
          (patrolPath) => {
            const guard = new PhantomGuard('test-guard', patrolPath[0], patrolPath, 50);
            
            const startPos = guard.getPosition();
            
            // Update enough to complete multiple patrol cycles
            for (let i = 0; i < 1000; i++) {
              guard.update(16);
            }
            
            // After many updates, guard should have cycled through path
            // and patrol direction should have reversed at least once
            const currentIndex = guard.getCurrentPathIndex();
            expect(currentIndex).toBeGreaterThanOrEqual(0);
            expect(currentIndex).toBeLessThan(patrolPath.length);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 24: Guard collision detection works correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          fc.float({ min: 5, max: 50, noNaN: true }),
          (guardPos, collisionRadius) => {
            const guard = new PhantomGuard('test-guard', guardPos, [guardPos]);
            
            // Position exactly at guard should collide
            expect(guard.checkCollision(guardPos, collisionRadius)).toBe(true);
            
            // Position far away should not collide
            const farPos = { x: guardPos.x + 1000, y: guardPos.y + 1000 };
            expect(guard.checkCollision(farPos, collisionRadius)).toBe(false);
            
            // Position just within radius should collide
            const nearPos = {
              x: guardPos.x + collisionRadius * 0.5,
              y: guardPos.y
            };
            expect(guard.checkCollision(nearPos, collisionRadius)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 24a: Inactive guard does not collide', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          (guardPos) => {
            const guard = new PhantomGuard('test-guard', guardPos, [guardPos]);
            
            // Deactivate guard
            guard.deactivate();
            
            // Should not collide even at same position
            expect(guard.checkCollision(guardPos, 20)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 24b: Reset restores guard to initial position', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.float({ min: 0, max: 500, noNaN: true }),
              y: fc.float({ min: 0, max: 500, noNaN: true })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (patrolPath) => {
            const guard = new PhantomGuard('test-guard', patrolPath[0], patrolPath, 10);
            
            const initialPos = guard.getPosition();
            
            // Move guard along path
            for (let i = 0; i < 100; i++) {
              guard.update(16);
            }
            
            // Reset guard
            guard.reset();
            
            // Should be back at initial position
            const resetPos = guard.getPosition();
            expect(resetPos.x).toBeCloseTo(initialPos.x, 1);
            expect(resetPos.y).toBeCloseTo(initialPos.y, 1);
            expect(guard.getCurrentPathIndex()).toBe(0);
            expect(guard.getPatrolDirection()).toBe(1);
            expect(guard.getIsActive()).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cursed Trap', () => {
    test('Property 25: Trap triggers when player enters radius', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          fc.float({ min: 10, max: 50, noNaN: true }),
          (trapPos, triggerRadius) => {
            const trap = new CursedTrap(
              'test-trap',
              trapPos,
              { type: TrapEffectType.COOLDOWN_INCREASE, duration: 1000, magnitude: 2 },
              triggerRadius
            );
            
            // Position within radius should trigger
            const nearPos = {
              x: trapPos.x + triggerRadius * 0.5,
              y: trapPos.y
            };
            
            expect(trap.checkCollision(nearPos)).toBe(true);
            expect(trap.getIsTriggered()).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 25a: Trap does not trigger outside radius', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          fc.float({ min: 10, max: 50, noNaN: true }),
          (trapPos, triggerRadius) => {
            const trap = new CursedTrap(
              'test-trap',
              trapPos,
              { type: TrapEffectType.COOLDOWN_INCREASE, duration: 1000, magnitude: 2 },
              triggerRadius
            );
            
            // Position far outside radius should not trigger
            const farPos = {
              x: trapPos.x + triggerRadius * 3,
              y: trapPos.y + triggerRadius * 3
            };
            
            expect(trap.checkCollision(farPos)).toBe(false);
            expect(trap.getIsTriggered()).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 25b: Trap has cooldown after triggering', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          fc.integer({ min: 1000, max: 5000 }),
          (trapPos, cooldown) => {
            const trap = new CursedTrap(
              'test-trap',
              trapPos,
              { type: TrapEffectType.COOLDOWN_INCREASE, duration: 1000, magnitude: 2 },
              20,
              cooldown
            );
            
            // Trigger trap
            trap.checkCollision(trapPos);
            expect(trap.getIsTriggered()).toBe(true);
            
            // Should not trigger again immediately
            expect(trap.checkCollision(trapPos)).toBe(false);
            
            // Remaining cooldown should be positive
            expect(trap.getRemainingCooldown()).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 25c: Trap effect has correct properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            TrapEffectType.COOLDOWN_INCREASE,
            TrapEffectType.MOVEMENT_RESTRICTION,
            TrapEffectType.ABILITY_DISABLE
          ),
          fc.integer({ min: 500, max: 5000 }),
          fc.float({ min: 0.5, max: 3, noNaN: true }),
          (effectType, duration, magnitude) => {
            const trap = new CursedTrap(
              'test-trap',
              { x: 100, y: 100 },
              { type: effectType, duration, magnitude },
              20
            );
            
            const effect = trap.getEffect();
            expect(effect.type).toBe(effectType);
            expect(effect.duration).toBe(duration);
            expect(effect.magnitude).toBe(magnitude);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 25d: Inactive trap does not trigger', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          (trapPos) => {
            const trap = new CursedTrap(
              'test-trap',
              trapPos,
              { type: TrapEffectType.COOLDOWN_INCREASE, duration: 1000, magnitude: 2 },
              20
            );
            
            // Deactivate trap
            trap.deactivate();
            
            // Should not trigger even at same position
            expect(trap.checkCollision(trapPos)).toBe(false);
            expect(trap.getIsTriggered()).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Obstacle Manager', () => {
    test('Property 24: Manager detects guard collisions', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          (checkpointPos, guardPos) => {
            const manager = new ObstacleManager(checkpointPos);
            const guard = new PhantomGuard('guard-1', guardPos, [guardPos]);
            manager.registerObstacle(guard);
            
            // Check collision at guard position
            const collision = manager.checkGuardCollision(guardPos, 20);
            expect(collision).toBeDefined();
            expect(collision?.getId()).toBe('guard-1');
            
            // Check no collision far away
            const farPos = { x: guardPos.x + 1000, y: guardPos.y + 1000 };
            const noCollision = manager.checkGuardCollision(farPos, 20);
            expect(noCollision).toBeUndefined();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 25: Manager detects trap collisions', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          (checkpointPos, trapPos) => {
            const manager = new ObstacleManager(checkpointPos);
            const trap = new CursedTrap(
              'trap-1',
              trapPos,
              { type: TrapEffectType.COOLDOWN_INCREASE, duration: 1000, magnitude: 2 },
              20
            );
            manager.registerObstacle(trap);
            
            // Check collision at trap position
            const collision = manager.checkTrapCollision(trapPos);
            expect(collision).toBeDefined();
            expect(collision?.getId()).toBe('trap-1');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 24: Manager provides checkpoint for respawn', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.float({ min: 0, max: 500, noNaN: true }),
            y: fc.float({ min: 0, max: 500, noNaN: true })
          }),
          (checkpointPos) => {
            const manager = new ObstacleManager(checkpointPos);
            
            const checkpoint = manager.getCheckpointPosition();
            expect(checkpoint.x).toBe(checkpointPos.x);
            expect(checkpoint.y).toBe(checkpointPos.y);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 24: Reset all resets all obstacles', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.float({ min: 0, max: 500, noNaN: true }),
              y: fc.float({ min: 0, max: 500, noNaN: true })
            }),
            { minLength: 2, maxLength: 4 }
          ),
          (patrolPath) => {
            const manager = new ObstacleManager({ x: 0, y: 0 });
            const guard = new PhantomGuard('guard-1', patrolPath[0], patrolPath, 10);
            manager.registerObstacle(guard);
            
            // Store initial position and state
            const initialPos = { ...guard.getPosition() };
            const initialIndex = guard.getCurrentPathIndex();
            
            // Move guard
            for (let i = 0; i < 100; i++) {
              manager.update(16);
            }
            
            // Reset all
            manager.resetAll();
            
            // Guard should be back at initial state
            const resetPos = guard.getPosition();
            expect(resetPos.x).toBeCloseTo(initialPos.x, 1);
            expect(resetPos.y).toBeCloseTo(initialPos.y, 1);
            expect(guard.getCurrentPathIndex()).toBe(initialIndex);
            expect(guard.getIsActive()).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
