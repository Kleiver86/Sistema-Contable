const jwt = require('jsonwebtoken');
const pool = require('../db/db');

const autenticarUsuario = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const usuario = await pool.query(
            'SELECT * FROM usuarios WHERE id = $1',
            [decoded.id]
        );
    
        if (!usuario.rows[0]) {
            throw new Error();
        }
    
        req.usuario = usuario.rows[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Autenticación requerida' });
    }
};

module.exports = autenticarUsuario;