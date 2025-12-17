const carritoService = require('../../services/carrito/carrito.services');

exports.getCarrito = async (req, res) => {
    try {
        const id_cliente = req.user.id;
        const carrito = await carritoService.obtenerCarritoActivo(id_cliente);
        
        res.json({
            success: true,
            carrito: carrito || { productos: [], total_carrito: 0, cantidad_items: 0 }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// En carrito.controllers.js - AGREGA LOGS DETALLADOS
exports.agregarAlCarrito = async (req, res) => {
    try {
        console.log(' BACKEND - agregarAlCarrito INICIADO');
        console.log(' BACKEND - User:', req.user);
        console.log(' BACKEND - Body:', req.body);
        
        const id_cliente = req.user.id;
        const { id_producto, cantidad = 1, accion } = req.body;

        console.log(' BACKEND - Parámetros antes de conversión:', {
            id_cliente, 
            tipo_id_cliente: typeof id_cliente,
            id_producto, 
            tipo_id_producto: typeof id_producto,
            cantidad, 
            tipo_cantidad: typeof cantidad
        });

        //  CONVERSIÓN EXPLÍCITA
        const idClienteNum = parseInt(String(id_cliente));
        const idProductoNum = parseInt(String(id_producto));
        const cantidadNum = parseInt(String(cantidad));

        console.log(' BACKEND - Parámetros después de conversión:', {
            idClienteNum, 
            tipo_idClienteNum: typeof idClienteNum,
            idProductoNum, 
            tipo_idProductoNum: typeof idProductoNum,
            cantidadNum, 
            tipo_cantidadNum: typeof cantidadNum
        });

        if (!id_producto) {
            return res.status(400).json({
                success: false,
                error: 'ID de producto requerido'
            });
        }

        console.log(' BACKEND - Llamando a carritoService.agregarProducto...');
        const carrito = await carritoService.agregarProducto(idClienteNum, idProductoNum, cantidadNum, accion);
        console.log(' BACKEND - Carrito procesado exitosamente');
        
        res.json({
            success: true,
            message: 'Producto procesado en carrito',
            carrito
        });
    } catch (error) {
        console.error(' BACKEND - ERROR en agregarAlCarrito:', error);
        console.error(' BACKEND - Stack trace:', error.stack);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Actualizar cantidad de producto
exports.actualizarCantidad = async (req, res) => {
    try {
        const id_cliente = req.user.id;
        const { id_producto } = req.params;
        const { cantidad } = req.body;

        if (!id_producto || cantidad === undefined) {
            return res.status(400).json({
                success: false,
                error: 'ID de producto y cantidad requeridos'
            });
        }

        const carrito = await carritoService.actualizarCantidad(id_cliente, id_producto, cantidad);
        
        res.json({
            success: true,
            message: 'Cantidad actualizada',
            carrito
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Eliminar producto del carrito
exports.eliminarProducto = async (req, res) => {
    try {
        const id_cliente = req.user.id;
        const { id_producto } = req.params;

        if (!id_producto) {
            return res.status(400).json({
                success: false,
                error: 'ID de producto requerido'
            });
        }

        const carrito = await carritoService.eliminarProducto(id_cliente, id_producto);
        
        res.json({
            success: true,
            message: 'Producto eliminado del carrito',
            carrito
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Vaciar carrito
exports.vaciarCarrito = async (req, res) => {
    try {
        const id_cliente = req.user.id;
        const carrito = await carritoService.vaciarCarrito(id_cliente);
        
        res.json({
            success: true,
            message: 'Carrito vaciado',
            carrito
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};