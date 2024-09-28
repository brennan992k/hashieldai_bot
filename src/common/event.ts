import { EventEmitter } from 'events';

export class CommonEvent {
  constructor() {
    this.event = new EventEmitter();
    this.event.setMaxListeners(Infinity);
  }

  private static _instance: CommonEvent;

  public static get instance(): CommonEvent {
    return CommonEvent._instance;
  }

  private readonly event: EventEmitter;

  public emit(eventName: string | symbol, ...args: any[]): boolean {
    return this.event?.emit(eventName, ...args);
  }

  public addListener(
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ): EventEmitter {
    return this.event?.addListener(eventName, listener);
  }
}
