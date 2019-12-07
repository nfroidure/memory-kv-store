# API
## Classes

<dl>
<dt><a href="#default">default</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#initKV">initKV(services)</a> ⇒ <code>Promise.&lt;KV&gt;</code></dt>
<dd><p>Instantiate the kv service</p>
</dd>
</dl>

<a name="default"></a>

## default
**Kind**: global class  
<a name="new_default_new"></a>

### new exports.default()
Creates a key/value store

<a name="initKV"></a>

## initKV(services) ⇒ <code>Promise.&lt;KV&gt;</code>
Instantiate the kv service

**Kind**: global function  
**Returns**: <code>Promise.&lt;KV&gt;</code> - A promise of the kv service  

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
