// productos.js - Gestión completa de productos

// Variables globales para productos
let currentProductoId = null;
let currentCategoriaId = null;

// Inicializar módulo de productos
document.addEventListener('DOMContentLoaded', () => {
    setupProductosEventListeners();
});

function setupProductosEventListeners() {
    const productoForm = document.getElementById('productoFormElement');
    if (productoForm) {
        productoForm.addEventListener('submit', handleProductoSubmit);
    }

    const categoriaForm = document.getElementById('categoriaFormElement');
    if (categoriaForm) {
        categoriaForm.addEventListener('submit', handleCategoriaSubmit);
    }
}

// ==================== PRODUCTOS ====================

// Mostrar formulario de productos
function showProductoForm(producto = null) {
    openManagementTab('productos');

    const form = document.getElementById('productoForm');
    const title = document.getElementById('productoFormTitle');

    if (form) {
        if (producto) {
            title.textContent = 'Editar Producto';
            currentProductoId = producto.id;
            fillProductoForm(producto);
        } else {
            title.textContent = 'Nuevo Producto';
            currentProductoId = null;
            resetProductoForm();
        }
        form.style.display = 'block';
    }
}

function resetProductoForm() {
    const form = document.getElementById('productoFormElement');
    if (form) form.reset();
    document.getElementById('productoStockMinimo').value = '0';
    document.getElementById('productoMargen').value = '30';
}

// Llenar formulario de producto
function fillProductoForm(producto) {
    document.getElementById('productoId').value = producto.id;
    document.getElementById('productoCodigo').value = producto.codigo || '';
    document.getElementById('productoNombre').value = producto.nombre || '';
    document.getElementById('productoDescripcion').value = producto.descripcion || '';
    document.getElementById('productoStockMinimo').value = producto.stockMinimo || 0;
    document.getElementById('productoMargen').value = producto.margenGanancia || 30;

    // Seleccionar categoría si existe
    if (producto.categoriaId && document.getElementById('productoCategoria')) {
        document.getElementById('productoCategoria').value = producto.categoriaId;
    }

    // Seleccionar unidad de medida
    if (producto.unidadMedidaBaseId && document.getElementById('productoUnidadBase')) {
        document.getElementById('productoUnidadBase').value = producto.unidadMedidaBaseId;
    }
}

// Ocultar formulario de producto
function hideProductoForm() {
    const form = document.getElementById('productoForm');
    if (form) form.style.display = 'none';
    currentProductoId = null;
}

