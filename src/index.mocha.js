/* eslint max-nested-callbacks: 0 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { Knifecycle } = require('knifecycle');
const initLog = require('../../common-services/src/log.mock');
const initDelay = require('../../common-services/src/delay.mock');
const initKV = require('./index');

describe('Simple Key Value service', () => {
  let $;

  beforeEach(() => {
    $ = new Knifecycle();
    $.register(initLog);
    $.register(initDelay);
    $.register(initKV);
  });

  it('should init well', (done) => {
    $.run(['log', 'kv'])
    .then(({ log, kv }) => {
      assert.equal(typeof kv.get, 'function', 'Expose a get function');
      assert.equal(typeof kv.set, 'function', 'Expose a set function');
      assert.deepEqual(
        log.args, [[
          'debug',
          'Simple Key Value Service initialized.',
        ]],
        'Simple Key Value initialization information'
      );
    })
    .then(done)
    .catch(done);
  });

  it('should allow to get a undefined value by its key', (done) => {
    $.run(['log', 'kv'])
    .then(({ log, kv }) =>
      kv.get('lol')
      .then((value) => {
        assert.equal(value, {}.undef);
      })
    )
    .then(done)
    .catch(done);
  });

  ['trololol', { lol: 'lol' }, 1, true].forEach((value) => {
    it('should allow to set and get a ' + (typeof value) + ' by its key', (done) => {
      $.run(['log', 'kv'])
      .then(({ log, kv }) =>
        kv.set('lol', value)
        .then(() =>
          kv.get('lol')
          .then((_value) => {
            assert.deepEqual(_value, value);
          })
        )
      )
      .then(done)
      .catch(done);
    });
  });

  it('should allow to bulk get a undefined values by their keys', (done) => {
    $.run(['log', 'kv'])
    .then(({ log, kv }) =>
      kv.bulkGet(['lol', 'kikoo'])
      .then((values) => {
        assert.deepEqual(values, [{}.undef, {}.undef]);
      })
    )
    .then(done)
    .catch(done);
  });

  it('should allow to set and get values by their keys', (done) => {
    const keys = ['a', 'b', 'c', 'd'];
    const values = ['trololol', { lol: 'lol' }, 1, true];

    $.run(['log', 'kv'])
    .then(({ log, kv }) =>
      kv.bulkSet(keys, values)
      .then(() =>
        kv.bulkGet(keys)
        .then((_values) => {
          assert.deepEqual(_values, values);
        })
      )
    )
    .then(done)
    .catch(done);
  });

  describe('when timeout occurs', () => {
    let context;
    let delayClearSpy;
    let delayCreateSpy;

    beforeEach((done) => {
      $.run(['log', 'kv', 'delay'])
      .then(({ log, kv, delay }) => {
        delayClearSpy = sinon.spy(delay, 'clear');
        delayCreateSpy = sinon.spy(delay, 'create');
        context = { log, kv, delay };
        done();
      });
    });

    afterEach(() => {
      delayClearSpy.restore();
      delayCreateSpy.restore();
    });

    it('should reset the store after the delay timeout', (done) => {
      Promise.resolve(context)
      .then(({ log, kv, delay }) =>
        kv.set('lol', 'lol')
        .then(() => delay.__resolveAll())
        .then(() => {
        })
        .then(() => {
          assert.equal(delayClearSpy.args.length, 0);
          assert.deepEqual(delayCreateSpy.args, [[
            5 * 60 * 1000,
          ]]);
          return kv.get('lol').then((value) => {
            assert.equal(value, {}.undef);
          });
        })
        .then(() =>
          kv.set('lol', 'lol')
          .then(() =>
            kv.get('lol').then((value) => {
              assert.equal(value, 'lol');
            })
          )
          .then(() => delay.__resolveAll())
          .then(() => {
            assert.equal(delayClearSpy.args.length, 0);
            assert.deepEqual(delayCreateSpy.args, [[
              5 * 60 * 1000,
            ], [
              5 * 60 * 1000,
            ]]);
            return kv.get('lol').then((value) => {
              assert.equal(value, {}.undef);
            });
          })
        )
      )
      .then(done)
      .catch(done);
    });
  });
});
