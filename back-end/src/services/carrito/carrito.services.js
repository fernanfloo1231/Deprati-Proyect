const model = require("../../models/carrito/carrito.models");
const productoModel = require("../../models/producto/producto.models");

// Obtener carrito activo del cliente
exports.obtenerCarritoActivo = async (id_cliente) => {
  try {
    let carrito = await model.findCarritoActivoByCliente(id_cliente);

    // Si no existe carrito activo, crear uno
    if (!carrito) {
      console.log(" Creando nuevo carrito para cliente:", id_cliente);
      carrito = await model.createCarrito(id_cliente);
    }

    return carrito;
  } catch (error) {
    console.error("Error en obtenerCarritoActivo:", error);
    throw error;
  }
};

exports.agregarProducto = async (
  id_cliente,
  id_producto,
  cantidad,
  accion = "reemplazar"
) => {
  try {
    const producto = await productoModel.findById(id_producto);
    if (!producto) throw new Error("Producto no encontrado");

    const precioFinal =
      producto.precio_oferta &&
      producto.precio_oferta < producto.precio_normal
        ? producto.precio_oferta
        : producto.precio_normal;

    let carrito = await this.obtenerCarritoActivo(id_cliente);
    const productoEnCarrito = await model.findProductoEnCarrito(
      carrito.id_carrito,
      id_producto
    );

    let nuevaCantidad = cantidad;
    if (productoEnCarrito) {
      nuevaCantidad = productoEnCarrito.cantidad + cantidad;
    }

    // Validaciones de stock (se quedan igual)
    if (producto.stock <= 0) {
      throw new Error(`El producto "${producto.nombre}" está agotado`);
    }

    if (nuevaCantidad > producto.stock) {
      throw new Error(
        `Solo hay ${producto.stock} unidades disponibles de "${producto.nombre}"`
      );
    }

    const stockMinimo = producto.stock_minimo ?? 0;
    if (producto.stock - cantidad < stockMinimo) {
      throw new Error(
        `No puedes agregar más. El stock mínimo permitido es ${stockMinimo}`
      );
    }

    // 👇 AQUÍ ESTABA EL ERROR
    if (productoEnCarrito) {
      await model.actualizarCantidad(
        carrito.id_carrito,
        id_producto,
        nuevaCantidad
      );
    } else {
      await model.agregarProducto(
        carrito.id_carrito,
        id_producto,
        cantidad,
        precioFinal
      );
    }

    await productoModel.descontarStock(id_producto, cantidad);

    return await model.findCarritoActivoByCliente(id_cliente);
  } catch (error) {
    console.error("ERROR en agregarProducto:", error);
    throw error;
  }
};

exports.actualizarCantidad = async (id_cliente, id_producto, cantidadNueva) => {
  const carrito = await this.obtenerCarritoActivo(id_cliente);
  if (!carrito) throw new Error("Carrito no encontrado");

  const producto = await productoModel.findById(id_producto);
  if (!producto) throw new Error("Producto no encontrado");

  const productoEnCarrito = await model.findProductoEnCarrito(
    carrito.id_carrito,
    id_producto
  );
  if (!productoEnCarrito) throw new Error("El producto no está en el carrito");

  const cantidadAnterior = productoEnCarrito.cantidad;

  //  Si la cantidad baja → devolver stock
  if (cantidadNueva < cantidadAnterior) {
    const devolver = cantidadAnterior - cantidadNueva;
    await productoModel.devolverStock(id_producto, devolver);
  }

  //  Si la cantidad sube → validar stock y descontar
  if (cantidadNueva > cantidadAnterior) {
    const aumentar = cantidadNueva - cantidadAnterior;

    if (aumentar > producto.stock) {
      throw new Error(`Solo hay ${producto.stock} unidades disponibles`);
    }

    await productoModel.descontarStock(id_producto, aumentar);
  }

  //  Si queda en cero → eliminar
  if (cantidadNueva <= 0) {
    await model.eliminarProducto(carrito.id_carrito, id_producto);
  } else {
    await model.actualizarCantidad(
      carrito.id_carrito,
      id_producto,
      cantidadNueva
    );
  }

  return await model.findCarritoActivoByCliente(id_cliente);
};

exports.eliminarProducto = async (id_cliente, id_producto) => {
  const carrito = await this.obtenerCarritoActivo(id_cliente);
  if (!carrito) throw new Error("Carrito no encontrado");

  const productoEnCarrito = await model.findProductoEnCarrito(
    carrito.id_carrito,
    id_producto
  );
  if (!productoEnCarrito) throw new Error("El producto no está en el carrito");

  //  Devolver stock
  await productoModel.devolverStock(id_producto, productoEnCarrito.cantidad);

  // Eliminar de carrito
  await model.eliminarProducto(carrito.id_carrito, id_producto);

  return await model.findCarritoActivoByCliente(id_cliente);
};

// Vaciar carrito
exports.vaciarCarrito = async (id_cliente) => {
  const carrito = await this.obtenerCarritoActivo(id_cliente);
  if (!carrito) throw new Error("Carrito no encontrado");

  // Obtener todos los productos antes de borrar
  const productos = await model.findProductosEnCarrito(carrito.id_carrito);

  //  Devolver stock de todos
  for (const p of productos) {
    await productoModel.devolverStock(p.id_producto, p.cantidad);
  }

  // Vaciar carrito en BD
  await model.vaciarCarrito(carrito.id_carrito);

  return await model.findCarritoActivoByCliente(id_cliente);
};

// Sincronizar carrito local con BD
exports.sincronizarCarrito = async (id_cliente, productosLocal) => {
  try {
    let carrito = await this.obtenerCarritoActivo(id_cliente);

    await model.vaciarCarrito(carrito.id_carrito);

    for (const productoLocal of productosLocal) {
      const productoBD = await productoModel.findById(productoLocal.id);

      if (productoBD && productoBD.stock >= productoLocal.cantidad) {
        const precioFinal =
          productoBD.precio_oferta &&
          productoBD.precio_oferta < productoBD.precio_normal
            ? productoBD.precio_oferta
            : productoBD.precio_normal;

        await model.agregarProducto(
          carrito.id_carrito,
          productoLocal.id,
          productoLocal.cantidad,
          precioFinal
        );
      }
    }

    return await model.findCarritoActivoByCliente(id_cliente);
  } catch (error) {
    console.error("Error sincronizando carrito:", error);
    throw error;
  }
};

