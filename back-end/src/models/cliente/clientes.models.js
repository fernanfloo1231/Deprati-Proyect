// En models/cliente/clientes.models.js - CORREGIR
const db = require("../../config/db");

const clienteModel = {
  // Buscar por provider_id
  findByProviderId: async (providerId, provider) => {
    const result = await db.query(
      "SELECT * FROM clientes WHERE provider_id = $1 AND provider = $2",
      [providerId, provider]
    );
    return result.rows[0];
  },

  // Buscar por email
  findByEmail: async (email) => {
    const result = await db.query("SELECT * FROM clientes WHERE correo = $1", [
      email,
    ]);
    return result.rows[0];
  },

  // Buscar por ID
  findById: async (id) => {
    const result = await db.query(
      `SELECT 
                id_cliente,
                nombre,
                apellido, 
                correo,
                telefono,
                direccion,
                provider,
                provider_id,
                avatar_url,
                fecha_registro
             FROM clientes WHERE id_cliente = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Actualizar información del provider
  updateProviderInfo: async (idCliente, provider, providerId, avatarUrl) => {
    await db.query(
      `UPDATE clientes 
             SET provider = $1, provider_id = $2, avatar_url = $3 
             WHERE id_cliente = $4`,
      [provider, providerId, avatarUrl, idCliente]
    );
  },

  // Crear cliente social
  createSocial: async (clienteData) => {
    const result = await db.query(
      `INSERT INTO clientes 
             (nombre, apellido, correo, provider, provider_id, avatar_url, fecha_registro) 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) 
             RETURNING *`,
      [
        clienteData.nombre,
        clienteData.apellido,
        clienteData.correo,
        clienteData.provider,
        clienteData.provider_id,
        clienteData.avatar_url,
      ]
    );
    return result.rows[0];
  },

  // Crear cliente local
  createLocal: async (clienteData) => {
    const result = await db.query(
      `INSERT INTO clientes 
             (nombre, apellido, correo, contraseña, telefono, direccion, fecha_registro) 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) 
             RETURNING *`,
      [
        clienteData.nombre,
        clienteData.apellido,
        clienteData.correo,
        clienteData.contraseña,
        clienteData.telefono,
        clienteData.direccion,
      ]
    );
    return result.rows[0];
  },

  // Buscar o crear cliente social
  // En models/cliente/clientes.models.js - CORREGIR
  findOrCreateSocial: async (profile) => {
    console.log(" Buscando/creando cliente social - SOLUCIÓN TEMPORAL");

    const provider = profile.provider;
    let providerId = profile.id;
    const email = profile.emails?.[0]?.value;
    const nombre = profile.displayName || profile.name?.givenName || "Usuario";
    const apellido = profile.name?.familyName || "Social";
    const avatar = profile.photos?.[0]?.value;

    if (email === "luisarmijos539@gmail.com" && provider === "google") {
      console.log(" Luis Google");
      providerId = "csTdTpsPgaZPPgpYZBssSO9wqpk1"; // Forzar el provider_id correcto
    }

    console.log(" Provider_id a usar:", providerId);

    try {
      // Buscar con el provider_id corregido
      let cliente = await clienteModel.findByProviderId(providerId, provider);
      if (cliente) {
        console.log(" Cliente encontrado:", cliente.id_cliente);
        return cliente;
      }

      // Buscar por email
      if (email) {
        cliente = await clienteModel.findByEmail(email);
        if (cliente) {
          console.log(
            " Cliente encontrado por email, actualizando provider_id"
          );
          await clienteModel.updateProviderInfo(
            cliente.id_cliente,
            provider,
            providerId,
            avatar
          );
          return await clienteModel.findById(cliente.id_cliente);
        }
      }

      // Crear nuevo
      console.log(" Creando nuevo cliente");
      const nuevoCliente = await clienteModel.createSocial({
        nombre,
        apellido,
        correo: email,
        provider,
        provider_id: providerId,
        avatar_url: avatar,
      });

      return nuevoCliente;
    } catch (error) {
      console.error(" Error:", error);
      throw error;
    }
  },
};

module.exports = clienteModel;
