// Funciones para Categorías
function showCategoriaForm(categoria = null) {
    console.log('Mostrando formulario de categoría');
    openManagementTab('categorias');
    const form = document.getElementById('categoriaForm');
    const title = document.getElementById('categoriaFormTitle');

    if (form) {
        if (categoria) {
            title.textContent = 'Editar Categoría';
            currentCategoriaId = categoria.id;
            fillCategoriaForm(categoria);
        } else {
            title.textContent = 'Nueva Categoría';
            currentCategoriaId = null;
            const categoriaFormElement = document.getElementById('categoriaFormElement');
            if (categoriaFormElement) categoriaFormElement.reset();
        }
        form.style.display = 'block';
    }
}

function hideCategoriaForm() {
    const form = document.getElementById('categoriaForm');
    if (form) form.style.display = 'none';
    currentCategoriaId = null;
}

function fillCategoriaForm(categoria) {
    document.getElementById('categoriaId').value = categoria.id;
    document.getElementById('categoriaNombre').value = categoria.nombre;
    document.getElementById('categoriaDescripcion').value = categoria.descripcion || '';
}

async function handleCategoriaSubmit(e) {
    e.preventDefault();
    console.log('Enviando formulario de categoría');

    const categoria = {
        nombre: document.getElementById('categoriaNombre').value,
        descripcion: document.getElementById('categoriaDescripcion').value
    };

    try {
        let response;
        if (currentCategoriaId) {
            categoria.id = currentCategoriaId;
            response = await fetch(`/api/categorias/${currentCategoriaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoria)
            });
        } else {
            response = await fetch('/api/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoria)
            });
        }

        if (response.ok) {
            showMessage('Categoría guardada exitosamente', 'success');
            hideCategoriaForm();
            loadCategorias();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar la categoría', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function loadCategorias() {
    try {
        console.log('Cargando categorías...');
        const response = await fetch('/api/categorias');
        if (response.ok) {
            categorias = await response.json();
            renderCategoriasTable();
            updateCategoriasSelect();
        } else {
            showMessage('Error al cargar las categorías', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión al cargar categorías', 'error');
    }
}

function renderCategoriasTable() {
    const tbody = document.getElementById('categoriasTableBody');
    if (!tbody) {
        console.error('No se encontró categoriasTableBody');
        return;
    }

    tbody.innerHTML = categorias.map(categoria => `
        <tr>
            <td>${categoria.nombre}</td>
            <td>${categoria.descripcion || '-'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="showCategoriaForm(${JSON.stringify(categoria).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteCategoria(${categoria.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateCategoriasSelect() {
    const select = document.getElementById('productoCategoria');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar categoría</option>' +
        categorias.map(cat =>
            `<option value="${cat.id}">${cat.nombre}</option>`
        ).join('');
}

async function deleteCategoria(id) {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) return;

    try {
        const response = await fetch(`/api/categorias/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Categoría eliminada exitosamente', 'success');
            loadCategorias();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}