/// <reference types="vite/client" />

interface PerformanceMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface Performance {
  memory?: PerformanceMemoryInfo;
}
