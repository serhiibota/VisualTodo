// crypto.randomUUID появился только в Safari 15.4 — используем простой генератор.
let counter = 0;

export function uid(): string {
  counter = (counter + 1) % 1679616;
  return (
    Date.now().toString(36) +
    counter.toString(36).padStart(4, "0") +
    Math.random().toString(36).slice(2, 6)
  );
}
