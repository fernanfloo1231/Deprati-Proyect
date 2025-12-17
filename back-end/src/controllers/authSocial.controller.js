const jwt = require("jsonwebtoken");
const clienteModel = require("../../models/cliente/clientes.models");

exports.socialLogin = async (req, res) => {
  try {
    const { provider, provider_id, nombre, apellido, correo, avatar_url } =
      req.body;

    if (!provider || !provider_id || !correo) {
      return res.status(400).json({
        success: false,
        error: "Datos incompletos para login social.",
      });
    }

    // Buscar cliente por provider_id
    let cliente = await clienteModel.findByProviderId(provider_id, provider);

    // Si no existe, buscar por correo
    if (!cliente) {
      cliente = await clienteModel.findByEmail(correo);

      if (cliente) {
        // Actualizar provider_id de Google/Facebook
        await clienteModel.updateProviderInfo(
          cliente.id_cliente,
          provider,
          provider_id,
          avatar_url
        );
      } else {
        // Crear cliente nuevo
        cliente = await clienteModel.createSocial({
          nombre,
          apellido,
          correo,
          provider,
          provider_id,
          avatar_url,
        });
      }
    }

    // Crear token JWT válido
    const token = jwt.sign(
      {
        id: cliente.id_cliente,
        tipo: "cliente",
      },
      process.env.JWT_SECRET || "tu_jwt_secret_super_seguro",
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: cliente.id_cliente,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        correo: cliente.correo,
        avatar_url: cliente.avatar_url,
        provider: cliente.provider,
      },
    });
  } catch (err) {
    console.error(" Error en login social:", err);
    res.status(500).json({
      success: false,
      error: "Error interno: " + err.message,
    });
  }
};
