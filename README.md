# Partial Expressions - Babel plugin

Try it in this **[babel playground](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=usage&corejs=3.6&spec=false&loose=false&code_lz=DYUwLgBAlgdgxhAvBAfhA-hA1BAjAbgCg4B7GAZxNADpgSBzACljkYBZcBKTow0SAA5QBIACZIIbAAwQAPgD4M2CACYipClRC0GjISNE8gA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=false&presets=stage-0%2Cstage-1&prettier=false&targets=&version=7.13.17&externalPlugins=%40kosich%2Fbabel-plugin-partial-expressions-experiment%400.0.4)**.

Or install it via

```
npm i @kosich/babel-plugin-partial-expressions-experiment -D
```

And then add it to your `babel.config.json` as [described here](https://babeljs.io/docs/en/plugins).

_NOTE: put it before pipeline operator plugins, if you use those._

## About

Partial expressions is a syntax sugar to simplify writing expression that are awating one additional variable.

Syntax:
- `_` is a placeholder for the value
- `~` is used to mark partial expression root and is required whenever we use `_` (except for RHS pipes)

Examples:

```js
let bang = ~ _ + '!';
// equals to
let bang = x => x + '!';
```

As a partially applied function:

```js
let bangLog = ~ console.log(_, '!');
// equals to
let bangLog = x => console.log(x, '!');
```

And as a context of application:

```js
let toBase16 = ~ _.toString(16);
// equals to
let toBase16 = x => x.toString(16);
```

It is also compatible with the [pipeline operator](https://github.com/tc39/proposal-pipeline-operator):

I tried to cover a special case for **pipes**, when `_` is in RHS of a pipe. E.g:

```js
let value = 42 |> _ + 1 |> console.log;
// equals to
let value = 42 |> (x => x + 1) |> console.log;
```

Similarly, we can do partial application:

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

    2.1 `~` operator
    `let a = ~ _ + '!'` equals `let a = x => x + '!'`

    2.2 RHS in pipeline operator    
    `42 |> _ + 1 |> console.log` equals `42 |> (x => x + 1) |> console.log`

## The End 🙂
