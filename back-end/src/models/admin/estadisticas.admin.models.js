const db = require('../../config/db');

exports.getVentas = async () => {
  const result = await db.query(`
    SELECT fecha, total_ventas, pedidos_totales
    FROM estadisticas_ventas
    ORDER BY fecha
  `);
  return result.rows;
};

exports.getTopProductos = async () => {
  const result = await db.query(`
    SELECT ep.id_producto, p.nombre, ep.total_vendido
    FROM estadisticas_productos ep
    JOIN productos p ON p.id_producto = ep.id_producto
    ORDER BY ep.total_vendido DESC
    LIMIT 5
  `);
  return result.rows;
};
