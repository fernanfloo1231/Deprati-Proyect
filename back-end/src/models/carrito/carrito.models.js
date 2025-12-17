const db = require("../../config/db");

// Obtener carrito activo por cliente
exports.findCarritoActivoByCliente = async (id_cliente) => {
  const idClienteInt = parseInt(id_cliente);

  const result = await db.query(
    `SELECT c.*,
            json_agg(
              json_build_object(
                'id_producto', cp.id_producto,
                'nombre', p.nombre,

                -- precios
                'precio_real', cp.precio_unitario,
                'precio_original', p.precio_normal,

                -- descuento (%)
                'descuento',
                  CASE
                    WHEN p.precio_oferta IS NOT NULL
                         AND p.precio_oferta < p.precio_normal
                    THEN ROUND((1 - (p.precio_oferta / p.precio_normal)) * 100)
                    ELSE NULL
                  END,

                'cantidad', cp.cantidad,
                'subtotal', cp.subtotal,
                'imagen', p.imagen_url,
                'stock', p.stock
              )
            ) AS productos,
            COALESCE(SUM(cp.subtotal), 0) AS total_carrito,
            COALESCE(SUM(cp.cantidad), 0) AS cantidad_items
     FROM carrito c
     LEFT JOIN carrito_productos cp ON c.id_carrito = cp.id_carrito
     LEFT JOIN productos p ON cp.id_producto = p.id_producto
     WHERE c.id_cliente = $1::smallint
       AND c.estado = 'Activo'
     GROUP BY c.id_carrito`,
    [idClienteInt]
  );

  return result.rows[0] || null;
};



// Crear nuevo carrito
exports.createCarrito = async (id_cliente) => {
  const idClienteInt = parseInt(id_cliente);

  const result = await db.query(
    "INSERT INTO carrito (id_cliente) VALUES ($1::smallint) RETURNING *",
    [idClienteInt]
  );
  return result.rows[0];
};

// Buscar producto en carrito
exports.findProductoEnCarrito = async (id_carrito, id_producto) => {
  const carritoId = parseInt(id_carrito);
  const productoId = parseInt(id_producto);

  const result = await db.query(
    "SELECT * FROM carrito_productos WHERE id_carrito = $1::integer AND id_producto = $2::integer",
    [carritoId, productoId]
  );
  return result.rows[0] || null;
};

// Actualizar cantidad
exports.actualizarCantidad = async (id_carrito, id_producto, cantidad) => {
  const carritoId = parseInt(id_carrito);
  const productoId = parseInt(id_producto);
  const cant = parseInt(cantidad);

  const result = await db.query(
    `UPDATE carrito_productos
     SET cantidad = $1::smallint,
         subtotal = precio_unitario * $1::smallint
     WHERE id_carrito = $2::integer
       AND id_producto = $3::integer
     RETURNING *`,
    [cant, carritoId, productoId]
  );

  return result.rows[0];
};


// Agregar producto al carrito
exports.agregarProducto = async (
  id_carrito,
  id_producto,
  cantidad,
  precioUnitario
) => {
  const carritoId = parseInt(id_carrito);
  const productoId = parseInt(id_producto);
  const cant = parseInt(cantidad);

  const result = await db.query(
    `INSERT INTO carrito_productos
     (id_carrito, id_producto, cantidad, precio_unitario, subtotal)
     VALUES (
       $1::integer,
       $2::integer,
       $3::smallint,
       $4::numeric,
       $4::numeric * $3::smallint
     )
     RETURNING *`,
    [carritoId, productoId, cant, precioUnitario]
  );

  return result.rows[0];
};


// Eliminar producto del carrito
exports.eliminarProducto = async (id_carrito, id_producto) => {
  const carritoId = parseInt(id_carrito);
  const productoId = parseInt(id_producto);

  const result = await db.query(
    "DELETE FROM carrito_productos WHERE id_carrito = $1::integer AND id_producto = $2::integer RETURNING *",
    [carritoId, productoId]
  );
  return result.rows[0];
};

// Vaciar carrito
exports.vaciarCarrito = async (id_carrito) => {
  const carritoId = parseInt(id_carrito);

  const result = await db.query(
    "DELETE FROM carrito_productos WHERE id_carrito = $1::integer RETURNING *",
    [carritoId]
  );
  return result.rows;
};

// Obtener todos los productos de un carrito con su cantidad
exports.findProductosEnCarrito = async (id_carrito) => {
  const carritoId = parseInt(id_carrito);

  const result = await db.query(
    `SELECT id_producto, cantidad 
         FROM carrito_productos 
         WHERE id_carrito = $1::integer`,
    [carritoId]
  );

  return result.rows;
};
