SELECT 
    c.id AS cuenta_id,
    t.id AS transaccion_id,
    o.id AS operacion_id,
    c.fecha AS fecha,
    o.tipo AS operacion_tipo,
    o.sucursal AS operacion_sucursal,
    o.operador AS operacion_operador,
    c1.nombre AS cliente_nombre,
    t.divisa AS transaccion_divisa,
    t.medio AS transaccion_medio,
    c.detalle AS detalle,
    o.detalle AS observaciones,
    CASE 
        WHEN c.direccion = 1 THEN COALESCE(NULLIF(c.monto, 0), t.monto)
        ELSE NULL
    END AS entrada,
    CASE 
        WHEN c.direccion = -1 THEN COALESCE(NULLIF(c.monto, 0), t.monto)
        ELSE NULL
    END AS salida
FROM 
    cuentas c
JOIN 
    transacciones t ON c.transaccion_id = t.id
JOIN 
    operaciones o ON t.operacion_id = o.id
JOIN 
    clientes c1 ON o.cliente_id = c1.id
WHERE 
    c.tipo = 'cuenta corriente' AND c1.nombre = ?;
