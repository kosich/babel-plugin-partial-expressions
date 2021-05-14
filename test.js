'use strict';

let a;
let inc = x => x + 1;
// Poor man's testing
// TODO: use proper tool w/ ast and exec specs
let log = console.log;
let assert = console.assert;

// Simple id fn
log('~ _');
a = ~ _;
assert(a(42) === 42);

log('~ _ + 1');
a = ~ _ + 1;
assert(a(41) === 42);

log('~ _(40) + 1');
a = ~ _(40) + 1;
assert(a(inc) === 42);

// mapping
log('[1,2,3].map(~ _ + 1).join()')
a = [1,2,3].map(~ _ + 1).join();
assert(a === '2,3,4');

log('[1,2,3].filter(~_ % 2).map(~ _ + 1).join()')
a = [1,2,3].filter(~_ % 2).map(~_ + 1).join()
assert(a === '2,4');

// pipe subject
log('~ _ |> inc')
a = ~ _ |> inc
assert(a(42) === 43)

// pipe processor
log('42 |> ~ _')
a = 42 |> ~ _
assert(a === 42)

log('42 |> ~ _ * 2')
a = 42 |> ~ _ * 2
assert(a === 84)

log('42 |> ~ _ * 2 |> inc')
a = 42 |> ~ _ * 2 |> inc
assert(a === 85)

// pipe implied expression start
log('42 |> _ + 1')
a = 42 |> _ + 1
assert(a === 43)

log('42 |> _ |> inc')
a = 42 |> _ |> inc
assert(a === 43)

// pipe subject
// THROWS cz _ is unbound
// a = _ |> inc

// literals
log("~ { answer: _ + '!' }")
a = ~ { answer: _ + '!' };
assert(a(42).answer === '42!');

log('~[ _ ]')
a = ~[ _ ];
assert(Array.isArray(a(42)));

console.log('done');