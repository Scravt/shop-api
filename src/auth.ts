import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

interface Credentials {
  salt: Buffer;
  hash: Buffer;
}

const users = new Map<string, Credentials>();
const tokens = new Map<string, string>();

// Token fijo para pruebas locales sin login.
const DEV_TOKEN = process.env.DEV_TOKEN ?? 'dev-token';
tokens.set(DEV_TOKEN, 'dev');

function addUser(name: string, password: string): void {
  const salt = randomBytes(16);
  users.set(name, { salt, hash: scryptSync(password, salt, 64) });
}

addUser('alice', 'alice123');
addUser('bob', 'bob123');
addUser('loadtest', 'loadtest');

export function login(req: Request, res: Response): void {
  const { user, password } = req.body ?? {};
  if (typeof user !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'user y password son obligatorios' });
    return;
  }

  const credentials = users.get(user);
  const valid =
    credentials !== undefined &&
    timingSafeEqual(scryptSync(password, credentials.salt, 64), credentials.hash);
  if (!valid) {
    res.status(401).json({ error: 'credenciales inválidas' });
    return;
  }

  const token = randomBytes(24).toString('hex');
  tokens.set(token, user);
  res.json({ access_token: token, token_type: 'Bearer' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.get('authorization') ?? '';
  const user = header.startsWith('Bearer ') ? tokens.get(header.slice(7)) : undefined;
  if (user === undefined) {
    res.status(401).json({ error: 'falta un token válido' });
    return;
  }
  res.locals.user = user;
  next();
}
