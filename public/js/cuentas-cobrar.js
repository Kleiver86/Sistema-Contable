document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/login';

    const listaCuentas = document.getElementById('listaCuentas');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroFecha = document.getElementById('filtroFecha');
    const formCuenta = document.getElementById('formCuenta');
    const btnGuardar = document.getElementById('btnGuardarCuenta');

    let cuentas = [];

    // Cargar cuentas iniciales
    try {
        cuentas = await cargarCuentas(token);
        actualizarTabla(cuentas);
    } catch (error) {
        mostrarError('Error cargando cuentas: ' + error.message);
    }

    // Event Listeners
    filtroEstado.addEventListener('change', filtrarCuentas);
    filtroFecha.addEventListener('change', filtrarCuentas);
    
    btnGuardar.addEventListener('click', async () => {
        const formData = {
            entidad: formCuenta.entidad.value.trim(),
            monto: parseFloat(formCuenta.monto.value),
            fecha_vencimiento: formCuenta.fecha_vencimiento.value,
            descripcion: formCuenta.descripcion.value.trim()
        };

        try {
            const nuevaCuenta = await crearCuenta(token, formData);
            cuentas.push(nuevaCuenta);
            actualizarTabla(cuentas);
            formCuenta.reset();
            bootstrap.Modal.getInstance(document.getElementById('modalNuevaCuenta')).hide();
            mostrarExito('Cuenta registrada exitosamente!');
        } catch (error) {
            mostrarError(error.message);
        }
    });

    // Funciones principales
    async function cargarCuentas(token) {
        const response = await fetch('/api/cuentas-cobrar', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error al obtener cuentas');
        return await response.json();
    }

    function actualizarTabla(cuentasMostrar) {
        listaCuentas.innerHTML = cuentasMostrar.map(cuenta => `
            <tr data-id="${cuenta.id}">
                <td>${cuenta.entidad}</td>
                <td>$${cuenta.monto.toFixed(2)}</td>
                <td>${new Date(cuenta.fecha_vencimiento).toLocaleDateString()}</td>
                <td>
                    <span class="estado-${cuenta.estado}">
                        ${cuenta.estado.charAt(0).toUpperCase() + cuenta.estado.slice(1)}
                    </span>
                </td>
                <td>${cuenta.descripcion || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning btn-editar">Editar</button>
                    <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
                </td>
            </tr>
        `).join('');

        // Agregar eventos a botones
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', manejarEdicion);
        });

        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', manejarEliminacion);
        });
    }

    function filtrarCuentas() {
        const estado = filtroEstado.value;
        const fecha = filtroFecha.value;

        const filtradas = cuentas.filter(c => {
            const cumpleEstado = estado === 'todos' || c.estado === estado;
            const cumpleFecha = !fecha || c.fecha_vencimiento === fecha;
            return cumpleEstado && cumpleFecha;
        });

        actualizarTabla(filtradas);
    }

    async function manejarEdicion(e) {
        const id = e.target.closest('tr').dataset.id;
        const cuenta = cuentas.find(c => c.id == id);

        // Llenar modal de edición
        formCuenta.entidad.value = cuenta.entidad;
        formCuenta.monto.value = cuenta.monto;
        formCuenta.fecha_vencimiento.value = cuenta.fecha_vencimiento.split('T')[0];
        formCuenta.descripcion.value = cuenta.descripcion;

        const modal = new bootstrap.Modal(document.getElementById('modalNuevaCuenta'));
        modal.show();

        btnGuardar.onclick = async () => {
            const datosActualizados = {
                entidad: formCuenta.entidad.value.trim(),
                monto: parseFloat(formCuenta.monto.value),
                fecha_vencimiento: formCuenta.fecha_vencimiento.value,
                descripcion: formCuenta.descripcion.value.trim()
            };

            try {
                const cuentaActualizada = await actualizarCuenta(token, id, datosActualizados);
                const index = cuentas.findIndex(c => c.id == id);
                cuentas[index] = cuentaActualizada;
                actualizarTabla(cuentas);
                modal.hide();
                mostrarExito('Cuenta actualizada!');
            } catch (error) {
                mostrarError(error.message);
            }
        };
    }

    async function manejarEliminacion(e) {
        const id = e.target.closest('tr').dataset.id;
        if (!confirm('¿Eliminar esta cuenta?')) return;

        try {
            await eliminarCuenta(token, id);
            cuentas = cuentas.filter(c => c.id != id);
            actualizarTabla(cuentas);
            mostrarExito('Cuenta eliminada!');
        } catch (error) {
            mostrarError(error.message);
        }
    }

    // Funciones API
    async function crearCuenta(token, datos) {
        const response = await fetch('/api/cuentas-cobrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });
        if (!response.ok) throw new Error('Error al crear cuenta');
        return await response.json();
    }

    async function actualizarCuenta(token, id, datos) {
        const response = await fetch(`/api/cuentas-cobrar/${id}`, {
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

    async function eliminarCuenta(token, id) {
        const response = await fetch(`/api/cuentas-cobrar/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error al eliminar');
    }

    // Helpers
    function mostrarExito(mensaje) {
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-success mt-3';
        alerta.textContent = mensaje;
        document.querySelector('.container-fluid').prepend(alerta);
        setTimeout(() => alerta.remove(), 3000);
    }

    function mostrarError(mensaje) {
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-danger mt-3';
        alerta.textContent = mensaje;
        document.querySelector('.container-fluid').prepend(alerta);
        setTimeout(() => alerta.remove(), 5000);
    }
});