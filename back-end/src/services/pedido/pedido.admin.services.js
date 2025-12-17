const pedidoModel = require('../../models/pedido/pedido.models');

// Obtener TODOS los pedidos para el administrador
exports.obtenerTodosLosPedidos = async () => {
    return await pedidoModel.findAllPedidos();
};

// Actualizar estado del pedido
exports.actualizarEstadoPedido = async (id_pedido, nuevoEstado) => {
    return await pedidoModel.updateEstado(id_pedido, nuevoEstado);
};
