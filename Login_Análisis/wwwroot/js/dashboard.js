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

    // Guardar el rol en localStorage para uso posterior
    const userRole = user.rol || user.role;
    localStorage.setItem('userRole', userRole);

    // Configurar interfaz según el rol del usuario
    configurarInterfazPorRol(userRole);

    // Mostrar panel de administración solo para Administrador
    const databasePanel = document.getElementById('databasePanel');
    if (databasePanel) {
        if (userRole === 'Administrador') {
            databasePanel.style.display = 'block';
        } else {
            databasePanel.style.display = 'none';
        }
    }

    // Mostrar vista de bienvenida
    showWelcomeView();

    // Cargar datos iniciales según permisos
    cargarDatosInicialesPorRol(userRole);

    // Configurar event listeners para gestión
    setTimeout(() => setupManagementEventListeners(userRole), 100);
}

function hideAllContentSections() {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Ocultar contenedor de pestañas de gestión
    const managementTabs = document.getElementById('managementTabs');
    if (managementTabs) {
        managementTabs.style.display = 'none';
    }
}

function showWelcomeView() {
    hideAllContentSections();
    const welcome = document.getElementById('welcomeView');
    if (welcome) {
        welcome.style.display = 'block';
    }
}


// Función para configurar la interfaz según el rol
function configurarInterfazPorRol(userRole) {
    console.log('Configurando interfaz para rol:', userRole);

    // Definir elementos visibles por rol
    const elementosPorRol = {
        'Administrador': [
            'usuarios-seccion', 'users-section', 'registrar-user-section',
            'inventario-seccion', 'productos-section', 'categorias-section', 'unidades-section', 'inventario-section',
            'compras-seccion', 'proveedores-section', 'compras-section',
            'ventas-seccion', 'ventas-section', 'clientes-section',
            'reportes-seccion', 'movimientos-section', 'reportes-section'
        ],
        'Cajero': [
            'inventario-seccion', 'inventario-section',
            'ventas-seccion', 'ventas-section',
            'reportes-seccion', 'movimientos-section', 'reportes-section'
        ],
        'Vendedor': [
            'inventario-seccion', 'inventario-section',
            'reportes-seccion', 'movimientos-section', 'reportes-section'
        ]
    };

    // Ocultar todos los elementos del sidebar primero
    const todosLosElementos = [
        'usuarios-seccion', 'users-section', 'registrar-user-section',
        'inventario-seccion', 'productos-section', 'categorias-section', 'unidades-section', 'inventario-section',
        'compras-seccion', 'proveedores-section', 'compras-section',
        'ventas-seccion', 'ventas-section', 'clientes-section',
        'reportes-seccion', 'movimientos-section', 'reportes-section'
    ];

    todosLosElementos.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Mostrar elementos permitidos según el rol
    if (elementosPorRol[userRole]) {
        elementosPorRol[userRole].forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.display = 'block';
            }
        });
    }

    // También configurar las tarjetas del dashboard
    configurarTarjetasDashboard(userRole);

    // Configurar permisos de solo lectura para roles no administradores
    if (userRole !== 'Administrador') {
        configurarModoSoloLectura(userRole);
    }
}

// Función para configurar las tarjetas del dashboard por rol
function configurarTarjetasDashboard(userRole) {
    const tarjetasPorRol = {
        'Administrador': [
            'users-section', 'products-section', 'categorias-section', 'unidades-section',
            'proveedores-section', 'clientes-section', 'compras-section', 'ventas-section',
            'inventario-section', 'movimientos-section', 'reportes-section'
        ],
        'Cajero': [
            'ventas-section', 'inventario-section', 'movimientos-section', 'reportes-section'
        ],
        'Vendedor': [
            'inventario-section', 'movimientos-section', 'reportes-section'
        ]
    };

    // Ocultar todas las tarjetas primero
    const todasLasTarjetas = [
        'users-section', 'products-section', 'categorias-section', 'unidades-section',
        'proveedores-section', 'clientes-section', 'compras-section', 'ventas-section',
        'inventario-section', 'movimientos-section', 'reportes-section'
    ];

    todasLasTarjetas.forEach(cardId => {
        const card = document.getElementById(cardId);
        if (card) {
            card.style.display = 'none';
        }
    });

    // Mostrar tarjetas permitidas
    if (tarjetasPorRol[userRole]) {
        tarjetasPorRol[userRole].forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) {
                card.style.display = 'block';
            }
        });
    }
 } 

// Función para cargar datos iniciales según el rol
function cargarDatosInicialesPorRol(userRole) {
    // Datos que todos los roles necesitan
    loadUnidadesMedida();
    loadProductos();
    loadClientes();

    // Datos específicos por rol
    if (userRole === 'Administrador') {
        loadProveedores();
        loadCategorias();
    }

    if (userRole === 'Cajero' || userRole === 'Administrador') {
        // Datos necesarios para ventas
        loadProveedores();
    }
}

