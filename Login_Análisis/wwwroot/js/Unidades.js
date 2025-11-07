// unidades.js - Gestión de unidades de medida

// Variables globales para unidades de medida
let currentUnidadId = null;

// Inicializar módulo de unidades
document.addEventListener('DOMContentLoaded', () => {
    setupUnidadesEventListeners();
});

function setupUnidadesEventListeners() {
    const unidadForm = document.getElementById('unidadFormElement');
    if (unidadForm) {
        unidadForm.addEventListener('submit', handleUnidadSubmit);
    }
}

// Cargar unidades de medida
async function loadUnidadesMedida() {
    try {
        unidadesMedida = await apiCall('https://localhost:7000/api/unidadesmedida');
        renderUnidadesTable();
        updateUnidadesMedidaSelect();
    } catch (error) {
        console.error('Error al cargar unidades de medida:', error);
        showMessage('Error al cargar unidades de medida', 'error');
    }
}

// Renderizar tabla de unidades de medida
function renderUnidadesTable() {
    const tbody = document.getElementById('unidadesTableBody');
    if (!tbody) return;

    if (!unidadesMedida || unidadesMedida.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 20px; color: #6c757d;">
                    <i class="fas fa-ruler-combined" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No hay unidades de medida registradas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = unidadesMedida.map(unidad => `
        <tr>
            <td>${unidad.nombre}</td>
            <td>${unidad.abreviatura}</td>
            <td>${unidad.factorConversion}</td>
            <td>
                <span class="badge ${unidad.esUnidadBase ? 'badge-primary' : 'badge-secondary'}">
                    ${unidad.esUnidadBase ? 'Unidad Base' : 'Unidad Derivada'}
                </span>
            </td>
            <td>
                <span class="badge ${unidad.estado ? 'badge-success' : 'badge-danger'}">
                    ${unidad.estado ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showUnidadForm(${JSON.stringify(unidad).replace(/"/g, '&quot;')})" 
                        title="Editar unidad">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${unidad.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${unidad.estado ? 'desactivarUnidad' : 'activarUnidad'}(${unidad.id})"
                        title="${unidad.estado ? 'Desactivar unidad' : 'Activar unidad'}">
                    <i class="fas ${unidad.estado ? 'fa-trash' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Mostrar formulario de unidades
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
            resetUnidadForm();
        }
        form.style.display = 'block';
    }
}

function resetUnidadForm() {
    const form = document.getElementById('unidadFormElement');
    if (form) form.reset();
    document.getElementById('unidadFactor').value = '1';
}

// Llenar formulario de unidad
function fillUnidadForm(unidad) {
    document.getElementById('unidadId').value = unidad.id;
    document.getElementById('unidadNombre').value = unidad.nombre || '';
    document.getElementById('unidadAbreviatura').value = unidad.abreviatura || '';
    document.getElementById('unidadFactor').value = unidad.factorConversion || 1;
    document.getElementById('unidadBase').checked = unidad.esUnidadBase || false;
}

// Ocultar formulario de unidad
function hideUnidadForm() {
    const form = document.getElementById('unidadForm');
    if (form) form.style.display = 'none';
    currentUnidadId = null;
}

// Manejar envío del formulario de unidad
async function handleUnidadSubmit(e) {
    e.preventDefault();

    const unidadData = {
        Nombre: document.getElementById('unidadNombre').value.trim(),
        Abreviatura: document.getElementById('unidadAbreviatura').value.trim(),
        FactorConversion: parseFloat(document.getElementById('unidadFactor').value) || 1,
        EsUnidadBase: document.getElementById('unidadBase').checked
    };

    // Validaciones
    if (!unidadData.Nombre) {
        showMessage('El nombre de la unidad es obligatorio', 'error');
        return;
    }

    if (!unidadData.Abreviatura) {
        showMessage('La abreviatura es obligatoria', 'error');
        return;
    }

    if (unidadData.FactorConversion <= 0) {
        showMessage('El factor de conversión debe ser mayor a 0', 'error');
        return;
    }

    try {
        const submitBtn = document.querySelector('#unidadFormElement button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Guardando...';

        let response;
        const url = currentUnidadId
            ? `https://localhost:7000/api/unidadesmedida/${currentUnidadId}`
            : 'https://localhost:7000/api/unidadesmedida';

        const method = currentUnidadId ? 'PUT' : 'POST';

        response = await apiCall(url, {
            method: method,
            body: JSON.stringify(unidadData)
        });

        showMessage('Unidad de medida guardada exitosamente', 'success');
        hideUnidadForm();
        loadUnidadesMedida();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar unidad de medida', 'error');
    } finally {
        const submitBtn = document.querySelector('#unidadFormElement button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = currentUnidadId ? 'Actualizar Unidad' : 'Guardar Unidad';
        }
    }
}

// Desactivar unidad
async function desactivarUnidad(id) {
    if (!confirm('¿Está seguro de desactivar esta unidad de medida?')) return;

    try {
        await apiCall(`https://localhost:7000/api/unidadesmedida/${id}`, {
            method: 'DELETE'
        });

        showMessage('Unidad desactivada exitosamente', 'success');
        loadUnidadesMedida();
    } catch (error) {
        showMessage(error.message || 'Error al desactivar unidad', 'error');
    }
}

// Activar unidad
async function activarUnidad(id) {
    if (!confirm('¿Está seguro de activar esta unidad de medida?')) return;

    try {
        await apiCall(`https://localhost:7000/api/unidadesmedida/${id}/activate`, {
            method: 'PUT'
        });

        showMessage('Unidad activada exitosamente', 'success');
        loadUnidadesMedida();
    } catch (error) {
        showMessage(error.message || 'Error al activar unidad', 'error');
    }
}

// Actualizar select de unidades de medida
function updateUnidadesMedidaSelect() {
    // Para productos
    const selectUnidadBase = document.getElementById('productoUnidadBase');
    if (selectUnidadBase && unidadesMedida) {
        const unidadesActivas = unidadesMedida.filter(u => u.estado);
        populateSelect(selectUnidadBase, unidadesActivas, 'id', 'nombre', 'Seleccionar unidad base');
    }

    // Para ventas
    const selectUnidadVenta = document.getElementById('ventaUnidadMedida');
    if (selectUnidadVenta && unidadesMedida) {
        const unidadesActivas = unidadesMedida.filter(u => u.estado);
        populateSelect(selectUnidadVenta, unidadesActivas, 'id', 'nombre', 'Seleccionar unidad');
    }

    // Para compras
    const selectUnidadCompra = document.getElementById('compraUnidadMedida');
    if (selectUnidadCompra && unidadesMedida) {
        const unidadesActivas = unidadesMedida.filter(u => u.estado);
        populateSelect(selectUnidadCompra, unidadesActivas, 'id', 'nombre', 'Seleccionar unidad');
    }
}

// Convertir unidades
async function convertirUnidades() {
    const desdeUnidadId = document.getElementById('convertirDesde').value;
    const aUnidadId = document.getElementById('convertirA').value;
    const cantidad = parseFloat(document.getElementById('convertirCantidad').value);

    if (!desdeUnidadId || !aUnidadId || !cantidad || cantidad <= 0) {
        showMessage('Complete todos los campos para realizar la conversión', 'error');
        return;
    }

    try {
        const resultado = await apiCall(
            `https://localhost:7000/api/productos/convertir-unidad?desdeUnidadId=${desdeUnidadId}&aUnidadId=${aUnidadId}&cantidad=${cantidad}`
        );

        document.getElementById('resultadoConversion').textContent =
            `${cantidad} ${getAbreviaturaUnidad(desdeUnidadId)} = ${resultado.cantidadConvertida.toFixed(4)} ${getAbreviaturaUnidad(aUnidadId)}`;

        showMessage('Conversión realizada exitosamente', 'success');
    } catch (error) {
        showMessage(error.message || 'Error al realizar la conversión', 'error');
    }
}

// Obtener abreviatura de unidad por ID
function getAbreviaturaUnidad(unidadId) {
    const unidad = unidadesMedida.find(u => u.id == unidadId);
    return unidad ? unidad.abreviatura : 'UND';
}

// Obtener unidad base
function getUnidadBase() {
    return unidadesMedida.find(u => u.esUnidadBase && u.estado);
}