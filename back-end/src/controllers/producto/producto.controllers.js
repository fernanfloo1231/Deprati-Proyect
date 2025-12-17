const service = require('../../services/producto/producto.services');

// Obtener todos los productos
exports.getAll = async (req, res) => {
    try {
        const data = await service.getAllProductos();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Obtener un producto por ID
exports.getById = async (req, res) => {
    try {
        const data = await service.getProductoById(req.params.id);
        if(!data) return res.status(404).json({error: 'Producto no encontrado'});
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Obtener productos por categoría
exports.getByCategoria = async (req, res) => {
    try {
        const data = await service.getProductosByCategoria(req.params.categoria);
        
        //  Array vacío con status 200
        if(!data || data.length === 0) {
            return res.status(200).json({
                message: 'No se encontraron productos en esta categoría',
                productos: [],
                categoria: req.params.categoria,
                total: 0
            });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Crear un producto
exports.create = async (req, res) => {
    try {
        const newProducto = req.body;
        const result = await service.createProducto(newProducto);
        res.status(201).json({ 
            message: 'Producto creado correctamente',
            id_producto: result.id_producto
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Actualizar producto
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const existingProducto = await service.getProductoById(id);
        if (!existingProducto) {
            return res.status(404).json({ error: `Producto ${id} no existe. No es posible actualizar.` });
        }
        const updatedProducto = req.body;
        await service.updateProducto(id, updatedProducto);
        res.json({ message: `Producto ${id} actualizado correctamente` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Eliminar producto
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const existingProducto = await service.getProductoById(id);
        if (!existingProducto) {
            return res.status(404).json({ error: `Producto ${id} no existe. No es posible eliminar.` });
        }
        await service.deleteProducto(id);
        res.json({ message: `Producto ${id} eliminado correctamente` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Buscar productos
exports.search = async (req, res) => {
    try {
        const query = req.params.query;
        const data = await service.searchProductos(query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Actualizar stock
exports.updateStock = async (req, res) => {
    try {
        const id = req.params.id;
        const { stock } = req.body;
        
        const existingProducto = await service.getProductoById(id);
        if (!existingProducto) {
            return res.status(404).json({ error: `Producto ${id} no existe.` });
        }
        
        await service.updateStock(id, stock);
        res.json({ message: `Stock del producto ${id} actualizado correctamente` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Nueva búsqueda SOLO por nombre
exports.searchByName = async (req, res) => {
    try {
        const name = req.params.name;
        const data = await service.searchByName(name);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
