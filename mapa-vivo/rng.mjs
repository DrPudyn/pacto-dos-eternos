// Gerador determinístico. O mesmo seed produz o mesmo continente,
// então um teste e uma sessão podem reproduzir o trecho.

export function hash32(seed, index) {
  let x = Math.imul((seed >>> 0) ^ Math.imul(index + 1, 0x9e3779b1), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
