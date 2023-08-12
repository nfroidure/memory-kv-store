import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { constant, Knifecycle } from 'knifecycle';
import initKV from './index.js';
import type { KVStoreService } from './index.js';
import type { DelayService, LogService, TimeService } from 'common-services';

describe('Simple Key Value service', () => {
  let $: Knifecycle;
  const delay = {
    create: jest.fn<DelayService['create']>(),
    clear: jest.fn<DelayService['clear']>(),
  };
  const log = jest.fn<LogService>();
  const time = jest.fn<TimeService>();

  beforeEach(() => {
    $ = new Knifecycle();
    $.register(constant('log', log));
    $.register(constant('delay', delay));
    $.register(constant('time', time));
    $.register(initKV);

    delay.create.mockReset();
    delay.clear.mockReset();
    log.mockReset();
    time.mockReset();
  });

  test('should init well', async () => {
    const promise = new Promise<void>(() => undefined);

    delay.create.mockReturnValueOnce(promise);

    const { kv } = (await $.run(['log', 'kv'])) as {
      kv: KVStoreService<unknown>;
    };

    expect(typeof kv.get).toEqual('function');
    expect(typeof kv.set).toEqual('function');
    expect(log.mock.calls).toEqual([
      ['debug', '💾 - Simple Key Value Service initialized.'],
    ]);
  });

  test('should allow to get a undefined value by its key', async () => {
    const promise = new Promise<void>(() => undefined);

    delay.create.mockReturnValueOnce(promise);
    const { kv } = (await $.run(['kv'])) as {
      kv: KVStoreService<number>;
    };

    const value = await kv.get('lol');

    expect(value).toEqual(undefined);
  });

  ['trololol', { lol: 'lol' }, 1, true].forEach((value) => {
    test(
      'should allow to set, delete and get a ' + typeof value + ' by its key',
      async () => {
        const promise = new Promise<void>(() => undefined);

        delay.create.mockReturnValueOnce(promise);

        $.register(constant('KV_TTL', Infinity));

        const { kv } = (await $.run(['kv'])) as {
          kv: KVStoreService<typeof value>;
        };

        time.mockReturnValue(Date.parse('2020-01-01T00:00:00Z'));

        await kv.set('lol', value);

        const retrievedValue = await kv.get('lol');

        expect(retrievedValue).toEqual(value);

        await kv.delete('lol');

        const retrievedValue2 = await kv.get('lol');

        expect(retrievedValue2).toBeUndefined();
      },
    );
  });

  test('should not return a value that expired', async () => {
    const promise = new Promise<void>(() => undefined);

    delay.create.mockReturnValueOnce(promise);
    const { kv } = (await $.run(['kv'])) as {
      kv: KVStoreService<number>;
    };

    time.mockReturnValueOnce(Date.parse('2020-01-01T00:00:00Z'));

    await kv.set('lol', 1664, 3600);

    time.mockReturnValueOnce(Date.parse('2020-01-01T10:00:00Z'));

    const retrievedValue = await kv.get('lol');

    expect(retrievedValue).toEqual(undefined);
  });

  test('should allow to bulk get a undefined values by their keys', async () => {
    let resolve;
    const promise = new Promise<void>((_resolve) => (resolve = _resolve));

    delay.create.mockReturnValueOnce(promise);
    const { kv } = (await $.run(['kv'])) as { kv: KVStoreService<number> };

    const values = await kv.bulkGet(['lol', 'kikoo']);

    expect(values).toEqual([undefined, undefined]);
    expect(resolve).toBeDefined();
  });

  test('should allow to set and get values by their keys', async () => {
    let resolve;
    const promise = new Promise<void>((_resolve) => (resolve = _resolve));

    delay.create.mockReturnValueOnce(promise);
    const keys = ['a', 'b', 'c', 'd'];
    const values = [1, 2, undefined, 4];

    const { kv } = (await $.run(['kv'])) as {
      kv: KVStoreService<number>;
    };

    time.mockReturnValue(Date.parse('2020-01-01T00:00:00Z'));

    await kv.bulkSet(keys, values);

    const retrievedValues = await kv.bulkGet(keys);

    expect(retrievedValues).toEqual(values);

    await kv.bulkDelete(keys);

    const retrievedValues2 = await kv.bulkGet(keys);

    expect(retrievedValues2).toEqual(values.map(() => undefined));
    expect(resolve).toBeDefined();
  });

  describe('when timeout occurs', () => {
    test('should reset the store after the delay timeout', async () => {
      let resolve1;
      const promise1 = new Promise<void>((_resolve) => (resolve1 = _resolve));
      let resolve2;
      const promise2 = new Promise<void>((_resolve) => (resolve2 = _resolve));

      delay.create.mockReturnValueOnce(promise1);
      delay.create.mockReturnValueOnce(promise2);
      delay.create.mockReturnValueOnce(new Promise<void>(() => undefined));
      delay.create.mockReturnValueOnce(new Promise<void>(() => undefined));
      delay.create.mockReturnValueOnce(new Promise<void>(() => undefined));

      const { kv } = (await $.run(['kv'])) as {
        kv: KVStoreService<string>;
      };

      time.mockReturnValueOnce(Date.parse('2020-01-01T00:00:00Z'));

      await kv.set('lol', 'lol');

      expect(delay.clear.mock.calls.length).toEqual(0);
      expect(delay.create.mock.calls).toEqual([[5 * 60 * 1000]]);

      await resolve1();

      expect(delay.clear.mock.calls.length).toEqual(0);
      expect(delay.create.mock.calls).toEqual([
        [5 * 60 * 1000],
        [5 * 60 * 1000],
      ]);

      time.mockReturnValueOnce(Date.parse('2020-01-01T00:00:01Z'));
      const value = await kv.get('lol');

      expect(value).toBeUndefined();

      time.mockReturnValueOnce(Date.parse('2020-01-01T00:00:00Z'));
      await kv.set('lol', 'lol');

      time.mockReturnValueOnce(Date.parse('2020-01-01T00:00:01Z'));

      const newValue = await kv.get('lol');

      expect(newValue).toEqual('lol');

      await resolve2();

      expect(delay.clear.mock.calls.length).toEqual(0);
      expect(delay.create.mock.calls).toEqual([
        [5 * 60 * 1000],
        [5 * 60 * 1000],
        [5 * 60 * 1000],
      ]);

      const lastValue = await kv.get('lol');

      expect(lastValue).toBeUndefined();
    });
  });
});