// Manejar envío del formulario de producto
async function handleProductoSubmit(e) {
    e.preventDefault();

    const productoData = {
        Codigo: document.getElementById('productoCodigo').value.trim(),
        Nombre: document.getElementById('productoNombre').value.trim(),
        Descripcion: document.getElementById('productoDescripcion').value.trim(),
        CategoriaId: document.getElementById('productoCategoria').value ? parseInt(document.getElementById('productoCategoria').value) : null,
        UnidadMedidaBaseId: parseInt(document.getElementById('productoUnidadBase').value),
        StockMinimo: parseFloat(document.getElementById('productoStockMinimo').value) || 0,
        MargenGanancia: parseFloat(document.getElementById('productoMargen').value) || 30
    };

    // Validaciones
    if (!productoData.Codigo) {
        showMessage('El código del producto es obligatorio', 'error');
        return;
    }

    if (!productoData.Nombre) {
        showMessage('El nombre del producto es obligatorio', 'error');
        return;
    }

    if (!productoData.UnidadMedidaBaseId) {
        showMessage('La unidad de medida es obligatoria', 'error');
        return;
    }

    // Verificar código duplicado
    const productoExistente = await verificarCodigoProductoExistente(productoData.Codigo, currentProductoId);
    if (productoExistente) {
        showMessage('Ya existe un producto con este código', 'error');
        document.getElementById('productoCodigo').focus();
        return;
    }

    try {
        const submitBtn = document.querySelector('#productoFormElement button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Guardando...';

        let response;
        const url = currentProductoId
            ? `https://localhost:7000/api/productos/${currentProductoId}`
            : 'https://localhost:7000/api/productos';

        const method = currentProductoId ? 'PUT' : 'POST';

        response = await apiCall(url, {
            method: method,
            body: JSON.stringify(productoData)
        });

        showMessage('Producto guardado exitosamente', 'success');
        hideProductoForm();
        loadProductos();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar producto', 'error');
    } finally {
        const submitBtn = document.querySelector('#productoFormElement button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = currentProductoId ? 'Actualizar Producto' : 'Guardar Producto';
        }
    }
}

// Verificar código de producto existente
async function verificarCodigoProductoExistente(codigo, excludeId = null) {
    try {
        const productos = await apiCall('https://localhost:7000/api/productos');
        return productos.find(p =>
            p.codigo === codigo &&
            p.id !== excludeId
        );
    } catch (error) {
        console.error('Error verificando código:', error);
        return null;
    }
}

// Cargar productos
async function loadProductos() {
    try {
        productos = await apiCall('https://localhost:7000/api/productos');
        renderProductosTable();
        updateProductosVentaSelect();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showMessage('Error al cargar productos', 'error');
    }
}

// Renderizar tabla de productos
function renderProductosTable() {
    const tbody = document.getElementById('productosTableBody');
    if (!tbody) return;

    if (!productos || productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 20px; color: #6c757d;">
                    <i class="fas fa-boxes" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No hay productos registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productos.map(producto => `
        <tr>
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>${producto.descripcion || '-'}</td>
            <td>${producto.categoria?.nombre || 'Sin categoría'}</td>
            <td>${producto.unidadMedidaBase?.abreviatura || '-'}</td>
            <td>
                <span class="stock-badge ${getStockStatusClass(producto)}">
                    ${producto.stockActual}
                </span>
            </td>
            <td>${formatCurrency(producto.precioVenta)}</td>
            <td>
                <span class="badge ${producto.estado ? 'badge-success' : 'badge-danger'}">
                    ${producto.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showProductoForm(${JSON.stringify(producto).replace(/"/g, '&quot;')})" 
                        title="Editar producto">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${producto.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${producto.estado ? 'desactivarProducto' : 'activarProducto'}(${producto.id})"
                        title="${producto.estado ? 'Desactivar producto' : 'Activar producto'}">
                    <i class="fas ${producto.estado ? 'fa-trash' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Determinar clase de estado de stock
function getStockStatusClass(producto) {
    if (producto.stockActual === 0) {
        return 'stock-critical';
    } else if (producto.stockActual <= producto.stockMinimo) {
        return 'stock-low';
    } else {
        return 'stock-normal';
    }
}

// Desactivar producto
async function desactivarProducto(id) {
    if (!confirm('¿Está seguro de desactivar este producto?')) return;

    try {
        await apiCall(`https://localhost:7000/api/productos/${id}`, {
            method: 'DELETE'
        });

        showMessage('Producto desactivado exitosamente', 'success');
        loadProductos();
    } catch (error) {
        showMessage(error.message || 'Error al desactivar producto', 'error');
    }
}

// Activar producto
async function activarProducto(id) {
    if (!confirm('¿Está seguro de activar este producto?')) return;

    try {
        await apiCall(`https://localhost:7000/api/productos/${id}/activate`, {
            method: 'PUT'
        });

        showMessage('Producto activado exitosamente', 'success');
        loadProductos();
    } catch (error) {
        showMessage(error.message || 'Error al activar producto', 'error');
    }
}

// Actualizar select de productos en ventas
function updateProductosVentaSelect() {
    const selectProducto = document.getElementById('ventaProducto');
    if (selectProducto && productos) {
        const productosActivos = productos.filter(p => p.estado && p.stockActual > 0);
        populateSelect(selectProducto, productosActivos, 'id', 'nombre', 'Seleccionar producto');
    }
}

