// routes/transaccionRoutes.js
const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');
const autenticarUsuario = require('../middleware/auth');

// Registrar transacción
router.post('/', autenticarUsuario, transaccionController.crearTransaccion);

// Obtener todas las transacciones
router.get('/', autenticarUsuario, transaccionController.obtenerTransacciones);

// Exportar a Excel
router.get('/exportar', autenticarUsuario, transaccionController.exportarExcel);

module.exports = router;