// Función para configurar modo solo lectura
function configurarModoSoloLectura(userRole) {
    console.log('Configurando modo solo lectura para:', userRole);

    // Ocultar botones de acción según el rol
    const accionesOcultas = {
        'Cajero': ['btn-agregar-usuario', 'btn-editar-usuario', 'btn-eliminar-usuario',
            'btn-agregar-producto', 'btn-editar-producto', 'btn-eliminar-producto',
            'btn-agregar-proveedor', 'btn-editar-proveedor', 'btn-eliminar-proveedor',
            'btn-agregar-categoria', 'btn-editar-categoria', 'btn-eliminar-categoria',
            'btn-agregar-unidad', 'btn-editar-unidad', 'btn-eliminar-unidad',
            'btn-crear-compra'],
        'Vendedor': ['btn-agregar-usuario', 'btn-editar-usuario', 'btn-eliminar-usuario',
            'btn-agregar-producto', 'btn-editar-producto', 'btn-eliminar-producto',
            'btn-agregar-proveedor', 'btn-editar-proveedor', 'btn-eliminar-proveedor',
            'btn-agregar-categoria', 'btn-editar-categoria', 'btn-eliminar-categoria',
            'btn-agregar-unidad', 'btn-editar-unidad', 'btn-eliminar-unidad',
            'btn-crear-compra', 'btn-crear-venta', 'btn-registrar-ajuste']
    };

    const accionesAOcultar = accionesOcultas[userRole] || [];

    accionesAOcultar.forEach(btnId => {
        const boton = document.getElementById(btnId);
        if (boton) {
            boton.style.display = 'none';
        }
    });

    // También ocultar botones por clase
    const clasesAOcultar = {
        'Cajero': ['.btn-eliminar', '.btn-editar', '.btn-agregar'],
        'Vendedor': ['.btn-eliminar', '.btn-editar', '.btn-agregar', '.btn-guardar']
    };

    const clases = clasesAOcultar[userRole] || [];
    clases.forEach(clase => {
        const botones = document.querySelectorAll(clase);
        botones.forEach(boton => {
            if (!boton.id || accionesAOcultar.includes(boton.id)) {
                boton.style.display = 'none';
            }
        });
    });
}

// Actualizar la función openManagementTab para verificar permisos
function openManagementTab(tabName) {
    const userRole = localStorage.getItem('userRole');

    // Verificar permisos antes de abrir la pestaña
    if (!tienePermisoParaSeccion(userRole, tabName)) {
        alert('No tiene permisos para acceder a esta sección.');
        return;
    }

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

            // Cargar datos específicos de la pestaña con verificación de permisos
            cargarDatosPestana(tabName, userRole);
        } else {
            console.error('No se encontró la pestaña:', `tab-${tabName}`);
        }
    }
}

// Función para verificar permisos por sección
function tienePermisoParaSeccion(userRole, seccion) {
    const permisos = {
        'Administrador': ['clientes', 'proveedores', 'productos', 'compras', 'inventario', 'ventas', 'categorias', 'unidades', 'reportes', 'movimientos', 'usuarios'],
        'Cajero': ['ventas', 'inventario', 'movimientos', 'reportes'],
        'Vendedor': ['inventario', 'movimientos', 'reportes']
    };

    return permisos[userRole] && permisos[userRole].includes(seccion);
}

// Función para cargar datos de pestaña con verificación de permisos
function cargarDatosPestana(tabName, userRole) {
    switch (tabName) {
        case 'clientes':
            if (userRole === 'Administrador') loadClientes();
            break;
        case 'proveedores':
            if (userRole === 'Administrador') loadProveedores();
            break;
        case 'productos':
            loadProductos(); // Todos pueden ver productos
            break;
        case 'compras':
            if (userRole === 'Administrador') {
                loadCompras();
                cargarCompras();
                loadProductos().then(() => {
                    updateProductosSelects();
                });
            }
            break;
        case 'inventario':
            loadInventario();
            break;
        case 'ventas':
            if (userRole === 'Administrador' || userRole === 'Cajero') {
                cargarVentas();
                cargarEstadisticasVentas();
                loadProductos().then(() => {
                    updateProductosSelects();
                    updateProductosSelectsVentas();
                    cargarUnidadesParaVenta();
                });
            }
            break;
        case 'categorias':
            if (userRole === 'Administrador') loadCategorias();
            break;
        case 'unidades':
            if (userRole === 'Administrador') loadUnidadesMedida();
            break;
        case 'reportes':
            inicializarSeccionReportes();
            break;
        case 'movimientos':
            // Todos los roles pueden ver movimientos, pero con diferentes permisos de acción
            document.getElementById('movimientoFechaInicio').value = "";
            document.getElementById('movimientoFechaFin').value = "";

            loadProductos().then(() => {
                if (userRole === 'Administrador') {
                    cargarProductosParaAjuste();
                }
                cargarProductosFiltro();
                cargarMovimientos();
            });
            break;
        case 'usuarios':
            if (userRole === 'Administrador') {
                // Cargar gestión de usuarios
                cargarUsuarios();
            }
            break;
    }
}

// Actualizar setupManagementEventListeners para considerar roles
function setupManagementEventListeners(userRole) {
    console.log('Configurando event listeners para rol:', userRole);

    // Solo configurar listeners para elementos visibles
    const managementCards = document.querySelectorAll('.management-card');
    managementCards.forEach(card => {
        if (card.style.display !== 'none') {
            card.addEventListener('click', function () {
                const tabName = this.getAttribute('data-tab');
                if (tabName && tienePermisoParaSeccion(userRole, tabName)) {
                    openManagementTab(tabName);
                }
            });
        }
    });

    // Configurar sidebar items
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        if (item.style.display !== 'none') {
            item.addEventListener('click', function () {
                const tabName = this.getAttribute('data-tab');
                if (tabName && tienePermisoParaSeccion(userRole, tabName)) {
                    openManagementTab(tabName);
                }
            });
        }
    });

    console.log('Event listeners configurados para rol:', userRole);
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
