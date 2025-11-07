// dashboard.js - Navegación y gestión del dashboard

// Variables globales del dashboard
let currentSection = 'welcome';
let proveedores = [];
let clientes = [];
let ventas = [];
let productos = [];
let categorias = [];
let compras = [];
let unidadesMedida = [];

// Inicializar dashboard cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    setupDashboardEventListeners();
});

function setupDashboardEventListeners() {
    // Event listeners del sidebar
    setupSidebarNavigation();

    // Event listeners del user menu
    setupUserMenu();

    // Event listeners globales
    setupGlobalEventListeners();
}

function setupSidebarNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function () {
            // Remover active de todos los items
            sidebarItems.forEach(i => i.classList.remove('active'));
            // Agregar active al item clickeado
            this.classList.add('active');

            // Obtener la sección a mostrar
            const section = this.getAttribute('data-section') || this.textContent.trim().toLowerCase();
            navigateToSection(section);
        });
    });
}

function setupUserMenu() {
    const userMenuBtn = document.querySelector('.user-menu-btn');
    const userMenuContent = document.querySelector('.user-menu-content');

    if (userMenuBtn && userMenuContent) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuContent.style.display = userMenuContent.style.display === 'block' ? 'none' : 'block';
        });

        // Cerrar menu cuando se hace click fuera
        document.addEventListener('click', () => {
            userMenuContent.style.display = 'none';
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function setupGlobalEventListeners() {
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function navigateToSection(section) {
    console.log('Navegando a sección:', section);

    // Ocultar todas las secciones de contenido
    hideAllContentSections();

    switch (section) {
        case 'welcome':
            showWelcomeView();
            break;
        case 'ventas':
            openManagementTab('ventas');
            break;
        case 'productos':
            openManagementTab('productos');
            break;
        case 'clientes':
            openManagementTab('clientes');
            break;
        case 'proveedores':
            openManagementTab('proveedores');
            break;
        case 'compras':
            openManagementTab('compras');
            break;
        case 'inventario':
            openManagementTab('inventario');
            break;
        case 'usuarios':
            if (isAdmin()) {
                viewUsers();
            } else {
                showMessage('No tienes permisos para acceder a esta sección', 'error');
                showWelcomeView();
            }
            break;
        default:
            showWelcomeView();
    }
}

// Mostrar dashboard después de login
function showDashboard(user) {
    hideAllAuthForms();
    if (dashboard) dashboard.style.display = 'block';

    // Actualizar información del usuario en la UI
    updateUserInfo(user);

    // Mostrar vista de bienvenida
    showWelcomeView();

    // Cargar datos iniciales
    loadInitialData();

    // Configurar event listeners para gestión
    setTimeout(setupManagementEventListeners, 100);
}

function updateUserInfo(user) {
    // Actualizar nombre en diferentes lugares
    const userNameElements = document.querySelectorAll('#welcomeName, #userNameNav, #userNameMenu');
    userNameElements.forEach(element => {
        if (element) element.textContent = user.nombre || user.name || 'Usuario';
    });

    // Actualizar email
    const userEmailElement = document.getElementById('userEmailMenu');
    if (userEmailElement) userEmailElement.textContent = user.email;

    // Avatar con iniciales
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        const initials = (user.nombre || user.name || 'Usuario')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
        userAvatar.textContent = initials;
    }

    // Mostrar/ocultar panel de administración según rol
    const databasePanel = document.getElementById('databasePanel');
    if (databasePanel) {
        databasePanel.style.display = isAdmin() ? 'block' : 'none';
    }
}

function showWelcomeView() {
    hideAllContentSections();
    const welcomeCard = document.querySelector('.welcome-card');
    const managementPanel = document.querySelector('.management-panel');

    if (welcomeCard) welcomeCard.style.display = 'block';
    if (managementPanel) managementPanel.style.display = 'block';

    currentSection = 'welcome';
    updateDocumentTitle('Inicio');
}

function hideAllContentSections() {
    const sections = document.querySelectorAll(
        '.content-section, .welcome-card, .user-registration-form, .management-panel, #managementTabs'
    );
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// FUNCIÓN PRINCIPAL PARA ABRIR PESTAÑAS DE GESTIÓN
function openManagementTab(tabName) {
    console.log('Abriendo pestaña:', tabName);

    hideAllContentSections();

    const managementTabs = document.getElementById('managementTabs');
    if (managementTabs) {
        managementTabs.style.display = 'block';

        // Ocultar todas las pestañas y mostrar la seleccionada
        const tabs = document.querySelectorAll('.management-tab');
        tabs.forEach(tab => {
            tab.style.display = 'none';
        });

        const selectedTab = document.getElementById(`tab-${tabName}`);
        if (selectedTab) {
            selectedTab.style.display = 'block';
            console.log('Pestaña mostrada:', selectedTab.id);

            // Cargar datos específicos de la pestaña
            loadTabData(tabName);
            updateDocumentTitle(`Gestión de ${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
        }
    }
}

function loadTabData(tabName) {
    switch (tabName) {
        case 'proveedores':
            loadProveedores();
            break;
        case 'productos':
            loadProductos();
            break;
        case 'compras':
            loadCompras();
            break;
        case 'inventario':
            loadInventario();
            break;
        case 'ventas':
            loadVentas();
            updateProductosVentaSelect();
            updateClientesVentaSelect();
            updateUnidadesMedidaSelect();
            break;
        case 'clientes':
            loadClientes();
            break;
    }
}

function updateDocumentTitle(title) {
    document.title = `${title} - Sistema POS Centro Plástico Leonor`;
}

function closeManagementTabs() {
    const managementTabs = document.getElementById('managementTabs');
    if (managementTabs) managementTabs.style.display = 'none';
    showWelcomeView();
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.remove();
    });
}

// Cargar datos iniciales de la aplicación
async function loadInitialData() {
    try {
        await Promise.all([
            loadUnidadesMedida(),
            loadProveedores(),
            loadCategorias(),
            loadProductos(),
            loadClientes()
        ]);
        showMessage('Sistema cargado correctamente', 'success');
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showMessage('Error cargando algunos datos del sistema', 'warning');
    }
}

// Configurar event listeners para gestión
function setupManagementEventListeners() {
    console.log('Configurando event listeners de gestión...');

    // Formularios principales
    const forms = {
        'proveedorFormElement': handleProveedorSubmit,
        'productoFormElement': handleProductoSubmit,
        'compraFormElement': handleCompraSubmit,
        'clienteFormElement': handleClienteSubmit,
        'ventaFormElement': handleVentaSubmit
    };

    Object.entries(forms).forEach(([formId, handler]) => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', handler);
            console.log(`Event listener agregado para ${formId}`);
        }
    });

    // Eventos para cálculos en tiempo real
    setupRealTimeCalculations();
}

function setupRealTimeCalculations() {
    const detalleCantidad = document.getElementById('detalleCantidad');
    const detallePrecio = document.getElementById('detallePrecio');
    const compraImpuestos = document.getElementById('compraImpuestos');

    if (detalleCantidad) {
        detalleCantidad.addEventListener('input', calcularTotalLinea);
    }
    if (detallePrecio) {
        detallePrecio.addEventListener('input', calcularTotalLinea);
    }
    if (compraImpuestos) {
        compraImpuestos.addEventListener('input', calcularTotalesCompra);
    }
}