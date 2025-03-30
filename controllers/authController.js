const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');

const registrarUsuario = async (req, res) => {
    try {
        const { 
            nombre, 
            apellido, 
            cedula, 
            email, 
            password, 
            empresa, 
            pregunta1, 
            respuesta1, 
            pregunta2, 
            respuesta2 
        } = req.body;

        // Validación completa de campos requeridos
        const camposRequeridos = [
            nombre, apellido, cedula, email, password, 
            empresa, pregunta1, respuesta1, pregunta2, respuesta2
        ];
        
        if (camposRequeridos.some(campo => !campo)) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios',
                camposFaltantes: [
                    !nombre && 'nombre',
                    !apellido && 'apellido',
                    !cedula && 'cedula',
                    !email && 'email',
                    !password && 'password',
                    !empresa && 'empresa',
                    !pregunta1 && 'pregunta1',
                    !respuesta1 && 'respuesta1',
                    !pregunta2 && 'pregunta2',
                    !respuesta2 && 'respuesta2'
                ].filter(Boolean)
            });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 OR cedula = $2',
            [email, cedula]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El usuario ya está registrado',
                detalle: usuarioExistente.rows[0].email === email 
                    ? 'El correo ya está en uso' 
                    : 'La cédula ya está registrada'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO usuarios 
            (nombre, apellido, cedula, email, password, empresa, 
            pregunta1, respuesta1, pregunta2, respuesta2)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, nombre, email, empresa, creado_en`;
        
        const values = [
            nombre.trim(),
            apellido.trim(),
            cedula.trim(),
            email.toLowerCase().trim(),
            hashedPassword,
            empresa.trim(),
            pregunta1.trim(),
            respuesta1.trim(),
            pregunta2.trim(),
            respuesta2.trim()
        ];

        const result = await pool.query(query, values);
        
        // Generar token JWT
        const token = jwt.sign(
            { id: result.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(201).json({
            mensaje: 'Registro exitoso',
            usuario: result.rows[0],
            token
        });

    } catch (error) {
        console.error('Error en registro:', error);
        
        // Manejar errores específicos de PostgreSQL
        if (error.code === '23505') {
            return res.status(400).json({
                error: 'Conflicto de datos únicos',
                detalle: error.detail
            });
        }

        res.status(500).json({ 
            error: 'Error en el servidor',
            detalle: error.message 
        });
    }
};

const solicitarRecuperacion = async (req, res) => {
    const { email, respuesta1, respuesta2 } = req.body;
    
    // Verificar respuestas
    const usuario = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND respuesta1 = $2 AND respuesta2 = $3',
        [email, respuesta1, respuesta2]
    );

    if (!usuario.rows[0]) {
        return res.status(400).json({ error: 'Datos incorrectos' });
    }

    // Generar token temporal (válido por 1 hora)
    const resetToken = jwt.sign({ id: usuario.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Actualizar usuario
    await pool.query(
        'UPDATE usuarios SET reset_token = $1, reset_expiry = NOW() + INTERVAL \'1 hour\' WHERE id = $2',
        [resetToken, usuario.rows[0].id]
    );

    // Enviar email (simulado)
    console.log(`Enlace de recuperación: http://tusitio.com/resetear?token=${resetToken}`);
    res.json({ mensaje: 'Instrucciones enviadas al correo' });
};

const resetearContrasena = async (req, res) => {
    const { token, nuevaContrasena } = req.body;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const usuario = await pool.query(
            'SELECT * FROM usuarios WHERE id = $1 AND reset_token = $2 AND reset_expiry > NOW()',
            [decoded.id, token]
        );

        if (!usuario.rows[0]) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
        
        await pool.query(
            'UPDATE usuarios SET password = $1, reset_token = NULL, reset_expiry = NULL WHERE id = $2',
            [hashedPassword, decoded.id]
        );

        res.json({ mensaje: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error en el proceso de recuperación' });
    }
};

const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Buscar usuario por email
        const usuario = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (!usuario.rows[0]) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Comparar contraseñas
        const contraseñaValida = await bcrypt.compare(password, usuario.rows[0].password);
        if (!contraseñaValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: usuario.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// 3. Función de perfil (FALTABA ESTA)
const obtenerPerfil = async (req, res) => {
    try {
        res.json({
            id: req.usuario.id,
            nombre: req.usuario.nombre,
            email: req.usuario.email,
            empresa: req.usuario.empresa
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};


module.exports = {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil,
    solicitarRecuperacion,
    resetearContrasena
};