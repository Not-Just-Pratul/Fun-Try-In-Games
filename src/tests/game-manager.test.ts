/**
 * Tests for Game Manager
 */

import {
  GameManager,
  GameState,
  GameEvent,
  getGameManager,
  resetGameManager
} from '../core/GameManager';

describe('GameManager', () => {
  let gameManager: GameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  describe('State Management', () => {
    it('should start in MENU state', () => {
      expect(gameManager.getState()).toBe(GameState.MENU);
    });

    it('should transition between states', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);
      expect(gameManager.getState()).toBe(GameState.GAMEPLAY);
      expect(gameManager.getPreviousState()).toBe(GameState.MENU);
    });

    it('should not transition to same state', () => {
      const initialHistory = gameManager.getStateHistory().length;
      gameManager.transitionTo(GameState.MENU);
      expect(gameManager.getStateHistory().length).toBe(initialHistory);
    });

    it('should track state history', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.transitionTo(GameState.PAUSED);
      gameManager.transitionTo(GameState.GAMEPLAY);

      const history = gameManager.getStateHistory();
      expect(history.length).toBe(3);
      expect(history[0].from).toBe(GameState.MENU);
      expect(history[0].to).toBe(GameState.GAMEPLAY);
      expect(history[1].from).toBe(GameState.GAMEPLAY);
      expect(history[1].to).toBe(GameState.PAUSED);
    });

    it('should clear state history', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.transitionTo(GameState.PAUSED);
      
      gameManager.clearStateHistory();
      expect(gameManager.getStateHistory().length).toBe(0);
    });

    it('should emit state_changed event on transition', (done) => {
      gameManager.on('state_changed', (event) => {
        expect(event.type).toBe('state_changed');
        expect(event.data.from).toBe(GameState.MENU);
        expect(event.data.to).toBe(GameState.GAMEPLAY);
        done();
      });

      gameManager.transitionTo(GameState.GAMEPLAY);
    });
  });

  describe('Pause/Resume', () => {
    it('should pause gameplay', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.pause();
      
      expect(gameManager.getState()).toBe(GameState.PAUSED);
      expect(gameManager.isPausedState()).toBe(true);
    });

    it('should resume gameplay', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.pause();
      gameManager.resume();
      
      expect(gameManager.getState()).toBe(GameState.GAMEPLAY);
      expect(gameManager.isPausedState()).toBe(false);
    });

    it('should not pause if not in gameplay', () => {
      gameManager.transitionTo(GameState.MENU);
      gameManager.pause();
      
      expect(gameManager.getState()).toBe(GameState.MENU);
    });

    it('should emit pause event', (done) => {
      gameManager.on('game_paused', (event) => {
        expect(event.type).toBe('game_paused');
        done();
      });

      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.pause();
    });

    it('should emit resume event', (done) => {
      gameManager.on('game_resumed', (event) => {
        expect(event.type).toBe('game_resumed');
        done();
      });

      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.pause();
      gameManager.resume();
    });

    it('should set paused state correctly for different game states', () => {
      // Menu - not paused
      gameManager.transitionTo(GameState.MENU);
      expect(gameManager.isPausedState()).toBe(false);

      // Gameplay - not paused
      gameManager.transitionTo(GameState.GAMEPLAY);
      expect(gameManager.isPausedState()).toBe(false);

      // Story - paused
      gameManager.transitionTo(GameState.STORY);
      expect(gameManager.isPausedState()).toBe(true);

      // Level complete - paused
      gameManager.transitionTo(GameState.LEVEL_COMPLETE);
      expect(gameManager.isPausedState()).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should register and call event handlers', () => {
      const handler = jest.fn();
      gameManager.on('level_started', handler);

      const event: GameEvent = {
        type: 'level_started',
        data: { levelId: 'level_1' },
        timestamp: Date.now()
      };

      gameManager.emitEvent(event);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      gameManager.on('level_completed', handler1);
      gameManager.on('level_completed', handler2);

      const event: GameEvent = {
        type: 'level_completed',
        timestamp: Date.now()
      };

      gameManager.emitEvent(event);
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should unregister event handlers', () => {
      const handler = jest.fn();
      gameManager.on('ability_activated', handler);
      gameManager.off('ability_activated', handler);

      const event: GameEvent = {
        type: 'ability_activated',
        timestamp: Date.now()
      };

      gameManager.emitEvent(event);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();

      gameManager.on('collectible_collected', errorHandler);
      gameManager.on('collectible_collected', normalHandler);

      const event: GameEvent = {
        type: 'collectible_collected',
        timestamp: Date.now()
      };

      // Should not throw
      expect(() => gameManager.emitEvent(event)).not.toThrow();
      
      // Normal handler should still be called
      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('Fixed Timestep Update', () => {
    it('should have default fixed timestep of 60 FPS', () => {
      expect(gameManager.getFixedTimeStep()).toBe(1000 / 60);
    });

    it('should allow setting fixed timestep', () => {
      gameManager.setFixedTimeStep(1000 / 30);
      expect(gameManager.getFixedTimeStep()).toBe(1000 / 30);
    });

    it('should not allow invalid timestep', () => {
      const original = gameManager.getFixedTimeStep();
      gameManager.setFixedTimeStep(0);
      expect(gameManager.getFixedTimeStep()).toBe(original);

      gameManager.setFixedTimeStep(-10);
      expect(gameManager.getFixedTimeStep()).toBe(original);
    });

    it('should not update when paused', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.pause();

      // Should not throw or cause issues
      expect(() => gameManager.update(16)).not.toThrow();
    });

    it('should not update when not in gameplay', () => {
      gameManager.transitionTo(GameState.MENU);

      // Should not throw or cause issues
      expect(() => gameManager.update(16)).not.toThrow();
    });

    it('should update when in gameplay and not paused', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);

      // Should not throw
      expect(() => gameManager.update(16)).not.toThrow();
    });
  });

  describe('State Persistence', () => {
    it('should save and load manager state', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.pause();

      const state = gameManager.getManagerState();
      
      const newManager = new GameManager();
      newManager.loadManagerState(state);

      expect(newManager.getState()).toBe(GameState.PAUSED);
      expect(newManager.getPreviousState()).toBe(GameState.GAMEPLAY);
      expect(newManager.isPausedState()).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      gameManager.transitionTo(GameState.GAMEPLAY);
      gameManager.pause();
      
      const handler = jest.fn();
      gameManager.on('level_started', handler);

      gameManager.reset();

      expect(gameManager.getState()).toBe(GameState.MENU);
      expect(gameManager.getPreviousState()).toBeNull();
      expect(gameManager.isPausedState()).toBe(false);
      expect(gameManager.getStateHistory().length).toBe(0);

      // Event handlers should be cleared
      gameManager.emitEvent({
        type: 'level_started',
        timestamp: Date.now()
      });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Singleton', () => {
    afterEach(() => {
      resetGameManager();
    });

    it('should return same instance', () => {
      const manager1 = getGameManager();
      const manager2 = getGameManager();
      
      expect(manager1).toBe(manager2);
    });

    it('should reset singleton instance', () => {
      const manager1 = getGameManager();
      manager1.transitionTo(GameState.GAMEPLAY);
      
      resetGameManager();
      
      const manager2 = getGameManager();
      expect(manager2.getState()).toBe(GameState.MENU);
    });
  });
});
