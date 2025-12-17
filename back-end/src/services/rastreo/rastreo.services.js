// En rastreo.services.js - CORREGIDO según tu BD
const rastreoModel = require("../../models/rastreo/rastreo.models");
const pedidoModel = require("../../models/pedido/pedido.models");

// Obtener información de rastreo por ID de pedido - CORREGIDO
exports.obtenerRastreoPorPedido = async (id_pedido, id_cliente) => {
  console.log(
    " Buscando rastreo para pedido:",
    id_pedido,
    "cliente:",
    id_cliente
  );

  try {
    // Verificar que el pedido pertenece al cliente
    const pedido = await pedidoModel.findPedidoById(id_pedido);
    if (!pedido || pedido.id_cliente !== id_cliente) {
      throw new Error("Pedido no encontrado o no pertenece al cliente");
    }

    // Obtener el último estado de rastreo
    const rastreo = await rastreoModel.findRastreoByPedido(id_pedido);

    if (!rastreo) {
      // Si no hay rastreo, crear uno básico según el estado del pedido
      console.log(" Creando rastreo básico para pedido:", id_pedido);

      let estadoEntrega = "Procesando";
      let ubicacion = "Centro de distribución principal";

      switch (pedido.estado) {
        case "Enviado":
          estadoEntrega = "En tránsito";
          ubicacion = "En camino a destino";
          break;
        case "Entregado":
          estadoEntrega = "Entregado";
          ubicacion = "Entregado al cliente";
          break;
        case "Cancelado":
          estadoEntrega = "Cancelado";
          ubicacion = "Pedido cancelado";
          break;
      }

      const rastreoBasico = await rastreoModel.crearRastreo({
        id_pedido: id_pedido,
        ubicacion_actual: ubicacion,
        ciudad: this.extraerCiudad(pedido.direccion_entrega),
        estado_entrega: estadoEntrega,
        observaciones: `Estado inicial: ${estadoEntrega}`,
      });

      return rastreoBasico;
    }

    console.log(" Rastreo encontrado:", rastreo);
    return rastreo;
  } catch (error) {
    console.error(" Error en obtenerRastreoPorPedido:", error);
    throw error;
  }
};

// Extraer ciudad de la dirección
exports.extraerCiudad = (direccion) => {
  const ciudades = [
    "Quito",
    "Guayaquil",
    "Cuenca",
    "Ambato",
    "Machala",
    "Manta",
    "Portoviejo",
    "Loja",
    "Ibarra",
    "Riobamba",
    "Esmeraldas",
  ];

  for (const ciudad of ciudades) {
    if (direccion.toLowerCase().includes(ciudad.toLowerCase())) {
      return ciudad;
    }
  }

  return "Quito"; // Ciudad por defecto
};

exports.obtenerCoordenadasPorCiudad = (ciudad) => {
  const coordenadas = {
    Quito: { lat: -0.1807, lng: -78.4678 },
    Guayaquil: { lat: -2.170998, lng: -79.922359 },
    Cuenca: { lat: -2.90055, lng: -79.00453 },
    Ambato: { lat: -1.241667, lng: -78.61972 },
    Machala: { lat: -3.258111, lng: -79.955124 },
    Manta: { lat: -0.95, lng: -80.7167 },
    Portoviejo: { lat: -1.0544, lng: -80.4544 },
    Loja: { lat: -3.99313, lng: -79.20422 },
    Ibarra: { lat: 0.339176, lng: -78.122234 },
    Riobamba: { lat: -1.66355, lng: -78.65464 },
    Esmeraldas: { lat: 0.968179, lng: -79.65172 },
  };

  return coordenadas[ciudad] || coordenadas["Quito"];
};
