import Phaser from 'phaser';
import { Vector2D } from '@game-types/common';

/**
 * ViewportCuller - Culls objects outside the viewport
 */
export class ViewportCuller {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private padding: number;

  constructor(camera: Phaser.Cameras.Scene2D.Camera, padding: number = 100) {
    this.camera = camera;
    this.padding = padding;
  }

  /**
   * Checks if a position is visible in the viewport
   */
  public isVisible(position: Vector2D): boolean {
    const bounds = this.getViewportBounds();
    
    return (
      position.x >= bounds.left &&
      position.x <= bounds.right &&
      position.y >= bounds.top &&
      position.y <= bounds.bottom
    );
  }

  /**
   * Checks if a rectangle is visible in the viewport
   */
  public isRectVisible(x: number, y: number, width: number, height: number): boolean {
    const bounds = this.getViewportBounds();
    
    return !(
      x + width < bounds.left ||
      x > bounds.right ||
      y + height < bounds.top ||
      y > bounds.bottom
    );
  }

  /**
   * Gets viewport bounds with padding
   */
  public getViewportBounds(): ViewportBounds {
    return {
      left: this.camera.scrollX - this.padding,
      right: this.camera.scrollX + this.camera.width + this.padding,
      top: this.camera.scrollY - this.padding,
      bottom: this.camera.scrollY + this.camera.height + this.padding
    };
  }

  /**
   * Culls a list of objects based on visibility
   */
  public cull<T extends { position: Vector2D }>(objects: T[]): T[] {
    return objects.filter(obj => this.isVisible(obj.position));
  }

  /**
   * Updates object visibility
   */
  public updateVisibility(gameObject: Phaser.GameObjects.GameObject & { x: number; y: number; setVisible: (value: boolean) => void; setActive: (value: boolean) => void }): void {
    const visible = this.isVisible({ x: gameObject.x, y: gameObject.y });
    gameObject.setVisible(visible);
    gameObject.setActive(visible);
  }

  /**
   * Sets padding
   */
  public setPadding(padding: number): void {
    this.padding = padding;
  }
}

/**
 * Viewport bounds
 */
export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
