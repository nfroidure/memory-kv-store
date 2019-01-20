[//]: # ( )
[//]: # (This file is automatically generated by a `metapak`)
[//]: # (module. Do not change it  except between the)
[//]: # (`content:start/end` flags, your changes would)
[//]: # (be overridden.)
[//]: # ( )
# memory-kv-store
> A simple in-memory key/value store.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nfroidure/memory-kv-store/blob/master/LICENSE)
[![Build status](https://secure.travis-ci.org/nfroidure/memory-kv-store.svg)](https://travis-ci.org/nfroidure/memory-kv-store)
[![Coverage Status](https://coveralls.io/repos/nfroidure/memory-kv-store/badge.svg?branch=master)](https://coveralls.io/r/nfroidure/memory-kv-store?branch=master)
[![NPM version](https://badge.fury.io/js/memory-kv-store.svg)](https://npmjs.org/package/memory-kv-store)
[![Dependency Status](https://david-dm.org/nfroidure/memory-kv-store.svg)](https://david-dm.org/nfroidure/memory-kv-store)
[![devDependency Status](https://david-dm.org/nfroidure/memory-kv-store/dev-status.svg)](https://david-dm.org/nfroidure/memory-kv-store#info=devDependencies)
[![Package Quality](http://npm.packagequality.com/shield/memory-kv-store.svg)](http://packagequality.com/#?package=memory-kv-store)
[![Code Climate](https://codeclimate.com/github/nfroidure/memory-kv-store.svg)](https://codeclimate.com/github/nfroidure/memory-kv-store)


[//]: # (::contents:start)

This simple project is intended to mock real key value stores likes Redis or
 file system based stores. It can also be used in local scripts to run code
 that assume a key value store exists.

It requires a `delay` services to be passed in, you can find an implementation
 in the [`common-services`](https://github.com/nfroidure/common-services)
 project.

[//]: # (::contents:end)

# API
## Classes

<dl>
<dt><a href="#KV">KV</a></dt>
<dd><p>Creates a key/value store</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#initKV">initKV(services)</a> ⇒ <code><a href="#KV">Promise.&lt;KV&gt;</a></code></dt>
<dd><p>Instantiate the kv service</p>
</dd>
</dl>

<a name="KV"></a>

## KV
Creates a key/value store

**Kind**: global class  

* [KV](#KV)
    * [.set(key, value)](#KV+set) ⇒ <code>Promise</code>
    * [.get(key)](#KV+get) ⇒ <code>Promise</code>
    * [.bulkSet(keys, values)](#KV+bulkSet) ⇒ <code>Promise</code>
    * [.bulkGet(keys)](#KV+bulkGet) ⇒ <code>Promise.&lt;Array&gt;</code>

<a name="KV+set"></a>

### kV.set(key, value) ⇒ <code>Promise</code>
Set a value in the store

**Kind**: instance method of [<code>KV</code>](#KV)  
**Returns**: <code>Promise</code> - A promise to be resolved when the value is stored.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to store the value at |
| value | <code>\*</code> | The value to store |

**Example**  
```js
kv.set('hello', 'world');
.then(() => console.log('Stored!'));
// Prints: Stored!
```
<a name="KV+get"></a>

### kV.get(key) ⇒ <code>Promise</code>
Get a value from the store

**Kind**: instance method of [<code>KV</code>](#KV)  
**Returns**: <code>Promise</code> - A promise that resolve to the actual value.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key that map to the value |

**Example**  
```js
kv.get('hello');
.then((value) => console.log(value));
// Prints: world
```
<a name="KV+bulkSet"></a>

### kV.bulkSet(keys, values) ⇒ <code>Promise</code>
Set a several values in the store

**Kind**: instance method of [<code>KV</code>](#KV)  
**Returns**: <code>Promise</code> - A promise to be resolved when the values are stored.  

| Param | Type | Description |
| --- | --- | --- |
| keys | <code>Array.String</code> | The keys to store the values at |
| values | <code>Array</code> | The values to store |

**Example**  
```js
kv.bulkSet(['hello', 'foo'], ['world', 'bar']);
.then(() => console.log('Stored!'));
// Prints: Stored!
```
<a name="KV+bulkGet"></a>

### kV.bulkGet(keys) ⇒ <code>Promise.&lt;Array&gt;</code>
Get a several values from the store

**Kind**: instance method of [<code>KV</code>](#KV)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - A promise to be resolved when the values
 are retrieved.  

| Param | Type | Description |
| --- | --- | --- |
| keys | <code>Array.String</code> | The keys to retrieve the values |

**Example**  
```js
kv.bulkGet(['hello', 'foo']);
.then((values) => console.log(values));
// Prints: ['world', 'bar']
```
<a name="initKV"></a>

## initKV(services) ⇒ [<code>Promise.&lt;KV&gt;</code>](#KV)
Instantiate the kv service

**Kind**: global function  
**Returns**: [<code>Promise.&lt;KV&gt;</code>](#KV) - A promise of the kv service  

| Param | Type | Description |
| --- | --- | --- |
| services | <code>Object</code> | The services to inject |
| services.delay | <code>function</code> | A delaying function |
| [services.log] | <code>function</code> | A logging function |
| [services.KV_TTL] | <code>Number</code> | The store time to live |
| [services.KV_STORE] | <code>Map</code> | The store for values as a simple object, it is useful  to get a synchronous access to the store in tests  for example. |

**Example**  
```js
import initKV from 'memory-kv-store';

const kv = await initKV({
  delay: Promise.delay.bind(Promise),
});
```

# Authors
- [Nicolas Froidure](http://insertafter.com/en/index.html)

# License
[MIT](https://github.com/nfroidure/memory-kv-store/blob/master/LICENSE)
