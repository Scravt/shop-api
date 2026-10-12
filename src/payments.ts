import { setTimeout as sleep } from 'node:timers/promises';

// Cliente del gateway de pagos (simulado). El proveedor permite pocas conexiones simultáneas.
const maxConnections = Number(process.env.PAYMENT_POOL ?? 5);
const latencyMs = Number(process.env.PAYMENT_LATENCY_MS ?? 30);

let active = 0;
const waiting: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (active < maxConnections) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
}

function release(): void {
  const next = waiting.shift();
  if (next) {
    next();
  } else {
    active--;
  }
}

export async function charge(amountCents: number): Promise<{ id: string; amount_cents: number }> {
  await acquire();
  try {
    await sleep(latencyMs);
    return { id: `pay_${Date.now().toString(36)}`, amount_cents: amountCents };
  } finally {
    release();
  }
}
