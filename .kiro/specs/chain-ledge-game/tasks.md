# Implementation Plan

- [x] 1. Set up project structure and development environment


  - Initialize TypeScript project with Phaser 3 game engine
  - Configure build system (Webpack/Vite) for development and production
  - Set up testing framework (Jest + fast-check for property-based testing)
  - Create directory structure: src/{core, systems, components, utils, types, tests}
  - Install dependencies: Phaser 3, TypeScript, Jest, fast-check, Redux/MobX
  - Configure TypeScript with strict mode and path aliases
  - _Requirements: 10.1, 10.2_


- [x] 2. Implement core data models and types


  - Define TypeScript interfaces for Vector2D, Cell, WallSet, Maze, MazeConfig
  - Create enums for MazeType, CellType, ObstacleType, CollectibleType, PuzzleType, AbilityType
  - Implement data models for GhostCharacter, Ability, Obstacle, Collectible, PuzzleElement
  - Define interfaces for game configuration (GameConfig, AbilityConfig, DifficultyConfig)
  - Create type definitions for save data structures (GameSaveData, LevelProgress, LevelStats)
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2.1 Write property test for data model serialization


  - **Property 28: Save/load round trip**

  - **Validates: Requirements 8.4, 11.1, 11.2, 11.3**

- [x] 3. Implement maze generation system


  - Create MazeGenerator interface with generate() and validate() methods
  - Implement ProceduralMazeGenerator using recursive backtracking algorithm
  - Implement pathfinding algorithm (A* or BFS) for solvability validation
  - Create HybridMazeGenerator that combines procedural generation with templates
  - Implement maze template loading system for handcrafted designs
  - Add maze complexity calculation based on size, obstacles, and puzzle count
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.1 Write property test for maze solvability


  - **Property 9: Maze solvability guarantee**
  - **Validates: Requirements 3.2**


- [x] 3.2 Write property test for difficulty progression

  - **Property 10: Difficulty progression**
  - **Validates: Requirements 3.3**

- [x] 4. Implement specialized maze types




  - Create MemoryMaze class that removes traversed paths from visibility
  - Implement ShadowMaze class with limited visibility radius around ghost
  - Create MultiLayeredMaze class with vertical navigation between floors
  - Implement TimeChangingMaze class with dynamic wall transformations
  - Add maze type factory for instantiating appropriate maze implementations
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 4.1 Write property test for memory maze behavior


  - **Property 11: Memory maze path removal**
  - **Validates: Requirements 3.4**

- [x] 4.2 Write property test for shadow maze visibility

  - **Property 12: Shadow maze visibility constraint**
  - **Validates: Requirements 3.5**


- [x] 4.3 Write property test for multi-layer navigation


  - **Property 13: Multi-layer navigation**
  - **Validates: Requirements 3.6**

- [x] 5. Implement ghost character and movement system






  - Create GhostCharacter class with position, velocity, and state management
  - Implement input handler for touch and keyboard directional controls
  - Add movement logic with consistent speed and immediate stop on input release
  - Implement collision detection system for walls, obstacles, and collectibles
  - Create hovering animation system with smooth transitions
  - Add position update and rendering pipeline
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5.1 Write property test for input-driven movement


  - **Property 1: Input-driven movement consistency**
  - **Validates: Requirements 1.1, 1.4**

- [x] 5.2 Write property test for wall collision


  - **Property 2: Wall collision prevention**
  - **Validates: Requirements 1.3**


- [x] 5.3 Write property test for collision detection


  - **Property 3: Collision detection during movement**
  - **Validates: Requirements 1.5, 4.1**

- [x] 6. Implement ability system foundation



  - Create Ability base class with charges, cooldown, and activation logic
  - Implement CooldownManager for tracking and updating ability cooldowns
  - Create AbilitySystem class to manage all abilities and coordinate activation
  - Add ability state tracking (active, charges remaining, cooldown remaining)
  - Implement ability charge restoration when cooldown completes
  - Create visual feedback system for ability activation and cooldown status
  - _Requirements: 2.5, 2.6_

- [x] 6.1 Write property test for ability charge management



  - **Property 8: Ability charge and cooldown management**
  - **Validates: Requirements 2.5, 2.6**

- [x] 7. Implement individual ghost abilities



  - Create PhaseAbility class that allows passage through phasing walls
  - Implement PossessAbility class for controlling objects and solving puzzles
  - Create SenseAbility class that reveals hidden routes and clues
  - Implement SpeedBoostAbility class that increases movement speed temporarily
  - Add ability-specific visual and audio effects
  - Integrate abilities with ghost character and maze system
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7.1 Write property test for phase ability


  - **Property 4: Phase ability wall penetration**
  - **Validates: Requirements 2.1**

