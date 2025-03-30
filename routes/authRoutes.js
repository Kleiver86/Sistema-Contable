const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const autenticarUsuario = require('../middleware/auth');

// Registro de usuario
router.post('/registro', authController.registrarUsuario);

// Inicio de sesión
router.post('/login', authController.iniciarSesion);

// Obtener perfil del usuario (protegido)
router.get('/perfil', autenticarUsuario, authController.obtenerPerfil);

// Recuperación de contraseña
router.post('/recuperar-contrasena', authController.solicitarRecuperacion);
router.post('/resetear-contrasena', authController.resetearContrasena);

module.exports = router;