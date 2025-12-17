const db = require("../../config/db");

exports.findAll = async () => {
  const result = await db.query(
    "SELECT * FROM productos ORDER BY id_producto DESC"
  );
  return result.rows;
};

exports.findById = async (id) => {
  const result = await db.query(
    "SELECT * FROM productos WHERE id_producto = $1",
    [id]
  );
  return result.rows[0];
};

exports.findByCategoria = async (categoria) => {
  const result = await db.query(
    `SELECT p.*, c.nombre_categoria as categoria_nombre 
         FROM productos p 
         JOIN categorias c ON p.id_categoria = c.id_categoria 
         WHERE LOWER(c.nombre_categoria) = LOWER($1)
         ORDER BY p.id_producto DESC`,
    [categoria]
  );
  return result.rows;
};

exports.insertProducto = async (prod) => {
  const query = `
        INSERT INTO productos 
        (nombre, descripcion, precio_normal, precio_oferta, stock, id_categoria, marca, imagen_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id_producto
    `;
  const values = [
    prod.nombre,
    prod.descripcion,
    prod.precio_normal,
    prod.precio_oferta,
    prod.stock,
    prod.id_categoria,
    prod.marca,
    prod.imagen_url,
  ];
  const result = await db.query(query, values);
  return result.rows[0];
};

exports.updateProducto = async (id, prod) => {
  const query = `
        UPDATE productos
        SET nombre = $1, descripcion = $2, precio_normal = $3, precio_oferta = $4,
            stock = $5, id_categoria = $6, marca = $7, imagen_url = $8
        WHERE id_producto = $9
    `;
  const values = [
    prod.nombre,
    prod.descripcion,
    prod.precio_normal,
    prod.precio_oferta,
    prod.stock,
    prod.id_categoria,
    prod.marca,
    prod.imagen_url,
    id,
  ];
  await db.query(query, values);
};

exports.deleteProducto = async (id) => {
  const query = "DELETE FROM productos WHERE id_producto = $1";
  await db.query(query, [id]);
};

exports.searchProductos = async (query) => {
  const result = await db.query(
    `SELECT p.*, c.nombre_categoria as categoria_nombre 
         FROM productos p 
         JOIN categorias c ON p.id_categoria = c.id_categoria 
         WHERE p.nombre_categoria ILIKE $1 OR p.descripcion ILIKE $1 OR p.marca ILIKE $1 
         ORDER BY p.id_producto DESC`,
    [`%${query}%`]
  );
  return result.rows;
};

exports.updateStock = async (id, stock) => {
  const query = "UPDATE productos SET stock = $1 WHERE id_producto = $2";
  await db.query(query, [stock, id]);
};

//  Nueva búsqueda solo por nombre (sin categoría)
exports.searchByName = async (name) => {
  const result = await db.query(
    `SELECT *
         FROM productos
         WHERE nombre ILIKE $1
         ORDER BY id_producto DESC`,
    [`%${name}%`]
  );

  return result.rows;
};

//  Descontar stock real cuando se agrega al carrito
exports.descontarStock = async (id_producto, cantidad) => {
  const query = `
        UPDATE productos
        SET stock = stock - $1
        WHERE id_producto = $2
    `;
  await db.query(query, [cantidad, id_producto]);
};

//  Devolver stock al inventario
exports.devolverStock = async (id_producto, cantidad) => {
  const query = `
        UPDATE productos
        SET stock = stock + $1
        WHERE id_producto = $2
    `;
  await db.query(query, [cantidad, id_producto]);
};
