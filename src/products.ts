import { Router } from 'express';
import { db } from './db.ts';

export const products = Router();

const listPage = db.prepare('SELECT id, name, price_cents, stock FROM products ORDER BY id LIMIT ? OFFSET ?');
const search = db.prepare(
  'SELECT id, name, price_cents FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY name LIMIT 50',
);
const byId = db.prepare('SELECT * FROM products WHERE id = ?');

products.get('/', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  res.json({ page, limit, items: listPage.all(limit, (page - 1) * limit) });
});

products.get('/search', (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q === '') {
    res.status(400).json({ error: 'q es obligatorio' });
    return;
  }
  const pattern = `%${q}%`;
  res.json({ items: search.all(pattern, pattern) });
});

products.get('/:id', (req, res) => {
  const product = byId.get(Number(req.params.id));
  if (product === undefined) {
    res.status(404).json({ error: 'producto inexistente' });
    return;
  }
  res.json(product);
});
