export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
}

export class KeyboardShortcutManager {
  private bindings: Map<string, KeyBinding> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.setupDefaultBindings();
  }

  private setupDefaultBindings(): void {
    // Standard editing shortcuts
    this.register({
      key: 'z',
      ctrl: true,
      handler: () => this.emit('undo'),
      description: 'Undo',
    });

    this.register({
      key: 'z',
      ctrl: true,
      shift: true,
      handler: () => this.emit('redo'),
      description: 'Redo',
    });

    this.register({
      key: 'y',
      ctrl: true,
      handler: () => this.emit('redo'),
      description: 'Redo (Alt)',
    });

    this.register({
      key: 's',
      ctrl: true,
      handler: () => this.emit('save'),
      description: 'Save Project',
    });

    this.register({
      key: 'o',
      ctrl: true,
      handler: () => this.emit('open'),
      description: 'Open Project',
    });

    this.register({
      key: 'n',
      ctrl: true,
      handler: () => this.emit('new'),
      description: 'New Project',
    });

    this.register({
      key: 'Delete',
      handler: () => this.emit('delete'),
      description: 'Delete Selected',
    });

    this.register({
      key: 'Escape',
      handler: () => this.emit('deselect'),
      description: 'Deselect All',
    });

    // View shortcuts
    this.register({
      key: '+',
      ctrl: true,
      handler: () => this.emit('zoom-in'),
      description: 'Zoom In',
    });

    this.register({
      key: '-',
      ctrl: true,
      handler: () => this.emit('zoom-out'),
      description: 'Zoom Out',
    });

    this.register({
      key: '0',
      ctrl: true,
      handler: () => this.emit('zoom-fit'),
      description: 'Fit to View',
    });

    this.register({
      key: 'g',
      handler: () => this.emit('toggle-grid'),
      description: 'Toggle Grid',
    });

    // Simulation shortcuts
    this.register({
      key: 'r',
      ctrl: true,
      handler: () => this.emit('run-simulation'),
      description: 'Run Simulation',
    });

    this.register({
      key: 'd',
      ctrl: true,
      handler: () => this.emit('run-drc'),
      description: 'Run DRC',
    });

    this.register({
      key: 't',
      ctrl: true,
      handler: () => this.emit('run-thermal'),
      description: 'Run Thermal Analysis',
    });

    // Layer shortcuts
    this.register({
      key: 'ArrowUp',
      handler: () => this.emit('layer-up'),
      description: 'Layer Up',
    });

    this.register({
      key: 'ArrowDown',
      handler: () => this.emit('layer-down'),
      description: 'Layer Down',
    });
  }

  register(binding: KeyBinding): void {
    const key = this.getKeySignature(binding);
    this.bindings.set(key, binding);
  }

  unregister(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean, meta?: boolean): void {
    const signature = this.getKeySignature({ key, ctrl, shift, alt, meta, handler: () => {}, description: '' });
    this.bindings.delete(signature);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const binding = this.findBinding(event);
    if (binding) {
      event.preventDefault();
      binding.handler();
    }
  }

  private findBinding(event: KeyboardEvent): KeyBinding | undefined {
    for (const binding of this.bindings.values()) {
      if (
        binding.key === event.key &&
        (binding.ctrl ?? false) === event.ctrlKey &&
        (binding.shift ?? false) === event.shiftKey &&
        (binding.alt ?? false) === event.altKey &&
        (binding.meta ?? false) === event.metaKey
      ) {
        return binding;
      }
    }
    return undefined;
  }

  private getKeySignature(binding: Partial<KeyBinding>): string {
    const parts = [
      binding.ctrl ? 'ctrl' : '',
      binding.shift ? 'shift' : '',
      binding.alt ? 'alt' : '',
      binding.meta ? 'meta' : '',
      binding.key,
    ];
    return parts.filter(Boolean).join('+');
  }

  getBindings(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  private eventListeners: Map<string, Set<() => void>> = new Map();

  private emit(event: string): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener());
    }
  }

  on(event: string, handler: () => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return () => this.eventListeners.get(event)!.delete(handler);
  }
}

export const globalKeyboardManager = new KeyboardShortcutManager();
