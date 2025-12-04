import * as fc from 'fast-check';
import { MultiLayeredMaze, LayerTransition } from '@systems/MultiLayeredMaze';
import { Maze, MazeType, CellType, Cell } from '@game-types/maze';
import { Vector2D } from '@game-types/common';

// Feature: chain-ledge-game, Property 13: Multi-layer navigation
// Validates: Requirements 3.6

/**
 * Generator for creating a simple test maze
 */
const mazeGenerator = (layers: number, width: number, height: number): Maze => {
  const grid: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        position: { x, y },
        type: CellType.EMPTY,
        walls: { north: false, south: false, east: false, west: false },
        isVisible: true,
        isRevealed: false
      });
    }
    grid.push(row);
  }

  return {
    type: MazeType.MULTI_LAYERED,
    grid,
    width,
    height,
    layers,
    entrance: { x: 0, y: 0 },
    exit: { x: width - 1, y: height - 1 },
    obstacles: [],
    collectibles: [],
    getCell: (pos: Vector2D) => {
      if (pos.y >= 0 && pos.y < height && pos.x >= 0 && pos.x < width) {
        return grid[pos.y][pos.x];
      }
      return undefined;
    },
    isWalkable: (pos: Vector2D) => {
      const cell = grid[pos.y]?.[pos.x];
      return cell?.type === CellType.EMPTY;
    },
    isSolvable: () => true
  };
};

describe('Multi-Layer Maze Property Tests', () => {
  test('Property 13: Using a transition updates the current layer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }), // Number of layers
        fc.integer({ min: 3, max: 10 }), // Maze width
        fc.integer({ min: 3, max: 10 }), // Maze height
        (layers, width, height) => {
          // Create a multi-layered maze
          const maze = mazeGenerator(layers, width, height);
          const multiLayerMaze = new MultiLayeredMaze(maze);

          // Get initial layer
          const initialLayer = multiLayerMaze.getCurrentLayer();
          expect(initialLayer).toBe(0);

          // Get all transitions
          const transitions = multiLayerMaze.getTransitions();
          expect(transitions.length).toBeGreaterThan(0);

          // Find a transition from the current layer
          const transitionFromCurrentLayer = transitions.find(
            t => t.fromLayer === initialLayer
          );

          if (transitionFromCurrentLayer) {
            // Use the transition
            const success = multiLayerMaze.useTransition(transitionFromCurrentLayer.position);
            
            // Verify transition was successful
            expect(success).toBe(true);
            
            // Verify layer was updated
            const newLayer = multiLayerMaze.getCurrentLayer();
            expect(newLayer).toBe(transitionFromCurrentLayer.toLayer);
            expect(newLayer).not.toBe(initialLayer);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 13b: Using transition at wrong position does not change layer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 3, max: 10 }),
        fc.integer({ min: 3, max: 10 }),
        (layers, width, height) => {
          const maze = mazeGenerator(layers, width, height);
          const multiLayerMaze = new MultiLayeredMaze(maze);

          const initialLayer = multiLayerMaze.getCurrentLayer();
          const transitions = multiLayerMaze.getTransitions();

          // Try to use transition at a position where there is no transition
          const invalidPosition: Vector2D = { x: 999, y: 999 };
          const success = multiLayerMaze.useTransition(invalidPosition);

          // Should fail
          expect(success).toBe(false);
          
          // Layer should not change
          expect(multiLayerMaze.getCurrentLayer()).toBe(initialLayer);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 13c: Transitions are bidirectional between adjacent layers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 3, max: 10 }),
        fc.integer({ min: 3, max: 10 }),
        (layers, width, height) => {
          const maze = mazeGenerator(layers, width, height);
          const multiLayerMaze = new MultiLayeredMaze(maze);

          const transitions = multiLayerMaze.getTransitions();

          // For each transition going up, there should be one going down
          for (const transition of transitions) {
            if (transition.toLayer > transition.fromLayer) {
              // Find reverse transition
              const reverseTransition = transitions.find(
                t => t.fromLayer === transition.toLayer &&
                     t.toLayer === transition.fromLayer &&
                     t.position.x === transition.position.x &&
                     t.position.y === transition.position.y
              );
              
              expect(reverseTransition).toBeDefined();
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 13d: Current layer cells are accessible after transition', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 3, max: 10 }),
        fc.integer({ min: 3, max: 10 }),
        (layers, width, height) => {
          const maze = mazeGenerator(layers, width, height);
          const multiLayerMaze = new MultiLayeredMaze(maze);

          // Get cells before transition
          const cellsBeforeTransition = multiLayerMaze.getCurrentLayerCells();
          expect(cellsBeforeTransition).toBeDefined();
          expect(cellsBeforeTransition.length).toBeGreaterThan(0);

          // Find and use a transition
          const transitions = multiLayerMaze.getTransitions();
          const transition = transitions.find(t => t.fromLayer === 0);

          if (transition) {
            multiLayerMaze.useTransition(transition.position);

            // Get cells after transition
            const cellsAfterTransition = multiLayerMaze.getCurrentLayerCells();
            expect(cellsAfterTransition).toBeDefined();
            expect(cellsAfterTransition.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 13e: Layer can be set directly within valid range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 3, max: 10 }),
        fc.integer({ min: 3, max: 10 }),
        (layers, width, height) => {
          const maze = mazeGenerator(layers, width, height);
          const multiLayerMaze = new MultiLayeredMaze(maze);

          // Try setting to each valid layer
          for (let layer = 0; layer < layers; layer++) {
            multiLayerMaze.setCurrentLayer(layer);
            expect(multiLayerMaze.getCurrentLayer()).toBe(layer);
          }

          // Try setting to invalid layer (should not change)
          const currentLayer = multiLayerMaze.getCurrentLayer();
          multiLayerMaze.setCurrentLayer(-1);
          expect(multiLayerMaze.getCurrentLayer()).toBe(currentLayer);
          
          multiLayerMaze.setCurrentLayer(layers + 10);
          expect(multiLayerMaze.getCurrentLayer()).toBe(currentLayer);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
