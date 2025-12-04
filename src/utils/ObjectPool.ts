/**
 * ObjectPool - Reuses objects to reduce garbage collection
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /**
   * Gets an object from the pool
   */
  public acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /**
   * Returns an object to the pool
   */
  public release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  /**
   * Releases multiple objects
   */
  public releaseAll(objects: T[]): void {
    objects.forEach(obj => this.release(obj));
  }

  /**
   * Gets current pool size
   */
  public getSize(): number {
    return this.pool.length;
  }

  /**
   * Clears the pool
   */
  public clear(): void {
    this.pool = [];
  }

  /**
   * Pre-warms the pool with objects
   */
  public prewarm(count: number): void {
    for (let i = 0; i < count && this.pool.length < this.maxSize; i++) {
      this.pool.push(this.factory());
    }
  }
}

/**
 * Particle pool for visual effects
 */
export class ParticlePool {
  private pool: ObjectPool<Phaser.GameObjects.Graphics>;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, initialSize: number = 20) {
    this.scene = scene;
    this.pool = new ObjectPool(
      () => scene.add.graphics(),
      (graphics) => {
        graphics.clear();
        graphics.setVisible(false);
        graphics.setActive(false);
      },
      initialSize,
      50
    );
  }

  public acquire(): Phaser.GameObjects.Graphics {
    const graphics = this.pool.acquire();
    graphics.setVisible(true);
    graphics.setActive(true);
    return graphics;
  }

  public release(graphics: Phaser.GameObjects.Graphics): void {
    this.pool.release(graphics);
  }
}

/**
 * Text pool for UI elements
 */
export class TextPool {
  private pool: ObjectPool<Phaser.GameObjects.Text>;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, initialSize: number = 10) {
    this.scene = scene;
    this.pool = new ObjectPool(
      () => scene.add.text(0, 0, ''),
      (text) => {
        text.setText('');
        text.setVisible(false);
        text.setActive(false);
        text.setPosition(0, 0);
      },
      initialSize,
      30
    );
  }

  public acquire(): Phaser.GameObjects.Text {
    const text = this.pool.acquire();
    text.setVisible(true);
    text.setActive(true);
    return text;
  }

  public release(text: Phaser.GameObjects.Text): void {
    this.pool.release(text);
  }
}
