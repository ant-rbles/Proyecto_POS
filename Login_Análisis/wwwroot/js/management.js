// management.js
// Contiene setupManagementEventListeners y helpers relacionados

function setupManagementEventListeners(userRole) {
    console.log('Configurando event listeners de gestión...');

    // Formulario de proveedores
    const proveedorForm = document.getElementById('proveedorFormElement');
    if (proveedorForm) {
        proveedorForm.removeEventListener('submit', handleProveedorSubmit);
        proveedorForm.addEventListener('submit', handleProveedorSubmit);
    }

    // Formulario de productos
    const productoForm = document.getElementById('productoFormElement');
    if (productoForm) {
        productoForm.removeEventListener('submit', handleProductoSubmit);
        productoForm.addEventListener('submit', handleProductoSubmit);
    }

    // Formulario de compras
    const compraForm = document.getElementById('compraFormElement');
    if (compraForm) {
        compraForm.removeEventListener('submit', handleCompraSubmit);
        compraForm.addEventListener('submit', handleCompraSubmit);
    }

    // Formulario de categorías
    const categoriaForm = document.getElementById('categoriaFormElement');
    if (categoriaForm) {
        categoriaForm.removeEventListener('submit', handleCategoriaSubmit);
        categoriaForm.addEventListener('submit', handleCategoriaSubmit);
    }

    // Formulario de unidades de medida
    const unidadForm = document.getElementById('unidadFormElement');
    if (unidadForm) {
        unidadForm.removeEventListener('submit', handleUnidadSubmit);
        unidadForm.addEventListener('submit', handleUnidadSubmit);
    }

    // Formulario de clientes
    const clienteForm = document.getElementById('clienteFormElement');
    if (clienteForm) {
        clienteForm.removeEventListener('submit', handleClienteSubmit);
        clienteForm.addEventListener('submit', handleClienteSubmit);
    }

    // Formulario de ventas
    const ventaForm = document.getElementById('ventaFormElement');
    if (ventaForm) {
        ventaForm.removeEventListener('submit', handleVentaSubmit);
        ventaForm.addEventListener('submit', handleVentaSubmit);
    }

    // Formulario de movimientos (ajustes de inventario)
    const movimientoForm = document.getElementById('formAjusteInventario');
    if (movimientoForm) {
        movimientoForm.removeEventListener('submit', registrarAjusteInventario);
        movimientoForm.addEventListener('submit', registrarAjusteInventario);
    }

    // Botón de filtrar movimientos
    const btnFiltrarMovimientos = document.getElementById('btnFiltrarMovimientos');
    if (btnFiltrarMovimientos) {
        btnFiltrarMovimientos.removeEventListener('click', filtrarMovimientos);
        btnFiltrarMovimientos.addEventListener('click', filtrarMovimientos);
    }

    // Eventos para detalles de compra
    const detalleCantidad = document.getElementById('detalleCantidad');
    const detallePrecio = document.getElementById('detallePrecio');
    const compraImpuestos = document.getElementById('compraImpuestos');

    if (detalleCantidad) {
        detalleCantidad.removeEventListener('input', calcularTotalLinea);
        detalleCantidad.addEventListener('input', calcularTotalLinea);
    }
    if (detallePrecio) {
        detallePrecio.removeEventListener('input', calcularTotalLinea);
        detallePrecio.addEventListener('input', calcularTotalLinea);
    }
    if (compraImpuestos) {
        compraImpuestos.removeEventListener('input', calcularTotalesCompra);
        compraImpuestos.addEventListener('input', calcularTotalesCompra);
    }

    // Puedes agregar más listeners especial para módulos que necesiten userRole
    // Por ejemplo, controlar botón Nuevo Presupuesto según rol:
    if (typeof aplicarPermisosPresupuestos === 'function') {
        const storedRole = userRole || (JSON.parse(localStorage.getItem('user') || 'null') || {}).rol;
        aplicarPermisosPresupuestos(storedRole);
    }
}
