// Ok
let a = _;
console.log(a('a'))

// Ok
let b = _ |> console.log;
b('b');

// Ok
let c = 'c' |> _ |> console.log;

// Ok
let d = _ |> _ + 1 |> console.log;
d('d');

// Err: limited to prop value
let e = { answer: _ };
console.log(e);

// Ok
let f = [ _ ];
console.log(f);