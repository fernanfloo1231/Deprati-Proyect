const jwt = require("jsonwebtoken");
const db = require("../config/db");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Acceso denegado. Token no proporcionado.",
      });
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tu_jwt_secret_super_seguro"
    );

    console.log(" TOKEN GOOGLE / NORMAL DECODIFICADO:", decoded);
    let user = null;
    let userType = "cliente";

    if (decoded.tipo === "cliente" && decoded.id) {
      const result = await db.query(
        `SELECT 
                    id_cliente AS id,
                    nombre,
                    apellido,
                    correo,
                    telefono,
                    direccion,
                    provider,
                    avatar_url
                 FROM clientes 
                 WHERE id_cliente = $1`,
        [decoded.id]
      );
      user = result.rows[0];
    } else if (decoded.tipo === "cliente" && decoded.email) {
      console.log(
        " Login Google detectado. Buscando cliente por correo:",
        decoded.email
      );

      const result = await db.query(
        `SELECT 
                    id_cliente AS id,
                    nombre,
                    apellido,
                    correo,
                    telefono,
                    direccion,
                    provider,
                    avatar_url
                 FROM clientes 
                 WHERE correo = $1`,
        [decoded.email]
      );

      user = result.rows[0];
    }

    // ADMINISTRADOR
    else if (decoded.tipo === "admin" && decoded.id) {
      userType = "admin";
      const result = await db.query(
        `SELECT id_admin AS id, usuario, rol 
                 FROM usuarios_admin 
                 WHERE id_admin = $1`,
        [decoded.id]
      );
      user = result.rows[0];
    }

    if (!user) {
      console.log(" No se encontró usuario para token:", decoded);
      return res
        .status(401)
        .json({ error: "Token inválido. Usuario no existe." });
    }

    // Agregar info del usuario
    req.user = {
      id: user.id,
      tipo: userType,
      ...user,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token inválido." });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado." });
    }

    res.status(500).json({ error: "Error en la autenticación." });
  }
};

module.exports = auth;
