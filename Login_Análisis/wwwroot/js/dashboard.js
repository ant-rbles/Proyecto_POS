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

    // Configurar event listeners para gestión
    setTimeout(setupManagementEventListeners, 100);
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
                    const hoy = new Date();
                    document.getElementById('reporteFechaFin').value = hoy.toISOString().split('T')[0];
                    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                    document.getElementById('reporteFechaInicio').value = inicioMes.toISOString().split('T')[0];
                    actualizarBotonesReporte();
                    break;
                case 'movimientos':
                    const hoyMov = new Date();
                    document.getElementById('movimientoFechaFin').value = hoyMov.toISOString().split('T')[0];
                    const inicioSemana = new Date(hoyMov);
                    inicioSemana.setDate(hoyMov.getDate() - 7);
                    document.getElementById('movimientoFechaInicio').value = inicioSemana.toISOString().split('T')[0];   

                    loadProductos().then(() => {
                        cargarProductosParaAjuste();
                        cargarProductosFiltro();
                        cargarMovimientos();   
                    });
                    break;
            }
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