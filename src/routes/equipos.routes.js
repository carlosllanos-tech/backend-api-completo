const express = require('express');
const { body, param } = require('express-validator');
const { verificarToken, esAdmin, esAdminOOrganizador, esAdminOrganizadorODelegado } = require('../middlewares/auth.middleware');
const EquiposController = require('../controllers/equipos.controller');

const router = express.Router();

router.get('/', EquiposController.listar);

router.post(
    '/',
    [
        verificarToken,
        esAdminOrganizadorODelegado,

        // Validación de nombre
        body('nombre')
            .notEmpty().withMessage('El nombre del equipo es requerido')
            .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres')
            .trim(),

        // Validación de color (opcional)
        body('color')
            .optional()
            .isLength({ max: 30 }).withMessage('El color no puede exceder 30 caracteres')
            .trim(),

        // Validación de representante (opcional)
        body('representante')
            .optional()
            .isLength({ max: 120 }).withMessage('El nombre del representante no puede exceder 120 caracteres')
            .trim(),

        // Validación de teléfono (opcional)
        body('telefono_representante')
            .optional({ nullable: true, checkFalsy: true })
            .matches(/^[0-9+\-() ]+$/)
            .withMessage('El teléfono solo puede contener números, +, -, paréntesis y espacios')
            .isLength({ min: 7, max: 30 })
            .withMessage('El teléfono debe tener entre 7 y 30 caracteres'),

        // Validación de torneo_id
        body('torneo_id')
            .notEmpty().withMessage('El ID del torneo es requerido')
            .isInt({ min: 1 }).withMessage('El ID del torneo debe ser un número positivo')
            .toInt()
    ],
    EquiposController.crear
);

router.get('/:id', EquiposController.obtenerPorId);

router.put(
    '/:id',
    [
        verificarToken,
        esAdminOrganizadorODelegado,

        // Validación de ID
        param('id')
            .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
            .toInt(),

        // Validación de nombre (opcional)
        body('nombre')
            .optional()
            .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres')
            .trim(),

        // Validación de color (opcional)
        body('color')
            .optional()
            .isLength({ max: 30 }).withMessage('El color no puede exceder 30 caracteres')
            .trim(),

        // Validación de representante (opcional)
        body('representante')
            .optional()
            .isLength({ max: 120 }).withMessage('El nombre del representante no puede exceder 120 caracteres')
            .trim(),

        // Validación de teléfono (opcional)
        body('telefono_representante')
            .optional({ nullable: true, checkFalsy: true })
            .matches(/^[0-9+\-() ]+$/)
            .withMessage('El teléfono solo puede contener números, +, -, paréntesis y espacios')
            .isLength({ min: 7, max: 30 })
            .withMessage('El teléfono debe tener entre 7 y 30 caracteres')
    ],
    EquiposController.actualizar
);

router.delete(
    '/:id',
    [
        verificarToken,
        // Solo admin u organizador pueden eliminar
        // (el controlador verifica si es organizador del torneo)
    ],
    EquiposController.eliminar
);

router.get('/:id/jugadores', EquiposController.obtenerJugadores);

module.exports = router;