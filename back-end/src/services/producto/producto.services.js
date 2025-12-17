const model = require("../../models/producto/producto.models");

exports.getAllProductos = async () => {
  return await model.findAll();
};

exports.getProductoById = async (id) => {
  return await model.findById(id);
};

exports.getProductosByCategoria = async (categoria) => {
  return await model.findByCategoria(categoria);
};

exports.createProducto = async (producto) => {
  return await model.insertProducto(producto);
};

exports.updateProducto = async (id, producto) => {
  return await model.updateProducto(id, producto);
};

exports.deleteProducto = async (id) => {
  return await model.deleteProducto(id);
};

exports.searchProductos = async (query) => {
  return await model.searchProductos(query);
};

exports.updateStock = async (id, stock) => {
  return await model.updateStock(id, stock);
};

exports.searchByName = async (name) => {
  return await model.searchByName(name);
};
