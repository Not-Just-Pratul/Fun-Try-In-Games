/**
 * PerformanceMonitor - Monitors and reports performance metrics
 */
export class PerformanceMonitor {
  private frameRates: number[] = [];
  private maxSamples: number = 60;
  private lastFrameTime: number = 0;
  private metrics: PerformanceMetrics;

  constructor() {
    this.metrics = {
      fps: 0,
      avgFps: 0,
      minFps: Infinity,
      maxFps: 0,
      frameTime: 0,
      memoryUsage: 0,
      objectCount: 0
    };
  }

  /**
   * Updates performance metrics
   */
  public update(time: number, objectCount: number = 0): void {
    // Calculate frame time
    const frameTime = time - this.lastFrameTime;
    this.lastFrameTime = time;

    // Calculate FPS
    const fps = frameTime > 0 ? 1000 / frameTime : 0;
    
    // Add to samples
    this.frameRates.push(fps);
    if (this.frameRates.length > this.maxSamples) {
      this.frameRates.shift();
    }

    // Update metrics
    this.metrics.fps = fps;
    this.metrics.frameTime = frameTime;
    this.metrics.avgFps = this.calculateAverage(this.frameRates);
    this.metrics.minFps = Math.min(this.metrics.minFps, fps);
    this.metrics.maxFps = Math.max(this.metrics.maxFps, fps);
    this.metrics.objectCount = objectCount;

    // Get memory usage if available
    if (performance && (performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576; // MB
    }
  }

  /**
   * Gets current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Checks if performance is acceptable
   */
  public isPerformanceGood(targetFps: number = 30): boolean {
    return this.metrics.avgFps >= targetFps;
  }

  /**
   * Gets performance report
   */
  public getReport(): string {
    return `
Performance Report:
- Current FPS: ${this.metrics.fps.toFixed(1)}
- Average FPS: ${this.metrics.avgFps.toFixed(1)}
- Min FPS: ${this.metrics.minFps.toFixed(1)}
- Max FPS: ${this.metrics.maxFps.toFixed(1)}
- Frame Time: ${this.metrics.frameTime.toFixed(2)}ms
- Memory: ${this.metrics.memoryUsage.toFixed(2)}MB
- Objects: ${this.metrics.objectCount}
    `.trim();
  }

  /**
   * Resets metrics
   */
  public reset(): void {
    this.frameRates = [];
    this.metrics.minFps = Infinity;
    this.metrics.maxFps = 0;
  }

  /**
   * Calculates average of an array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Logs performance warning if below threshold
   */
  public checkPerformance(targetFps: number = 30): void {
    if (this.metrics.avgFps < targetFps) {
      console.warn(`Performance below target: ${this.metrics.avgFps.toFixed(1)} FPS (target: ${targetFps} FPS)`);
    }
  }
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  frameTime: number;
  memoryUsage: number;
  objectCount: number;
}
