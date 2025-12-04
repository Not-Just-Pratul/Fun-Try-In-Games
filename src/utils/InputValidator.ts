import { Vector2D } from '@game-types/common';
import { Maze } from '@game-types/maze';

/**
 * InputValidator - Validates player inputs and game state
 */
export class InputValidator {
  /**
   * Validates a position is within bounds
   */
  public static isValidPosition(position: Vector2D, maze: Maze): boolean {
    return (
      position.x >= 0 &&
      position.x < maze.width &&
      position.y >= 0 &&
      position.y < maze.height
    );
  }

  /**
   * Validates movement input
   */
  public static isValidMovement(
    from: Vector2D,
    to: Vector2D,
    maze: Maze,
    maxDistance: number = 1
  ): boolean {
    // Check bounds
    if (!this.isValidPosition(to, maze)) {
      return false;
    }

    // Check distance
    const distance = Math.sqrt(
      Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
    );
    
    if (distance > maxDistance) {
      return false;
    }

    // Check if walkable
    return maze.isWalkable(to);
  }

  /**
   * Validates ability usage
   */
  public static isValidAbilityUse(
    abilityId: string,
    charges: number,
    cooldown: number
  ): boolean {
    // Must have charges
    if (charges <= 0) {
      return false;
    }

    // Must not be on cooldown
    if (cooldown > 0) {
      return false;
    }

    return true;
  }

  /**
   * Validates puzzle interaction
   */
  public static isValidPuzzleInteraction(
    playerPosition: Vector2D,
    puzzlePosition: Vector2D,
    maxDistance: number = 2
  ): boolean {
    const distance = Math.sqrt(
      Math.pow(puzzlePosition.x - playerPosition.x, 2) +
      Math.pow(puzzlePosition.y - playerPosition.y, 2)
    );

    return distance <= maxDistance;
  }

  /**
   * Validates collectible pickup
   */
  public static isValidCollectiblePickup(
    playerPosition: Vector2D,
    collectiblePosition: Vector2D,
    pickupRadius: number = 1
  ): boolean {
    const distance = Math.sqrt(
      Math.pow(collectiblePosition.x - playerPosition.x, 2) +
      Math.pow(collectiblePosition.y - playerPosition.y, 2)
    );

    return distance <= pickupRadius;
  }

  /**
   * Validates level ID format
   */
  public static isValidLevelId(levelId: string): boolean {
    // Format: "chapterX-levelY" or "tutorial"
    const pattern = /^(tutorial|chapter\d+-level\d+)$/;
    return pattern.test(levelId);
  }

  /**
   * Validates save data structure
   */
  public static isValidSaveData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['version', 'timestamp', 'levelProgress'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return false;
      }
    }

    // Validate version
    if (typeof data.version !== 'string') {
      return false;
    }

    // Validate timestamp
    if (typeof data.timestamp !== 'number' || data.timestamp <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Sanitizes user input
   */
  public static sanitizeInput(input: string, maxLength: number = 100): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Trim and limit length
    let sanitized = input.trim().substring(0, maxLength);

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>]/g, '');

    return sanitized;
  }

  /**
   * Validates numeric input
   */
  public static isValidNumber(
    value: any,
    min?: number,
    max?: number
  ): boolean {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return false;
    }

    if (min !== undefined && value < min) {
      return false;
    }

    if (max !== undefined && value > max) {
      return false;
    }

    return true;
  }

  /**
   * Validates array input
   */
  public static isValidArray<T>(
    value: any,
    minLength?: number,
    maxLength?: number,
    validator?: (item: T) => boolean
  ): boolean {
    if (!Array.isArray(value)) {
      return false;
    }

    if (minLength !== undefined && value.length < minLength) {
      return false;
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return false;
    }

    if (validator) {
      return value.every(validator);
    }

    return true;
  }
}
