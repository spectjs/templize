# templize <a href="https://github.com/spectjs/templize/actions/workflows/node.js.yml"><img src="https://github.com/spectjs/templize/actions/workflows/node.js.yml/badge.svg"/></a> <a href="http://npmjs.org/templize"><img src="https://img.shields.io/npm/v/templize"/></a>

> Native HTML templating based on template parts.

_Templize_ provides elegant native templating for any DOM elements with expressions and reactivity. It builds on [template-parts ponyfill](https://github.com/spectjs/template-parts), providing more user-friendly API.

Based on [Template Instantiation](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md) and [DOM-parts](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/DOM-Parts.md) spec.

## Features

Extends template parts with the following:

- Works with any elements;
- Expression processor;
- Reactive props support;
- Loops, conditions directives;
- Directives API;
- Vanilla ESM, no tooling.

## Usage

```html
<script type="importmap">{ "imports": { "templize": "parth/to/templize.js" }}</script>

<div id="foo" class="foo {{y}}">{{x}} world</div>

<script type="module">
  import templize from 'templize'

  const [params, update] = templize(document.getElementById('foo'), { x: 'Hello', y: 'bar'})
  // <div id="foo" class="foo bar">Hello world</div>

  params.x = 'Goodbye' // === update({x: 'Goodbye'})
  // <div id="foo" class="foo bar">Goodbye world</div>
</script>
```

`params` is proxy reflecting current state. Changing any of its props updates fields. `update` can be used for bulk-updating multiple props.

## Expressions

_Templize_ enables expressions via default **expression processor**:

```html
<header id="title">
  <h1>{{ user.name }}</h1>
  Email: <a href="mailto:{{ user.email }}">{{ user.email }}</a>
</header>

<script>
  import templize from 'templize'
  const titleParams = templize(
    document.querySelector('#title'),
    { user: { name: 'Hare Krishna', email: 'krishn@hari.om' }}
  )
  titleParams.user.name = 'Hare Rama'
</script>
```

It supports the following field expressions with common syntax:

Part | Expression
---|---
Value | `{{ foo }}`
Property | `{{ foo.bar?.baz }}`, `{{ foo["bar"] }}`
Call | `{{ foo.bar(baz, qux) }}`
Boolean | `{{ !foo && bar \|\| baz }}`
Ternary | `{{ foo ? bar : baz }}`
Primitives | `{{ "foo" }}`, `{{ true }}`, `{{ 0.1 }}`
Comparison | `{{ foo == 1 }}`, `{{ bar >= 2 }}`
Math | `{{ a * 2 + b / 3 }}`
Pipe | `{{ bar \| foo }}` ??? `{{ foo(bar) }}`
<!-- Loop | `{{ item, idx in list }}` | `params.d` | Used for `:for` directive only -->
<!-- Spread | `{{ ...foo }}` | `params.foo` | Used to pass multiple attributes or nodes -->

### Attributes

Processor makes assumptions regarding how attribute parts set values.

* `hidden="{{ boolean }}"` boolean values set or remove attribute.
* `onClick="{{ function }}"` assigns `onclick` handler function (no need to call it).
* `class="{{ classes }}"` can take either an array or a string.
* `style="{{ styles }}"` can take either an object or a string.

Other attributes are handled as strings.

### Reactivity

Initial state can define async/reactive values: _Promise_/_Thenable_, _AsyncIterable_, _Observable_/_Subject_.<br/>

Update happens when any param changes:

```html
<div id="done">{{ done || '...' }}</div>

<script type="module">
  import templize from 'templize'

  const done = new Promise(ok => setTimeout(() => ok('Done!'), 1000))

  templize(document.querySelector('#done'), { done })

  // <div id="done">...</div>

  // ... 1s after
  // <div id="done">done</div>
</script>
```

This way, for example, _rxjs_ can be streamed directly to element attribute or content.

Note: observers don't require disposal, since they're connected in weak fashion.

## Directives

_Templize_ recognizes shortcut directives via `:<attr>` (similar to _vue_).

### Loops

Iterating over set of items can be done with `each` directive:

```html
<ul>
  <li :each="{{ item in items }}" id="item-{{item.id}}" data-value="{{item.value}}">{{item.label}}</li>
</ul>

```

<!-- equivalent to
<ul>
  <template directive="each" expression="item in items">
    <li id="item-{{item.id}}" data-value={{item.value}}>{{item.label}}</li>
  </template>
</ul>
```
-->

<!--
#### Cases

```html
<li :each="{{ item, index in array }}">
<li :each="{{ key, value, index in object }}">
<li :each="{{ value in object }}">
```
-->

### Conditions

To optionally display an element, there are `if`, `else-if`, `else` directives.

```html
<span :if="{{ status == 0 }}">Inactive</span>
<span :else-if="{{ status == 1 }}">Active</span>
<span :else>Finished</span>
```

<!-- equivalent to
<template directive="if" expression="status == 0"><span>Inactive</span></template>
<template directive="else-if" expression="status == 1"><span>Active</span></template>
<template directive="else"><span>Finished</span></template>
```
 -->

Note: text conditions can be organized via ternary operator:

```html
<span>Status: {{ status === 0 ? 'Active' : 'Inactive' }}</span>
```

### Adding directives

To register a directive, `directive(name, onCreate)` function can be used:

```js
import templize, { directive } from 'templize'

directive('inline', (instance, innerTplPart, state) =>
  innerTplPart.replaceWith(innerTplPart.template.createInstance(state))
)
```

## Interop

_Templize_ supports any [standard](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md#32-template-parts-and-custom-template-process-callback) template parts processor:

```js
const params = templize(element, initState, {
  createCallback(element, parts, state) {
    // ... init parts / parse expressions
  },
  processCallback(element, parts, state) {
    // ... update parts / evaluate expressions
  }
})
```

Any external processor can be used with templize, eg. [@github/template-parts](https://github.com/github/template-parts):

```js
import templize from 'templize'
import { propertyIdentityOrBooleanAttribute } from '@github/template-parts'

const params = templize(
  document.getElementById('foo'),
  { x: 'Hello', hidden: false },
  propertyIdentityOrBooleanAttribute
)
params.hidden = true
```

_Templize_ expression processor can also be used with other template instancing libraries as:

```js
import { TemplateInstance } from '@github/template-parts'
import { processor } from 'templize'

const instance = new TemplateInstance(document.querySelector('my-template'), {}, processor)
```

Or it can be used with proposal polyfill:

```js
import 'templize-instantiation-polyfill'
import { processor } from 'templize'

document.defineTemplateType('my-template-type', processor)
```

## Dependencies

* [template-parts](https://github.com/spectjs/template-parts) ??? compact template parts ponyfill.
* [subscript](https://github.com/spectjs/subscript) ??? fast and tiny expressions parser.
* [sube](https://github.com/specths/sube) ??? subscribe to any reactive source.
* [element-props](https://github.com/specths/element-props) ??? normalized element properties setter.
<!-- * [swapdom](https://github.com/specths/swapdom) ??? fast and tiny dom swapping algo. -->

## Buddies

* [spect](https://github.com/spectjs/spect) ??? selector observer, perfect match for organizing flexible native DOM templates.
* [value-ref](https://github.com/spectjs/value-ref) ??? reactive value container with reactivity, useful for state management.
* [subscribable-things](https://github.com/chrisguttandin/subscribable-things) ??? reactive wrappers for various APIs.
<!-- * [define-element](https://github.com/spectjs/define-element) ??? declarative custom elements. -->

## Neighbors

* [stampino](https://www.npmjs.com/package/stampino) ??? small HTML template system based on lit-html.


<p align="center">????<p>
