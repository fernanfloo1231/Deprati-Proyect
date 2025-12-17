// src/controllers/admin/pedido.admin.controllers.js

const service = require('../../services/pedido/pedido.admin.services');

// Obtener todos los pedidos (solo admin)
exports.getAllPedidos = async (req, res) => {
    try {
        const pedidos = await service.obtenerTodosLosPedidos();
        res.json({ success: true, pedidos });
    } catch (error) {
        console.error(" Error getAllPedidos:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Cambiar estado del pedido
exports.updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({ error: "Estado requerido" });
        }

        const pedidoActualizado = await service.actualizarEstadoPedido(id, estado);

        res.json({ 
            success: true, 
            message: "Estado actualizado",
            pedido: pedidoActualizado
        });
    } catch (error) {
        console.error(" Error updateEstado:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
