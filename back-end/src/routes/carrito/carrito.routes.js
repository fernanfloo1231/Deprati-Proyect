const express = require('express');
const router = express.Router();
const controller = require('../../../src/controllers/carrito/carrito.controllers');
const auth = require('../../middleware/auth');

//TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
router.use(auth);

//RUTAS DEL CARRITO
router.get('/', controller.getCarrito);
router.post('/agregar', controller.agregarAlCarrito);
router.put('/actualizar/:id_producto', controller.actualizarCantidad);
router.delete('/eliminar/:id_producto', controller.eliminarProducto);
router.delete('/vaciar', controller.vaciarCarrito);

module.exports = router;