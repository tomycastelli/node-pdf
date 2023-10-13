function organizeData(inputArray) {
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

    // Push the current item to the corresponding currency's movimientos array
    currencies[transaccion_divisa].movimientos.push({
      cuenta_id,
      fecha,
      operacion_tipo,
      operacion_sucursal,
      operacion_operador,
      detalle,
      observaciones,
      entrada: parsedEntrada.toLocaleString('es-AR'),
      salida: parsedSalida.toLocaleString('es-AR'),
      saldo: parseFloat((currencies[transaccion_divisa].saldo).toFixed(2)).toLocaleString('es-AR'), // Include saldo in movimiento
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

module.exports = {
  organizeData,
};
