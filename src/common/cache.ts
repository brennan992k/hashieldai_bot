import { CommonEvent } from './event';

enum CacheEvent {
  set = 'set',
  get = 'get',
  clear = 'clear',
}

export class CommonCache {
  constructor() {
    if (!CommonCache._instance) {
      CommonCache._instance = this;
      this._event = new CommonEvent();
      this._store = {};
    }
    return CommonCache._instance;
  }

  private static _instance: CommonCache;
  private _store: Record<string, any>;
  private _event: CommonEvent;

  public static get instance(): CommonCache {
    if (!CommonCache._instance) {
      CommonCache._instance = new CommonCache();
    }
    return CommonCache._instance;
  }

  public set<T>(key: string, val: T) {
    this._store[key] = val;
    this._event?.emit(CacheEvent.set, key, val);
  }

  public get(key: string, defaultVal?: any) {
    const val = this._store[key];
    this._event?.emit(CacheEvent.get, key, val);
    if (!val) return defaultVal;
    return val;
  }

  public clear() {
    this._event?.emit(CacheEvent.clear);
    this._store = {};
  }
}
