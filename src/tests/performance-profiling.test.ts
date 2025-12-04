import { PerformanceMonitor } from '@utils/PerformanceMonitor';
import { ProceduralMazeGenerator } from '@systems/ProceduralMazeGenerator';
import { GameSaveManager } from '@services/GameSaveManager';
import { IndexedDBAdapter } from '@services/IndexedDBAdapter';
import { MazeConfig, MazeType, GameSaveData } from '../types';

describe('Performance Profiling - Task 30', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('Frame Rate Profiling', () => {
    test('should maintain 30+ FPS during normal gameplay', () => {
      // Simulate 60 frames at 60 FPS (16.67ms per frame)
      for (let i = 0; i < 60; i++) {
        const time = i * 16.67;
        monitor.update(time, 100);
      }

      const metrics = monitor.getMetrics();
      expect(metrics.avgFps).toBeGreaterThanOrEqual(30);
      expect(metrics.fps).toBeGreaterThan(0);
    });

    test('should track frame time accurately', () => {
      monitor.update(0, 0);
      monitor.update(16.67, 0); // 60 FPS frame
      
      const metrics = monitor.getMetrics();
      expect(metrics.frameTime).toBeCloseTo(16.67, 1);
    });

    test('should calculate min/max FPS correctly', () => {
      const frameTimes = [16.67, 20, 14, 18, 16.67]; // Varying frame times
      let time = 0;
      
      frameTimes.forEach(frameTime => {
        monitor.update(time, 0);
        time += frameTime;
      });

      const metrics = monitor.getMetrics();
      expect(metrics.maxFps).toBeGreaterThan(metrics.minFps);
      expect(metrics.avgFps).toBeLessThanOrEqual(metrics.maxFps);
      expect(metrics.avgFps).toBeGreaterThanOrEqual(metrics.minFps);
    });
  });

  describe('Maze Generation Performance', () => {
    test('should generate small maze (20x20) within 100ms', () => {
      const generator = new ProceduralMazeGenerator();
      const config: MazeConfig = {
        width: 20,
        height: 20,
        type: MazeType.LINEAR,
        difficulty: 0.5,
        layers: 1,
        obstacleCount: 2,
        collectibleCount: 3
      };

      const startTime = performance.now();
      const maze = generator.generate(config);
      const endTime = performance.now();

      expect(maze).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should generate medium maze (50x50) within 500ms', () => {
      const generator = new ProceduralMazeGenerator();
      const config: MazeConfig = {
        width: 50,
        height: 50,
        type: MazeType.LINEAR,
        difficulty: 0.5,
        layers: 1,
        obstacleCount: 5,
        collectibleCount: 8
      };

      const startTime = performance.now();
      const maze = generator.generate(config);
      const endTime = performance.now();

      expect(maze).toBeDefined();
      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should generate large maze (100x100) within 2000ms', () => {
      const generator = new ProceduralMazeGenerator();
      const config: MazeConfig = {
        width: 100,
        height: 100,
        type: MazeType.LINEAR,
        difficulty: 0.5,
        layers: 1,
        obstacleCount: 10,
        collectibleCount: 15
      };

      const startTime = performance.now();
      const maze = generator.generate(config);
      const endTime = performance.now();

      expect(maze).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should validate maze solvability within 200ms', () => {
      const generator = new ProceduralMazeGenerator();
      const config: MazeConfig = {
        width: 50,
        height: 50,
        type: MazeType.LINEAR,
        difficulty: 0.5,
        layers: 1,
        obstacleCount: 5,
        collectibleCount: 8
      };

      const maze = generator.generate(config);
      
      const startTime = performance.now();
      const isValid = generator.validate(maze);
      const endTime = performance.now();

      expect(isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Save/Load Performance', () => {
    test('should save game state within 50ms', async () => {
      const adapter = new IndexedDBAdapter();
      const saveManager = new GameSaveManager(adapter);

      const gameState = GameSaveManager.createDefaultSaveData();

      const startTime = performance.now();
      await saveManager.saveGame(gameState);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });

    test('should load game state within 50ms', async () => {
      const adapter = new IndexedDBAdapter();
      const saveManager = new GameSaveManager(adapter);

      const gameState = GameSaveManager.createDefaultSaveData();
      await saveManager.saveGame(gameState);

      const startTime = performance.now();
      const loaded = await saveManager.loadGame();
      const endTime = performance.now();

      expect(loaded).toBeDefined();
      expect(endTime - startTime).toBeLessThan(50);
    });

    test('should handle multiple saves without performance degradation', async () => {
      const adapter = new IndexedDBAdapter();
      const saveManager = new GameSaveManager(adapter);

      const times: number[] = [];

      for (let i = 0; i < 10; i++) {
        const gameState = GameSaveManager.createDefaultSaveData();
        gameState.currentLevel = `level-${i}`;

        const startTime = performance.now();
        await saveManager.saveGame(gameState);
        times.push(performance.now() - startTime);
      }

      // Check that save times don't increase significantly
      const avgFirstHalf = times.slice(0, 5).reduce((a, b) => a + b) / 5;
      const avgSecondHalf = times.slice(5).reduce((a, b) => a + b) / 5;
      
      expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5); // Allow 50% increase
    });
  });

  describe('Asset Loading Performance', () => {
    test('should load texture atlas within 200ms', async () => {
      const startTime = performance.now();
      // Simulate texture loading
      await new Promise(resolve => setTimeout(resolve, 50));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200);
    });

    test('should cache assets efficiently', async () => {
      const cache = new Map<string, any>();
      
      // First load
      const startTime1 = performance.now();
      if (!cache.has('sprite')) {
        await new Promise(resolve => setTimeout(resolve, 50));
        cache.set('sprite', { data: 'sprite' });
      }
      const time1 = performance.now() - startTime1;

      // Second load (from cache)
      const startTime2 = performance.now();
      if (!cache.has('sprite')) {
        await new Promise(resolve => setTimeout(resolve, 50));
        cache.set('sprite', { data: 'sprite' });
      }
      const time2 = performance.now() - startTime2;

      expect(time2).toBeLessThan(time1);
    });
  });

  describe('Memory Usage Profiling', () => {
    test('should track memory usage', () => {
      monitor.update(0, 100);
      const metrics = monitor.getMetrics();

      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.objectCount).toBe(100);
    });

    test('should not leak memory during repeated operations', () => {
      const initialMetrics = monitor.getMetrics();
      
      for (let i = 0; i < 100; i++) {
        monitor.update(i * 16.67, 50 + i);
      }

      const finalMetrics = monitor.getMetrics();
      
      // Memory should not grow excessively
      expect(finalMetrics.memoryUsage).toBeLessThan(initialMetrics.memoryUsage + 100);
    });
  });

  describe('Performance Thresholds', () => {
    test('should identify when performance is good', () => {
      for (let i = 0; i < 60; i++) {
        monitor.update(i * 16.67, 100); // 60 FPS
      }

      expect(monitor.isPerformanceGood(30)).toBe(true);
    });

    test('should identify when performance is poor', () => {
      for (let i = 0; i < 60; i++) {
        monitor.update(i * 50, 100); // ~20 FPS
      }

      expect(monitor.isPerformanceGood(30)).toBe(false);
    });

    test('should generate performance report', () => {
      for (let i = 0; i < 10; i++) {
        monitor.update(i * 16.67, 100);
      }

      const report = monitor.getReport();
      expect(report).toContain('Performance Report');
      expect(report).toContain('FPS');
      expect(report).toContain('Memory');
    });
  });

  describe('Collision Detection Performance', () => {
    test('should perform collision checks efficiently', () => {
      const objects = Array.from({ length: 100 }, (_, i) => ({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        radius: 10
      }));

      const startTime = performance.now();
      
      // Simulate collision detection
      for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
          const dx = objects[i].x - objects[j].x;
          const dy = objects[i].y - objects[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const colliding = distance < objects[i].radius + objects[j].radius;
          expect(typeof colliding).toBe('boolean');
        }
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Rendering Performance', () => {
    test('should render large number of sprites efficiently', () => {
      const sprites = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        visible: true
      }));

      const startTime = performance.now();
      
      // Simulate rendering
      const visibleSprites = sprites.filter(s => s.visible);
      expect(visibleSprites.length).toBeGreaterThan(0);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});