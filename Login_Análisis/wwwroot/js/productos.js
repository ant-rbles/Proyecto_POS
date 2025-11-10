//Funciones Productos   
function showProductoForm(producto = null) {
    openManagementTab('productos');
    loadProveedores(); 

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
            document.getElementById('productoFormElement').reset();
            document.getElementById('productoStockMinimo').value = '0';
            document.getElementById('productoMargen').value = '30';
        }
        form.style.display = 'block';
    }
}

async function editProducto(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/productos/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const producto = await response.json();
            showProductoForm(producto);
        } else {
            showMessage('Error al cargar el producto', 'error');
        }
    } catch (err) {
        showMessage('Error de conexión', 'error');
    }
}

function hideProductoForm() {
    const form = document.getElementById('productoForm');
    if (form) form.style.display = 'none';
    currentProductoId = null;
}

function fillProductoForm(producto) {
    console.log('Llenando formulario con producto:', producto);

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

async function handleProductoSubmit(e) {
    e.preventDefault();

    try {
        const authToken = localStorage.getItem('authToken');
        const codigo = document.getElementById('productoCodigo').value.trim();

        // Validar código duplicado antes de enviar
        const productoExistente = await verificarCodigoProductoExistente(codigo, currentProductoId);
        if (productoExistente) {
            showMessage('Ya existe un producto con este código. Por favor use un código único.', 'error');
            document.getElementById('productoCodigo').focus();
            return;
        }

        const productData = {
            Codigo: document.getElementById('productoCodigo').value.trim(),
            Nombre: document.getElementById('productoNombre').value.trim(),
            Descripcion: document.getElementById('productoDescripcion').value.trim() || "",
            ProveedorId: document.getElementById('productoProveedor').value ?
                parseInt(document.getElementById('productoProveedor').value) : null, 
            CategoriaId: document.getElementById('productoCategoria').value ?
                parseInt(document.getElementById('productoCategoria').value) : null,
            UnidadMedidaBaseId: parseInt(document.getElementById('productoUnidadBase').value),
            StockMinimo: parseFloat(document.getElementById('productoStockMinimo').value) || 0,
            MargenGanancia: parseFloat(document.getElementById('productoMargen').value) || 30
        };
        console.log('Datos para crear producto:', productData);

        let response;
        if (currentProductoId) {
            response = await fetch(`https://localhost:7000/api/productos/${currentProductoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(productData)
            });
        } else {
            response = await fetch('https://localhost:7000/api/productos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(productData)
            });
        }

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message, 'success');
            hideProductoForm();
            await loadProductos(); // Recargar la lista completa
        } else {
            const errorText = await response.text();
            let errorMessage = 'Error al guardar el producto';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
                if (errorData.errors) {
                    errorMessage += ': ' + errorData.errors.join(', ');
                }
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            showMessage(errorMessage, 'error');
        }

    } catch (error) {
        console.error('Error en handleProductoSubmit:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Función para verificar código duplicado
async function verificarCodigoProductoExistente(codigo, excludeId = null) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/productos/todos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const productos = await response.json();
            return productos.find(p =>
                p.codigo.toLowerCase() === codigo.toLowerCase() &&
                p.id !== excludeId
            );
        }
        return null;
    } catch (error) {
        console.error('Error verificando código:', error);
        return null;
    }
}

// Función para eliminar producto (desactivar)
async function deleteProducto(id) {
    console.log('Intentando desactivar producto ID:', id);

    if (!confirm('¿Está seguro de que desea desactivar este producto? El producto se marcará como inactivo y ya no estará disponible para ventas, pero se mantendrán los registros históricos.')) {
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showMessage('No hay sesión activa. Por favor, inicie sesión nuevamente.', 'error');
            return;
        }

        const response = await fetch(`https://localhost:7000/api/productos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showMessage('Producto desactivado exitosamente', 'success');
            // Recargar la tabla completa para asegurar consistencia
            await loadProductos();
        } else {
            let errorMessage = 'Error al desactivar el producto';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error en deleteProducto:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Función para activar producto
async function activateProducto(id) {
    console.log('Intentando activar producto ID:', id);

    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showMessage('No hay sesión activa. Por favor, inicie sesión nuevamente.', 'error');
            return;
        }

        const response = await fetch(`https://localhost:7000/api/productos/${id}/activate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showMessage('Producto activado exitosamente', 'success');
            // Recargar la tabla completa para asegurar consistencia
            await loadProductos();
        } else {
            let errorMessage = 'Error al activar el producto';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error en activateProducto:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Función principal para cargar productos 
async function loadProductos() {

    if (!proveedores || proveedores.length === 0) {
        try {
            const token = localStorage.getItem('authToken');
            const responseProv = await fetch('https://localhost:7000/api/proveedores', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (responseProv.ok) {
                proveedores = await responseProv.json();
                console.log('Proveedores precargados:', proveedores);
            } else {
                console.warn('No se pudieron cargar los proveedores antes de renderizar productos');
            }
        } catch (err) {
            console.error('Error precargando proveedores:', err);
        }
    }

    try {
        console.log(' INICIANDO CARGA DE TODOS LOS PRODUCTOS ');
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error('No hay token de autenticación');
            showMessage('No hay sesión activa', 'error');
            return;
        }

        const response = await fetch('https://localhost:7000/api/productos/todos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const productosData = await response.json();
            console.log('TODOS los productos recibidos:', productosData);

            // Asignar a variable global
            productos = productosData;

            // Mostrar estadísticas
            const activos = productos.filter(p => p.estado === true).length;
            const inactivos = productos.filter(p => p.estado === false).length;
            console.log(`Productos cargados: ${activos} activos, ${inactivos} inactivos, Total: ${productos.length}`);

            // Renderizar tabla
            renderProductosTable();

            // Actualizar selects en otras secciones (solo productos activos)
            updateProductosSelects();
            updateProductosSelectsVentas();

            if (typeof cargarProductosParaAjuste === "function") {
                cargarProductosParaAjuste();
            }

        } else {
            console.error('Error al cargar productos. Status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            showMessage('Error al cargar los productos', 'error');
        }
    } catch (error) {
        console.error('Error en loadProductos:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }

    const selectProductoProveedor = document.getElementById('productoProveedor');
    if (selectProductoProveedor) {
        console.log("Actualizando <select> de productoProveedor con proveedores cargados...");
        selectProductoProveedor.innerHTML = '<option value="">Seleccionar proveedor</option>';
        proveedores.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id ?? p.Id ?? p.proveedorId ?? '';
            option.textContent = p.nombre ?? p.Nombre ?? 'Proveedor sin nombre';
            selectProductoProveedor.appendChild(option);
        });
    }
}

// 🔹 Cargar productos según el proveedor seleccionado
async function loadProductosPorProveedor(proveedorId) {
    try {
        console.log(`Cargando productos para proveedor ID: ${proveedorId}`);
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
            console.error('No hay token de autenticación');
            showMessage('No hay sesión activa', 'error');
            return;
        }

        const response = await fetch(`https://localhost:7000/api/productos/por-proveedor/${proveedorId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const productosProveedor = await response.json();
            console.log(`Productos recibidos para proveedor ${proveedorId}:`, productosProveedor);

            // Actualizar el select de productos en la sección de Compras
            const selectProducto = document.getElementById('detalleProducto');
            selectProducto.innerHTML = '<option value="">Seleccionar producto</option>';

            productosProveedor.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `${p.nombre} (${p.codigo})`;
                selectProducto.appendChild(option);
            });

        } else {
            console.error('Error al cargar productos del proveedor:', response.status);
            showMessage('No se pudieron cargar los productos del proveedor', 'error');
        }
    } catch (error) {
        console.error('Error en loadProductosPorProveedor:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }

}

// Función para renderizar tabla de productos - VERSIÓN MEJORADA
function renderProductosTable() {
    const tbody = document.getElementById('productosTableBody');
    if (!tbody) {
        console.error('No se encontró el elemento con id "productosTableBody"');
        return;
    }

    console.log('Renderizando tabla de productos...');
    console.log('Productos a renderizar:', productos);

    if (!productos || productos.length === 0) {
        console.log('No hay productos para mostrar');
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay productos disponibles</td></tr>';
        return;
    }

    // Estadísticas antes de renderizar
    const totalProductos = productos.length;
    const productosConEstado = productos.filter(p => p.estado !== undefined);
    const productosSinEstado = productos.filter(p => p.estado === undefined);

    console.log(`Estadísticas: ${totalProductos} total, ${productosConEstado.length} con estado, ${productosSinEstado.length} sin estado`);

    // Generar HTML de la tabla
    const tableHTML = productos.map((producto, index) => {
        const id = producto.id || producto.Id || index;
        const codigo = producto.codigo || producto.Codigo || 'N/A';
        const nombre = producto.nombre || producto.Nombre || 'N/A';

        // Manejo robusto del estado
        let estado;
        if (producto.estado !== undefined) {
            estado = producto.estado;
        } else if (producto.Estado !== undefined) {
            estado = producto.Estado;
        } else {
            // Si no tiene estado, asumimos que está activo
            estado = true;
            console.warn(`Producto ${id} (${nombre}) no tiene estado definido. Se asume activo.`);
        }

        // Proveedor
        let proveedorNombre = 'Sin proveedor';

        if (producto.proveedor) {
            proveedorNombre = producto.proveedor.nombre || producto.proveedor.Nombre || 'Sin proveedor';
        }

        else if (producto.Proveedor) {
            proveedorNombre = producto.Proveedor.nombre || producto.Proveedor.Nombre || 'Sin proveedor';
        }
        else if (producto.proveedorId || producto.ProveedorId) {
            const proveedorId = producto.proveedorId || producto.ProveedorId;

            if (typeof proveedores !== 'undefined' && Array.isArray(proveedores)) {
                const proveedorEncontrado = proveedores.find(p =>
                    p.id === proveedorId || p.Id === proveedorId
                );

                if (proveedorEncontrado) {
                    proveedorNombre = proveedorEncontrado.nombre || proveedorEncontrado.Nombre || 'Sin proveedor';
                } else {
                    proveedorNombre = `Proveedor ID: ${proveedorId}`;
                }
            } else {
                proveedorNombre = `Proveedor ID: ${proveedorId}`;
            }
        }

        // Categoría
        let categoriaNombre = 'Sin categoría';
        if (producto.categoria) {
            categoriaNombre = producto.categoria.nombre || producto.categoria.Nombre || 'Sin categoría';
        } else if (producto.Categoria) {
            categoriaNombre = producto.Categoria.nombre || producto.Categoria.Nombre || 'Sin categoría';
        } else if (producto.categoriaId) {
            categoriaNombre = `Categoría ID: ${producto.categoriaId}`;
        }

        // Unidad de medida
        let unidadNombre = 'N/A';
        if (producto.unidadMedidaBase) {
            unidadNombre = producto.unidadMedidaBase.nombre || producto.unidadMedidaBase.Nombre || 'N/A';
        } else if (producto.UnidadMedidaBase) {
            unidadNombre = producto.UnidadMedidaBase.nombre || producto.UnidadMedidaBase.Nombre || 'N/A';
        } else if (producto.unidadMedidaBaseId) {
            unidadNombre = `Unidad ID: ${producto.unidadMedidaBaseId}`;
        }

        // Valores numéricos con manejo de errores
        const stockActual = parseFloat(producto.stockActual || producto.StockActual || 0);
        const stockMinimo = parseFloat(producto.stockMinimo || producto.StockMinimo || 0);
        const precioCosto = parseFloat(producto.precioCostoPromedio || producto.PrecioCostoPromedio || 0);
        const precioVenta = parseFloat(producto.precioVenta || producto.PrecioVenta || 0);

        console.log(`Renderizando producto ${index + 1}: ${nombre} (ID: ${id}), Estado: ${estado}`);

        return `
        <tr data-producto-id="${id}" data-estado="${estado}">
            <td>${codigo}</td>
            <td>${nombre}</td>
            <td>${proveedorNombre}</td>
            <td>${categoriaNombre}</td>
            <td>${unidadNombre}</td>
            <td class="text-center">
                <span class="stock-badge ${getStockStatusClass(stockActual, stockMinimo)}">
                    ${stockActual.toFixed(2)}
                </span>
            </td>
            <td class="text-right">Q ${precioCosto.toFixed(2)}</td>
            <td class="text-right">Q ${precioVenta.toFixed(2)}</td>
            <td class="text-center">
                <span class="badge ${estado ? 'badge-success' : 'badge-danger'}" id="estado-${id}">
                    ${estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="text-center" style="min-width: 120px;">
    <div style="display: flex; gap: 4px; justify-content: center;">
        <button class="db-btn db-view" onclick="editProducto(${id})" title="Editar">
            <i class="fas fa-edit"></i>
        </button>
        <button class="db-btn ${estado ? 'db-clear' : 'db-view'}" 
                onclick="${estado ? 'deleteProducto' : 'activateProducto'}(${id})"
                title="${estado ? 'Desactivar' : 'Activar'}"
                style="min-width: 40px;">
            <i class="fas ${estado ? 'fa-times' : 'fa-check'}"></i>
        </button>
    </div>
</td>
        `;
    }).join('');

    // Insertar en el DOM
    tbody.innerHTML = tableHTML;
    console.log('Tabla renderizada correctamente. Filas creadas:', productos.length);
}

function getStockStatusClass(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'stock-critical';
    if (stockActual <= stockMinimo) return 'stock-low';
    return 'stock-normal';
}

function updateProductosSelects() {
    console.log('Actualizando select de productos para COMPRAS...');

    try {
        const selectCompra = document.getElementById('detalleProducto');
        if (selectCompra && productos) {
            const productosActivos = productos.filter(p => {
                const estado = p.estado !== undefined ? p.estado : true;
                return estado;
            });

            console.log(`Para compras: ${productosActivos.length} productos activos de ${productos.length} totales`);

            selectCompra.innerHTML = '<option value="">Seleccionar producto</option>' +
                productosActivos.map(p =>
                    `<option value="${p.id}" data-stock="${p.stockActual || 0}">${p.nombre} - Stock: ${p.stockActual || 0}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error en updateProductosSelects:', error);
    }
}

function updateProductosSelectsVentas() {
    console.log('Actualizando select de productos para VENTAS...');

    const select = document.getElementById('ventaProducto');
    if (!select || !productos) return;

    const productosActivos = productos.filter(p => {
        const estado = p.estado !== undefined ? p.estado : true;
        return estado;
    });

    console.log(`Para ventas: ${productosActivos.length} productos activos de ${productos.length} totales`);

    select.innerHTML = '<option value="">Seleccionar producto...</option>' +
        productosActivos.map(p => {
            const precio = p.precioVenta || 0;
            const stock = p.stockActual || 0;
            return `<option value="${p.id}" data-precio="${precio}" data-stock="${stock}">
                ${p.nombre} - Q${precio.toFixed(2)} (Stock: ${stock.toFixed(2)})
            </option>`;
        }).join('');
}

function toggleProductRegistrationForm() {
    hideAllContentSections();
    const productForm = document.getElementById('productRegistrationForm');
    if (productForm) productForm.style.display = 'block';
}

document.getElementById('compraProveedor').addEventListener('change', (e) => {
    const proveedorId = e.target.value;
    if (proveedorId) {
        loadProductosPorProveedor(proveedorId);
    } else {
        // Si se deselecciona, limpiar productos
        const selectProducto = document.getElementById('detalleProducto');
        selectProducto.innerHTML = '<option value="">Seleccionar producto</option>';
    }
});