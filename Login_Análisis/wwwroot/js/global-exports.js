// =============================================
// GLOBAL EXPORTS — SEGURO Y SIN ERRORES
// =============================================

// Esta función global ayuda a exportar funciones sin romper el sistema
function safeExport(name, fn) {
    if (typeof fn === "function") {
        window[name] = fn;
        console.log("[EXPORTADO]", name);
    } else {
        console.warn("[NO EXPORTADO]", name, "→ no existe en este contexto");
    }
}

// ================================
// EXPORTS DE AUTH.JS
// ================================
safeExport("logout", window.logout);
safeExport("togglePassword", window.togglePassword);

// ================================
// EXPORTS DE DASHBOARD.JS
// ================================
safeExport("showDashboard", window.showDashboard);
safeExport("openManagementTab", window.openManagementTab);
safeExport("closeManagementTabs", window.closeManagementTabs);
safeExport("toggleSidebar", window.toggleSidebar);
safeExport("setupSidebarToggle", window.setupSidebarToggle);

// ================================
// EXPORTS COMUNES EN MÓDULOS
// SOLO SI EXISTEN
// ================================

// Clientes
safeExport("loadClientes", window.loadClientes);
safeExport("guardarCliente", window.guardarCliente);
safeExport("editarCliente", window.editarCliente);
safeExport("actualizarCliente", window.actualizarCliente);

// Productos
safeExport("loadProductos", window.loadProductos);
safeExport("guardarProducto", window.guardarProducto);
safeExport("eliminarProducto", window.eliminarProducto);

// Proveedores
safeExport("loadProveedores", window.loadProveedores);
safeExport("guardarProveedor", window.guardarProveedor);

// Categorías
safeExport("loadCategorias", window.loadCategorias);

// Unidades
safeExport("loadUnidadesMedida", window.loadUnidadesMedida);

// Compras
safeExport("cargarCompras", window.cargarCompras);
safeExport("registrarCompra", window.registrarCompra);

// Ventas
safeExport("cargarVentas", window.cargarVentas);
safeExport("registrarVenta", window.registrarVenta);

// Inventario
safeExport("cargarInventario", window.cargarInventario);

// Movimientos
safeExport("cargarMovimientos", window.cargarMovimientos);

// Reportes
safeExport("cargarReporteVentas", window.cargarReporteVentas);

// Presupuestos
safeExport("cargarPresupuestos", window.cargarPresupuestos);
safeExport("crearPresupuesto", window.crearPresupuesto);

// FIN
console.log("✔ global-exports.js cargado correctamente.");