// ==================== CATEGORÍAS ====================

// Mostrar formulario de categorías
function showCategoriaForm(categoria = null) {
    openManagementTab('productos');

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
            resetCategoriaForm();
        }
        form.style.display = 'block';
    }
}

function resetCategoriaForm() {
    const form = document.getElementById('categoriaFormElement');
    if (form) form.reset();
}

// Llenar formulario de categoría
function fillCategoriaForm(categoria) {
    document.getElementById('categoriaId').value = categoria.id;
    document.getElementById('categoriaNombre').value = categoria.nombre || '';
    document.getElementById('categoriaDescripcion').value = categoria.descripcion || '';
}

// Ocultar formulario de categoría
function hideCategoriaForm() {
    const form = document.getElementById('categoriaForm');
    if (form) form.style.display = 'none';
    currentCategoriaId = null;
}

// Manejar envío del formulario de categoría
async function handleCategoriaSubmit(e) {
    e.preventDefault();

    const categoriaData = {
        Nombre: document.getElementById('categoriaNombre').value.trim(),
        Descripcion: document.getElementById('categoriaDescripcion').value.trim()
    };

    // Validaciones
    if (!categoriaData.Nombre) {
        showMessage('El nombre de la categoría es obligatorio', 'error');
        return;
    }

    try {
        const submitBtn = document.querySelector('#categoriaFormElement button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Guardando...';

        let response;
        const url = currentCategoriaId
            ? `https://localhost:7000/api/categorias/${currentCategoriaId}`
            : 'https://localhost:7000/api/categorias';

        const method = currentCategoriaId ? 'PUT' : 'POST';

        response = await apiCall(url, {
            method: method,
            body: JSON.stringify(categoriaData)
        });

        showMessage('Categoría guardada exitosamente', 'success');
        hideCategoriaForm();
        loadCategorias();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar categoría', 'error');
    } finally {
        const submitBtn = document.querySelector('#categoriaFormElement button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = currentCategoriaId ? 'Actualizar Categoría' : 'Guardar Categoría';
        }
    }
}

// Cargar categorías
async function loadCategorias() {
    try {
        categorias = await apiCall('https://localhost:7000/api/categorias');
        updateCategoriasSelect();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showMessage('Error al cargar categorías', 'error');
    }
}

// Actualizar select de categorías en productos
function updateCategoriasSelect() {
    const selectCategoria = document.getElementById('productoCategoria');
    if (selectCategoria && categorias) {
        const categoriasActivas = categorias.filter(c => c.estado);
        populateSelect(selectCategoria, categoriasActivas, 'id', 'nombre', 'Seleccionar categoría');
    }
}

// Desactivar categoría
async function desactivarCategoria(id) {
    if (!confirm('¿Está seguro de desactivar esta categoría?')) return;

    try {
        await apiCall(`https://localhost:7000/api/categorias/${id}`, {
            method: 'DELETE'
        });

        showMessage('Categoría desactivada exitosamente', 'success');
        loadCategorias();
    } catch (error) {
        showMessage(error.message || 'Error al desactivar categoría', 'error');
    }
}

// Renderizar tabla de categorías
function renderCategoriasTable() {
    const tbody = document.getElementById('categoriasTableBody');
    if (!tbody) return;

    if (!categorias || categorias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center" style="padding: 20px; color: #6c757d;">
                    No hay categorías registradas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = categorias.map(categoria => `
        <tr>
            <td>${categoria.nombre}</td>
            <td>${categoria.descripcion || '-'}</td>
            <td>
                <span class="badge ${categoria.estado ? 'badge-success' : 'badge-danger'}">
                    ${categoria.estado ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showCategoriaForm(${JSON.stringify(categoria).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="desactivarCategoria(${categoria.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}