import { DatabaseSync } from 'node:sqlite';

export const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE products (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    stock       INTEGER NOT NULL
  );

  CREATE TABLE orders (
    id              INTEGER PRIMARY KEY,
    user            TEXT NOT NULL,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    quantity        INTEGER NOT NULL,
    total_cents     INTEGER NOT NULL,
    idempotency_key TEXT UNIQUE,
    created_at      TEXT NOT NULL
  );
`);

const adjectives = ['red', 'blue', 'green', 'small', 'large', 'vintage', 'modern', 'wooden', 'steel', 'cotton'];
const nouns = ['lamp', 'chair', 'table', 'mug', 'shirt', 'backpack', 'notebook', 'clock', 'pillow', 'bottle'];

export function seed(products = 50_000, orders = 1_000): void {
  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price_cents, stock) VALUES (?, ?, ?, ?)',
  );
  const insertOrder = db.prepare(
    'INSERT INTO orders (user, product_id, quantity, total_cents, created_at) VALUES (?, ?, ?, ?, ?)',
  );

  db.exec('BEGIN');
  for (let i = 0; i < products; i++) {
    const name = `${adjectives[i % adjectives.length]} ${nouns[Math.floor(i / adjectives.length) % nouns.length]} ${i}`;
    const description = `A ${name} for everyday use. Model ${(i * 7919) % 100_000}.`;
    insertProduct.run(name, description, 500 + ((i * 37) % 20_000), 100_000);
  }
  for (let i = 1; i <= orders; i++) {
    insertOrder.run('alice', ((i * 13) % products) + 1, 1, 1_000, new Date().toISOString());
  }
  db.exec('COMMIT');
}
