import { PuzzleBase, PuzzleSolveContext } from './PuzzleBase';
import { Vector2D } from '@game-types/common';
import { Maze } from '@game-types/maze';

/**
 * Manages all puzzles in the game
 */
export class PuzzleManager {
  private puzzles: Map<string, PuzzleBase>;
  private maze: Maze;

  constructor(maze: Maze) {
    this.puzzles = new Map();
    this.maze = maze;
  }

  /**
   * Registers a puzzle
   */
  registerPuzzle(puzzle: PuzzleBase): void {
    this.puzzles.set(puzzle.getId(), puzzle);
  }

  /**
   * Gets a puzzle by ID
   */
  getPuzzle(id: string): PuzzleBase | undefined {
    return this.puzzles.get(id);
  }

  /**
   * Gets all puzzles
   */
  getAllPuzzles(): PuzzleBase[] {
    return Array.from(this.puzzles.values());
  }

  /**
   * Gets puzzles at a specific position
   */
  getPuzzlesAtPosition(position: Vector2D, radius: number = 1): PuzzleBase[] {
    return this.getAllPuzzles().filter(puzzle => {
      const puzzlePos = puzzle.getPosition();
      const distance = Math.sqrt(
        Math.pow(puzzlePos.x - position.x, 2) + 
        Math.pow(puzzlePos.y - position.y, 2)
      );
      return distance <= radius;
    });
  }

  /**
   * Attempts to solve a puzzle
   */
  attemptSolvePuzzle(puzzleId: string, context: PuzzleSolveContext): boolean {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle) {
      return false;
    }

    const wasSolved = puzzle.getIsSolved();
    const solved = puzzle.attemptSolve(context);
    
    if (solved && !wasSolved && puzzle.getIsSolved()) {
      // Puzzle was just solved, unlock paths
      this.unlockPaths(puzzle);
    }

    return solved;
  }

  /**
   * Checks if a puzzle can be solved
   */
  canSolvePuzzle(puzzleId: string, context: PuzzleSolveContext): boolean {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle) {
      return false;
    }

    return puzzle.canSolve(context);
  }

  /**
   * Unlocks paths associated with a puzzle
   */
  private unlockPaths(puzzle: PuzzleBase): void {
    const paths = puzzle.getUnlocksPath();
    
    paths.forEach(pos => {
      const cell = this.maze.getCell(pos);
      if (cell) {
        // Make the cell walkable by removing walls or changing type
        // This is a simplified implementation
        cell.walls = {
          north: false,
          south: false,
          east: false,
          west: false
        };
      }
    });
  }

  /**
   * Gets all solved puzzles
   */
  getSolvedPuzzles(): PuzzleBase[] {
    return this.getAllPuzzles().filter(puzzle => puzzle.getIsSolved());
  }

  /**
   * Gets all unsolved puzzles
   */
  getUnsolvedPuzzles(): PuzzleBase[] {
    return this.getAllPuzzles().filter(puzzle => !puzzle.getIsSolved());
  }

  /**
   * Checks if all puzzles are solved
   */
  areAllPuzzlesSolved(): boolean {
    return this.getAllPuzzles().every(puzzle => puzzle.getIsSolved());
  }

  /**
   * Resets all puzzles
   */
  resetAll(): void {
    this.puzzles.forEach(puzzle => puzzle.reset());
  }

  /**
   * Removes a puzzle
   */
  removePuzzle(puzzleId: string): boolean {
    return this.puzzles.delete(puzzleId);
  }
}
