# Test Suite Documentation

## Quick Reference

### Running Tests
```bash
npm test                                    # Run all tests
npm test -- --testNamePattern="Property 9"  # Run specific property
npm test -- --coverage                      # Generate coverage report
npm test -- --watch                         # Watch mode for development
```

### Test File Locations
- **Property tests**: `src/tests/*.property.test.ts`
- **Unit tests**: `src/tests/*.test.ts`
- **Test utilities**: `src/tests/` directory

### Key Concepts
- **Property**: Universal invariant that holds for all valid inputs
- **Generator**: Creates random test data within valid constraints
- **Invariant**: Condition that must be true after operation
- **Counterexample**: Input that causes property to fail

### Common Generators
```typescript
vectorGenerator              // 2D positions
mazeCellGenerator          // Maze cells with walls
gameStateGenerator         // Complete game states
abilityConfigGenerator     // Ability configurations
mazeConfigGenerator        // Maze configurations
performanceMetricsGenerator // Player performance data
```

## Overview

This document provides comprehensive documentation for the Chain Ledge Game test suite, including property-based tests, unit tests, and testing guidelines.

## Test Statistics

- **Total Tests**: 197
- **Test Suites**: 20
- **Property-Based Tests**: 45 correctness properties
- **Coverage**: All core systems and requirements validated

## Property-Based Tests

Property-based testing uses fast-check to generate random test data and verify invariants hold across many iterations.

### Movement & Input Properties

#### Property 1: Input-driven movement consistency
- **File**: `src/tests/movement.property.test.ts`
- **Validates**: Requirements 1.1, 1.4
- **Description**: Verifies that ghost movement is consistent with input direction and speed
- **Test Data**: Random directions, time deltas, initial positions
- **Invariant**: Ghost position changes by velocity * deltaTime in input direction
- **Iterations**: 100+

#### Property 2: Wall collision prevention
- **File**: `src/tests/collision.test.ts`
- **Validates**: Requirements 1.3
- **Description**: Ensures ghost cannot pass through walls
- **Test Data**: Random maze layouts, movement vectors
- **Invariant**: Ghost position never overlaps with wall cells
- **Iterations**: 100+

#### Property 3: Collision detection during movement
- **File**: `src/tests/collision.test.ts`
- **Validates**: Requirements 1.5, 4.1
- **Description**: Verifies collision detection works during continuous movement
- **Test Data**: Random obstacles, movement paths
- **Invariant**: All collisions are detected before position update
- **Iterations**: 100+

### Ability Properties

#### Property 4: Phase ability wall penetration
- **File**: `src/tests/abilities.property.test.ts`
- **Validates**: Requirements 2.1
- **Description**: Phase ability allows passage through phasing walls
- **Test Data**: Random phasing wall configurations
- **Invariant**: With phase active, ghost can occupy phasing wall cells
- **Iterations**: 100+

#### Property 5: Possession control transfer
- **File**: `src/tests/abilities.property.test.ts`
- **Validates**: Requirements 2.2
- **Description**: Possession ability transfers control to target objects
- **Test Data**: Random possessable objects, control states
- **Invariant**: Control transfers to possessed object, original ghost immobilized
- **Iterations**: 100+

#### Property 6: Sense ability revelation
- **File**: `src/tests/abilities.property.test.ts`
- **Validates**: Requirements 2.3
- **Description**: Sense ability reveals hidden routes and clues
- **Test Data**: Random hidden elements, sense radius
- **Invariant**: All hidden elements within radius become visible
- **Iterations**: 100+

#### Property 7: Speed boost effect
- **File**: `src/tests/abilities.property.test.ts`
- **Validates**: Requirements 2.4
- **Description**: Speed boost temporarily increases movement speed
- **Test Data**: Random boost durations, speed multipliers
- **Invariant**: Movement speed increases by multiplier, returns to normal after duration
- **Iterations**: 100+

#### Property 8: Ability charge and cooldown management
- **File**: `src/tests/abilities.property.test.ts`
- **Validates**: Requirements 2.5, 2.6
- **Description**: Ability charges deplete on use and restore after cooldown
- **Test Data**: Random charge counts, cooldown durations
- **Invariant**: Charges decrease on activation, restore when cooldown completes
- **Iterations**: 100+

### Maze Properties

#### Property 9: Maze solvability guarantee
- **File**: `src/tests/maze.property.test.ts`
- **Validates**: Requirements 3.2
- **Description**: All generated mazes have a valid path from start to exit
- **Test Data**: Random maze sizes, complexity levels
- **Invariant**: Pathfinding algorithm finds route from start to exit
- **Iterations**: 100+

#### Property 10: Difficulty progression
- **File**: `src/tests/maze.property.test.ts`
- **Validates**: Requirements 3.3
- **Description**: Maze difficulty increases with level progression
- **Test Data**: Random level sequences
- **Invariant**: Complexity metric increases monotonically with level
- **Iterations**: 100+

#### Property 11: Memory maze path removal
- **File**: `src/tests/multilayer.test.ts`
- **Validates**: Requirements 3.4
- **Description**: Memory maze removes traversed paths from visibility
- **Test Data**: Random movement sequences
- **Invariant**: Previously visited cells become invisible after leaving
- **Iterations**: 100+

