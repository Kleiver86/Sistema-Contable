require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// Importar rutas API
const authRoutes = require('./routes/authRoutes');
const transaccionRoutes = require('./routes/transaccionRoutes');
const cuentaCobrarRoutes = require('./routes/cuentaCobrarRoutes');
// Configuración básica
const port = process.env.PORT || 3000;

// 1. Middlewares iniciales
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2. Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// 3. Rutas principales (HTML)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, 'views', 'registro.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/transacciones', (req, res) => res.sendFile(path.join(__dirname, 'views', 'transacciones.html')));
app.get('/reportes', (req, res) => res.sendFile(path.join(__dirname, 'views', 'reportes.html')));
app.get('/cuentas-por-pagar', (req, res) => res.sendFile(path.join(__dirname, 'views', 'cuentas-pagar.html')));
app.get('/cuentas-por-cobrar', (req, res) => res.sendFile(path.join(__dirname, 'views', 'cuentas-cobrar.html')));
app.get('/perfil', (req, res) => res.sendFile(path.join(__dirname, 'views', 'perfil.html')));

// 4. Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/transacciones', transaccionRoutes);
app.use('/api/cuentas-cobrar', cuentaCobrarRoutes);
// 5. Manejo de errores (Debe ir al final)
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'views', '404.html')));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
});

// Iniciar servidor
app.listen(port, () => console.log(`Servidor corriendo en http://localhost:${port}`));