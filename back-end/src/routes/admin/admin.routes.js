const express = require("express");
const router = express.Router();

const adminController = require("../../../src/controllers/admin/admin.controllers");
const pedidoAdminController = require("../../../src/controllers/admin/pedido.admin.controllers");
const estadisticasController = require("../../../src/controllers/admin/estadisticas.admin.controllers");

// Login admin
router.post("/login", adminController.login);

// Pedidos (solo admin)
router.get("/pedidos", pedidoAdminController.getAllPedidos);
router.put("/pedidos/:id/estado", pedidoAdminController.updateEstado);

// ESTADÍSTICAS (ADMIN)
router.get("/estadisticas/ventas", estadisticasController.getVentas);
router.get("/estadisticas/productos", estadisticasController.getTopProductos);
module.exports = router;
