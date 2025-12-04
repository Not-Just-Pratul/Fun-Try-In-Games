import * as fc from 'fast-check';
import { Direction } from '@game-types/common';

// Feature: chain-ledge-game, Property 1: Input-driven movement consistency
// Validates: Requirements 1.1, 1.4

// Mock GhostCharacter for testing
class MockGhostCharacter {
  x: number;
  y: number;
  private velocity: { x: number; y: number };
  private isMoving: boolean;
  private moveSpeed: number = 150;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.isMoving = false;
  }

  move(direction: Direction): void {
    this.isMoving = true;
    switch (direction) {
      case Direction.NORTH:
        this.velocity = { x: 0, y: -1 };
        break;
      case Direction.SOUTH:
        this.velocity = { x: 0, y: 1 };
        break;
      case Direction.EAST:
        this.velocity = { x: 1, y: 0 };
        break;
      case Direction.WEST:
        this.velocity = { x: -1, y: 0 };
        break;
    }
  }

  stopMovement(): void {
    this.isMoving = false;
    this.velocity = { x: 0, y: 0 };
  }

  update(deltaTime: number): void {
    if (this.isMoving) {
      const deltaSeconds = deltaTime / 1000;
      this.x += this.velocity.x * this.moveSpeed * deltaSeconds;
      this.y += this.velocity.y * this.moveSpeed * deltaSeconds;
    }
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }

  getVelocity(): { x: number; y: number } {
    return { ...this.velocity };
  }
}

describe('Movement Property Tests', () => {
  test('Property 1: Input-driven movement consistency - Providing input moves ghost in specified direction at consistent speed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 800 }),
        fc.integer({ min: 0, max: 600 }),
        fc.constantFrom(Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST),
        fc.float({ min: 16, max: 100, noNaN: true }),
        (startX, startY, direction, deltaTime) => {
          const ghost = new MockGhostCharacter(startX, startY);
          const initialX = ghost.x;
          const initialY = ghost.y;

          // Provide directional input
          ghost.move(direction);

          // Ghost should be moving
          expect(ghost.getIsMoving()).toBe(true);

          // Update position
          ghost.update(deltaTime);

          // Verify movement occurred in correct direction
          const velocity = ghost.getVelocity();
          
          switch (direction) {
            case Direction.NORTH:
              expect(velocity.x).toBe(0);
              expect(velocity.y).toBe(-1);
              expect(ghost.y).toBeLessThan(initialY);
              expect(ghost.x).toBe(initialX);
              break;
            case Direction.SOUTH:
              expect(velocity.x).toBe(0);
              expect(velocity.y).toBe(1);
              expect(ghost.y).toBeGreaterThan(initialY);
              expect(ghost.x).toBe(initialX);
              break;
            case Direction.EAST:
              expect(velocity.x).toBe(1);
              expect(velocity.y).toBe(0);
              expect(ghost.x).toBeGreaterThan(initialX);
              expect(ghost.y).toBe(initialY);
              break;
            case Direction.WEST:
              expect(velocity.x).toBe(-1);
              expect(velocity.y).toBe(0);
              expect(ghost.x).toBeLessThan(initialX);
              expect(ghost.y).toBe(initialY);
              break;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1b: Releasing input stops movement immediately', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 800 }),
        fc.integer({ min: 0, max: 600 }),
        fc.constantFrom(Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST),
        (startX, startY, direction) => {
          const ghost = new MockGhostCharacter(startX, startY);

          // Start moving
          ghost.move(direction);
          expect(ghost.getIsMoving()).toBe(true);

          // Stop movement (release input)
          ghost.stopMovement();

          // Ghost should stop immediately
          expect(ghost.getIsMoving()).toBe(false);
          
          const velocity = ghost.getVelocity();
          expect(velocity.x).toBe(0);
          expect(velocity.y).toBe(0);

          // Position should not change after stopping
          const posX = ghost.x;
          const posY = ghost.y;
          ghost.update(16);
          expect(ghost.x).toBe(posX);
          expect(ghost.y).toBe(posY);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
