const { validationResult } = require('express-validator');
const EquipoModel = require('../models/equipo.model');
const TorneoModel = require('../models/torneo.model');

class EquiposController {

    static async listar(req, res) {
        try {
            const equipos = await EquipoModel.findAll();

            return res.status(200).json({
                success: true,
                message: 'Equipos obtenidos exitosamente',
                data: equipos,
                total: equipos.length
            });

        } catch (error) {
            console.error('Error al listar equipos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener equipos',
                error: error.message
            });
        }
    }

    static async crear(req, res) {
        try {
            // Validar errores de express-validator
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { nombre, color, representante, telefono_representante, torneo_id } = req.body;

            // Verificar que el torneo existe
            const torneo = await TorneoModel.findById(torneo_id);
            if (!torneo) {
                return res.status(404).json({
                    success: false,
                    message: 'El torneo especificado no existe'
                });
            }

            // Verificar que no exista un equipo con el mismo nombre en el torneo
            const nombreExiste = await EquipoModel.nombreExisteEnTorneo(nombre, torneo_id);
            if (nombreExiste) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un equipo con ese nombre en este torneo'
                });
            }

            // Crear el equipo
            const nuevoEquipo = await EquipoModel.create({
                nombre,
                color,
                representante,
                telefono_representante,
                torneo_id
            });

            return res.status(201).json({
                success: true,
                message: 'Equipo creado exitosamente',
                data: nuevoEquipo
            });

        } catch (error) {
            console.error('Error al crear equipo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear equipo',
                error: error.message
            });
        }
    }

    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            const equipo = await EquipoModel.findById(id);

            if (!equipo) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipo no encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Equipo encontrado',
                data: equipo
            });

        } catch (error) {
            console.error('Error al obtener equipo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener equipo',
                error: error.message
            });
        }
    }

    static async actualizar(req, res) {
        try {
            // Validar errores de express-validator
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Verificar que el equipo exista
            const equipoExiste = await EquipoModel.findById(id);
            if (!equipoExiste) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipo no encontrado'
                });
            }

            // Verificar permisos:
            // - Si es admin, puede editar cualquier equipo
            // - Si es organizador, solo puede editar equipos de sus torneos
            // - Si es delegado, puede editar equipos
            const esAdmin = req.usuario.rol_nombre === 'admin';
            const esDelegado = req.usuario.rol_nombre === 'delegado';
            const esOrganizadorDelTorneo = equipoExiste.torneo_organizador_id === req.usuario.id;

            if (!esAdmin && !esDelegado && !esOrganizadorDelTorneo) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para modificar este equipo'
                });
            }

            // Si se está cambiando el nombre, verificar que no exista otro equipo con ese nombre
            if (req.body.nombre && req.body.nombre !== equipoExiste.nombre) {
                const nombreExiste = await EquipoModel.nombreExisteEnTorneo(
                    req.body.nombre,
                    equipoExiste.torneo_id,
                    id
                );

                if (nombreExiste) {
                    return res.status(409).json({
                        success: false,
                        message: 'Ya existe otro equipo con ese nombre en este torneo'
                    });
                }
            }

            // Actualizar el equipo
            const equipoActualizado = await EquipoModel.update(id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Equipo actualizado exitosamente',
                data: equipoActualizado
            });

        } catch (error) {
            console.error('Error al actualizar equipo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar equipo',
                error: error.message
            });
        }
    }

    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Verificar que el equipo exista
            const equipo = await EquipoModel.findById(id);
            if (!equipo) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipo no encontrado'
                });
            }

            // Verificar permisos:
            // - Si es admin, puede eliminar cualquier equipo
            // - Si es organizador, solo puede eliminar equipos de sus torneos
            const esAdmin = req.usuario.rol_nombre === 'admin';
            const esOrganizadorDelTorneo = equipo.torneo_organizador_id === req.usuario.id;

            if (!esAdmin && !esOrganizadorDelTorneo) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este equipo'
                });
            }

            // Eliminar el equipo (cascada eliminará jugadores)
            await EquipoModel.delete(id);

            return res.status(200).json({
                success: true,
                message: 'Equipo eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar equipo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar equipo',
                error: error.message
            });
        }
    }

    static async obtenerJugadores(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Verificar que el equipo exista
            const equipo = await EquipoModel.findById(id);
            if (!equipo) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipo no encontrado'
                });
            }

            const jugadores = await EquipoModel.getJugadores(id);

            return res.status(200).json({
                success: true,
                message: 'Jugadores del equipo obtenidos exitosamente',
                data: jugadores,
                total: jugadores.length,
                equipo: {
                    id: equipo.id,
                    nombre: equipo.nombre,
                    torneo: equipo.torneo_nombre
                }
            });

        } catch (error) {
            console.error('Error al obtener jugadores del equipo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener jugadores',
                error: error.message
            });
        }
    }

}

module.exports = EquiposController;