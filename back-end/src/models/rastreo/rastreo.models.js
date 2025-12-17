const db = require("../../config/db");

/* ============================================================
   OBTENER COORDENADAS POR CIUDAD (lat / lng correctos)
   ============================================================ */
exports.obtenerCoordenadasPorCiudad = (ciudad) => {
  const coordenadas = {
    Quito: { lat: -0.1807, lng: -78.4678 },
    Guayaquil: { lat: -2.170998, lng: -79.922359 },
    Cuenca: { lat: -2.90055, lng: -79.00453 },
    Ambato: { lat: -1.241667, lng: -78.61972 },
    Manta: { lat: -0.95, lng: -80.7167 },
    Portoviejo: { lat: -1.0547, lng: -80.4522 },
    Loja: { lat: -3.99313, lng: -79.20422 },
    Ibarra: { lat: 0.3392, lng: -78.1222 },
    Riobamba: { lat: -1.6636, lng: -78.6547 },
    Esmeraldas: { lat: 0.9592, lng: -79.654 },
  };

  return coordenadas[ciudad] || coordenadas["Quito"];
};

/* ============================================================
   CREAR RASTREO INICIAL
   ============================================================ */
exports.crearRastreo = async (rastreoData) => {
  const coordsOrigen = exports.obtenerCoordenadasPorCiudad("Quito");
  const coordsDestino = exports.obtenerCoordenadasPorCiudad(rastreoData.ciudad);

  const query = `
        INSERT INTO rastreo_pedidos 
        (id_pedido, ubicacion_actual, ciudad, latitud, longitud, 
         latitud_destino, longitud_destino, estado_entrega, observaciones)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
    `;

  const values = [
    rastreoData.id_pedido,
    rastreoData.ubicacion_actual,
    rastreoData.ciudad,
    coordsOrigen.lat,
    coordsOrigen.lng,
    coordsDestino.lat,
    coordsDestino.lng,
    rastreoData.estado_entrega || "Procesando",
    rastreoData.observaciones,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

/* ============================================================
   OBTENER ÚLTIMO RASTREO POR PEDIDO  (CORREGIDO)
   ============================================================ */
exports.findRastreoByPedido = async (id_pedido) => {
  const result = await db.query(
    `SELECT r.*, 
                p.direccion_entrega, 
                p.metodo_pago, 
                p.total,
                p.estado AS estado_pedido   -- ✔ AHORA VIENE EL ESTADO REAL
         FROM rastreo_pedidos r
         JOIN pedidos p ON r.id_pedido = p.id_pedido
         WHERE r.id_pedido = $1
         ORDER BY r.fecha_actualizacion DESC
         LIMIT 1`,
    [id_pedido]
  );
  return result.rows[0];
};

/* ============================================================
   HISTORIAL COMPLETO
   ============================================================ */
exports.findHistorialRastreoByPedido = async (id_pedido) => {
  const result = await db.query(
    `SELECT * FROM rastreo_pedidos 
         WHERE id_pedido = $1 
         ORDER BY fecha_actualizacion ASC`,
    [id_pedido]
  );
  return result.rows;
};

/* ============================================================
   CREAR NUEVA ACTUALIZACIÓN DE RASTREO
   ============================================================ */
exports.crearActualizacionRastreo = async (id_pedido, datosActualizacion) => {
  const coordsOrigen = exports.obtenerCoordenadasPorCiudad("Quito");
  const coordsDestino = exports.obtenerCoordenadasPorCiudad(
    datosActualizacion.ciudad
  );

  const query = `
        INSERT INTO rastreo_pedidos
        (id_pedido, ubicacion_actual, ciudad, latitud, longitud,
         latitud_destino, longitud_destino, estado_entrega, observaciones)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
    `;

  const values = [
    id_pedido,
    datosActualizacion.ubicacion_actual,
    datosActualizacion.ciudad,
    coordsOrigen.lat,
    coordsOrigen.lng,
    coordsDestino.lat,
    coordsDestino.lng,
    datosActualizacion.estado_entrega,
    datosActualizacion.observaciones,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

/* ============================================================
   VERIFICAR CLIENTE
   ============================================================ */
exports.verificarPedidoCliente = async (id_pedido, id_cliente) => {
  const result = await db.query(
    "SELECT id_pedido FROM pedidos WHERE id_pedido = $1 AND id_cliente = $2",
    [id_pedido, id_cliente]
  );
  return result.rows[0];
};
