import { TimingPuzzle } from '@systems/TimingPuzzle';
import { PuzzleSolveContext } from '@systems/PuzzleBase';

describe('Debug Timing Puzzle', () => {
  test('Simple case: windowStart=1000, windowEnd=4000', () => {
    const puzzle = new TimingPuzzle(
      'test',
      { x: 0, y: 0 },
      1000,
      4000
    );

    console.log('Initial state:', { isSolved: puzzle.getIsSolved() });

    puzzle.activate(0);
    console.log('After activate:', { activationTime: puzzle.getActivationTime() });

    const attemptTime = 2500;
    const context: PuzzleSolveContext = {
      playerPosition: { x: 0, y: 0 },
      inventory: [],
      timestamp: attemptTime
    };

    console.log('Attempting at:', attemptTime);
    console.log('Can solve?', puzzle.canSolve(context));

    const solved = puzzle.attemptSolve(context);
    console.log('Solved?', solved, 'isSolved:', puzzle.getIsSolved());

    expect(solved).toBe(true);
  });
});
