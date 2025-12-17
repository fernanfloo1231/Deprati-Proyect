const express = require("express");
const router = express.Router();
const controller = require("../../../src/controllers/producto/producto.controllers");

router.get("/buscar-nombre/:name", controller.searchByName);

router.get("/buscar/:query", controller.search);
router.get("/categoria/:categoria", controller.getByCategoria);

// --- LUEGO RUTAS GENERALES ---
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);
router.patch("/:id/stock", controller.updateStock);

module.exports = router;