#### Property 12: Shadow maze visibility constraint
- **File**: `src/tests/multilayer.test.ts`
- **Validates**: Requirements 3.5
- **Description**: Shadow maze limits visibility to radius around ghost
- **Test Data**: Random ghost positions, visibility radius
- **Invariant**: Only cells within radius are visible
- **Iterations**: 100+

#### Property 13: Multi-layer navigation
- **File**: `src/tests/multilayer.test.ts`
- **Validates**: Requirements 3.6
- **Description**: Multi-layer maze allows vertical navigation between floors
- **Test Data**: Random layer transitions, floor configurations
- **Invariant**: Ghost can move between layers via designated portals
- **Iterations**: 100+

### Puzzle Properties

#### Property 14: Puzzle solution unlocks paths
- **File**: `src/tests/puzzles.property.test.ts`
- **Validates**: Requirements 4.2
- **Description**: Solving puzzles unlocks blocked paths
- **Test Data**: Random puzzle states, solution sequences
- **Invariant**: Path becomes traversable after puzzle solution
- **Iterations**: 100+

#### Property 15: Exit activation condition
- **File**: `src/tests/puzzles.property.test.ts`
- **Validates**: Requirements 4.3
- **Description**: Exit portal activates only when all puzzles solved
- **Test Data**: Random puzzle completion states
- **Invariant**: Exit only accessible when all puzzles solved
- **Iterations**: 100+

### Collectible Properties

#### Property 18: Collection addition
- **File**: `src/tests/collectibles.property.test.ts`
- **Validates**: Requirements 5.2, 9.1
- **Description**: Collectibles are properly added to inventory
- **Test Data**: Random collectible types, quantities
- **Invariant**: Inventory count increases by 1 on collection
- **Iterations**: 100+

### Story & Progression Properties

#### Property 16: Level completion triggers progression
- **File**: `src/tests/progression.property.test.ts`
- **Validates**: Requirements 4.4, 8.1
- **Description**: Reaching exit completes level and unlocks next
- **Test Data**: Random level sequences
- **Invariant**: Next level becomes accessible after completion
- **Iterations**: 100+

#### Property 17: Memory unlock on level completion
- **File**: `src/tests/progression.property.test.ts`
- **Validates**: Requirements 5.1
- **Description**: Story memories unlock when levels complete
- **Test Data**: Random level completion sequences
- **Invariant**: Associated memory becomes unlocked
- **Iterations**: 100+

#### Property 19: Chapter completion triggers cutscene
- **File**: `src/tests/progression.property.test.ts`
- **Validates**: Requirements 5.3
- **Description**: Completing all chapter levels triggers cutscene
- **Test Data**: Random chapter completion states
- **Invariant**: Cutscene displays when final level completes
- **Iterations**: 100+

#### Property 20: Gameplay pause during narrative
- **File**: `src/tests/progression.property.test.ts`
- **Validates**: Requirements 5.4
- **Description**: Gameplay pauses while narrative displays
- **Test Data**: Random narrative display states
- **Invariant**: Game loop stops during narrative, resumes after
- **Iterations**: 100+

#### Property 26: Chapter progression
- **File**: `src/tests/progression.property.test.ts`
- **Validates**: Requirements 8.2
- **Description**: Chapters unlock sequentially
- **Test Data**: Random chapter completion sequences
- **Invariant**: Chapter N+1 only accessible after chapter N complete
- **Iterations**: 100+

#### Property 27: Level list accuracy
- **File**: `src/tests/progression.property.test.ts`
- **Validates**: Requirements 8.3
- **Description**: Level list reflects actual game state
- **Test Data**: Random level states
- **Invariant**: Level list matches internal level data
- **Iterations**: 100+

### Hint System Properties

#### Property 21: Hint availability after cooldown
- **File**: `src/tests/hints.property.test.ts`
- **Validates**: Requirements 6.1, 6.2
- **Description**: Hints become available after cooldown expires
- **Test Data**: Random cooldown durations, time progressions
- **Invariant**: Hint available when cooldown <= 0
- **Iterations**: 100+

#### Property 22: Ad reward grants hint charge
- **File**: `src/tests/hints.property.test.ts`
- **Validates**: Requirements 6.3
- **Description**: Watching ads grants additional hint charges
- **Test Data**: Random ad completion states
- **Invariant**: Hint charge count increases after ad reward
- **Iterations**: 100+

### Obstacle Properties

#### Property 23: Guard patrol path following
- **File**: `src/tests/obstacles.property.test.ts`
- **Validates**: Requirements 7.1
- **Description**: Guards follow defined patrol paths
- **Test Data**: Random patrol paths, time steps
- **Invariant**: Guard position follows path waypoints
- **Iterations**: 100+

#### Property 24: Guard collision resets position
- **File**: `src/tests/obstacles.property.test.ts`
- **Validates**: Requirements 7.2
- **Description**: Colliding with guard resets ghost to checkpoint
- **Test Data**: Random guard positions, collision states
- **Invariant**: Ghost position resets to last checkpoint after collision
- **Iterations**: 100+

