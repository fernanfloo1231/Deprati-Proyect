const service = require('../../services/admin/admin.services')

// Login de admin
exports.login = async (req, res) => {
    try {
        const { usuario, contraseña } = req.body;
        
        if (!usuario || !contraseña) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }
        
        const admin = await service.authenticateAdmin(usuario, contraseña);
        if (!admin) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const { contraseña: _, ...adminData } = admin;
        res.json({ 
            message: 'Login exitoso',
            admin: adminData
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Obtener todos los admins (solo para super admins)
exports.getAll = async (req, res) => {
    try {
        const data = await service.getAllAdmins();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Crear admin
exports.create = async (req, res) => {
    try {
        const newAdmin = req.body;
        const result = await service.createAdmin(newAdmin);
        res.status(201).json({ 
            message: 'Administrador creado correctamente',
            id_admin: result.id_admin
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};