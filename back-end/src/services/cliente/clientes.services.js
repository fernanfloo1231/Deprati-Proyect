// En services/cliente/clientes.services.js - CORREGIR
const model = require("../../models/cliente/clientes.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Registrar cliente local
exports.registrarCliente = async (clienteData) => {
  const { contraseña, ...rest } = clienteData;

  // Verificar si el correo ya existe
  const existe = await model.findByEmail(rest.correo);
  if (existe) {
    throw new Error("El correo ya está registrado");
  }

  // Hash de contraseña
  const hashedPassword = await bcrypt.hash(contraseña, 12);

  const cliente = await model.createLocal({
    ...rest,
    contraseña: hashedPassword,
  });

  // No retornar la contraseña
  const { contraseña: _, ...clienteSeguro } = cliente;
  return clienteSeguro;
};

// Autenticar cliente local
exports.autenticarCliente = async (correo, contraseña) => {
  const cliente = await model.findByEmail(correo);
  if (!cliente) {
    throw new Error("Credenciales inválidas");
  }

  // Verificar contraseña solo para clientes locales
  if (cliente.provider !== "local") {
    throw new Error(
      `Este correo está registrado con ${cliente.provider}. Use ese método para iniciar sesión.`
    );
  }

  const contraseñaValida = await bcrypt.compare(contraseña, cliente.contraseña);
  if (!contraseñaValida) {
    throw new Error("Credenciales inválidas");
  }

  // No retornar la contraseña
  const { contraseña: _, ...clienteSeguro } = cliente;
  return clienteSeguro;
};

// Autenticación social
exports.autenticarSocial = async (profile) => {
  console.log(" autenticarSocial - Iniciando con profile:", {
    provider: profile.provider,
    id: profile.id,
    email: profile.emails?.[0]?.value,
  });

  const cliente = await model.findOrCreateSocial(profile);

  console.log(" autenticarSocial - Cliente obtenido de BD:", {
    id_cliente: cliente.id_cliente,
    nombre: cliente.nombre,
    email: cliente.correo,
    provider: cliente.provider,
    provider_id: cliente.provider_id,
  });

  return cliente;
};

// Obtener perfil
exports.obtenerPerfil = async (id) => {
  return await model.findById(id);
};

// Actualizar perfil
exports.actualizarPerfil = async (id, clienteData) => {
  // Implementar según sea necesario
  return await model.findById(id);
};

// Generar token
exports.generarToken = (cliente) => {
  console.log(" generarToken - Cliente recibido:", {
    id_cliente: cliente.id_cliente,
    id: cliente.id,
    nombre: cliente.nombre,
    correo: cliente.correo,
    provider: cliente.provider,
  });

  const idCliente = cliente.id_cliente;

  if (!idCliente) {
    console.error(" ERROR: No se pudo obtener id_cliente");
    throw new Error("No se pudo obtener id_cliente para generar token");
  }

  const payload = {
    id: idCliente,
    tipo: "cliente",
    correo: cliente.correo,
    nombre: cliente.nombre,
    provider: cliente.provider,
  };

  console.log(" GENERANDO TOKEN - Payload final:", payload);

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || "tu_jwt_secret_super_seguro",
    { expiresIn: "7d" }
  );

  console.log(" Token generado con id_cliente:", idCliente);
  return token;
};
