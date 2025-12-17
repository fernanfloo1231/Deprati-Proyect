const express = require("express");
const router = express.Router();

const controller = require("../../../src/controllers/rastreo/rastreo.controllers");
const auth = require("../../middleware/auth");

router.use(auth);

// PRIMERO las rutas ESPECÍFICAS
router.get("/:id_pedido/historial", controller.getHistorialRastreo);

// LUEGO la ruta general
router.get("/:id_pedido", controller.getRastreo);

// Actualizar estado de rastreo (admin)
router.put("/:id_pedido", controller.actualizarRastreo);

module.exports = router;