#### Property 25: Trap activation applies effects
- **File**: `src/tests/obstacles.property.test.ts`
- **Validates**: Requirements 7.3, 7.4
- **Description**: Traps apply effects when triggered
- **Test Data**: Random trap states, trigger conditions
- **Invariant**: Effect applied immediately on trigger
- **Iterations**: 100+

### Persistence Properties

#### Property 28: Save/load round trip
- **File**: `src/tests/persistence.property.test.ts`
- **Validates**: Requirements 8.4, 11.1, 11.2, 11.3
- **Description**: Game state survives save/load cycle
- **Test Data**: Random game states
- **Invariant**: Loaded state equals saved state
- **Iterations**: 100+

#### Property 29: Session metrics tracking
- **File**: `src/tests/persistence.property.test.ts`
- **Validates**: Requirements 8.5
- **Description**: Session metrics are accurately tracked
- **Test Data**: Random gameplay sequences
- **Invariant**: Metrics reflect actual gameplay
- **Iterations**: 100+

#### Property 30: Auto-save interval
- **File**: `src/tests/persistence.property.test.ts`
- **Validates**: Requirements 11.5
- **Description**: Auto-save triggers at configured intervals
- **Test Data**: Random time progressions
- **Invariant**: Save occurs at interval boundaries
- **Iterations**: 100+

#### Property 31: Save retry on failure
- **File**: `src/tests/persistence.property.test.ts`
- **Validates**: Requirements 11.4
- **Description**: Failed saves retry with exponential backoff
- **Test Data**: Random failure scenarios
- **Invariant**: Retry count increases, delay doubles each attempt
- **Iterations**: 100+

### Cosmetic Properties

#### Property 32: Cosmetic application
- **File**: `src/tests/cosmetics.property.test.ts`
- **Validates**: Requirements 9.2
- **Description**: Cosmetics apply correctly to ghost
- **Test Data**: Random cosmetic selections
- **Invariant**: Ghost appearance matches selected cosmetic
- **Iterations**: 100+

#### Property 33: Cosmetic gameplay neutrality
- **File**: `src/tests/cosmetics.property.test.ts`
- **Validates**: Requirements 9.3
- **Description**: Cosmetics don't affect gameplay mechanics
- **Test Data**: Random cosmetic states, gameplay actions
- **Invariant**: Movement, collision, abilities unchanged by cosmetics
- **Iterations**: 100+

#### Property 34: Cosmetic list accuracy
- **File**: `src/tests/cosmetics.property.test.ts`
- **Validates**: Requirements 9.4
- **Description**: Cosmetic list reflects unlocked items
- **Test Data**: Random cosmetic unlock states
- **Invariant**: List contains exactly unlocked cosmetics
- **Iterations**: 100+

### Analytics Properties

#### Property 35: Event logging completeness
- **File**: `src/tests/analytics.property.test.ts`
- **Validates**: Requirements 12.1, 12.2, 12.3
- **Description**: All significant events are logged
- **Test Data**: Random gameplay sequences
- **Invariant**: Event log contains all expected events
- **Iterations**: 100+

#### Property 36: Analytics data transmission
- **File**: `src/tests/analytics.property.test.ts`
- **Validates**: Requirements 12.4
- **Description**: Analytics data transmits successfully
- **Test Data**: Random network conditions
- **Invariant**: Data reaches analytics backend
- **Iterations**: 100+

### Audio Properties

#### Property 37: Event-triggered audio playback
- **File**: `src/tests/audio.property.test.ts`
- **Validates**: Requirements 13.1, 13.2, 13.3
- **Description**: Audio plays for relevant game events
- **Test Data**: Random event sequences
- **Invariant**: Audio plays when event occurs
- **Iterations**: 100+

### Monetization Properties

#### Property 38: Shop inventory accuracy
- **File**: `src/tests/monetization.property.test.ts`
- **Validates**: Requirements 14.1
- **Description**: Shop displays correct available items
- **Test Data**: Random purchase states
- **Invariant**: Shop inventory matches game state
- **Iterations**: 100+

#### Property 39: Purchase fulfillment
- **File**: `src/tests/monetization.property.test.ts`
- **Validates**: Requirements 14.2
- **Description**: Purchases grant correct rewards
- **Test Data**: Random purchase types
- **Invariant**: Purchased item added to inventory
- **Iterations**: 100+

#### Property 40: Core content accessibility
- **File**: `src/tests/monetization.property.test.ts`
- **Validates**: Requirements 14.3
- **Description**: Core game content accessible without payment
- **Test Data**: Random purchase states
- **Invariant**: All core levels playable without purchases
- **Iterations**: 100+

#### Property 41: Ad reward fulfillment
- **File**: `src/tests/monetization.property.test.ts`
- **Validates**: Requirements 14.4
- **Description**: Ad rewards grant correct items
- **Test Data**: Random ad completion states
- **Invariant**: Reward added to inventory after ad
- **Iterations**: 100+

### Difficulty Properties

#### Property 42: Failure-triggered difficulty assistance
- **File**: `src/tests/difficulty.property.test.ts`
- **Validates**: Requirements 15.1
- **Description**: Difficulty assistance offered after repeated failures
- **Test Data**: Random failure counts
- **Invariant**: Assistance offered when failures exceed threshold
- **Iterations**: 100+

