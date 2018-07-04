'use strict';

import { initializer } from 'knifecycle/dist/util';

const DEFAULT_KV_TTL = 5 * 60 * 1000;

function noop() {}

/* Architecture Note #1: Memory Key/Value Store

This simple key/value store is intended to serve
 as a dumb, in memory, key/value store that empty
 itself after `KV_TTL` milliseconds.
*/
export default initializer(
  {
    name: 'kv',
    type: 'service',
    inject: ['?KV_TTL', '?KV_STORE', '?log', 'delay'],
    options: { singleton: true },
  },
  initKV,
);

/**
 * Creates a key/value store
 * @class
 */
class KV {
  constructor({ store, ttl, log, delay }) {
    this._log = log;
    this._ttl = ttl;
    this._delay = delay;
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
   * @return {Promise}
   * A promise to be resolved when the value is stored.
   * @example
   * kv.set('hello', 'world');
   * .then(() => console.log('Stored!'));
   * // Prints: Stored!
   */
  set(key, value) {
    return new Promise((resolve, reject) => {
      try {
        this._store.set(key, value);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get a value from the store
   * @param  {String}   key
   * The key that map to the value
   * @return {Promise}
   * A promise that resolve to the actual value.
   * @example
   * kv.get('hello');
   * .then((value) => console.log(value));
   * // Prints: world
   */
  get(key) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this._store.get(key));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Set a several values in the store
   * @param  {Array.String}   keys
   * The keys to store the values at
   * @param  {Array}          values
   * The values to store
   * @return {Promise}
   * A promise to be resolved when the values are stored.
   * @example
   * kv.bulkSet(['hello', 'foo'], ['world', 'bar']);
   * .then(() => console.log('Stored!'));
   * // Prints: Stored!
   */
  bulkSet(keys, values) {
    return Promise.all(
      keys.map((key, index) => {
        const value = values[index];

        return this.set(key, value);
      }),
    );
  }

  /**
   * Get a several values from the store
   * @param  {Array.String}   keys
   * The keys to retrieve the values
   * @return {Promise<Array>}
   * A promise to be resolved when the values
   *  are retrieved.
   * @example
   * kv.bulkGet(['hello', 'foo']);
   * .then((values) => console.log(values));
   * // Prints: ['world', 'bar']
   */
  bulkGet(keys) {
    return Promise.all(keys.map(key => this.get(key)));
  }

  _kvServiceClear() {
    this._store = new Map();
    this._currentDelay = null;
    this._kvServiceRenew();
  }

  _kvServiceRenew() {
    if (this._currentDelay) {
      this._delay.cancel(this._currentDelay).catch(err => {
        this._log('debug', 'No delay to cancel.', err);
      });
    }

    this._currentDelay = this._delay.create(this._ttl);

    this._currentDelay.then(this._kvServiceClear.bind(this)).catch(err => {
      this._log('debug', 'Delay renewed.', err);
    });
  }
}

/**
 * Instantiate the kv service
 * @param  {Object}     services
 * The services to inject
 * @param  {Function}   services.delay
 * A delaying function
 * @param  {Function}   [services.log]
 * A logging function
 * @param  {Number}     [services.KV_TTL]
 * The store time to live
 * @param  {Map}        [services.KV_STORE]
 * The store time to live
 * @return {Promise<KV>}
 * A promise of the kv service
 * @example
 * import initKV from 'memory-kv-store';
 *
 * const kv = await initKV({
 *   delay: Promise.delay.bind(Promise),
 * });
 */
function initKV({
  KV_TTL = DEFAULT_KV_TTL,
  KV_STORE = new Map(),
  log = noop,
  delay,
}) {
  log('debug', 'Simple Key Value Service initialized.');

  return Promise.resolve(
    new KV({
      ttl: KV_TTL,
      store: KV_STORE,
      log,
      delay,
    }),
  );
}
