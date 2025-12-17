const express = require('express');
const router = express.Router();
const productosRoutes = require('./producto/producto.routes');
const adminRoutes = require('./admin/admin.routes');
const uploadRoutes = require('./images/upload.routes');
const carritoRoutes = require('./carrito/carrito.routes');
const pedidoRoutes = require('./pedido/pedido.routes');
const clientesRoutes = require('./cliente/clientes.routes');
const rastreoRoutes = require('./rastreo/rastreo.routes');

router.use('/productos', productosRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/carrito', carritoRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/clientes', clientesRoutes);
router.use('/rastreo', rastreoRoutes);

router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'API funcionando' });
});

module.exports = router;
