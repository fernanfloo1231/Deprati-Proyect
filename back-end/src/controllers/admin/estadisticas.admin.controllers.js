const service = require('../../services/admin/estadisticas.admin.services');

// Ventas
exports.getVentas = async (req, res) => {
  try {
    const data = await service.obtenerVentas();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Top productos
exports.getTopProductos = async (req, res) => {
  try {
    const data = await service.obtenerTopProductos();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
