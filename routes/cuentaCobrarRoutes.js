const express = require('express');
const router = express.Router();

// Ejemplo de ruta para servir la interfaz
router.get('/cuentas-cobrar', (req, res) => {
    res.sendFile(__dirname + '/views/cuentas-cobrar.html');
});

// Exporta el router
module.exports = router;