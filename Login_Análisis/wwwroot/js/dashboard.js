// Muestra el dashboard después de login
function showDashboard(user) {
    hideAllForms();
    if (dashboard) dashboard.style.display = 'block';

    // Información básica del usuario
    if (document.getElementById('welcomeName'))
        document.getElementById('welcomeName').textContent = user.nombre || user.name || 'Usuario';
    if (document.getElementById('userNameNav'))
        document.getElementById('userNameNav').textContent = user.nombre || user.name || 'Usuario';
    if (document.getElementById('userNameMenu'))
        document.getElementById('userNameMenu').textContent = user.nombre || user.name || 'Usuario';
    if (document.getElementById('userEmailMenu'))
        document.getElementById('userEmailMenu').textContent = user.email;

    // Avatar con iniciales
    if (document.getElementById('userAvatar')) {
        const initials = (user.nombre || user.name || 'Usuario').split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('userAvatar').textContent = initials;
    }

    // Mostrar panel de administración solo para Administrador
    const databasePanel = document.getElementById('databasePanel');
    if (databasePanel) {
        if (user.rol === 'Administrador' || user.role === 'Administrador') {
            databasePanel.style.display = 'block';
        } else {
            databasePanel.style.display = 'none';
        }
    }

    // Mostrar vista de bienvenida
    showWelcomeView();

    // Cargar datos iniciales
    loadUnidadesMedida();
    loadProveedores();
    loadCategorias();
    loadProductos();
    loadClientes();

    if (user.rol === 'Vendedor' || user.rol === 'Administrador' || user.rol === 'Cajero') {
        // Pre-cargar clientes y productos para presupuestos
        cargarClientesParaPresupuesto();
        cargarProductosParaPresupuesto();
    }

    // Configurar event listeners para gestión y aplicar permisos por rol
    setTimeout(() => setupManagementEventListeners(user.rol || user.role), 100);
    // Aplicar permisos de visibilidad en sidebar y tarjetas
    applyRolePermissions(user.rol || user.role);
}

// Oculta secciones de contenido (tablas, formularios, inicio)
function hideAllContentSections() {
    const sections = document.querySelectorAll('.content-section, .welcome-card, .user-registration-form, .management-panel, #managementTabs');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// Muestra la vista de inicio (tarjeta de bienvenida)
function showWelcomeView() {
    hideAllContentSections();
    const welcomeCard = document.querySelector('.welcome-card');
    const managementPanel = document.querySelector('.management-panel');
    if (welcomeCard) welcomeCard.style.display = 'block';
    if (managementPanel) managementPanel.style.display = 'block';
    currentSection = 'welcome';
}

// FUNCIÓN PRINCIPAL PARA ABRIR PESTAÑAS DE GESTIÓN
function openManagementTab(tabName) {
    console.log('Abriendo pestaña:', tabName);

    // Ocultar todas las secciones de contenido
    hideAllContentSections();

    // Mostrar el contenedor de pestañas de gestión
    const managementTabs = document.getElementById('managementTabs');
    if (managementTabs) {
        managementTabs.style.display = 'block';

        // Ocultar todas las pestañas
        const tabs = document.querySelectorAll('.management-tab');
        tabs.forEach(tab => {
            tab.style.display = 'none';
        });

        // Mostrar la pestaña seleccionada
        const selectedTab = document.getElementById(`tab-${tabName}`);
        if (selectedTab) {
            selectedTab.style.display = 'block';
            console.log('Pestaña mostrada:', selectedTab.id);

            // Cargar datos específicos de la pestaña
            switch (tabName) {
                case 'clientes':
                    loadClientes();
                    break;
                case 'proveedores':
                    console.log('Cargando TODOS los proveedores...');
                    loadProveedores();
                    break;
                case 'productos':
                    console.log('Forzando recarga de productos...');
                    loadProductos();
                    break;
                case 'compras':
                    loadCompras();
                    cargarCompras();
                    loadProductos().then(() => {
                        updateProductosSelects();
                    });
                    break;
                case 'inventario':
                    loadInventario();
                    break;
                case 'ventas':
                    cargarVentas();
                    cargarEstadisticasVentas();
                    loadProductos().then(() => {
                        updateProductosSelects();
                        updateProductosSelectsVentas();
                        cargarUnidadesParaVenta();
                    });
                    break;
                case 'categorias':
                    loadCategorias();
                    break;
                case 'unidades':
                    loadUnidadesMedida();
                    break;
                case 'reportes':
                    inicializarSeccionReportes();
                    break;
                case 'movimientos':
                    // Dejamos las fechas vacías para que se muestren todos
                    document.getElementById('movimientoFechaInicio').value = "";
                    document.getElementById('movimientoFechaFin').value = "";

                    loadProductos().then(() => {
                        cargarProductosParaAjuste();
                        cargarProductosFiltro();
                        cargarMovimientos(); // Esto ahora traerá TODOS
                    });
                    break;
                case 'tarjetas':
                    loadTarjetas();
                    setTimeout(() => initTarjetasModule(), 20);
                    break;
                case 'presupuestos':
                    cargarPresupuestos();
                    break;
            }
        } else {
            console.error('No se encontró la pestaña:', `${tabName}Section`);
        }
    }
}

function closeManagementTabs() {
    const managementTabs = document.getElementById('managementTabs');
    if (managementTabs) managementTabs.style.display = 'none';
    showWelcomeView();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.toggle-sidebar-btn');
    const dashboardContent = document.querySelector('.dashboard-content');

    if (sidebar && dashboardContent && toggleBtn) {
        sidebar.classList.toggle('sidebar-collapsed');

        if (sidebar.classList.contains('sidebar-collapsed')) {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            dashboardContent.style.marginLeft = '60px';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            dashboardContent.style.marginLeft = '250px';
        }
    }
}

function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !document.querySelector('.toggle-sidebar-btn')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-sidebar-btn';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        toggleBtn.onclick = toggleSidebar;
        sidebar.appendChild(toggleBtn);
        console.log('Botón de sidebar agregado');
    }
}

