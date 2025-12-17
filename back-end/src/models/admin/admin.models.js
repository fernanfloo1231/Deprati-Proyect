const db = require("../../config/db");
const bcrypt = require("bcrypt");

exports.findAll = async () => {
  const result = await db.query(
    "SELECT id_admin, usuario, rol, fecha_creacion FROM usuarios_admin ORDER BY id_admin"
  );
  return result.rows;
};

exports.findById = async (id) => {
  const result = await db.query(
    "SELECT id_admin, usuario, rol, fecha_creacion FROM usuarios_admin WHERE id_admin = $1",
    [id]
  );
  return result.rows[0];
};

exports.findByUsername = async (usuario) => {
  const result = await db.query(
    "SELECT * FROM usuarios_admin WHERE usuario = $1",
    [usuario]
  );
  return result.rows[0];
};

exports.verifyPassword = async (plainPassword, storedPassword) => {
  if (storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2a$")) {
    const isValid = await bcrypt.compare(plainPassword, storedPassword);
    return isValid;
  } else {
    const isValid = plainPassword === storedPassword;
    return isValid;
  }
};

exports.insertAdmin = async (admin) => {
  const { usuario, contraseña, rol } = admin;
  const hashedPassword = await bcrypt.hash(contraseña, 10);

  const result = await db.query(
    "INSERT INTO usuarios_admin (usuario, contraseña, rol) VALUES ($1, $2, $3) RETURNING id_admin",
    [usuario, hashedPassword, rol]
  );
  return result.rows[0];
};

exports.updateAdmin = async (id, admin) => {
  const { usuario, contraseña, rol } = admin;

  let query, values;
  if (contraseña) {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    query =
      "UPDATE usuarios_admin SET usuario = $1, contraseña = $2, rol = $3 WHERE id_admin = $4";
    values = [usuario, hashedPassword, rol, id];
  } else {
    query =
      "UPDATE usuarios_admin SET usuario = $1, rol = $2 WHERE id_admin = $3";
    values = [usuario, rol, id];
  }

  await db.query(query, values);
};

exports.deleteAdmin = async (id) => {
  await db.query("DELETE FROM usuarios_admin WHERE id_admin = $1", [id]);
};

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
