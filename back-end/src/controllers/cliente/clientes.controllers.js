const jwt = require("jsonwebtoken");
const db = require("../../config/db");
const service = require("../../services/cliente/clientes.services");
const carritoService = require("../../services/carrito/carrito.services");

// Registro local
exports.registrar = async (req, res) => {
  try {
    const { nombre, apellido, correo, contraseña, telefono, direccion } =
      req.body;

    if (!nombre || !apellido || !correo || !contraseña) {
      return res
        .status(400)
        .json({
          error: "Nombre, apellido, correo y contraseña son requeridos",
        });
    }

    const cliente = await service.registrarCliente({
      nombre,
      apellido,
      correo,
      contraseña,
      telefono,
      direccion,
    });

    const token = service.generarToken(cliente);

    res.status(201).json({
      message: "Cliente registrado exitosamente",
      cliente,
      token,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login local
exports.login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
      return res
        .status(400)
        .json({ error: "Correo y contraseña son requeridos" });
    }

    const cliente = await service.autenticarCliente(correo, contraseña);
    const token = service.generarToken(cliente);

    res.json({
      message: "Login exitoso",
      cliente,
      token,
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.socialCallback = async (req, res) => {
  try {
    console.log(" socialCallback - Inicio");
    console.log(" Datos recibidos de Google:", req.user);

    const clienteGoogle = req.user;

    if (!clienteGoogle || !clienteGoogle.correo) {
      throw new Error("No se recibió información válida del proveedor");
    }

    //  Buscar si el cliente ya existe en BD
    const email = clienteGoogle.correo;

    const resultado = await db.query(
      "SELECT id_cliente FROM clientes WHERE correo = $1",
      [email]
    );

    let id_cliente;

    if (resultado.rows.length > 0) {
      id_cliente = resultado.rows[0].id_cliente;
      console.log(" Cliente Google EXISTE con ID:", id_cliente);
    } else {
      const nuevo = await db.query(
        `INSERT INTO clientes (nombre, apellido, correo, provider)
                 VALUES ($1, $2, $3, 'google')
                 RETURNING id_cliente`,
        [
          clienteGoogle.nombre || clienteGoogle.given_name || "Usuario",
          clienteGoogle.apellido || clienteGoogle.family_name || "",
          email,
        ]
      );

      id_cliente = nuevo.rows[0].id_cliente;
      console.log(" Cliente Google CREADO con ID:", id_cliente);
    }

    //  Generar Token Correcto
    const token = jwt.sign(
      {
        id: id_cliente,
        tipo: "cliente",
        correo: email,
        provider: "google",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(" TOKEN ENVIADO:", token);

    const clienteFrontend = {
      id: id_cliente,
      nombre: clienteGoogle.nombre,
      email: email,
      foto: clienteGoogle.avatar_url,
      provider: "google",
    };

    res.redirect(
      `http://localhost:4200/home?token=${token}&cliente=${encodeURIComponent(
        JSON.stringify(clienteFrontend)
      )}`
    );
  } catch (err) {
    console.error(" Error en socialCallback:", err);
    res.redirect("http://localhost:4200/login?error=auth_failed");
  }
};

// Obtener perfil
exports.obtenerPerfil = async (req, res) => {
  try {
    const cliente = await service.obtenerPerfil(req.user.id);
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar perfil
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, telefono, direccion } = req.body;
    const cliente = await service.actualizarPerfil(req.user.id, {
      nombre,
      apellido,
      telefono,
      direccion,
    });

    res.json({
      message: "Perfil actualizado exitosamente",
      cliente,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =============== CARRITO =============== //

exports.obtenerCarritoCliente = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const carrito = await carritoService.obtenerCarritoActivo(id_cliente);

    res.json({
      success: true,
      carrito: carrito || {
        productos: [],
        total_carrito: 0,
        cantidad_items: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.sincronizarCarrito = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const { productos } = req.body;

    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({
        success: false,
        error: "Lista de productos requerida",
      });
    }

    const carrito = await carritoService.sincronizarCarrito(
      id_cliente,
      productos
    );

    res.json({
      success: true,
      message: "Carrito sincronizado exitosamente",
      carrito,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.agregarAlCarrito = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const { id_producto, cantidad = 1 } = req.body;

    if (!id_producto) {
      return res.status(400).json({
        success: false,
        error: "ID de producto requerido",
      });
    }

    const carrito = await carritoService.agregarProducto(
      id_cliente,
      id_producto,
      cantidad
    );

    res.json({
      success: true,
      message: "Producto agregado al carrito",
      carrito,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.actualizarCarrito = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const { id_producto, cantidad } = req.body;

    if (!id_producto || cantidad === undefined) {
      return res.status(400).json({
        success: false,
        error: "ID de producto y cantidad requeridos",
      });
    }

    const carrito = await carritoService.actualizarCantidad(
      id_cliente,
      id_producto,
      cantidad
    );

    res.json({
      success: true,
      message: "Cantidad actualizada",
      carrito,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.eliminarDelCarrito = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const { id_producto } = req.params;

    if (!id_producto) {
      return res.status(400).json({
        success: false,
        error: "ID de producto requerido",
      });
    }

    const carrito = await carritoService.eliminarProducto(
      id_cliente,
      id_producto
    );

    res.json({
      success: true,
      message: "Producto eliminado del carrito",
      carrito,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.vaciarCarrito = async (req, res) => {
  try {
    const id_cliente = req.user.id;
    const carrito = await carritoService.vaciarCarrito(id_cliente);

    res.json({
      success: true,
      message: "Carrito vaciado",
      carrito,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
