const { pool } = require('../config/db');
const bcrypt = require('bcryptjs')

class UsuarioModel {

    static async findByEmail(email) {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.email,
                    u.password_hash,
                    u.telefono,
                    u.activo,
                    u.rol_id,
                    r.nombre as rol_nombre,
                    r.descripcion as rol_descripcion,
                    u.creado_en,
                    u.actualizado_en
                FROM usuarios u
                JOIN roles r ON u.rol_id = r.id
                WHERE u.email = $1
            `;
            const result = await pool.query(query, [email]);
            
            if(result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch(error) {
            throw new Error(`Error al buscar usuario por email: ${error.message}`);
        }
    }

    static async comparePassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch(error) {
            throw new Error(`Error al comparar contraseñas ${error.message}`);
        }
    }

}

module.exports = UsuarioModel