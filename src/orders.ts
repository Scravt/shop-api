import { Router } from 'express';
import { requireAuth } from './auth.ts';
import { db } from './db.ts';
import { charge } from './payments.ts';

export const orders = Router();
orders.use(requireAuth);

interface Product {
  id: number;
  price_cents: number;
  stock: number;
}

const productById = db.prepare('SELECT id, price_cents, stock FROM products WHERE id = ?');
const orderById = db.prepare('SELECT * FROM orders WHERE id = ?');
const orderByKey = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?');
const insertOrder = db.prepare(
  `INSERT INTO orders (user, product_id, quantity, total_cents, idempotency_key, created_at)
   VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
);
const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

orders.post('/', async (req, res) => {
  const { product_id, quantity, idempotency_key } = req.body ?? {};
  if (!Number.isInteger(product_id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    res.status(400).json({ error: 'product_id entero y quantity entre 1 y 10 son obligatorios' });
    return;
  }
  if (idempotency_key !== undefined && typeof idempotency_key !== 'string') {
    res.status(400).json({ error: 'idempotency_key tiene que ser un string' });
    return;
  }

  if (idempotency_key) {
    const existing = orderByKey.get(idempotency_key);
    if (existing) {
      res.status(200).json(existing);
      return;
    }
  }

  const product = productById.get(product_id) as Product | undefined;
  if (product === undefined) {
    res.status(404).json({ error: 'producto inexistente' });
    return;
  }
  if (product.stock < quantity) {
    res.status(409).json({ error: 'sin stock suficiente' });
    return;
  }

  const total = product.price_cents * quantity;
  const payment = await charge(total);

  decrementStock.run(quantity, product_id);
  const order = insertOrder.get(
    res.locals.user,
    product_id,
    quantity,
    total,
    idempotency_key ?? null,
    new Date().toISOString(),
  );
  res.status(201).json({ ...order, payment_id: payment.id });
});

orders.get('/:id', (req, res) => {
  const order = orderById.get(Number(req.params.id));
  if (order === undefined) {
    res.status(404).json({ error: 'orden inexistente' });
    return;
  }
  res.json(order);
});
