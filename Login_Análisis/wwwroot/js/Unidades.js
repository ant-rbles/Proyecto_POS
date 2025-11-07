// Funciones para Unidades de Medida
function showUnidadForm(unidad = null) {
    openManagementTab('unidades');

    const form = document.getElementById('unidadForm');
    const title = document.getElementById('unidadFormTitle');

    if (form) {
        if (unidad) {
            title.textContent = 'Editar Unidad de Medida';
            currentUnidadId = unidad.id;
            fillUnidadForm(unidad);
        } else {
            title.textContent = 'Nueva Unidad de Medida';
            currentUnidadId = null;
            document.getElementById('unidadFormElement').reset();
        }
        form.style.display = 'block';
    }
}

function hideUnidadForm() {
    const form = document.getElementById('unidadForm');
    if (form) form.style.display = 'none';
    currentUnidadId = null;
}

function fillUnidadForm(unidad) {
    document.getElementById('unidadId').value = unidad.id;
    document.getElementById('unidadNombre').value = unidad.nombre;
    document.getElementById('unidadAbreviatura').value = unidad.abreviatura;
    document.getElementById('unidadEsBase').checked = unidad.esUnidadBase;
    document.getElementById('unidadFactor').value = unidad.factorConversion;
}

async function handleUnidadSubmit(e) {
    e.preventDefault();

    // Validaciones
    const nombre = document.getElementById('unidadNombre').value.trim();
    const abreviatura = document.getElementById('unidadAbreviatura').value.trim();
    const factor = parseFloat(document.getElementById('unidadFactor').value);

    if (!nombre) {
        showMessage('El nombre es obligatorio', 'error');
        return;
    }
    if (!abreviatura) {
        showMessage('La abreviatura es obligatoria', 'error');
        return;
    }
    if (!factor || factor <= 0) {
        showMessage('El factor de conversión debe ser mayor a 0', 'error');
        return;
    }

    // Construir objeto como lo espera el modelo C#
    const unidadData = {
        id: currentUnidadId || 0,
        nombre: nombre,
        abreviatura: abreviatura,
        esUnidadBase: document.getElementById('unidadEsBase').checked,
        factorConversion: factor,
        estado: true
    };

    console.log('Datos a enviar:', unidadData);

    try {
        const authToken = localStorage.getItem('authToken');
        const url = currentUnidadId
            ? `https://localhost:7000/api/unidadesmedida/${currentUnidadId}`
            : 'https://localhost:7000/api/unidadesmedida';

        const method = currentUnidadId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(unidadData)
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message, 'success');
            hideUnidadForm();
            await loadUnidadesMedida();
        } else {
            const errorData = await response.json();
            console.error('Error del servidor:', errorData);
            showMessage(errorData.message || `Error ${response.status}: ${response.statusText}`, 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

async function loadUnidadesMedida() {
    try {
        console.log('Cargando unidades de medida...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/unidadesmedida', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            unidadesMedida = await response.json();
            console.log('Unidades cargadas:', unidadesMedida);
            updateUnidadesMedidaSelect();
            renderUnidadesTable();
        } else {
            showMessage('Error al cargar unidades de medida', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

function renderUnidadesTable() {
    const tbody = document.getElementById('unidadesTableBody');
    if (!tbody) return;

    tbody.innerHTML = unidadesMedida.map(unidad => `
        <tr>
            <td>${unidad.nombre}</td>
            <td>${unidad.abreviatura}</td>
            <td>${unidad.esUnidadBase ? 'Sí' : 'No'}</td>
            <td>${unidad.factorConversion}</td>
            <td>
                <button class="action-btn edit-btn" onclick="showUnidadForm(${JSON.stringify(unidad).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteUnidad(${unidad.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function deleteUnidad(id) {
    if (!confirm('¿Está seguro de eliminar esta unidad de medida?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/unidadesmedida/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message || 'Unidad de medida eliminada exitosamente', 'success');
            await loadUnidadesMedida();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

function updateUnidadesMedidaSelect() {
    console.log('Actualizando select de unidades de medida para productos...');

    const selectUnidad = document.getElementById('productoUnidadBase');
    if (!selectUnidad) {
        console.error('No se encontró el select de unidad de medida');
        return;
    }

    if (!unidadesMedida || unidadesMedida.length === 0) {
        console.warn('No hay unidades de medida cargadas');
        return;
    }

    // Guardar el valor actual si existe
    const currentValue = selectUnidad.value;

    // Limpiar y llenar el select
    selectUnidad.innerHTML = '<option value="">Seleccionar unidad de medida</option>';

    unidadesMedida.forEach(unidad => {
        if (unidad.estado) {
            const option = document.createElement('option');
            option.value = unidad.id;
            option.textContent = `${unidad.nombre} (${unidad.abreviatura})`;
            selectUnidad.appendChild(option);
        }
    });

    // Restaurar el valor anterior si existe
    if (currentValue) {
        selectUnidad.value = currentValue;
    }

    console.log('Select de unidades de medida actualizado');
}