// membresias.js
document.addEventListener('DOMContentLoaded', () => {
    const btnNew = document.getElementById('btnNewMembresia');
    const formContainer = document.getElementById('membresiaFormContainer');
    const form = document.getElementById('membresiaForm');
    const tablaBody = document.querySelector('#tablaMembresias tbody');
    const cancelBtn = document.getElementById('cancelMembresia');

    btnNew.addEventListener('click', () => {
        form.reset();
        document.getElementById('membresiaId').value = '';
        formContainer.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
    });

    async function cargarMembresias() {
        try {
            const res = await fetch('/api/membresias', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') } });
            if (!res.ok) throw new Error('No se pudieron obtener membresías');
            const data = await res.json();
            tablaBody.innerHTML = '';
            data.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td>${m.id}</td>
          <td>${m.codigo}</td>
          <td>${m.nombreCliente}</td>
          <td>${m.tipo}</td>
          <td>${new Date(m.fechaVencimiento).toLocaleDateString()}</td>
          <td>${m.estado}</td>
          <td>
            <button class="btn btn-sm btn-info" data-id="${m.id}" data-action="edit">Editar</button>
            <button class="btn btn-sm btn-danger" data-id="${m.id}" data-action="cancel">Cancelar</button>
            <button class="btn btn-sm btn-success" data-id="${m.id}" data-action="reactivate">Reactivar</button>
          </td>
        `;
                tablaBody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            alert('Error cargando membresías');
        }
    }

    tablaBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'edit') {
            // cargar detalles y mostrar formulario
            const res = await fetch(`/api/membresias/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') } });
            if (!res.ok) { alert('No se pudo cargar'); return; }
            const m = await res.json();
            document.getElementById('membresiaId').value = m.id;
            document.getElementById('mCodigo').value = m.codigo;
            document.getElementById('mNombre').value = m.nombreCliente;
            document.getElementById('mTipo').value = m.tipo;
            document.getElementById('mFechaInicio').value = m.fechaInicio.split('T')[0];
            document.getElementById('mFechaVencimiento').value = m.fechaVencimiento.split('T')[0];
            document.getElementById('mMontoPagado').value = m.montoPagado;
            document.getElementById('mMetodoPago').value = m.metodoPago || '';
            document.getElementById('mTelefono').value = m.telefonoContacto || '';
            formContainer.style.display = 'block';
        } else if (action === 'cancel') {
            if (!confirm('¿Cancelar esta membresía?')) return;
            const res = await fetch(`/api/membresias/${id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                },
                body: JSON.stringify({ estado: 'Cancelada' })
            });
            if (res.ok) { alert('Cancelada'); cargarMembresias(); }
            else { const d = await res.json(); alert(d.message || 'Error'); }
        } else if (action === 'reactivate') {
            const res = await fetch(`/api/membresias/${id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                },
                body: JSON.stringify({ estado: 'Activa' })
            });
            if (res.ok) { alert('Reactivada'); cargarMembresias(); }
            else { const d = await res.json(); alert(d.message || 'Error'); }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('membresiaId').value;
        const payload = {
            Codigo: document.getElementById('mCodigo').value.trim(),
            NombreCliente: document.getElementById('mNombre').value.trim(),
            Tipo: document.getElementById('mTipo').value,
            FechaInicio: document.getElementById('mFechaInicio').value,
            FechaVencimiento: document.getElementById('mFechaVencimiento').value,
            MontoPagado: parseFloat(document.getElementById('mMontoPagado').value) || 0,
            MetodoPago: document.getElementById('mMetodoPago').value,
            TelefonoContacto: document.getElementById('mTelefono').value
        };

        try {
            let res;
            if (!id) {
                res = await fetch('/api/membresias', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`/api/membresias/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                alert('Guardado correctamente');
                formContainer.style.display = 'none';
                cargarMembresias();
            } else {
                const d = await res.json();
                alert(d.message || 'Error al guardar');
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        }
    });

    // inicial
    cargarMembresias();
});
