export interface ProcessingEvent {
  status: string;
  progress: number;
  message?: string;
}

export interface StatusEmitter {
  emit(event: ProcessingEvent): void;
}

class ProcessingStatusManager {
  private listeners = new Map<
    string,
    Set<(event: ProcessingEvent) => void>
  >();

  subscribe(
    contentId: string,
    callback: (event: ProcessingEvent) => void
  ): () => void {
    if (!this.listeners.has(contentId)) {
      this.listeners.set(contentId, new Set());
    }
    this.listeners.get(contentId)!.add(callback);

    return () => {
      this.listeners.get(contentId)?.delete(callback);
      if (this.listeners.get(contentId)?.size === 0) {
        this.listeners.delete(contentId);
      }
    };
  }

  createEmitter(contentId: string): StatusEmitter {
    return {
      emit: (event: ProcessingEvent) => {
        this.listeners.get(contentId)?.forEach((callback) => callback(event));
      },
    };
  }
}

// Singleton
export const processingStatus = new ProcessingStatusManager();
