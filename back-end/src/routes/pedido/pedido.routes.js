// En pedido.routes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../../../src/controllers/pedido/pedido.controllers');
const auth = require('../../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Crear pedido
router.post('/crear', pedidoController.crearPedido);

// Obtener pedidos del cliente
router.get('/', pedidoController.getPedidos);

// Obtener pedido específico
router.get('/:id', pedidoController.getPedidoById);

// Cancelar pedido
router.put('/:id/cancelar', pedidoController.cancelarPedido);

module.exports = router;