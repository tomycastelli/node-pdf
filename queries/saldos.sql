SELECT 
    c.nombre AS cliente,
    SUM(CASE WHEN t.divisa = 'usd' AND cc.direccion = 1 THEN (CASE WHEN cc.monto > 0.00 THEN cc.monto ELSE t.monto END)
             WHEN t.divisa = 'usd' AND cc.direccion = -1 THEN (CASE WHEN cc.monto > 0.00 THEN -cc.monto ELSE -t.monto END)
             ELSE 0 END) AS usd,
    SUM(CASE WHEN t.divisa = 'usdt' AND cc.direccion = 1 THEN (CASE WHEN cc.monto > 0.00 THEN cc.monto ELSE t.monto END)
             WHEN t.divisa = 'usdt' AND cc.direccion = -1 THEN (CASE WHEN cc.monto > 0.00 THEN -cc.monto ELSE -t.monto END)
             ELSE 0 END) AS usdt,
    SUM(CASE WHEN t.divisa = 'ars' AND cc.direccion = 1 THEN (CASE WHEN cc.monto > 0.00 THEN cc.monto ELSE t.monto END)
             WHEN t.divisa = 'ars' AND cc.direccion = -1 THEN (CASE WHEN cc.monto > 0.00 THEN -cc.monto ELSE -t.monto END)
             ELSE 0 END) AS ars,
    SUM(CASE WHEN t.divisa = 'eur' AND cc.direccion = 1 THEN (CASE WHEN cc.monto > 0.00 THEN cc.monto ELSE t.monto END)
             WHEN t.divisa = 'eur' AND cc.direccion = -1 THEN (CASE WHEN cc.monto > 0.00 THEN -cc.monto ELSE -t.monto END)
             ELSE 0 END) AS eur,
    SUM(CASE WHEN t.divisa = 'brl' AND cc.direccion = 1 THEN (CASE WHEN cc.monto > 0.00 THEN cc.monto ELSE t.monto END)
             WHEN t.divisa = 'brl' AND cc.direccion = -1 THEN (CASE WHEN cc.monto > 0.00 THEN -cc.monto ELSE -t.monto END)
             ELSE 0 END) AS brl
FROM cuentas cc
INNER JOIN transacciones t ON cc.transaccion_id = t.id
INNER JOIN operaciones o ON t.operacion_id = o.id
INNER JOIN clientes c ON o.cliente_id = c.id
WHERE cc.tipo = 'cuenta corriente'
GROUP BY cliente, c.id
HAVING (usd <> 0) OR (usdt <> 0) OR (ars <> 0) OR (eur <> 0) OR (brl <> 0);
