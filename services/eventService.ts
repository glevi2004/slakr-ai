type EventCallback = () => void;

class EventService {
  private listeners: Map<string, EventCallback[]> = new Map();

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event: string): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback());
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventService = new EventService();

// Event types
export const STREAK_EVENTS = {
  STREAK_UPDATED: "streak_updated",
  STUDY_TIME_UPDATED: "study_time_updated",
} as const;
