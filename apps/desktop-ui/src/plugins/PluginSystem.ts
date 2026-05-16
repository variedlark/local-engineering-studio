import type { ComponentType } from "react";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  entryPoint: string;
  permissions: string[];
  dependencies?: string[];
}

export interface PluginContext {
  api: PluginAPI;
  config: Record<string, unknown>;
}

export interface PluginAPI {
  registerCommand: (id: string, handler: () => void) => void;
  registerMenu: (id: string, label: string, icon?: string) => void;
  registerPanel: (id: string, component: ComponentType) => void;
  onProjectOpen: (callback: (projectId: string) => void) => void;
  onProjectSave: (callback: (projectId: string) => void) => void;
  onComponentAdded: (callback: (componentId: string) => void) => void;
  onComponentDeleted: (callback: (componentId: string) => void) => void;
  getState: (key: string) => unknown;
  setState: (key: string, value: unknown) => void;
  showNotification: (
    message: string,
    type: "info" | "warning" | "error" | "success",
  ) => void;
  showDialog: (
    title: string,
    content: string,
    buttons: string[],
  ) => Promise<number>;
}

export class Plugin {
  manifest: PluginManifest;
  context: PluginContext;
  enabled: boolean = false;

  constructor(manifest: PluginManifest, context: PluginContext) {
    this.manifest = manifest;
    this.context = context;
  }

  async activate(): Promise<void> {
    this.enabled = true;
  }

  async deactivate(): Promise<void> {
    this.enabled = false;
  }

  isActive(): boolean {
    return this.enabled;
  }
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private commands: Map<string, () => void> = new Map();
  private menus: Map<string, { label: string; icon?: string }> = new Map();
  private eventListeners: Map<string, Set<(...args: unknown[]) => void>> =
    new Map();
  private state: Map<string, unknown> = new Map();

  registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin ${plugin.manifest.id} is already registered`);
    }
    this.plugins.set(plugin.manifest.id, plugin);
  }

  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    await plugin.activate();
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    await plugin.deactivate();
  }

  registerCommand(id: string, handler: () => void): void {
    this.commands.set(id, handler);
  }

  executeCommand(id: string): void {
    const handler = this.commands.get(id);
    if (handler) {
      handler();
    }
  }

  registerMenu(id: string, label: string, icon?: string): void {
    this.menus.set(id, { label, icon });
  }

  getMenus(): Map<string, { label: string; icon?: string }> {
    return new Map(this.menus);
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(...args));
    }
  }

  setState(key: string, value: unknown): void {
    this.state.set(key, value);
  }

  getState(key: string): unknown {
    return this.state.get(key);
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.isActive());
  }
}

export const globalPluginManager = new PluginManager();