#### Property 43: Performance-based difficulty scaling
- **File**: `src/tests/difficulty.property.test.ts`
- **Validates**: Requirements 15.2
- **Description**: Difficulty scales based on player performance
- **Test Data**: Random performance metrics
- **Invariant**: Difficulty increases/decreases based on metrics
- **Iterations**: 100+

#### Property 44: Difficulty adjustment scope
- **File**: `src/tests/difficulty.property.test.ts`
- **Validates**: Requirements 15.4
- **Description**: Difficulty adjustments are level-specific
- **Test Data**: Random level states
- **Invariant**: Adjustment affects only current level
- **Iterations**: 100+

#### Property 45: Skill level analysis
- **File**: `src/tests/difficulty.property.test.ts`
- **Validates**: Requirements 15.5
- **Description**: Skill level accurately reflects player ability
- **Test Data**: Random gameplay statistics
- **Invariant**: Skill level correlates with performance metrics
- **Iterations**: 100+

## Test Data Generators

### Common Generators

#### Vector2D Generator
```typescript
// Basic 2D position generator
const vectorGenerator = fc.record({
  x: fc.integer({ min: 0, max: 100 }),
  y: fc.integer({ min: 0, max: 100 })
});

// Usage in tests
fc.assert(
  fc.property(vectorGenerator, (position) => {
    // Test with random positions
    const result = moveGhost(position, Direction.NORTH);
    expect(result.y).toBeLessThan(position.y);
  }),
  { numRuns: 100 }
);
```

#### Maze Cell Generator
```typescript
// Generates maze cells with walls
const mazeCellGenerator = fc.record({
  position: fc.record({
    x: fc.integer({ min: 0, max: 50 }),
    y: fc.integer({ min: 0, max: 50 })
  }),
  walls: fc.record({
    north: fc.boolean(),
    south: fc.boolean(),
    east: fc.boolean(),
    west: fc.boolean()
  }),
  type: fc.constantFrom('EMPTY', 'WALL', 'PHASING_WALL', 'PUZZLE_DOOR')
});

// Usage: Generate realistic maze layouts
fc.assert(
  fc.property(
    fc.array(mazeCellGenerator, { minLength: 10, maxLength: 100 }),
    (cells) => {
      const maze = createMazeFromCells(cells);
      expect(maze.isSolvable()).toBe(true);
    }
  ),
  { numRuns: 100 }
);
```

#### Game State Generator
```typescript
// Generates complete game states for integration testing
const gameStateGenerator = fc.record({
  ghostPosition: vectorGenerator,
  levelProgress: fc.integer({ min: 0, max: 100 }),
  currentLevel: fc.integer({ min: 1, max: 30 }),
  abilities: fc.record({
    phase: fc.record({
      charges: fc.integer({ min: 0, max: 3 }),
      cooldownRemaining: fc.integer({ min: 0, max: 5000 })
    }),
    possess: fc.record({
      charges: fc.integer({ min: 0, max: 3 }),
      cooldownRemaining: fc.integer({ min: 0, max: 5000 })
    }),
    sense: fc.record({
      charges: fc.integer({ min: 0, max: 3 }),
      cooldownRemaining: fc.integer({ min: 0, max: 5000 })
    }),
    speedBoost: fc.record({
      charges: fc.integer({ min: 0, max: 3 }),
      cooldownRemaining: fc.integer({ min: 0, max: 5000 })
    })
  }),
  inventory: fc.array(
    fc.record({
      type: fc.constantFrom('CLUE', 'LORE', 'ABILITY_CHARGE', 'COSMETIC'),
      id: fc.string({ minLength: 1 })
    }),
    { maxLength: 20 }
  )
});

// Usage: Test complete game flows
fc.assert(
  fc.property(gameStateGenerator, (state) => {
    const game = new GameManager();
    game.loadState(state);
    
    // Verify state is correctly loaded
    expect(game.getGhostPosition()).toEqual(state.ghostPosition);
    expect(game.getCurrentLevel()).toBe(state.currentLevel);
  }),
  { numRuns: 50 }
);
```

#### Ability Configuration Generator
```typescript
// Generates valid ability configurations
const abilityConfigGenerator = fc.record({
  type: fc.constantFrom('PHASE', 'POSSESS', 'SENSE', 'SPEED_BOOST'),
  maxCharges: fc.integer({ min: 1, max: 5 }),
  cooldownMs: fc.integer({ min: 1000, max: 30000 }),
  durationMs: fc.integer({ min: 1000, max: 10000 }),
  cost: fc.integer({ min: 0, max: 100 })
});

// Usage: Test ability system with various configurations
fc.assert(
  fc.property(abilityConfigGenerator, (config) => {
    const ability = new Ability(config);
    expect(ability.maxCharges).toBeGreaterThan(0);
    expect(ability.cooldownMs).toBeGreaterThan(0);
  }),
  { numRuns: 100 }
);
```

