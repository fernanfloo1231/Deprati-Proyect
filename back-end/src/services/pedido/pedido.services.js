// En services/pedido/pedido.services.js
const pedidoModel = require("../../models/pedido/pedido.models");
const carritoModel = require("../../models/carrito/carrito.models");
const productoModel = require("../../models/producto/producto.models");
const rastreoModel = require("../../models/rastreo/rastreo.models");
const pool = require("../../config/db");

// Crear pedido desde carrito
exports.crearPedidoDesdeCarrito = async (id_cliente, pedidoData) => {
  console.log(" Creando pedido desde carrito para cliente:", id_cliente);

  const carrito = await carritoModel.findCarritoActivoByCliente(id_cliente);
  console.log(" Carrito encontrado:", carrito);

  if (!carrito || !carrito.productos || carrito.productos.length === 0) {
    throw new Error("Carrito vacío o no encontrado");
  }

  for (const producto of carrito.productos) {
    const productoInfo = await productoModel.findById(producto.id_producto);
    if (productoInfo.stock < producto.cantidad) {
      throw new Error(
        `Stock insuficiente para: ${productoInfo.nombre}. Disponible: ${productoInfo.stock}, Solicitado: ${producto.cantidad}`
      );
    }
  }

  const pedido = await pedidoModel.crearPedido({
    ...pedidoData,
    id_cliente: id_cliente,
    total: carrito.total_carrito || 0,
  });

  console.log(" Pedido creado:", pedido);

  for (const producto of carrito.productos) {
    await pedidoModel.agregarDetallePedido(
      pedido.id_pedido,
      producto.id_producto,
      producto.cantidad,
      producto.precio_unitario || producto.precio
    );

    await productoModel.actualizarStock(
      producto.id_producto,
      -producto.cantidad
    );
  }

  console.log(" Creando registro de rastreo para pedido:", pedido.id_pedido);
  const rastreo = await rastreoModel.crearRastreo({
    id_pedido: pedido.id_pedido,
    ubicacion_actual: "Centro de distribución principal",
    ciudad: this.extraerCiudad(pedidoData.direccion_entrega),
    estado_entrega: "Procesando",
    observaciones: "Pedido recibido y en proceso de preparación",
  });
  console.log(" Rastreo creado:", rastreo);

  await carritoModel.finalizarCarrito(carrito.id_carrito);

  return pedido;
};

// Crear pedido desde productos enviados
exports.crearPedidoDesdeProductos = async (id_cliente, pedidoData) => {
  const { metodo_pago, direccion_entrega, observaciones, productos } =
    pedidoData;

  console.log(" Procesando productos para pedido:", productos);

  const total = productos.reduce((sum, producto) => {
    return sum + producto.precio_unitario * producto.cantidad;
  }, 0);

  console.log(" Total calculado:", total);

  for (const producto of productos) {
    const productoInfo = await productoModel.findById(producto.id_producto);
    console.log(
      ` Verificando stock: ${productoInfo.nombre} - Stock: ${productoInfo.stock}, Solicitado: ${producto.cantidad}`
    );

    if (productoInfo.stock < producto.cantidad) {
      throw new Error(
        `Stock insuficiente para: ${productoInfo.nombre}. Disponible: ${productoInfo.stock}, Solicitado: ${producto.cantidad}`
      );
    }
  }

  const pedido = await pedidoModel.crearPedido({
    id_cliente: id_cliente,
    total: total,
    metodo_pago: metodo_pago,
    direccion_entrega: direccion_entrega,
    observaciones: observaciones,
  });

  console.log(" Pedido creado en BD:", pedido);

  for (const producto of productos) {
    console.log(" Agregando producto al detalle:", producto);

    const productoInfo = await productoModel.findById(producto.id_producto);

    await pedidoModel.agregarDetallePedido(
      pedido.id_pedido,
      producto.id_producto,
      producto.cantidad,
      producto.precio_unitario
    );

    console.log(
      ` Actualizando stock: Producto ${producto.id_producto}, Restar ${producto.cantidad}`
    );
    await productoModel.updateStock(
      producto.id_producto,
      productoInfo.stock - producto.cantidad
    );
  }

  console.log(" Creando registro de rastreo para pedido:", pedido.id_pedido);
  const rastreo = await rastreoModel.crearRastreo({
    id_pedido: pedido.id_pedido,
    ubicacion_actual: "Centro de distribución principal",
    ciudad: this.extraerCiudad(direccion_entrega),
    estado_entrega: "Procesando",
    observaciones: "Pedido recibido y en proceso de preparación",
  });
  console.log(" Rastreo creado:", rastreo);

  return pedido;
};

//  Obtener productos desde detalle_pedido
exports.obtenerProductosDePedido = async (id_pedido) => {
  const query = `
        SELECT 
            dp.id_producto,
            p.nombre,
            dp.cantidad,
            dp.precio_unitario,
            p.imagen_url
        FROM detalle_pedido dp
        JOIN productos p ON p.id_producto = dp.id_producto
        WHERE dp.id_pedido = $1
    `;

  const { rows } = await pool.query(query, [id_pedido]);
  return rows;
};

// Obtener pedido específico
exports.obtenerPedidoPorId = async (id_pedido, id_cliente) => {
  return await pedidoModel.findPedidoById(id_pedido, id_cliente);
};

// Cancelar pedido
exports.cancelarPedido = async (id_pedido, id_cliente) => {
  return await pedidoModel.cancelarPedido(id_pedido, id_cliente);
};

// Extraer ciudad
exports.extraerCiudad = (direccion) => {
  const ciudades = [
    "Quito",
    "Guayaquil",
    "Cuenca",
    "Ambato",
    "Manta",
    "Portoviejo",
    "Loja",
    "Ibarra",
    "Riobamba",
    "Esmeraldas",
  ];

  for (const ciudad of ciudades) {
    if (direccion.toLowerCase().includes(ciudad.toLowerCase())) {
      return ciudad;
    }
  }

  return "Quito";
};

// Obtener pedidos del cliente
exports.obtenerPedidosCliente = async (id_cliente) => {
  return await pedidoModel.findPedidosByCliente(id_cliente);
};
