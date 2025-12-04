/**
 * Game Manager
 * Coordinates all game systems and manages game state
 */

import Phaser from 'phaser';

export enum GameState {
  MENU = 'menu',
  GAMEPLAY = 'gameplay',
  STORY = 'story',
  LEVEL_COMPLETE = 'level_complete',
  PAUSED = 'paused',
  SETTINGS = 'settings',
  SHOP = 'shop'
}

export interface GameStateTransition {
  from: GameState;
  to: GameState;
  timestamp: number;
}

export type GameEventType = 
  | 'state_changed'
  | 'level_started'
  | 'level_completed'
  | 'game_paused'
  | 'game_resumed'
  | 'ability_activated'
  | 'collectible_collected'
  | 'puzzle_solved';

export interface GameEvent {
  type: GameEventType;
  data?: any;
  timestamp: number;
}

export type GameEventHandler = (event: GameEvent) => void;

export class GameManager {
  private currentState: GameState = GameState.MENU;
  private previousState: GameState | null = null;
  private stateHistory: GameStateTransition[] = [];
  private eventHandlers: Map<GameEventType, Set<GameEventHandler>> = new Map();
  private isPaused: boolean = false;
  private scene: Phaser.Scene | null = null;
  private fixedTimeStep: number = 1000 / 60; // 60 FPS
  private accumulator: number = 0;
  private lastUpdateTime: number = 0;

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handler storage
   */
  private initializeEventHandlers(): void {
    const eventTypes: GameEventType[] = [
      'state_changed',
      'level_started',
      'level_completed',
      'game_paused',
      'game_resumed',
      'ability_activated',
      'collectible_collected',
      'puzzle_solved'
    ];

    for (const type of eventTypes) {
      this.eventHandlers.set(type, new Set());
    }
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return this.currentState;
  }

  /**
   * Get previous game state
   */
  getPreviousState(): GameState | null {
    return this.previousState;
  }

  /**
   * Transition to a new game state
   */
  transitionTo(newState: GameState): void {
    if (this.currentState === newState) {
      return;
    }

    const transition: GameStateTransition = {
      from: this.currentState,
      to: newState,
      timestamp: Date.now()
    };

    // Cleanup current state
    this.cleanupState(this.currentState);

    // Update state
    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateHistory.push(transition);

    // Initialize new state
    this.initializeState(newState);

    // Emit state change event
    this.emitEvent({
      type: 'state_changed',
      data: { from: this.previousState, to: newState },
      timestamp: Date.now()
    });
  }

  /**
   * Cleanup state before transition
   */
  private cleanupState(state: GameState): void {
    switch (state) {
      case GameState.GAMEPLAY:
        // Cleanup gameplay systems
        this.isPaused = false;
        break;
      case GameState.PAUSED:
        // Resume if transitioning away from pause
        break;
      case GameState.STORY:
        // Cleanup story display
        break;
      case GameState.LEVEL_COMPLETE:
        // Cleanup completion screen
        break;
      default:
        break;
    }
  }

  /**
   * Initialize state after transition
   */
  private initializeState(state: GameState): void {
    switch (state) {
      case GameState.MENU:
        // Initialize menu
        this.isPaused = false;
        break;
      case GameState.GAMEPLAY:
        // Initialize gameplay systems
        this.isPaused = false;
        this.lastUpdateTime = Date.now();
        this.accumulator = 0;
        break;
      case GameState.STORY:
        // Initialize story display
        this.isPaused = true;
        break;
      case GameState.PAUSED:
        // Pause game
        this.isPaused = true;
        break;
      case GameState.LEVEL_COMPLETE:
        // Initialize completion screen
        this.isPaused = true;
        break;
      default:
        break;
    }
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (this.currentState === GameState.GAMEPLAY && !this.isPaused) {
      this.transitionTo(GameState.PAUSED);
      this.emitEvent({
        type: 'game_paused',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Resume the game
   */
  resume(): void {
    if (this.currentState === GameState.PAUSED && this.previousState === GameState.GAMEPLAY) {
      this.transitionTo(GameState.GAMEPLAY);
      this.emitEvent({
        type: 'game_resumed',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check if game is paused
   */
  isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Update game loop with fixed timestep
   */
  update(deltaTime: number): void {
    if (this.isPaused || this.currentState !== GameState.GAMEPLAY) {
      return;
    }

    // Accumulate time
    this.accumulator += deltaTime;

    // Update with fixed timestep
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedUpdate(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }
  }

  /**
   * Fixed timestep update for physics
   */
  private fixedUpdate(deltaTime: number): void {
    // This would update physics and game logic
    // Called by systems that need fixed timestep
  }

  /**
   * Get fixed timestep value
   */
  getFixedTimeStep(): number {
    return this.fixedTimeStep;
  }

  /**
   * Set fixed timestep value
   */
  setFixedTimeStep(timeStep: number): void {
    if (timeStep > 0) {
      this.fixedTimeStep = timeStep;
    }
  }

  /**
   * Register event handler
   */
  on(eventType: GameEventType, handler: GameEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.add(handler);
    }
  }

  /**
   * Unregister event handler
   */
  off(eventType: GameEventType, handler: GameEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit game event
   */
  emitEvent(event: GameEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Get state history
   */
  getStateHistory(): GameStateTransition[] {
    return [...this.stateHistory];
  }

  /**
   * Clear state history
   */
  clearStateHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Set current scene
   */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * Get current scene
   */
  getScene(): Phaser.Scene | null {
    return this.scene;
  }

  /**
   * Reset game manager
   */
  reset(): void {
    this.currentState = GameState.MENU;
    this.previousState = null;
    this.stateHistory = [];
    this.isPaused = false;
    this.accumulator = 0;
    this.lastUpdateTime = 0;
    
    // Clear all event handlers
    for (const handlers of this.eventHandlers.values()) {
      handlers.clear();
    }
    this.initializeEventHandlers();
  }

  /**
   * Get game manager state for save
   */
  getManagerState(): {
    currentState: GameState;
    previousState: GameState | null;
    isPaused: boolean;
  } {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      isPaused: this.isPaused
    };
  }

  /**
   * Load game manager state from save
   */
  loadManagerState(state: {
    currentState: GameState;
    previousState: GameState | null;
    isPaused: boolean;
  }): void {
    this.currentState = state.currentState;
    this.previousState = state.previousState;
    this.isPaused = state.isPaused;
  }
}

/**
 * Singleton instance
 */
let gameManagerInstance: GameManager | null = null;

export function getGameManager(): GameManager {
  if (!gameManagerInstance) {
    gameManagerInstance = new GameManager();
  }
  return gameManagerInstance;
}

export function resetGameManager(): void {
  if (gameManagerInstance) {
    gameManagerInstance.reset();
  }
  gameManagerInstance = null;
}