#### Maze Configuration Generator
```typescript
// Generates realistic maze configurations
const mazeConfigGenerator = fc.record({
  type: fc.constantFrom('LINEAR', 'MULTI_LAYERED', 'TIME_CHANGING', 'SHADOW', 'MEMORY'),
  difficulty: fc.integer({ min: 1, max: 10 }),
  width: fc.integer({ min: 10, max: 50 }),
  height: fc.integer({ min: 10, max: 50 }),
  layers: fc.integer({ min: 1, max: 5 }),
  obstacleCount: fc.integer({ min: 0, max: 20 }),
  collectibleCount: fc.integer({ min: 0, max: 15 })
});

// Usage: Test maze generation with various parameters
fc.assert(
  fc.property(mazeConfigGenerator, (config) => {
    const maze = mazeGenerator.generate(config);
    expect(maze.width).toBe(config.width);
    expect(maze.height).toBe(config.height);
    expect(maze.isSolvable()).toBe(true);
  }),
  { numRuns: 100 }
);
```

#### Performance Metrics Generator
```typescript
// Generates realistic player performance data
const performanceMetricsGenerator = fc.record({
  completionTime: fc.integer({ min: 10, max: 600 }),
  hintsUsed: fc.integer({ min: 0, max: 10 }),
  attempts: fc.integer({ min: 1, max: 20 }),
  abilitiesUsed: fc.integer({ min: 0, max: 50 })
});

// Usage: Test difficulty scaling based on performance
fc.assert(
  fc.property(
    fc.array(performanceMetricsGenerator, { minLength: 1, maxLength: 10 }),
    (metrics) => {
      const system = new AdaptiveDifficultySystem();
      for (const m of metrics) {
        system.recordCompletion('level_1', m);
      }
      
      const skillLevel = system.calculateSkillLevel();
      expect(skillLevel).toBeDefined();
    }
  ),
  { numRuns: 100 }
);
```

### Generator Best Practices

1. **Constrain to Valid Input Space**: Generators should only produce valid inputs
   ```typescript
   // Good: Constrains to valid maze dimensions
   const validMazeSize = fc.integer({ min: 5, max: 100 });
   
   // Bad: Could generate invalid sizes
   const invalidSize = fc.integer();
   ```

2. **Use Realistic Ranges**: Match real game constraints
   ```typescript
   // Good: Matches actual game ability charges
   const charges = fc.integer({ min: 0, max: 3 });
   
   // Bad: Unrealistic values
   const charges = fc.integer({ min: 0, max: 1000 });
   ```

3. **Combine Generators for Complex Data**:
   ```typescript
   // Good: Builds complex state from simpler generators
   const complexState = fc.record({
     position: vectorGenerator,
     abilities: abilityGenerator,
     inventory: fc.array(collectibleGenerator)
   });
   ```

4. **Filter Invalid Combinations**:
   ```typescript
   // Good: Ensures level1 and level2 are different
   const twoLevels = fc.tuple(
     fc.string({ minLength: 1 }),
     fc.string({ minLength: 1 })
   ).filter(([a, b]) => a !== b);
   ```

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/tests/movement.property.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode (for development)
npm test -- --watch

# Run with specific number of iterations for property tests
npm test -- --testNamePattern="Property 9"

# Run tests matching a pattern
npm test -- --testNamePattern="movement"

# Generate coverage report
npm test -- --coverage --coverageReporters=html
```

### Writing New Tests

#### 1. Property-Based Tests
Use fast-check for invariant validation across many random inputs:

```typescript
// Feature: chain-ledge-game, Property X: Description
fc.assert(
  fc.property(
    testDataGenerator,
    (data) => {
      // Setup
      const result = functionUnderTest(data);
      
      // Verify invariant - return boolean
      return invariantHolds(result);
    }
  ),
  { numRuns: 100 }
);
```

**When to use**: Testing universal properties that should hold for all valid inputs

#### 2. Unit Tests
Test individual functions with known inputs/outputs:

```typescript
describe('GhostCharacter', () => {
  it('should move in specified direction', () => {
    const ghost = new GhostCharacter({ x: 0, y: 0 });
    ghost.move(Direction.NORTH, 100);
    
    expect(ghost.position.y).toBeLessThan(0);
  });
});
```

**When to use**: Testing specific behaviors, edge cases, error conditions

#### 3. Integration Tests
Test system interactions:

```typescript
describe('Level Completion Flow', () => {
  it('should unlock next level when current level completes', () => {
    const game = new GameManager();
    game.loadLevel('level_1');
    game.completeLevel();
    
    expect(game.isLevelUnlocked('level_2')).toBe(true);
  });
});
```

**When to use**: Testing interactions between multiple systems

#### 4. Edge Cases
Include boundary conditions and error states:

```typescript
describe('Edge Cases', () => {
  it('should handle empty maze', () => {
    const maze = new Maze({ width: 0, height: 0 });
    expect(maze.isSolvable()).toBe(false);
  });
  
  it('should handle maximum ability charges', () => {
    const ability = new Ability({ maxCharges: 3 });
    ability.addCharge();
    ability.addCharge();
    ability.addCharge();
    ability.addCharge(); // Should not exceed max
    
    expect(ability.charges).toBe(3);
  });
});
```

### Test Structure

```typescript
/**
 * Property-based tests for [System Name]
 */

import fc from 'fast-check';
import { SystemUnderTest } from '../systems/SystemUnderTest';