- [x] 7.2 Write property test for possession ability

  - **Property 5: Possession control transfer**
  - **Validates: Requirements 2.2**

- [x] 7.3 Write property test for sense ability

  - **Property 6: Sense ability revelation**
  - **Validates: Requirements 2.3**

- [x] 7.4 Write property test for speed boost

  - **Property 7: Speed boost effect**
  - **Validates: Requirements 2.4**

- [x] 8. Implement puzzle system




  - Create PuzzleElement base class with solve conditions and unlock paths
  - Implement possession-based puzzles requiring object manipulation
  - Create sequence puzzles requiring specific action order
  - Implement timing puzzles with time-sensitive mechanics
  - Add collection puzzles requiring gathering multiple items
  - Create puzzle solution validation and path unlocking logic
  - _Requirements: 4.2, 4.3_


- [x] 8.1 Write property test for puzzle unlocking



  - **Property 14: Puzzle solution unlocks paths**
  - **Validates: Requirements 4.2**



- [x] 8.2 Write property test for exit activation


  - **Property 15: Exit activation condition**
  - **Validates: Requirements 4.3**

- [x] 9. Implement obstacles and environmental threats


  - Create Obstacle base class with position and behavior patterns
  - Implement PhantomGuard class with patrol path following
  - Create CursedTrap class with trigger zones and effect application
  - Add collision detection between ghost and obstacles
  - Implement checkpoint reset logic when ghost collides with guards
  - Create trap effect system (cooldown increase, movement restriction)
  - Add audio cues for guard proximity
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9.1 Write property test for guard patrol

  - **Property 23: Guard patrol path following**
  - **Validates: Requirements 7.1**


- [x] 9.2 Write property test for guard collision

  - **Property 24: Guard collision resets position**
  - **Validates: Requirements 7.2**

- [x] 9.3 Write property test for trap effects

  - **Property 25: Trap activation applies effects**
  - **Validates: Requirements 7.3, 7.4**

- [x] 10. Implement collectibles and inventory system




  - Create Collectible base class with type, position, and collection state
  - Implement inventory system for storing collected items
  - Add clue collectibles that provide puzzle hints
  - Create lore collectibles for story content
  - Implement ability charge collectibles
  - Add cosmetic unlock collectibles
  - Create collection feedback (visual/audio) system
  - _Requirements: 4.1, 5.2, 9.1_

- [x] 10.1 Write property test for collection

  - **Property 18: Collection addition**
  - **Validates: Requirements 5.2, 9.1**

- [x] 11. Implement level manager and progression system





  - Create LevelManager class for tracking progression and unlocks
  - Implement level loading from configuration files
  - Add level completion detection when ghost reaches portal exit
  - Create level unlock logic for sequential progression
  - Implement chapter progression and unlock system
  - Add level statistics tracking (time, attempts, hints used)
  - Create level selection interface data provider
  - _Requirements: 4.4, 8.1, 8.2, 8.3_

- [x] 11.1 Write property test for level completion


  - **Property 16: Level completion triggers progression**
  - **Validates: Requirements 4.4, 8.1**

- [x] 11.2 Write property test for chapter progression

  - **Property 26: Chapter progression**
  - **Validates: Requirements 8.2**

- [x] 11.3 Write property test for level list accuracy

  - **Property 27: Level list accuracy**
  - **Validates: Requirements 8.3**

- [x] 12. Implement story engine and narrative system



  - Create StoryEngine class for managing narrative progression
  - Implement Memory data structure for story fragments
  - Add memory unlock logic triggered by level completion
  - Create lore collection system for optional story items
  - Implement narrative display system with pause functionality
  - Add chapter cutscene triggering when all chapter levels complete
  - Create skip and replay controls for narrative content
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 12.1 Write property test for memory unlock

  - **Property 17: Memory unlock on level completion**
  - **Validates: Requirements 5.1**

- [x] 12.2 Write property test for chapter cutscene

  - **Property 19: Chapter completion triggers cutscene**
  - **Validates: Requirements 5.3**

- [x] 12.3 Write property test for gameplay pause

  - **Property 20: Gameplay pause during narrative**
  - **Validates: Requirements 5.4**

- [x] 13. Implement hint system



  - Create HintSystem class with cooldown management
  - Implement contextual hint generation based on current puzzle state
  - Add hint charge system with cooldown timer
  - Create hint display with visual highlighting of relevant elements
  - Implement reward-based ad integration for extra hint charges
  - Add hint button UI with disabled state during cooldown
  - _Requirements: 6.1, 6.2, 6.3_


- [x] 13.1 Write property test for hint availability

  - **Property 21: Hint availability after cooldown**
  - **Validates: Requirements 6.1, 6.2**


