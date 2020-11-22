import { Knifecycle } from 'knifecycle';
import initLog from 'common-services/dist/log.mock';
import initDelay from 'common-services/dist/delay.mock';
import initKV from '.';
import type { KVStoreService } from '.';

describe('Simple Key Value service', () => {
  let $: Knifecycle<unknown>;

  beforeEach(() => {
    $ = new Knifecycle();
    $.register(initLog);
    $.register(initDelay);
    $.register(initKV);
  });

  it('should init well', async () => {
    const { log, kv } = (await $.run(['log', 'kv'])) as {
      kv: KVStoreService<unknown>;
      log: any;
    };

    expect(typeof kv.get).toEqual('function');
    expect(typeof kv.set).toEqual('function');
    expect(log.args).toEqual([
      ['debug', '💾 - Simple Key Value Service initialized.'],
    ]);
  });

  it('should allow to get a undefined value by its key', async () => {
    const { kv } = (await $.run(['kv'])) as { kv: KVStoreService<number> };

    const value = await kv.get('lol');

    expect(value).toEqual(undefined);
  });

  ['trololol', { lol: 'lol' }, 1, true].forEach((value) => {
    it(
      'should allow to set and get a ' + typeof value + ' by its key',
      async () => {
        const { kv } = (await $.run(['kv'])) as {
          kv: KVStoreService<typeof value>;
        };

        await kv.set('lol', value);

        const retrievedValue = await kv.get('lol');

        expect(retrievedValue).toEqual(value);
      },
    );
  });

  it('should allow to bulk get a undefined values by their keys', async () => {
    const { kv } = (await $.run(['kv'])) as { kv: KVStoreService<number> };

    const values = await kv.bulkGet(['lol', 'kikoo']);

    expect(values).toEqual([undefined, undefined]);
  });

  it('should allow to set and get values by their keys', async () => {
    const keys = ['a', 'b', 'c', 'd'];
    const values = [1, 2, undefined, 4];

    const { kv } = (await $.run(['kv'])) as { kv: KVStoreService<number> };

    await kv.bulkSet(keys, values);

    const retrievedValues = await kv.bulkGet(keys);

    expect(retrievedValues).toEqual(values);
  });

  describe('when timeout occurs', () => {
    let context;
    let delayClearSpy;
    let delayCreateSpy;

    beforeEach(async () => {
      const { log, kv, delay } = (await $.run(['log', 'kv', 'delay'])) as {
        kv: KVStoreService<number>;
        log: any;
        delay: any;
      };

      delayClearSpy = jest.spyOn(delay, 'clear');
      delayCreateSpy = jest.spyOn(delay, 'create');
      context = { log, kv, delay };
    });

    afterEach(() => {
      delayClearSpy.mockReset();
      delayCreateSpy.mockReset();
    });

    it('should reset the store after the delay timeout', async () => {
      const { kv, delay }: { kv: KVStoreService<string>; delay: any } = context;

      await kv.set('lol', 'lol');

      await delay.__resolveAll();

      expect(delayClearSpy.mock.calls.length).toEqual(0);
      expect(delayCreateSpy.mock.calls).toEqual([[5 * 60 * 1000]]);

      const value = await kv.get('lol');

      expect(value).toBeUndefined();

      await kv.set('lol', 'lol');

      const newValue = await kv.get('lol');

      expect(newValue).toEqual('lol');

      await delay.__resolveAll();

      expect(delayClearSpy.mock.calls.length).toEqual(0);
      expect(delayCreateSpy.mock.calls).toEqual([
        [5 * 60 * 1000],
        [5 * 60 * 1000],
      ]);

      const lastValue = await kv.get('lol');

      expect(lastValue).toBeUndefined();
    });
  });
});
