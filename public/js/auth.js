// Registro
document.getElementById('registroForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        nombre: document.querySelector('#registroForm input[name="nombre"]').value,
        apellido: document.querySelector('#registroForm input[name="apellido"]').value,
        cedula: document.querySelector('#registroForm input[name="cedula"]').value,
        email: document.querySelector('#registroForm input[name="email"]').value,
        password: document.querySelector('#registroForm input[name="password"]').value,
        empresa: document.querySelector('#registroForm input[name="empresa"]').value,
        pregunta1: document.querySelector('#registroForm input[name="pregunta1"]').value,
        respuesta1: document.querySelector('#registroForm input[name="respuesta1"]').value,
        pregunta2: document.querySelector('#registroForm input[name="pregunta2"]').value,
        respuesta2: document.querySelector('#registroForm input[name="respuesta2"]').value
    };

    try {
        const response = await fetch('/api/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error en el registro');
        
        const data = await response.json();
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
        
    } catch (error) {
        mostrarErrores([error.message]);
    }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        email: document.querySelector('#loginForm input[name="email"]').value,
        password: document.querySelector('#loginForm input[name="password"]').value
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Credenciales inválidas');
        
        const { token } = await response.json();
        localStorage.setItem('token', token);
        window.location.href = '/dashboard';
        
    } catch (error) {
        mostrarErrores([error.message]);
    }
});

function mostrarErrores(errores) {
    const contenedor = document.getElementById('errores');
    contenedor.innerHTML = errores.map(e => `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${e}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `).join('');
}

// public/js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/login';

    try {
        // 2. Obtener datos del usuario
        const userRes = await fetch('/api/auth/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!userRes.ok) throw new Error('Error cargando perfil');
        const usuario = await userRes.json();

        // 3. Actualizar nombre en navbar
        document.getElementById('nombreUsuario').textContent = usuario.nombre;

        // 4. Cargar transacciones
        const transaccionesRes = await fetch('/api/transacciones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const transacciones = await transaccionesRes.json();

        // 5. Crear gráfico
        const ctx = document.getElementById('resumenChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ingresos', 'Egresos'],
                datasets: [{
                    data: [
                        transacciones.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.monto, 0),
                        transacciones.filter(t => t.tipo === 'egreso').reduce((sum, t) => sum + t.monto, 0)
                    ],
                    backgroundColor: ['#4CAF50', '#F44336']
                }]
            }
        });

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
});

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
});

