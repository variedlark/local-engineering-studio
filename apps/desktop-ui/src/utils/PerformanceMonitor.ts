export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  lastUpdate: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    lastUpdate: Date.now(),
  };

  private frameCount = 0;
  private lastFrameTime = Date.now();
  private renderTimes: number[] = [];
  private maxSamples = 60;

  recordFrame(renderTime: number): void {
    this.frameCount++;
    this.renderTimes.push(renderTime);

    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }

    const now = Date.now();
    const elapsed = now - this.lastFrameTime;

    if (elapsed >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.metrics.renderTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
      this.metrics.lastUpdate = now;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    if (performance.memory) {
      this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
    }
  }

  setComponentCount(count: number): void {
    this.metrics.componentCount = count;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  isPerformanceGood(): boolean {
    return this.metrics.fps >= 50 && this.metrics.renderTime < 16.67;
  }

  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.metrics.fps < 30) {
      suggestions.push('FPS is critically low. Consider reducing component count or enabling LOD.');
    } else if (this.metrics.fps < 50) {
      suggestions.push('FPS is below optimal. Consider optimizing rendering or reducing detail level.');
    }

    if (this.metrics.renderTime > 16.67) {
      suggestions.push('Render time exceeds 16.67ms (60 FPS target). Consider GPU optimization.');
    }

    if (this.metrics.memoryUsage > 500) {
      suggestions.push('Memory usage is high. Consider clearing caches or reducing scene complexity.');
    }

    if (this.metrics.componentCount > 10000) {
      suggestions.push('Component count is very high. Consider using instancing or LOD techniques.');
    }

    return suggestions;
  }
}

export const globalPerformanceMonitor = new PerformanceMonitor();
