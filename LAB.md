# Problemas de performance intencionales

Sirven para validar el diagnóstico de lt (rebanada 5). **No se lo muestres al agente** cuando pruebes si encuentra la causa solo.

| # | Dónde | Problema | Señal esperada |
| --- | --- | --- | --- |
| 1 | `src/auth.ts` `login` | `scryptSync` bloquea el event loop (~29 ms de CPU por login) | Throughput tope ~35 login/s; la latencia explota y arrastra a los demás endpoints |
| 2 | `src/products.ts` `/search` | `LIKE '%q%'` sobre 50.000 filas sin índice, sincrónico | ~9 ms por búsqueda; a tasa alta bloquea el event loop |
| 3 | `src/payments.ts` | Pool de 5 conexiones al gateway, 30 ms cada una | Tope ~166 órdenes/s; después, cola y latencia creciente en `create_order` |
| 4 | `src/orders.ts` | Sin control de concurrencia en el stock (lectura, `await`, escritura) | Con stock bajo, la carga concurrente lo deja negativo |

Mediciones de referencia (12 oct 2026, esta máquina):

- `login` a 30/s: p50 29 ms. A 60/s: throughput 36,7/s, p50 2,2 s y 22% de iteraciones descartadas.
- `checkout` a 50 it/s: `create_order` p50 39 ms, `search_products` p50 9 ms, el resto < 2 ms.
