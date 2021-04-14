import { initializer } from 'knifecycle';
import type { LogService, DelayService, TimeService } from 'common-services';

const DEFAULT_KV_TTL = 5 * 60 * 1000;

function noop(...args: unknown[]) {
  args;
}

type InternalStore<T> = Map<string, { data: T; expiresAt: number }>;

export type KVStoreConfig<T> = {
  KV_TTL?: number;
  KV_STORE: InternalStore<T>;
};

export type KVStoreDependencies<T> = KVStoreConfig<T> & {
  log: LogService;
  delay: DelayService;
  time: TimeService;
};

export type KVStoreService<T> = {
  get: (key: string) => Promise<T | undefined>;
  set: (key: string, value: T, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  bulkGet: (keys: string[]) => Promise<(T | undefined)[]>;
  bulkSet: (
    keys: string[],
    values: (T | undefined)[],
    ttls?: number[],
  ) => Promise<void>;
  bulkDelete: (keys: string[]) => Promise<void>;
};

export type KVStoreServiceInitializer<T> = (
  dependencies: KVStoreDependencies<T>,
) => Promise<KVStoreService<T>>;

/* Architecture Note #1: Memory Key/Value Store

This simple key/value store is intended to serve
 as a dumb, in memory, key/value store that empty
 itself after `KV_TTL` milliseconds.
*/
export default initializer(
  {
    name: 'kv',
    type: 'service',
    inject: ['?KV_TTL', '?KV_STORE', '?log', 'delay', 'time'],
  },
  initKV,
);

/**
 * Creates a key/value store
 * @class
 */
class KV<T> {
  private _log: LogService;
  private _ttl: number;
  private _delay: DelayService;
  private _time: TimeService;
  private _store: InternalStore<T>;
  private _currentDelay: Promise<void> | null;
  constructor({
    store,
    ttl,
    log,
    delay,
    time,
  }: {
    store: InternalStore<T>;
    ttl: number;
    log: LogService;
    delay: DelayService;
    time: TimeService;
  }) {
    this._log = log;
    this._ttl = ttl;
    this._delay = delay;
    this._time = time;
    this._store = store;
    this._currentDelay = null;
    this._kvServiceClear();
  }

  /**
   * Set a value in the store
   * @param  {String}   key
   * The key to store the value at
   * @param  {*}        value
   * The value to store
   * @param  {number}   [ttl]
   * The duration in milliseconds the value remains valid
   * @return {Promise<void>}
   * A promise to be resolved when the value is stored.
   * @example
   * kv.set('hello', 'world');
   * .then(() => console.log('Stored!'));
   * // Prints: Stored!
   */
  async set(key: string, value: T | undefined, ttl = Infinity) {
    this._store.set(key, { data: value, expiresAt: ttl + this._time() });
  }

  /**
   * Get a value from the store
   * @param  {String}   key
   * The key that map to the value
   * @return {Promise<*>}
   * A promise that resolve to the actual value.
   * @example
   * kv.get('hello');
   * .then((value) => console.log(value));
   * // Prints: world
   */
  async get(key: string): Promise<T | undefined> {
    const result = this._store.get(key);

    if (result) {
      if (result.expiresAt > this._time()) {
        return result.data;
      } else {
        this._store.delete(key);
      }
    }

    return;
  }

  /**
   * Delete a value from the store
   * @param  {String}   key
   * The keyof the deleted value
   * @return {Promise<void>}
   * A promise that resolve once the value is deleted.
   * @example
   * kv.delete('hello');
   * .then((value) => console.log('Deleted!'));
   * // Prints: Deleted!
   */
  async delete(key: string): Promise<void> {
    this._store.delete(key);
  }

  /**
   * Set a several values in the store
   * @param  {Array.String}   keys
   * The keys to store the values at
   * @param  {Array}          values
   * The values to store
   * @param  {Array.number}   [ttls]
   * The duration in milliseconds each values remains valid
   * @return {Promise<void>}
   * A promise to be resolved when the values are stored.
   * @example
   * kv.bulkSet(['hello', 'foo'], ['world', 'bar']);
   * .then(() => console.log('Stored!'));
   * // Prints: Stored!
   */
  async bulkSet(
    keys: string[],
    values: (T | undefined)[],
    ttls: number[] = [],
  ) {
    await Promise.all(
      keys.map((key, index) => {
        const value = values[index];

        return this.set(key, value, ttls[index]);
      }),
    );
  }

  /**
   * Get a several values from the store
   * @param  {Array.String}   keys
   * The keys to retrieve the values
   * @return {Promise<Array<*>>}
   * A promise to be resolved when the values
   *  are retrieved.
   * @example
   * kv.bulkGet(['hello', 'foo']);
   * .then((values) => console.log(values));
   * // Prints: ['world', 'bar']
   */
  async bulkGet(keys: string[]): Promise<(T | undefined)[]> {
    return await Promise.all(keys.map((key) => this.get(key)));
  }

  /**
   * Delete values for several keys from the store
   * @param  {Array.String}   keys
   * The keys for which to delete the values
   * @return {Promise<void>}
   * A promise to be resolved when the values
   *  are deleted.
   * @example
   * kv.bulkDelete(['hello', 'foo']);
   * .then((values) => console.log('Deleted!'));
   * // Prints: Deleted!
   */
  async bulkDelete(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  _kvServiceClear() {
    this._store = new Map();
    this._currentDelay = null;
    this._kvServiceRenew();
  }

  _kvServiceRenew() {
    if (this._currentDelay) {
      this._delay.clear(this._currentDelay).catch((err) => {
        this._log('debug', '💾 - No delay to cancel.', err);
      });
    }

    this._currentDelay = this._delay.create(this._ttl);

    this._currentDelay.then(this._kvServiceClear.bind(this)).catch((err) => {
      this._log('debug', '💾 - Delay renewed.', err);
    });
  }
}

/**
 * Instantiate the kv service
 * @param  {Object}     services
 * The services to inject
 * @param  {Function}   services.delay
 * A delaying function
 * @param  {Function}   services.time
 * A timing function
 * @param  {Function}   [services.log]
 * A logging function
 * @param  {Number}     [services.KV_TTL]
 * The store time to live
 * @param  {Map}        [services.KV_STORE]
 * The store for values as a simple object, it is useful
 *  to get a synchronous access to the store in tests
 *  for example.
 * @return {Promise<KV>}
 * A promise of the kv service
 * @example
 * import initKV from 'memory-kv-store';
 *
 * const kv = await initKV({
 *   delay: Promise.delay.bind(Promise),
 * });
 */
async function initKV<T>({
  KV_TTL = DEFAULT_KV_TTL,
  KV_STORE = new Map(),
  log = noop,
  delay,
  time,
}: KVStoreDependencies<T>): Promise<KVStoreService<T>> {
  log('debug', '💾 - Simple Key Value Service initialized.');

  return new KV<T>({
    ttl: KV_TTL,
    store: KV_STORE,
    log,
    delay,
    time,
  });
}
