const { request, response } = require('express');
const UsuarioModel = require('../models/usuario.model');

class AuthController {
    static async login(req = request, res = response) {
        try {
            const { email, password } = req.body;

            const usuario = await UsuarioModel.findByEmail(email);

            if(!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas',
                });
            }

            if(!usuario.activo) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario inactivo. Contacte al administrador',
                });
            }

            const passwordMatch = await UsuarioModel.comparePassword(password, usuario.password_hash);

            if(!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas',
                });
            }

            res.status(200).json({
                usuario
            });
        } catch(error) {
            console.error('Error en login: ', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;