const model = require('../../models/admin/admin.models');

exports.getAllAdmins = async () => {
    return await model.findAll();
};

exports.getAdminById = async (id) => {
    return await model.findById(id);
};

exports.authenticateAdmin = async (usuario, contraseña) => {
    console.log(' INICIANDO AUTENTICACIÓN ====================');
    console.log(' Datos recibidos:', { usuario, contraseña });
    const admin = await model.findByUsername(usuario);
    console.log(' Admin encontrado:', admin);
    if (!admin) {
        console.log(' Usuario no existe');
        return null;
    }
    console.log(' Verificando contraseña...');
    const isValid = await model.verifyPassword(contraseña, admin.contraseña);
    console.log(' Resultado verificación:', isValid);
    return isValid ? admin : null;
};

exports.createAdmin = async (admin) => {
    return await model.insertAdmin(admin);
};

exports.updateAdmin = async (id, admin) => {
    return await model.updateAdmin(id, admin);
};

exports.deleteAdmin = async (id) => {
    return await model.deleteAdmin(id);
};