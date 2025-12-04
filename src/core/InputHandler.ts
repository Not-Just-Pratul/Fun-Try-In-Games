import Phaser from 'phaser';
import { Direction } from '@game-types/common';

/**
 * InputHandler - Manages keyboard and touch input for the game
 */
export class InputHandler {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private wasdKeys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  } | null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursors = null;
    this.wasdKeys = null;
    
    this.setupKeyboard();
  }

  /**
   * Sets up keyboard input
   */
  private setupKeyboard(): void {
    if (this.scene.input.keyboard) {
      // Arrow keys
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      
      // WASD keys
      this.wasdKeys = this.scene.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D
      }) as any;
    }
  }

  /**
   * Gets the current direction input
   * Returns null if no direction is pressed
   */
  getDirectionInput(): Direction | null {
    if (!this.cursors || !this.wasdKeys) return null;

    // Check for vertical input (prioritize vertical over horizontal)
    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      return Direction.NORTH;
    }
    if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      return Direction.SOUTH;
    }
    
    // Check for horizontal input
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      return Direction.WEST;
    }
    if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      return Direction.EAST;
    }

    return null;
  }

  /**
   * Checks if any movement key is pressed
   */
  isMovementKeyPressed(): boolean {
    return this.getDirectionInput() !== null;
  }

  /**
   * Checks if a specific key is just pressed (single press)
   */
  isKeyJustPressed(key: string): boolean {
    if (!this.scene.input.keyboard) return false;
    
    const keyObj = this.scene.input.keyboard.addKey(key);
    return Phaser.Input.Keyboard.JustDown(keyObj);
  }

  /**
   * Destroys the input handler
   */
  destroy(): void {
    // Cleanup if needed
  }
}
