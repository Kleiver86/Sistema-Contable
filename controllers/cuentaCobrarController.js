const pool = require('../db/db');

const obtenerCuentas = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM cuentas_por_cobrar WHERE usuario_id = $1 ORDER BY fecha_vencimiento',
            [req.usuario.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cuentas' });
    }
};

const crearCuenta = async (req, res) => {
    try {
        const { entidad, monto, fecha_vencimiento, descripcion } = req.body;
        const result = await pool.query(
            `INSERT INTO cuentas_por_cobrar 
            (usuario_id, entidad, monto, fecha_vencimiento, descripcion, estado)
            VALUES ($1, $2, $3, $4, $5, 'pendiente')
            RETURNING *`,
            [req.usuario.id, entidad, monto, fecha_vencimiento, descripcion]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear cuenta' });
    }
};

// Agregar funciones de actualizar y eliminar similares

module.exports = {
    obtenerCuentas,
    crearCuenta
};