- [x] 13.2 Write property test for ad rewards


  - **Property 22: Ad reward grants hint charge**
  - **Validates: Requirements 6.3**

- [x] 14. Implement persistence service and save system



  - Create PersistenceService interface with save/load/delete methods
  - Implement IndexedDB adapter for web platform
  - Add AsyncStorage adapter for React Native platform
  - Create GameSaveData serialization and deserialization
  - Implement auto-save system with configurable interval
  - Add save-on-exit functionality for app backgrounding
  - Implement save retry logic with exponential backoff
  - Add save data validation and integrity checks
  - _Requirements: 8.4, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 14.1 Write property test for auto-save interval


  - **Property 30: Auto-save interval**
  - **Validates: Requirements 11.5**

- [x] 14.2 Write property test for save retry


  - **Property 31: Save retry on failure**
  - **Validates: Requirements 11.4**

- [x] 15. Implement analytics service



  - Create AnalyticsService interface for event tracking
  - Implement Firebase Analytics adapter
  - Add event logging for level completion, ability usage, hint requests
  - Create analytics data aggregation and batching
  - Implement periodic data transmission with retry logic
  - Add session metrics tracking (time, attempts, performance)
  - Create privacy-compliant data collection (no PII)
  - _Requirements: 8.5, 12.1, 12.2, 12.3, 12.4_

- [x] 15.1 Write property test for event logging


  - **Property 35: Event logging completeness**
  - **Validates: Requirements 12.1, 12.2, 12.3**

- [x] 15.2 Write property test for analytics transmission

  - **Property 36: Analytics data transmission**
  - **Validates: Requirements 12.4**

- [x] 15.3 Write property test for session metrics

  - **Property 29: Session metrics tracking**
  - **Validates: Requirements 8.5**

- [x] 16. Implement cosmetic system



  - Create cosmetic skin data structures and configuration
  - Implement cosmetic unlock and collection system
  - Add cosmetic selection and application to ghost character
  - Create cosmetic rendering system that replaces default sprites
  - Implement cosmetic preview functionality
  - Add cosmetic persistence to save data
  - Ensure cosmetics don't affect gameplay mechanics
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 16.1 Write property test for cosmetic application


  - **Property 32: Cosmetic application**
  - **Validates: Requirements 9.2**


- [x] 16.2 Write property test for cosmetic neutrality


  - **Property 33: Cosmetic gameplay neutrality**
  - **Validates: Requirements 9.3**


- [x] 16.3 Write property test for cosmetic list


  - **Property 34: Cosmetic list accuracy**
  - **Validates: Requirements 9.4**

- [x] 17. Implement audio system



  - Create AudioManager for managing sound effects and music
  - Implement ability sound effects with echo processing
  - Add environmental ambient sounds (whispers, rumbles)
  - Create background music system with theme switching per maze type
  - Implement audio cue system for guard proximity
  - Add volume controls for music, SFX, and voice separately
  - Create audio asset loading and caching system
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 17.1 Write property test for event-triggered audio


  - **Property 37: Event-triggered audio playback**
  - **Validates: Requirements 13.1, 13.2, 13.3**

- [x] 18. Implement monetization system
  - Create shop interface data provider with available items
  - Implement purchase flow for cosmetics, ability bundles, chapter unlocks
  - Add purchase verification and fulfillment logic
  - Create reward-based ad integration (extra hints, ability charges)
  - Implement ad loading and display system
  - Add purchase persistence to save data
  - Ensure core content is accessible without purchases
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 18.1 Write property test for shop inventory
  - **Property 38: Shop inventory accuracy**
  - **Validates: Requirements 14.1**

- [x] 18.2 Write property test for purchase fulfillment
  - **Property 39: Purchase fulfillment**
  - **Validates: Requirements 14.2**

- [x] 18.3 Write property test for core content accessibility
  - **Property 40: Core content accessibility**
  - **Validates: Requirements 14.3**

- [x] 18.4 Write property test for ad rewards
  - **Property 41: Ad reward fulfillment**
  - **Validates: Requirements 14.4**

- [x] 19. Implement adaptive difficulty system
  - Create difficulty tracking system for player performance
  - Implement failure counter per level
  - Add difficulty adjustment offer system after threshold failures
  - Create performance analysis (completion time, hint usage, attempts)
  - Implement skill level calculation algorithm
  - Add difficulty scaling based on performance metrics
  - Ensure adjustments are optional and level-specific
  - _Requirements: 15.1, 15.2, 15.4, 15.5_

- [x] 19.1 Write property test for failure-triggered assistance
  - **Property 42: Failure-triggered difficulty assistance**
  - **Validates: Requirements 15.1**

- [x] 19.2 Write property test for performance scaling
  - **Property 43: Performance-based difficulty scaling**
  - **Validates: Requirements 15.2**