// Aplica permisos de visibilidad en base al rol usando el atributo data-role de los elementos
function applyRolePermissions(userRole) {
    try {
        if (!userRole) return;
        // Sidebar items
        document.querySelectorAll('.sidebar-item').forEach(item => {
            const roles = item.getAttribute('data-role');
            if (!roles) {
                item.style.display = 'block';
                return;
            }
            const allowed = roles.split(',').map(r => r.trim());
            if (allowed.includes(userRole)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });

        // Sidebar sections (headings) - show if any child visible
        document.querySelectorAll('.sidebar-section').forEach(section => {
            // find following siblings until next section or end
            let next = section.nextElementSibling;
            let anyVisible = false;
            while (next && !next.classList.contains('sidebar-section')) {
                if (next.style && next.style.display !== 'none') anyVisible = true;
                next = next.nextElementSibling;
            }
            section.style.display = anyVisible ? 'block' : 'none';
        });

        // Management cards (if present)
        document.querySelectorAll('.management-card').forEach(card => {
            const roles = card.getAttribute('data-role');
            if (!roles) { card.style.display = 'block'; return; }
            const allowed = roles.split(',').map(r => r.trim());
            card.style.display = allowed.includes(userRole) ? 'block' : 'none';
        });
        // ✅ NUEVO: Aplicar permisos específicos para botones en presupuestos
        aplicarPermisosPresupuestos(userRole);
    } catch (e) {
        console.error('applyRolePermissions error:', e);
    }
}

// ✅ NUEVA FUNCIÓN: Aplicar permisos específicos para presupuestos
function aplicarPermisosPresupuestos(userRole) {
    const btnNuevoPresupuesto = document.getElementById('btn-nuevo-presupuesto');

    if (btnNuevoPresupuesto) {
        // Solo vendedores pueden crear nuevos presupuestos
        if (userRole === 'Vendedor') {
            btnNuevoPresupuesto.style.display = 'block';
        } else {
            btnNuevoPresupuesto.style.display = 'none';
        }
    }
}

