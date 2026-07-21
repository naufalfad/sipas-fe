import type { BimEngineEventMap } from './types';

export type EventCallback<T> = (data: T) => void;

/**
 * ============================================================================
 * BIM EVENT BUS - GRASP Indirection / Low Coupling Pattern
 * ============================================================================
 * Menghubungkan WebGL Raycaster dengan Zustand State Store secara asinkron
 * tanpa ketergantungan langsung (Zero WebGL Coupling di UI Component).
 * ============================================================================
 */
export class BimEventBus {
  private static instance: BimEventBus;
  private listeners: Map<keyof BimEngineEventMap, Set<EventCallback<any>>> = new Map();

  private constructor() {}

  public static getInstance(): BimEventBus {
    if (!BimEventBus.instance) {
      BimEventBus.instance = new BimEventBus();
    }
    return BimEventBus.instance;
  }

  /**
   * Berlangganan event tertentu dari WebGL Engine
   */
  public subscribe<K extends keyof BimEngineEventMap>(
    event: K,
    callback: EventCallback<BimEngineEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Function untuk Unsubscribe
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  /**
   * Memancarkan event dari WebGL Engine ke Listener (Zustand Store / React)
   */
  public publish<K extends keyof BimEngineEventMap>(
    event: K,
    payload: BimEngineEventMap[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[BimEventBus] Error in listener for event '${event}':`, err);
        }
      });
    }
  }

  /**
   * Membersihkan seluruh listener event
   */
  public clearAll(): void {
    this.listeners.clear();
  }
}
