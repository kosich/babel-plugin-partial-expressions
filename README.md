# Partial Expressions - Babel plugin

Try it in this **[babel playground](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=usage&corejs=3.6&spec=false&loose=false&code_lz=CwJgUABBA-B8EH0IGoIHICEbI3gYwHsA7AZwIBsBTAOnIIHMBuIA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=true&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=env%2Cstage-0%2Cstage-1&prettier=false&targets=&version=7.13.17&externalPlugins=%40kosich%2Fbabel-plugin-partial-expressions-experiment%400.0.1)**.

Or install it via

```
npm i @kosich/babel-plugin-partial-expressions-experiment -D
```

And then add it to your `babel.config.json` as [described here](https://babeljs.io/docs/en/plugins).

_NOTE: put it before pipeline operator plugins, if you use those._

## About

Partial expressions is a syntax sugar to simplify writing expression that are awating one additional variable, e.g.:

```js
let bang = _ + '!';
// equals to
let bang = x => x + '!';
```

As a partially applied function:

```js
let bangLog = console.log(_, '!');
// equals to
let bangLog = x => console.log(x, '!');
```

And as a context of application:

```js
let toBase16 = _.toString(16);
// equals to
let toBase16 = x => x.toString(16);
```

It is also compatible with the [pipeline operator](https://github.com/tc39/proposal-pipeline-operator):

I tried to cover two special cases for pipes.

When the partial expression is in the **subject** of piping:

```js
let fn = _ |> increment |> console.log;
// equals to
let fn = x => (x |> increment |> console.log);
```

And when it's in a **pipe**:

```js
let value = 42 |> _ + 1 |> console.log;
// equals to
let value = 42 |> (x => x + 1) |> console.log;
```

.

Similarly, we could do partial application:

```js
42 |> console.log(_, '!');
// equals to
42 |> (x => console.log(x, '!'));
```

And as a context:

```js
42 |> _.toString(16) |> _.toUpperCase();
// equals to
42 |> (x => x.toString(16)) |> (x => x.toUpperCase());
```

## Rules

1. Expression is considered partial if an unbound `_` symbol is used in it.

2. Expression boudaries are limited by following:

    2.1 root of an expression    
    `let a = _ + '!'` equals `let a = x => x + '!'`

    2.2 body of a function    
    `let b = x => _ + '!'` equals `let b = x => n => n + '!'`

    2.3 pipe in pipeline operator    
    `42 |> _ + 1 |> console.log` equals `42 |> (x => x + 1) |> console.log`

## The End 🙂
