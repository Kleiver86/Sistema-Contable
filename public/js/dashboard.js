// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        // Elementos del DOM
        const ctx = document.getElementById('resumenChart').getContext('2d');
        const loadingMessage = document.createElement('div');
        loadingMessage.textContent = 'Cargando datos...';
        document.querySelector('.card-body').appendChild(loadingMessage);

        // Obtener datos del backend
        const response = await fetch('/api/transacciones', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const transacciones = await response.json();
        loadingMessage.remove();

        // Procesar datos con validación
        const datos = {
            ingresos: transacciones.filter(t => t.tipo === 'ingreso').reduce((a, b) => a + (b.monto || 0), 0),
            egresos: transacciones.filter(t => t.tipo === 'egreso').reduce((a, b) => a + (b.monto || 0), 0)
        };

        // Crear gráfico con opciones mejoradas
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ingresos', 'Egresos'],
                datasets: [{
                    data: [datos.ingresos, datos.egresos],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: $${formatCurrency(value)}`;
                            }
                        }
                    }
                }
            }
        });

        // Función para formatear moneda
        function formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        }

    } catch (error) {
        console.error('Error:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-danger mt-3';
        errorMessage.textContent = `Error al cargar datos: ${error.message}`;
        document.querySelector('.card-body').appendChild(errorMessage);
    }
});

// Cerrar sesión con confirmación
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
});