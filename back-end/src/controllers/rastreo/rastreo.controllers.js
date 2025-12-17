const service = require("../../services/rastreo/rastreo.services");
const rastreoModel = require("../../models/rastreo/rastreo.models");
const pedidoModel = require("../../models/pedido/pedido.models");

//OBTENER RASTREO DEL PEDIDO

exports.getRastreo = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    const id_cliente = req.user.id;

    console.log(
      " Solicitando rastreo para pedido:",
      id_pedido,
      "cliente:",
      id_cliente
    );

    if (!id_pedido || isNaN(id_pedido)) {
      return res.status(400).json({
        success: false,
        error: "ID de pedido inválido",
      });
    }

    const rastreoInfo = await service.obtenerRastreoPorPedido(
      parseInt(id_pedido),
      id_cliente
    );

  
    console.log(" DATOS QUE SE ENVIAN AL FRONT:", rastreoInfo);
    console.log(" DEBUG RASTREO → req.user:", req.user);
    console.log(" DEBUG RASTREO → cliente ID:", req.user.id);
    console.log(" DEBUG RASTREO → id_pedido recibido:", id_pedido);

    res.json({
      success: true,
      rastreo: rastreoInfo,
    });
  } catch (err) {
    console.error(" Error en getRastreo:", err);

    if (
      err.message.includes("no encontrado") ||
      err.message.includes("no pertenece")
    ) {
      return res.status(404).json({
        success: false,
        error: err.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Error interno del servidor: " + err.message,
    });
  }
};

// ACTUALIZAR RASTREO (ADMIN CREA UNA NUEVA FILA)

exports.actualizarRastreo = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    const { ubicacion_actual, ciudad, estado_entrega, observaciones } =
      req.body;

    console.log(
      " Actualizando rastreo para pedido:",
      id_pedido,
      "datos:",
      req.body
    );

    //  Validación de permisos
    if (!req.user || req.user.tipo !== "admin") {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para actualizar rastreos",
      });
    }

    if (!ubicacion_actual || !estado_entrega) {
      return res.status(400).json({
        success: false,
        error:
          "Datos incompletos: ubicacion_actual y estado_entrega son requeridos",
      });
    }

    //  Crear nueva fila de actualización de rastreo
    const datosActualizacion = {
      ubicacion_actual,
      ciudad: ciudad || "Quito",
      estado_entrega,
      observaciones: observaciones || "",
    };

    const nuevaFila = await rastreoModel.crearActualizacionRastreo(
      parseInt(id_pedido),
      datosActualizacion
    );

    res.json({
      success: true,
      message: "Rastreo actualizado correctamente",
      data: nuevaFila,
    });
  } catch (err) {
    console.error(" Error en actualizarRastreo:", err);

    res.status(500).json({
      success: false,
      error: "Error interno del servidor: " + err.message,
    });
  }
};

/* ============================================================
   OBTENER HISTORIAL COMPLETO DEL RASTREO
   ============================================================ */
exports.getHistorialRastreo = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    const id_cliente = req.user.id;

    if (!id_pedido || isNaN(id_pedido)) {
      return res.status(400).json({
        success: false,
        error: "ID de pedido inválido",
      });
    }

    const pedidoValido = await rastreoModel.verificarPedidoCliente(
      parseInt(id_pedido),
      id_cliente
    );

    if (!pedidoValido) {
      return res.status(404).json({
        success: false,
        error: "Pedido no encontrado o no pertenece al cliente",
      });
    }

    const historial = await rastreoModel.findHistorialRastreoByPedido(
      parseInt(id_pedido)
    );

    res.json({
      success: true,
      data: historial,
    });
  } catch (err) {
    console.error(" Error en getHistorialRastreo:", err);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor: " + err.message,
    });
  }
};
