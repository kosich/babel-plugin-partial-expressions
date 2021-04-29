// Core
let Observable =
  producer =>
  subscriber =>
  producer(subscriber);

let subscribe =
  subscriber =>
  observable =>
  observable(subscriber);

// Producers
let timer = interval => Observable(subscriber => {
  let i = 0;
  let id = setInterval(() => subscriber(i++), interval);
  return () => clearInterval(id);
});

// Operators
let filter = fn => source => Observable(subscriber => 
  source(value => fn(value) && subscriber(value))
)

let map = fn => source => Observable(subscriber => 
  source(value => subscriber(fn(value)))
)

// WILDLANDS
let unsub = timer(100)
  |> filter(x => x % 2)
  |> map(x => x + '!')
  |> subscribe(console.log)


setTimeout(unsub, 1000);
