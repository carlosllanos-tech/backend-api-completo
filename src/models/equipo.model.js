const { pool } = require('../config/db');

class EquipoModel {

    static async findAll() {
        try {
            const query = `
                SELECT 
                e.id,
                e.nombre,
                e.color,
                e.representante,
                e.telefono_representante,
                e.torneo_id,
                t.nombre as torneo_nombre,
                t.disciplina as torneo_disciplina,
                t.estado as torneo_estado,
                (SELECT COUNT(*) FROM jugadores j WHERE j.equipo_id = e.id) as total_jugadores,
                e.creado_en,
                e.actualizado_en
                FROM equipos e
                INNER JOIN torneos t ON e.torneo_id = t.id
                ORDER BY t.nombre, e.nombre
            `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener equipos: ${error.message}`);
        }
    }

    static async create(equipoData) {
        const {
            nombre,
            color,
            representante,
            telefono_representante,
            torneo_id
        } = equipoData;

        try {
            const query = `
            INSERT INTO equipos (
                nombre, 
                color, 
                representante, 
                telefono_representante,
                torneo_id
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING 
                id, 
                nombre, 
                color, 
                representante, 
                telefono_representante,
                torneo_id,
                creado_en
            `;

            const values = [
                nombre,
                color || null,
                representante || null,
                telefono_representante || null,
                torneo_id
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            // Error de violación de constraint UNIQUE (torneo_id, nombre)
            if (error.code === '23505') {
                throw new Error('Ya existe un equipo con ese nombre en este torneo');
            }
            // Error de foreign key (torneo no existe)
            if (error.code === '23503') {
                throw new Error('El torneo especificado no existe');
            }
            throw new Error(`Error al crear equipo: ${error.message}`);
        }
    }

    static async nombreExisteEnTorneo(nombre, torneoId, equipoIdExcluir = null) {
        try {
            let query = `
                SELECT id FROM equipos 
                WHERE LOWER(nombre) = LOWER($1) AND torneo_id = $2
            `;

            const values = [nombre, torneoId];

            // Si se proporciona un ID para excluir (actualización), agregarlo a la query
            if (equipoIdExcluir) {
                query += ` AND id != $3`;
                values.push(equipoIdExcluir);
            }

            const result = await pool.query(query, values);
            return result.rows.length > 0;
        } catch (error) {
            throw new Error(`Error al verificar nombre del equipo: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const query = `
                SELECT 
                e.id,
                e.nombre,
                e.color,
                e.representante,
                e.telefono_representante,
                e.torneo_id,
                t.nombre as torneo_nombre,
                t.disciplina as torneo_disciplina,
                t.estado as torneo_estado,
                t.organizador_id as torneo_organizador_id,
                (SELECT COUNT(*) FROM jugadores j WHERE j.equipo_id = e.id) as total_jugadores,
                e.creado_en,
                e.actualizado_en
                FROM equipos e
                INNER JOIN torneos t ON e.torneo_id = t.id
                WHERE e.id = $1
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al buscar equipo por ID: ${error.message}`);
        }
    }

    static async update(id, equipoData) {
        const {
            nombre,
            color,
            representante,
            telefono_representante
        } = equipoData;

        try {
            const query = `
                UPDATE equipos 
                SET 
                nombre = COALESCE($1, nombre),
                color = COALESCE($2, color),
                representante = COALESCE($3, representante),
                telefono_representante = COALESCE($4, telefono_representante),
                actualizado_en = NOW()
                WHERE id = $5
                RETURNING 
                id, 
                nombre, 
                color, 
                representante, 
                telefono_representante,
                torneo_id,
                actualizado_en
            `;

            const values = [
                nombre,
                color,
                representante,
                telefono_representante,
                id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            // Error de violación de constraint UNIQUE
            if (error.code === '23505') {
                throw new Error('Ya existe otro equipo con ese nombre en este torneo');
            }
            throw new Error(`Error al actualizar equipo: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const query = `DELETE FROM equipos WHERE id = $1`;
            const result = await pool.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar equipo: ${error.message}`);
        }
    }

    static async getJugadores(equipoId) {
        try {
            const query = `
        SELECT 
            j.id,
            j.nombre,
            j.apellido,
            j.fecha_nacimiento,
            j.nro_camiseta,
            j.posicion,
            j.equipo_id,
            j.creado_en,
            j.actualizado_en
        FROM jugadores j
        WHERE j.equipo_id = $1
        ORDER BY j.nro_camiseta
        `;

            const result = await pool.query(query, [equipoId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener jugadores del equipo: ${error.message}`);
        }
    }

}

module.exports = EquipoModel;