/* eslint max-nested-callbacks: 0 */
import assert from 'assert';
import sinon from 'sinon';
import { Knifecycle } from 'knifecycle';
import initLog from 'common-services/dist/log.mock';
import initDelay from 'common-services/dist/delay.mock';
import initKV, { KVStoreService } from './index';

describe('Simple Key Value service', () => {
  let $: Knifecycle;

  beforeEach(() => {
    $ = new Knifecycle();
    $.register(initLog);
    $.register(initDelay);
    $.register(initKV);
  });

  it('should init well', async () => {
    const { log, kv }: { kv: KVStoreService<any>; log: any } = await $.run([
      'log',
      'kv',
    ]);

    assert.equal(typeof kv.get, 'function', 'Expose a get function');
    assert.equal(typeof kv.set, 'function', 'Expose a set function');
    assert.deepEqual(
      log.args,
      [['debug', '💾 - Simple Key Value Service initialized.']],
      'Simple Key Value initialization information',
    );
  });

  it('should allow to get a undefined value by its key', async () => {
    const { kv }: { kv: KVStoreService<number> } = await $.run(['kv']);

    const value = await kv.get('lol');

    assert.equal(value, undefined);
  });

  ['trololol', { lol: 'lol' }, 1, true].forEach(value => {
    it(
      'should allow to set and get a ' + typeof value + ' by its key',
      async () => {
        const { kv }: { kv: KVStoreService<typeof value> } = await $.run([
          'kv',
        ]);

        await kv.set('lol', value);

        const retrievedValue = await kv.get('lol');

        assert.deepEqual(retrievedValue, value);
      },
    );
  });

  it('should allow to bulk get a undefined values by their keys', async () => {
    const { kv }: { kv: KVStoreService<number> } = await $.run(['kv']);

    const values = await kv.bulkGet(['lol', 'kikoo']);

    assert.deepEqual(values, [undefined, undefined]);
  });

  it('should allow to set and get values by their keys', async () => {
    const keys = ['a', 'b', 'c', 'd'];
    const values = [1, 2, undefined, 4];

    const { kv } = (await $.run(['kv'])) as { kv: KVStoreService<number> };

    await kv.bulkSet(keys, values);

    const retrievedValues = await kv.bulkGet(keys);

    assert.deepEqual(retrievedValues, values);
  });

  describe('when timeout occurs', () => {
    let context;
    let delayClearSpy;
    let delayCreateSpy;

    beforeEach(async () => {
      const {
        log,
        kv,
        delay,
      }: { kv: KVStoreService<number>; log: any; delay: any } = await $.run([
        'log',
        'kv',
        'delay',
      ]);

      delayClearSpy = sinon.spy(delay, 'clear');
      delayCreateSpy = sinon.spy(delay, 'create');
      context = { log, kv, delay };
    });

    afterEach(() => {
      delayClearSpy.restore();
      delayCreateSpy.restore();
    });

    it('should reset the store after the delay timeout', async () => {
      const { kv, delay }: { kv: KVStoreService<string>; delay: any } = context;

      await kv.set('lol', 'lol');

      await delay.__resolveAll();

      assert.equal(delayClearSpy.args.length, 0);
      assert.deepEqual(delayCreateSpy.args, [[5 * 60 * 1000]]);

      const value = await kv.get('lol');

      assert.equal(value, undefined);

      await kv.set('lol', 'lol');

      const newValue = await kv.get('lol');

      assert.equal(newValue, 'lol');

      await delay.__resolveAll();

      assert.equal(delayClearSpy.args.length, 0);
      assert.deepEqual(delayCreateSpy.args, [[5 * 60 * 1000], [5 * 60 * 1000]]);

      const lastValue = await kv.get('lol');

      assert.equal(lastValue, undefined);
    });
  });
});
