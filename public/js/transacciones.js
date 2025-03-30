// public/js/transacciones.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // 2. Elementos del DOM
    const transaccionesTable = document.getElementById('listaTransacciones');
    const filtroFecha = document.getElementById('filtroFecha');
    const filtroTipo = document.getElementById('filtroTipo');
    const formTransaccion = document.getElementById('transaccionForm');

    // 3. Cargar transacciones iniciales
    let transacciones = [];
    try {
        transacciones = await cargarTransaccionesDesdeAPI(token);
        actualizarTabla(transacciones);
    } catch (error) {
        mostrarError('Error cargando transacciones: ' + error.message);
    }

    // 4. Configurar filtros
    filtroFecha.addEventListener('change', () => filtrarTransacciones());
    filtroTipo.addEventListener('change', () => filtrarTransacciones());

    // 5. Manejar nuevo registro
    formTransaccion.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nuevaTransaccion = {
            tipo: document.querySelector('[name="tipo"]').value,
            monto: parseFloat(document.querySelector('[name="monto"]').value),
            descripcion: document.querySelector('[name="descripcion"]').value.trim(),
            categoria: document.querySelector('[name="categoria"]').value || 'General'
        };

        try {
            const transaccionCreada = await crearTransaccionAPI(token, nuevaTransaccion);
            transacciones.push(transaccionCreada);
            actualizarTabla(transacciones);
            formTransaccion.reset();
            mostrarExito('Transacción registrada exitosamente!');
        } catch (error) {
            mostrarError(error.message);
        }
    });

    // 6. Funciones principales
    async function cargarTransaccionesDesdeAPI(token) {
        const response = await fetch('/api/transacciones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al obtener transacciones');
        return await response.json();
    }

    function actualizarTabla(transacciones) {
        transaccionesTable.innerHTML = transacciones.map(t => `
            <tr data-id="${t.id}">
                <td>${new Date(t.fecha).toLocaleDateString()}</td>
                <td>
                    <span class="badge ${t.tipo === 'ingreso' ? 'bg-success' : 'bg-danger'}">
                        ${t.tipo}
                    </span>
                </td>
                <td>$${t.monto.toFixed(2)}</td>
                <td>${t.descripcion}</td>
                <td>${t.categoria}</td>
                <td>
                    <button class="btn btn-sm btn-warning btn-editar">✏️ Editar</button>
                    <button class="btn btn-sm btn-danger btn-eliminar">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');

        // Agregar eventos a los botones
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', manejarEdicion);
        });
        
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', manejarEliminacion);
        });
    }

    function filtrarTransacciones() {
        const fechaSeleccionada = filtroFecha.value;
        const tipoSeleccionado = filtroTipo.value;

        const transaccionesFiltradas = transacciones.filter(t => {
            const cumpleFecha = !fechaSeleccionada || 
                new Date(t.fecha).toISOString().split('T')[0] === fechaSeleccionada;
            
            const cumpleTipo = !tipoSeleccionado || 
                t.tipo === tipoSeleccionado.toLowerCase();
            
            return cumpleFecha && cumpleTipo;
        });

        actualizarTabla(transaccionesFiltradas);
    }

    async function manejarEdicion(e) {
        const idTransaccion = e.target.closest('tr').dataset.id;
        const transaccion = transacciones.find(t => t.id == idTransaccion);

        // Llenar formulario de edición
        document.getElementById('editarTipo').value = transaccion.tipo;
        document.getElementById('editarMonto').value = transaccion.monto;
        document.getElementById('editarDescripcion').value = transaccion.descripcion;
        document.getElementById('editarCategoria').value = transaccion.categoria;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalEdicion'));
        modal.show();

        // Manejar guardado
        document.getElementById('btnGuardarCambios').onclick = async () => {
            const datosActualizados = {
                tipo: document.getElementById('editarTipo').value,
                monto: parseFloat(document.getElementById('editarMonto').value),
                descripcion: document.getElementById('editarDescripcion').value.trim(),
                categoria: document.getElementById('editarCategoria').value
            };

            try {
                const transaccionActualizada = await actualizarTransaccionAPI(token, idTransaccion, datosActualizados);
                const index = transacciones.findIndex(t => t.id == idTransaccion);
                transacciones[index] = transaccionActualizada;
                actualizarTabla(transacciones);
                modal.hide();
                mostrarExito('Transacción actualizada!');
            } catch (error) {
                mostrarError(error.message);
            }
        };
    }

    async function manejarEliminacion(e) {
        const idTransaccion = e.target.closest('tr').dataset.id;
        if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;

        try {
            await eliminarTransaccionAPI(token, idTransaccion);
            transacciones = transacciones.filter(t => t.id != idTransaccion);
            actualizarTabla(transacciones);
            mostrarExito('Transacción eliminada!');
        } catch (error) {
            mostrarError(error.message);
        }
    }

    // Funciones de ayuda
    async function crearTransaccionAPI(token, transaccion) {
        const response = await fetch('/api/transacciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(transaccion)
        });
        
        if (!response.ok) throw new Error('Error al crear transacción');
        return await response.json();
    }

    async function actualizarTransaccionAPI(token, id, datos) {
        const response = await fetch(`/api/transacciones/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });
        
        if (!response.ok) throw new Error('Error al actualizar');
        return await response.json();
    }

    async function eliminarTransaccionAPI(token, id) {
        const response = await fetch(`/api/transacciones/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al eliminar');
    }

    function mostrarExito(mensaje) {
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-success mt-3';
        alerta.textContent = mensaje;
        document.querySelector('.container').prepend(alerta);
        setTimeout(() => alerta.remove(), 3000);
    }

    function mostrarError(mensaje) {
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-danger mt-3';
        alerta.textContent = mensaje;
        document.querySelector('.container').prepend(alerta);
        setTimeout(() => alerta.remove(), 5000);
    }
});