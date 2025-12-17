const db = require("../../config/db");
const { enviarFacturaPedido } = require("../../services/mail/mail.service");

// =============================
// Crear nuevo pedido
// =============================
exports.crearPedido = async (pedidoData) => {
  const query = `
        INSERT INTO pedidos (id_cliente, total, metodo_pago, direccion_entrega, observaciones)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
  const values = [
    pedidoData.id_cliente,
    pedidoData.total,
    pedidoData.metodo_pago,
    pedidoData.direccion_entrega,
    pedidoData.observaciones,
  ];
  const result = await db.query(query, values);
  return result.rows[0];
};

// =============================
// Agregar detalle de pedido
// =============================
exports.agregarDetallePedido = async (
  id_pedido,
  id_producto,
  cantidad,
  precio_unitario
) => {
  const query = `
        INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
  const values = [id_pedido, id_producto, cantidad, precio_unitario];
  const result = await db.query(query, values);
  return result.rows[0];
};

// =============================
// Obtener pedidos por cliente
// =============================
exports.findPedidosByCliente = async (id_cliente) => {
  const result = await db.query(
    `SELECT p.*, 
                json_agg(
                    json_build_object(
                        'id_producto', dp.id_producto,
                        'nombre', pr.nombre,
                        'cantidad', dp.cantidad,
                        'precio_unitario', dp.precio_unitario,
                        'subtotal', dp.subtotal
                    )
                ) as productos
         FROM pedidos p
         LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
         LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
         WHERE p.id_cliente = $1
         GROUP BY p.id_pedido
         ORDER BY p.fecha_pedido DESC`,
    [id_cliente]
  );
  return result.rows;
};

// =============================
// ADMIN: Obtener todos los pedidos
// =============================
exports.findAllPedidos = async () => {
  const query = `
        SELECT 
            p.id_pedido,
            p.id_cliente,
            p.total,
            p.metodo_pago,
            p.direccion_entrega,
            p.estado,
            p.fecha_pedido,
            c.nombre AS cliente_nombre,
            c.correo AS cliente_correo
        FROM pedidos p
        JOIN clientes c ON c.id_cliente = p.id_cliente
        ORDER BY p.fecha_pedido DESC
    `;
  const { rows } = await db.query(query);
  return rows;
};

// =============================
// ADMIN: Actualizar estado del pedido + enviar correo
// =============================
exports.updateEstado = async (id_pedido, nuevoEstado) => {
  //  Obtener pedido actual + cliente
  const pedidoRes = await db.query(
    `
        SELECT p.*, c.nombre, c.correo AS email
        FROM pedidos p
        JOIN clientes c ON c.id_cliente = p.id_cliente
        WHERE p.id_pedido = $1
    `,
    [id_pedido]
  );

  if (pedidoRes.rowCount === 0) {
    throw new Error("Pedido no encontrado");
  }

  const pedido = pedidoRes.rows[0];

  //  Si el estado no cambió, no enviar correo
  if (pedido.estado === nuevoEstado) {
    return pedido;
  }

  //  Actualizar estado
  const updateRes = await db.query(
    `
        UPDATE pedidos
        SET estado = $2
        WHERE id_pedido = $1
        RETURNING *
    `,
    [id_pedido, nuevoEstado]
  );

  const pedidoActualizado = updateRes.rows[0];

  //  Obtener productos del pedido
  const productosRes = await db.query(
    `
        SELECT pr.nombre, dp.cantidad, dp.precio_unitario
        FROM detalle_pedido dp
        JOIN productos pr ON pr.id_producto = dp.id_producto
        WHERE dp.id_pedido = $1
    `,
    [id_pedido]
  );

  //  Enviar correo con nuevo estado
  await enviarFacturaPedido({
    email: pedido.email,
    nombre: pedido.nombre,
    pedido: pedidoActualizado,
    productos: productosRes.rows,
    codigo_rastreo: pedido.codigo_rastreo,
    estado: nuevoEstado,
  });

  return pedidoActualizado;
};

// =============================
// Obtener un pedido por ID
// =============================
exports.findPedidoById = async (id_pedido) => {
  const query = `
        SELECT *
        FROM pedidos
        WHERE id_pedido = $1
        LIMIT 1
    `;
  const result = await db.query(query, [id_pedido]);
  return result.rows[0];
};
