SELECT 
    o.id AS operacion_id,
    o.fecha AS fecha,
    o.tipo AS tipo,
    o.sucursal AS sucursal,
    o.operador AS operador,
    o.detalle AS observacion,
    c.nombre AS cliente,
    t.id AS transaccion_id,
    t.medio,
    t.divisa,
    CASE
        WHEN t.direccion = 1 THEN t.monto
        ELSE NULL
    END AS entrada,
    CASE
        WHEN t.direccion = -1 THEN t.monto
        ELSE NULL
    END AS salida,
    CASE
        WHEN cuentas.detalle = "Fee" THEN (cuentas.monto / t.monto) * 100
        ELSE NULL
    END AS cambio
FROM 
    operaciones o
JOIN 
    clientes c ON o.cliente_id = c.id
JOIN 
    transacciones t ON t.operacion_id = o.id
LEFT JOIN
    cuentas ON t.id = cuentas.transaccion_id AND cuentas.detalle = "Fee"