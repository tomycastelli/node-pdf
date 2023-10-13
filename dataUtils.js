function transformCuenta(inputArray) {
  const result = {
    cliente: "",
    cuentas: [],
  };

  // Create an object to store unique currencies as keys
  const currencies = {};

  // Iterate through the inputArray to organize data by currency
  inputArray.forEach((item) => {
    const {
      cliente_nombre,
      transaccion_divisa,
      cuenta_id,
      fecha,
      operacion_tipo,
      operacion_sucursal,
      operacion_operador,
      detalle,
      observaciones,
      entrada,
      salida,
    } = item;

    // Set the cliente value if not already set
    if (!result.cliente) {
      result.cliente = cliente_nombre;
    }

    // Check if the currency exists in currencies
    if (!currencies[transaccion_divisa]) {
      currencies[transaccion_divisa] = {
        divisa: transaccion_divisa,
        movimientos: [],
        saldo: 0.00, // Initialize saldo to 0 for the divisa
      };
    }

    // Parse entrada and salida as numbers and set to 0 if null
    const parsedEntrada = entrada !== null ? parseFloat(entrada) : 0.00;
    const parsedSalida = salida !== null ? parseFloat(salida) : 0.00;

    // Calculate saldo for the divisa based on entrada and salida
    currencies[transaccion_divisa].saldo += parsedEntrada - parsedSalida;

    // Format the fecha value to the desired format
    const formattedFecha = new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');

    // Push the current item to the corresponding currency's movimientos array
    currencies[transaccion_divisa].movimientos.push({
      cuenta_id,
      fecha: formattedFecha,
      operacion_tipo,
      operacion_sucursal,
      operacion_operador,
      detalle,
      observaciones,
      entrada: parsedEntrada.toLocaleString('es-AR'),
      salida: parsedSalida.toLocaleString('es-AR'),
      saldo: parseFloat(currencies[transaccion_divisa].saldo.toFixed(2)).toLocaleString('es-AR'), // Include saldo in movimiento
    });
  });

  // Convert the currencies object values to an array and add it to result.cuentas
  result.cuentas = Object.values(currencies);

  // Round the saldo at the top level (outside the forEach loop)
  result.cuentas.forEach((currency) => {
    currency.saldo = parseFloat(currency.saldo).toFixed(2).toLocaleString('es-AR');
  });

  return result;
}

function transformCaja(data) {
  const divisa = data[0].transaccion_divisa;
  const movimientos = [];
  let saldoFinal = 0;
  let prevDate = null;
  let lastEntryOfDayBefore = null;

  data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  for (let i = data.length - 1; i >= 0; i--) {
    const current = data[i];
    const currentDate = new Date(current.fecha).toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
    });
    let saldo = saldoFinal;
    if (current.entrada) {
      saldo += parseFloat(current.entrada);
    } else if (current.salida) {
      saldo -= parseFloat(current.salida);
    }
    saldoFinal = saldo;

    const roundedSaldo = parseFloat(saldo.toFixed(2));
    const roundedEntrada = current.entrada ? parseFloat(current.entrada) : 0.0;
    const roundedSalida = current.salida ? parseFloat(current.salida) : 0.0;

    const { transaccion_divisa, ...rest } = current;
    const movimiento = { ...rest, saldo: roundedSaldo, entrada: roundedEntrada, salida: roundedSalida };

    if (prevDate !== currentDate && lastEntryOfDayBefore) {
      const lastDate = new Date(lastEntryOfDayBefore.fecha);
      lastDate.setHours(23, 59, 59);
      const formattedDate = lastDate.toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      }).replace(/\//g, '-');
      const saldoDiario = {
        detalle: 'Saldo diario',
        fecha: formattedDate,
        saldo: lastEntryOfDayBefore.saldo,
      };
      movimientos.push(saldoDiario);
    }

    movimientos.push(movimiento);
    prevDate = currentDate;
    lastEntryOfDayBefore = movimiento;
  }

  const formattedMovimientos = movimientos.reverse().map((item) => {
    if (item.fecha) {
      const date = new Date(item.fecha);
      const formattedDate = date.toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      }).replace(/\//g, '-');
      return { ...item, fecha: formattedDate };
    }
    return item;
  });

  return { divisa, movimientos: formattedMovimientos, saldoFinal: parseFloat(saldoFinal.toFixed(2)) };
}

module.exports = {
  transformCaja,
  transformCuenta
};