- [x] 19.3 Write property test for adjustment scope
  - **Property 44: Difficulty adjustment scope**
  - **Validates: Requirements 15.4**

- [x] 19.4 Write property test for skill analysis
  - **Property 45: Skill level analysis**
  - **Validates: Requirements 15.5**

- [x] 20. Implement game state management
  - Create GameManager class for coordinating all systems
  - Implement game state machine (menu, gameplay, story, level complete, paused)
  - Add state transition logic with proper cleanup and initialization
  - Create event system for cross-component communication
  - Implement game loop with fixed timestep for physics
  - Add pause/resume functionality
  - Create scene management for different game screens
  - _Requirements: 1.1, 5.4, 10.1, 10.2_

- [x] 21. Create UI components
  - Implement main menu UI with level selection
  - Create in-game HUD showing abilities, charges, cooldowns
  - Add pause menu with settings and resume options
  - Implement hint button with cooldown display
  - Create level completion screen with statistics
  - Add story/narrative display UI with skip/replay controls
  - Implement shop interface for purchases
  - Create customization interface for cosmetics
  - Add settings menu for audio, controls, accessibility
  - _Requirements: 6.1, 8.3, 9.4, 14.1_

- [x] 22. Implement rendering and visual effects
  - Create sprite rendering system for ghost, obstacles, collectibles
  - Implement maze cell rendering with wall visualization
  - Add particle effects for ability activation
  - Create visual feedback for collectible pickup
  - Implement lighting effects for shadow mazes
  - Add transition effects for level changes
  - Create animation system for ghost hovering and movement
  - Implement visual indicators for interactive elements
  - _Requirements: 1.2, 3.5, 13.4_

- [x] 23. Create level content and configurations
  - Design and implement tutorial level introducing mechanics
  - Create Chapter 1 levels (5-7 levels) with progressive difficulty
  - Design handcrafted maze templates for key story moments
  - Implement level configuration files with maze parameters
  - Create puzzle configurations for each level
  - Add collectible placement data
  - Write story content for memories and lore items
  - Design chapter cutscene content
  - _Requirements: 3.1, 4.2, 5.1, 5.3_

- [x] 24. Implement error handling and validation
  - Add input validation for all player actions
  - Implement maze solvability validation before presentation
  - Create save data integrity validation
  - Add error logging system with context capture
  - Implement graceful degradation for network failures
  - Create user-friendly error messages and recovery options
  - Add retry logic for failed operations (save, analytics, ads)
  - Implement critical error handling with state preservation
  - _Requirements: 3.2, 11.4_

- [x] 25. Optimize performance
  - Implement sprite batching for maze rendering
  - Add viewport culling for large mazes
  - Create object pooling for frequently created objects
  - Implement texture atlas for efficient asset loading
  - Add asynchronous maze generation to avoid blocking
  - Optimize collision detection with spatial partitioning
  - Implement asset preloading and caching
  - Add memory management for level transitions
  - Profile and optimize to meet 30 FPS target on mobile
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 26. Implement accessibility features
  - Add high contrast mode for better visibility
  - Create colorblind-friendly palette options
  - Implement adjustable UI scale
  - Add subtitle/caption system for audio cues
  - Create visual alternatives for audio-only hints
  - Implement configurable control schemes
  - Ensure touch targets meet 44x44 pixel minimum
  - Add keyboard navigation for all UI elements
  - _Requirements: 1.1, 6.1_

- [x] 27. Add localization support
  - Externalize all UI strings to JSON resource files
  - Implement localization system with language switching
  - Add support for right-to-left languages
  - Create dynamic text sizing for different languages
  - Implement locale-specific date/time formatting
  - Add placeholder translations for key languages (English, Spanish, Chinese)
  - _Requirements: 5.1, 5.3_

- [x] 28. Final checkpoint - Ensure all tests pass

  - Run all unit tests and verify passing
  - Execute all property-based tests with 100+ iterations
  - Verify all 45 correctness properties are validated
  - Check test coverage meets minimum thresholds
  - Fix any failing tests or implementation bugs
  - Ensure all tests pass, ask the user if questions arise

- [x] 29. Create comprehensive test suite documentation
  - Document all property-based tests with examples
  - Create test data generators documentation
  - Write testing guidelines for future development
  - Document edge cases and known limitations

- [x] 30. Performance profiling and optimization
  - Profile frame rate across different devices
  - Measure and optimize memory usage
  - Benchmark maze generation times
  - Test save/load performance
  - Optimize asset loading times

- [x] 31. Integration testing
  - Test complete level flow from start to finish
  - Verify save/load preserves all game state
  - Test ability combinations in various scenarios
  - Verify analytics event flow
  - Test purchase flow end-to-end
