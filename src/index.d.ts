import { LogService, DelayService } from 'common-services';
export interface KVStoreService<T> {
  get: (key: string) => Promise<T | undefined>;
  set: (key: string, value: T) => Promise<void>;
  bulkGet: (keys: string[]) => Promise<(T | undefined)[]>;
  bulkSet: (keys: string[], values: (T | undefined)[]) => Promise<void>;
}
declare const _default: typeof initKV;
export default _default;
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
declare function initKV<T = any>({
  KV_TTL,
  KV_STORE,
  log,
  delay,
}: {
  KV_TTL?: number;
  KV_STORE?: Map<string, T | undefined>;
  log?: LogService;
  delay: DelayService;
}): Promise<KVStoreService<T>>;
