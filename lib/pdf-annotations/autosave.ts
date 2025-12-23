/**
 * Autosave utility with debounce for PDF annotations
 */

export type AutosaveStatus = "saved" | "saving" | "unsaved";

export interface AutosaveOptions {
  debounceMs?: number;
  onSave: () => Promise<void>;
  onStatusChange?: (status: AutosaveStatus) => void;
}

export class AutosaveManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private isSaving = false;
  private status: AutosaveStatus = "saved";
  private debounceMs: number;
  private onSave: () => Promise<void>;
  private onStatusChange?: (status: AutosaveStatus) => void;

  constructor(options: AutosaveOptions) {
    this.debounceMs = options.debounceMs ?? 2000;
    this.onSave = options.onSave;
    this.onStatusChange = options.onStatusChange;
  }

  trigger(): void {
    if (this.isSaving) return;

    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Update status to unsaved
    this.updateStatus("unsaved");

    // Set new timeout
    this.timeoutId = setTimeout(() => {
      this.save();
    }, this.debounceMs);
  }

  private async save(): Promise<void> {
    if (this.isSaving) return;

    this.isSaving = true;
    this.updateStatus("saving");

    try {
      await this.onSave();
      this.updateStatus("saved");
    } catch (error) {
      console.error("Autosave failed:", error);
      this.updateStatus("unsaved");
    } finally {
      this.isSaving = false;
    }
  }

  private updateStatus(status: AutosaveStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.onStatusChange?.(status);
    }
  }

  getStatus(): AutosaveStatus {
    return this.status;
  }

  forceSave(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    return this.save();
  }

  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