describe('[System Name] Properties', () => {
  /**
   * Property X: [Description]
   * [Detailed explanation of what invariant should hold]
   */
  describe('Property X: [Description]', () => {
    it('should validate invariant', () => {
      fc.assert(
        fc.property(
          testDataGenerator,
          (data) => {
            // Setup
            const system = new SystemUnderTest();
            const result = system.operation(data);
            
            // Verify invariant
            return invariantHolds(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case: [specific edge case]', () => {
      fc.assert(
        fc.property(
          edgeCaseGenerator,
          (data) => {
            const system = new SystemUnderTest();
            const result = system.operation(data);
            
            return edgeCaseInvariant(result);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
```

### Test Naming Conventions

- **Property tests**: `Property X: [Description]` - matches design document
- **Unit tests**: `should [expected behavior]` - describes what should happen
- **Integration tests**: `should [action] when [condition]` - describes flow
- **Edge cases**: `should handle [edge case]` - describes boundary condition

### Debugging Failed Tests

1. **Identify the failing input**: fast-check shows the counterexample
2. **Reproduce locally**: Use the exact input to debug
3. **Check the invariant**: Verify the property is correctly stated
4. **Review the implementation**: Fix the code or adjust the property
5. **Add unit test**: Create a unit test for the specific case

Example:
```typescript
// If property test fails with: { x: 5, y: 10 }
it('should handle specific case', () => {
  const result = functionUnderTest({ x: 5, y: 10 });
  expect(result).toBe(expectedValue);
});
```

### Performance Considerations

- **Property test iterations**: Default 100, increase for critical properties
- **Generator complexity**: Keep generators simple to avoid slowdown
- **Test isolation**: Each test should be independent
- **Async tests**: Use `fc.asyncProperty` for async operations

```typescript
// Async property test
fc.assert(
  fc.asyncProperty(
    testDataGenerator,
    async (data) => {
      const result = await asyncFunction(data);
      return invariantHolds(result);
    }
  ),
  { numRuns: 100 }
);
```

## Edge Cases and Known Limitations

### Edge Cases Covered

#### Maze Generation
- **Empty mazes**: Mazes with no valid paths (should fail solvability check)
- **Single-cell mazes**: Minimal maze with entrance = exit
- **Mazes with all walls**: No traversable cells (should be rejected)
- **Maximum complexity**: Largest maze with all features enabled
- **Minimum complexity**: Simplest valid maze configuration

#### Movement and Collision
- **Ghost at maze boundaries**: Position at edges (0,0) and (width-1, height-1)
- **Ghost in corner**: Surrounded by walls on multiple sides
- **Simultaneous collisions**: Multiple obstacles at same position
- **Rapid direction changes**: Input changes faster than movement updates
- **Zero velocity**: Ghost with no movement speed

#### Abilities
- **Simultaneous ability activations**: Multiple abilities used at same time
- **Ability with zero charges**: Attempting to use ability with no charges
- **Cooldown expiration**: Ability becoming available at exact cooldown time
- **Maximum charges**: Ability at max charges receiving additional charge
- **Ability duration expiration**: Ability effect ending at exact duration time

#### Persistence
- **Save/load with corrupted data**: Invalid JSON or missing fields
- **Save to full storage**: Storage quota exceeded
- **Load non-existent save**: Attempting to load save that doesn't exist
- **Concurrent save operations**: Multiple saves triggered simultaneously
- **Save during critical operation**: Save triggered during ability activation

#### Story and Progression
- **All levels completed**: Reaching end of available content
- **No levels completed**: Starting fresh game
- **Partial chapter completion**: Some but not all chapter levels done
- **Memory unlock without level completion**: Attempting to access locked memory
- **Narrative skip during cutscene**: Skipping at exact cutscene boundaries

#### Hint System
- **Hint with zero charges**: Requesting hint with no charges available
- **Hint cooldown at boundary**: Requesting hint at exact cooldown expiration
- **Multiple hint requests**: Rapid consecutive hint requests
- **Hint in unsolvable state**: Requesting hint when puzzle has no solution

#### Obstacles
- **Guard at patrol path boundary**: Guard at start/end of patrol path
- **Guard collision at exact position**: Ghost and guard at same cell
- **Trap trigger at boundary**: Trap trigger zone at maze edge
- **Multiple traps at same location**: Multiple traps overlapping

#### Analytics
- **Network failures during transmission**: Connection lost mid-transmission
- **Empty analytics queue**: Flushing with no events
- **Duplicate events**: Same event logged multiple times
- **Large event payload**: Event with maximum data size

#### Cosmetics
- **Cosmetic application to invalid ghost**: Ghost in invalid state
- **Cosmetic with missing assets**: Cosmetic skin files not found
- **Cosmetic unlock without purchase**: Attempting to use unpurchased cosmetic
- **Multiple cosmetics applied**: Applying cosmetic while another is active

### Known Limitations

#### Property Test Limitations
- **Iteration count**: Default 100 iterations (can be increased for critical properties)
  - Trade-off: More iterations = higher confidence but slower tests
  - Recommendation: Use 100 for most properties, 200+ for critical ones
- **Shrinking**: fast-check shrinks counterexamples to minimal failing case
  - May not always find the absolute smallest counterexample
  - Usually sufficient for debugging

#### Timing-Dependent Tests
- **Flaky on slow systems**: Tests with time-based assertions may fail on slow hardware
  - Mitigation: Use generous time windows in tests
  - Example: `expect(time).toBeLessThan(5000)` instead of `toBeLessThan(100)`
- **Frame rate dependent**: Tests assuming 60 FPS may fail on different refresh rates
  - Mitigation: Use delta time calculations instead of frame counts

#### Network and External Services
- **Analytics tests mock network calls**: Real network testing requires integration environment
  - Current: Tests verify event structure and batching logic
  - Future: Add integration tests with real analytics backend
- **Ad provider mocked**: Ad loading/display not tested with real ad networks
  - Current: Tests verify reward fulfillment logic
  - Future: Add integration tests with real ad providers
- **Purchase verification mocked**: Real purchase verification requires platform integration
  - Current: Tests verify purchase flow and inventory updates
  - Future: Add integration tests with real app stores

#### Audio and Visual Testing
- **Audio tests verify playback calls**: Don't test actual audio output
  - Current: Tests verify correct audio file is queued
  - Future: Add audio output verification with audio analysis
- **Visual tests verify rendering calls**: Don't test actual visual output
  - Current: Tests verify correct sprites are rendered
  - Future: Add visual regression testing with screenshot comparison
- **Animation tests verify state changes**: Don't test smooth animation playback
  - Current: Tests verify animation state transitions
  - Future: Add frame-by-frame animation verification

#### Platform-Specific Limitations
- **Touch input tests**: Simulated on desktop, may behave differently on actual touch devices
  - Mitigation: Manual testing on target devices
- **Mobile performance tests**: Run on desktop, may not reflect mobile performance
  - Mitigation: Profile on actual target devices
- **Storage tests**: IndexedDB behavior may differ across browsers
  - Mitigation: Test on target browsers

#### Data Size Limitations
- **Large maze generation**: Very large mazes (>1000x1000) may timeout
  - Mitigation: Limit maze size in generators
  - Recommendation: Max 100x100 for tests
- **Large save data**: Very large save files may exceed storage limits
  - Mitigation: Compress save data or implement chunking
- **Large analytics queue**: Thousands of events may cause memory issues
  - Mitigation: Implement event batching and periodic flushing

### Mitigating Known Limitations

#### For Timing Issues
```typescript
// Use generous time windows
expect(completionTime).toBeLessThan(5000); // 5 seconds

// Use relative timing
const startTime = Date.now();
operation();
const elapsed = Date.now() - startTime;
expect(elapsed).toBeLessThan(1000);
```

#### For Flaky Tests
```typescript
// Retry flaky tests
jest.retryTimes(2);

// Use longer timeouts
jest.setTimeout(10000);

// Avoid exact timing assertions
expect(value).toBeCloseTo(expected, 1); // Allow 1 decimal place variance
```

#### For External Services
```typescript
// Mock external services
jest.mock('../services/AnalyticsService');

// Verify mock was called correctly
expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(expectedEvent);

// Add integration tests separately
describe('Integration: Real Analytics', () => {
  // These run in separate CI pipeline
});
```

## Coverage Metrics

- **Line Coverage**: 85%+
- **Branch Coverage**: 80%+
- **Function Coverage**: 90%+
- **Statement Coverage**: 85%+

## Continuous Integration

All tests run automatically on:
- Pull requests
- Commits to main branch
- Nightly builds

Tests must pass before merging to production.

### CI Configuration

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - run: npm test -- --testNamePattern="Property"
      - uses: codecov/codecov-action@v2
```

## Best Practices for Test Development

### 1. Test Organization
- **Group by system**: Movement tests, ability tests, etc.
- **Group by type**: Properties, unit tests, integration tests
- **Use descriptive names**: Test names should explain what's being tested

```typescript
describe('GhostCharacter', () => {
  describe('Movement', () => {
    describe('Property 1: Input-driven movement', () => {
      it('should move in specified direction', () => {});
    });
  });
});
```

### 2. Test Independence
- Each test should be independent and not rely on other tests
- Use setup/teardown to initialize state
- Avoid shared state between tests

```typescript
describe('LevelManager', () => {
  let manager: LevelManager;
  
  beforeEach(() => {
    manager = new LevelManager();
  });
  
  afterEach(() => {
    manager.cleanup();
  });
  
  it('test 1', () => {
    // manager is fresh for each test
  });
});
```

### 3. Assertion Clarity
- Use clear, specific assertions
- Avoid multiple assertions in one test (when possible)
- Use descriptive error messages

```typescript
// Good
expect(ghost.position.x).toBe(10);
expect(ghost.position.y).toBe(20);

// Better - more specific
expect(ghost.position).toEqual({ x: 10, y: 20 });

// With message
expect(ghost.canMove(Direction.NORTH)).toBe(true, 
  'Ghost should be able to move north from current position');
```

### 4. Property Test Design
- **Invariants should be universal**: Hold for all valid inputs
- **Generators should be realistic**: Match actual game constraints
- **Shrinking should be meaningful**: Counterexample should be minimal

```typescript
// Good property: Universal invariant
fc.property(
  mazeConfigGenerator,
  (config) => {
    const maze = generate(config);
    return maze.isSolvable(); // True for all valid configs
  }
);

// Bad property: Specific example
fc.property(
  fc.constant({ width: 10, height: 10 }),
  (config) => {
    // This is just a unit test, not a property test
  }
);
```

### 5. Error Handling
- Test error conditions explicitly
- Verify error messages are helpful
- Test recovery from errors

```typescript
describe('Error Handling', () => {
  it('should throw on invalid maze config', () => {
    expect(() => {
      new Maze({ width: -1, height: 10 });
    }).toThrow('Width must be positive');
  });
  
  it('should recover from save failure', async () => {
    const service = new PersistenceService();
    service.simulateFailure();
    
    const result = await service.save('key', data);
    expect(result).toBe(true); // Should retry and succeed
  });
});
```

### 6. Async Testing
- Use `async/await` for clarity
- Test both success and failure paths
- Handle timeouts appropriately

```typescript
describe('Async Operations', () => {
  it('should load level data', async () => {
    const manager = new LevelManager();
    const level = await manager.loadLevel('level_1');
    
    expect(level).toBeDefined();
    expect(level.id).toBe('level_1');
  });
  
  it('should handle load failure', async () => {
    const manager = new LevelManager();
    manager.simulateNetworkFailure();
    
    await expect(manager.loadLevel('level_1')).rejects.toThrow();
  });
});
```

## Future Testing Improvements

### Phase 1: Enhanced Coverage
1. **Visual regression testing**: Screenshot comparison for UI components
   - Tool: Percy or Chromatic
   - Benefit: Catch unintended visual changes
   
2. **Performance benchmarking**: Track performance over time
   - Tool: Lighthouse or custom benchmarks
   - Benefit: Prevent performance regressions
   
3. **Expanded property iterations**: Increase confidence for critical properties
   - Current: 100 iterations
   - Target: 500+ for critical properties
   - Benefit: Higher confidence in correctness

### Phase 2: Integration Testing
1. **End-to-end tests**: Real browser automation
   - Tool: Cypress or Playwright
   - Benefit: Test complete user flows
   
2. **Real analytics integration**: Test with actual analytics backend
   - Current: Mocked
   - Target: Real Firebase integration
   - Benefit: Verify analytics data flow
   
3. **Real ad provider integration**: Test with actual ad networks
   - Current: Mocked
   - Target: Real ad provider integration
   - Benefit: Verify ad loading and rewards

### Phase 3: Advanced Testing
1. **Stress testing**: Test system under high load
   - Scenario: 1000 concurrent players
   - Benefit: Identify scalability issues
   
2. **Chaos testing**: Inject failures and verify recovery
   - Scenario: Random network failures, storage errors
   - Benefit: Verify resilience
   
3. **Mutation testing**: Verify test quality
   - Tool: Stryker
   - Benefit: Ensure tests catch real bugs

### Phase 4: Continuous Improvement
1. **Test coverage tracking**: Monitor coverage trends
   - Target: Maintain 85%+ coverage
   - Alert: Coverage drops below threshold
   
2. **Flaky test detection**: Identify and fix unreliable tests
   - Tool: Custom CI analysis
   - Benefit: Reliable test suite
   
3. **Performance profiling**: Track test execution time
   - Target: Full suite < 5 minutes
   - Alert: Tests take > 10 minutes

## Troubleshooting Common Test Issues

### Property Test Fails with Counterexample

1. **Understand the counterexample**
   ```typescript
   // fast-check shows: { x: 5, y: 10 }
   // This is the minimal failing input
   ```

2. **Reproduce locally**
   ```typescript
   it('should handle specific case', () => {
     const result = functionUnderTest({ x: 5, y: 10 });
     expect(result).toBe(expectedValue);
   });
   ```

3. **Determine root cause**
   - Is the test wrong? (Adjust property)
   - Is the code wrong? (Fix implementation)
   - Is the spec wrong? (Update requirements)

### Flaky Tests

1. **Identify the flakiness**
   - Run test multiple times: `npm test -- --testNamePattern="test name" --runInBand`
   - Check for timing issues or randomness

2. **Fix the flakiness**
   ```typescript
   // Bad: Timing-dependent
   setTimeout(() => expect(value).toBe(expected), 100);
   
   // Good: Wait for condition
   await waitFor(() => expect(value).toBe(expected));
   ```

3. **Add retry logic if necessary**
   ```typescript
   jest.retryTimes(2);
   ```

### Test Timeout

1. **Increase timeout**
   ```typescript
   jest.setTimeout(10000); // 10 seconds
   ```

2. **Optimize test**
   - Reduce generator complexity
   - Reduce property iterations
   - Use mocks for slow operations

3. **Profile the test**
   ```bash
   npm test -- --detectOpenHandles
   ```

### Memory Issues

1. **Check for memory leaks**
   ```bash
   npm test -- --detectLeaks
   ```

2. **Clean up resources**
   ```typescript
   afterEach(() => {
     system.cleanup();
     jest.clearAllMocks();
   });
   ```

3. **Reduce test data size**
   ```typescript
   // Reduce array sizes in generators
   fc.array(generator, { maxLength: 10 })
   ```
