import express, { type NextFunction, type Request, type Response } from 'express';
import { login } from './auth.ts';
import { seed } from './db.ts';
import { orders } from './orders.ts';
import { products } from './products.ts';

seed();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.post('/auth/login', login);
app.use('/products', products);
app.use('/orders', orders);

app.use((_req, res) => {
  res.status(404).json({ error: 'ruta inexistente' });
});

app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'error interno' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '127.0.0.1', () => {
  console.log(`shop-api en http://127.0.0.1:${port}`);
});
