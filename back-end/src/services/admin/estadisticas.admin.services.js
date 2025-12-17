const model = require('../../models/admin/estadisticas.admin.models');

exports.obtenerVentas = async () => {
  return await model.getVentas();
};

exports.obtenerTopProductos = async () => {
  return await model.getTopProductos();
};
