# shop-api

API de tienda de ejemplo para probar [Crabfall](../load-test) en local. Node 24 + TypeScript (sin build) + Express 5 + SQLite en memoria.

```bash
npm install
npm start                 # http://127.0.0.1:3000
npm run typecheck
```

Variables: `PORT` (3000), `DEV_TOKEN` (`dev-token`), `PAYMENT_POOL` (5), `PAYMENT_LATENCY_MS` (30).

## Endpoints

| Método | Ruta | Auth | Notas |
| --- | --- | --- | --- |
| GET | `/health` | | |
| POST | `/auth/login` | | `{ "user": "alice", "password": "alice123" }` → `access_token` |
| GET | `/products?page=&limit=` | | 50.000 productos |
| GET | `/products/search?q=` | | hasta 50 resultados |
| GET | `/products/{id}` | | |
| POST | `/orders` | Bearer | `{ "product_id": 42, "quantity": 1, "idempotency_key"? }` → 201 |
| GET | `/orders/{id}` | Bearer | órdenes 1–1000 precargadas |

Usuarios: `alice/alice123`, `bob/bob123`, `loadtest/loadtest`. El token fijo `dev-token` sirve sin login.

Spec completa: [openapi.yaml](openapi.yaml).

## Pruebas de carga

```bash
crabfall validate checkout
crabfall run smoke
crabfall run checkout           # mezcla: 70% navega, 10% busca, 20% compra
crabfall run checkout-stress    # lo mismo a 300 it/s
crabfall run login              # solo login
```

## License

Licensed under either of [Apache License, Version 2.0](LICENSE-APACHE) or [MIT license](LICENSE-MIT), at your option. Copyright 2026 Gonzalo Martínez.
