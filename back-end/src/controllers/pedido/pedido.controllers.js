// En pedido.controllers.js - CORREGIDO según tu BD
const service = require('../../services/pedido/pedido.services');
const mailService = require('../../services/mail/mail.service');

// Crear pedido desde carrito o desde productos enviados
exports.crearPedido = async (req, res) => {
    try {
        const id_cliente = req.user.id;
        const { metodo_pago, direccion_entrega, observaciones, productos } = req.body;

        console.log(' Datos recibidos para pedido:', { 
            id_cliente, 
            metodo_pago,    
            direccion_entrega, 
            productos_count: productos ? productos.length : 0 
        });

        if (!metodo_pago || !direccion_entrega) {
            return res.status(400).json({ 
                success: false,
                error: 'Método de pago y dirección de entrega son requeridos' 
            });
        }

        let pedido;

        if (productos && productos.length > 0) {
            console.log(' Creando pedido desde productos enviados');
            pedido = await service.crearPedidoDesdeProductos(id_cliente, {
                metodo_pago,
                direccion_entrega,
                observaciones,
                productos
            });
        } else {
            console.log(' Creando pedido desde carrito');
            pedido = await service.crearPedidoDesdeCarrito(id_cliente, {
                metodo_pago,
                direccion_entrega,
                observaciones
            });
        }

        console.log(' Pedido creado exitosamente:', pedido.id_pedido);

        // =====================================================
        // ENVÍO DE FACTURA AL CORREO DEL CLIENTE
        // =====================================================
        try {
            const codigo_rastreo = `TRK-${pedido.id_pedido}`;

            //  Obtener productos reales del pedido desde la base de datos
            const productosPedido = await service.obtenerProductosDePedido(pedido.id_pedido);

            await mailService.enviarFacturaPedido({
                email: req.user.correo,
                nombre: req.user.nombre || 'Cliente',
                pedido,
                productos: productosPedido,
                codigo_rastreo
            });

            console.log("📧 Factura enviada correctamente a:", req.user.correo);

        } catch (error) {
            console.error(" Error enviando factura por correo:", error);
        }
        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            pedido: pedido
        });

    } catch (err) {
        console.error(' Error en crearPedido:', err);
        
        if (err.message.includes('Stock insuficiente') || err.message.includes('Carrito vacío')) {
            return res.status(400).json({ 
                success: false,
                error: err.message 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor: ' + err.message 
        });
    }
};

// Obtener pedidos del cliente
exports.getPedidos = async (req, res) => {
    try {
        const id_cliente = req.user.id;
        console.log(' Obteniendo pedidos para cliente:', id_cliente);
        
        const pedidos = await service.obtenerPedidosCliente(id_cliente);

        const response = {
            success: true,
            pedidos: Array.isArray(pedidos) ? pedidos : (pedidos ? [pedidos] : [])
        };
        
        console.log(' Respuesta final que se envía:', JSON.stringify(response, null, 2));
        
        res.json(response);
        
    } catch (err) {
        console.error(' Error en getPedidos:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Obtener un pedido específico
exports.getPedidoById = async (req, res) => {
    try {
        const { id } = req.params;
        const id_cliente = req.user.id;
        
        console.log(' Buscando pedido:', id, 'para cliente:', id_cliente);
        
        const pedido = await service.obtenerPedidoPorId(parseInt(id), id_cliente);
        
        if (!pedido) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado'
            });
        }
        
        res.json({
            success: true,
            pedido: pedido
        });
        
    } catch (err) {
        console.error(' Error en getPedidoById:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Cancelar pedido
exports.cancelarPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const id_cliente = req.user.id;
        
        console.log(' Cancelando pedido:', id, 'cliente:', id_cliente);
        
        const pedidoCancelado = await service.cancelarPedido(parseInt(id), id_cliente);
        
        res.json({
            success: true,
            message: 'Pedido cancelado exitosamente',
            pedido: pedidoCancelado
        });
        
    } catch (err) {
        console.error(' Error en cancelarPedido:', err);
        
        if (err.message.includes('no encontrado') || err.message.includes('no se puede cancelar')) {
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
