export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  getDescription(): string;
}

export class CommandManager {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 100;
  private listeners: Set<() => void> = new Set();

  execute(command: Command): void {
    // Remove any commands after current index (branching history)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Execute the command
    command.execute();
    this.history.push(command);
    this.currentIndex++;

    // Maintain max history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    this.notifyListeners();
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    this.history[this.currentIndex].undo();
    this.currentIndex--;
    this.notifyListeners();
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    this.currentIndex++;
    this.history[this.currentIndex].redo();
    this.notifyListeners();
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getUndoDescription(): string {
    if (!this.canUndo()) return '';
    return `Undo: ${this.history[this.currentIndex].getDescription()}`;
  }

  getRedoDescription(): string {
    if (!this.canRedo()) return '';
    return `Redo: ${this.history[this.currentIndex + 1].getDescription()}`;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.notifyListeners();
  }

  getHistory(): Command[] {
    return [...this.history];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// Example command implementations
export class PlaceComponentCommand implements Command {
  constructor(
    private componentId: string,
    private x: number,
    private y: number,
    private onExecute: (id: string, x: number, y: number) => void,
    private onUndo: (id: string) => void
  ) {}

  execute(): void {
    this.onExecute(this.componentId, this.x, this.y);
  }

  undo(): void {
    this.onUndo(this.componentId);
  }

  redo(): void {
    this.execute();
  }

  getDescription(): string {
    return `Place component ${this.componentId} at (${this.x}, ${this.y})`;
  }
}

export class MoveComponentCommand implements Command {
  constructor(
    private componentId: string,
    private fromX: number,
    private fromY: number,
    private toX: number,
    private toY: number,
    private onMove: (id: string, x: number, y: number) => void
  ) {}

  execute(): void {
    this.onMove(this.componentId, this.toX, this.toY);
  }

  undo(): void {
    this.onMove(this.componentId, this.fromX, this.fromY);
  }

  redo(): void {
    this.execute();
  }

  getDescription(): string {
    return `Move component ${this.componentId} from (${this.fromX}, ${this.fromY}) to (${this.toX}, ${this.toY})`;
  }
}

export class DeleteComponentCommand implements Command {
  constructor(
    private componentId: string,
    private componentData: any,
    private onDelete: (id: string) => void,
    private onRestore: (id: string, data: any) => void
  ) {}

  execute(): void {
    this.onDelete(this.componentId);
  }

  undo(): void {
    this.onRestore(this.componentId, this.componentData);
  }

  redo(): void {
    this.execute();
  }

  getDescription(): string {
    return `Delete component ${this.componentId}`;
  }
}
