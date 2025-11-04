// ELEMENTOS DEL DOM
const loginForm = document.getElementById('loginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const successView = document.getElementById('successView');
const dashboard = document.getElementById('dashboard');
const userRegistrationForm = document.getElementById('userRegistrationForm');
const showForgotPasswordLink = document.getElementById('showForgotPassword');
const backToLoginLink = document.getElementById('backToLogin');
const backToLoginSuccessBtn = document.getElementById('backToLoginSuccess');
const messageDiv = document.getElementById('message');
const sentEmailSpan = document.getElementById('sentEmail');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const recoveryEmailInput = document.getElementById('recoveryEmail');
const emailGroup = document.getElementById('emailGroup');
const passwordGroup = document.getElementById('passwordGroup');
const recoveryEmailGroup = document.getElementById('recoveryEmailGroup');

// Variables globales
let currentSection = 'welcome';
let proveedores = [];
let ventas = [];
let productos = [];
let categorias = [];
let compras = [];
let unidadesMedida = [];
let detallesVenta = [];
let detallesCompra = [];
let currentProveedorId = null;
let currentProductoId = null;
let currentCategoriaId = null;
let currentUnidadId = null;
let currentVentaId = null;

// Configura validaciones en tiempo real para email y contraseña
function setupValidation() {
    if (emailInput) {
        emailInput.addEventListener('input', () => validateEmailField(emailInput, emailGroup));
        emailInput.addEventListener('blur', () => validateEmailField(emailInput, emailGroup));
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', () => validatePasswordField(passwordInput, passwordGroup));
        passwordInput.addEventListener('blur', () => validatePasswordField(passwordInput, passwordGroup));
    }
    if (recoveryEmailInput) {
        recoveryEmailInput.addEventListener('input', () => validateEmailField(recoveryEmailInput, recoveryEmailGroup));
        recoveryEmailInput.addEventListener('blur', () => validateEmailField(recoveryEmailInput, recoveryEmailGroup));
    }
}

// Validación del campo email
function validateEmailField(input, group) {
    if (!group) return;
    if (input.value === '') {
        group.classList.remove('valid', 'invalid');
        return;
    }
    if (validateEmail(input.value)) {
        group.classList.add('valid');
        group.classList.remove('invalid');
    } else {
        group.classList.remove('valid');
        group.classList.add('invalid');
    }
}

// Validación del campo contraseña
function validatePasswordField(input, group) {
    if (!group) return;
    if (input.value === '') {
        group.classList.remove('valid', 'invalid');
        return;
    }
    if (validatePassword(input.value)) {
        group.classList.add('valid');
        group.classList.remove('invalid');
    } else {
        group.classList.remove('valid');
        group.classList.add('invalid');
    }
}

// Validación de email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(email) && email.includes('.');
}

// Longitud mínima de contraseña
function validatePassword(password) {
    return password.length >= 8;
}

// Cuando carga la página, revisa si ya hay sesión guardada en localStorage
document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (authToken && user) showDashboard(user);
    setupValidation();
    setupPasswordValidation();
});

// Oculta todos los formularios principales
function hideAllForms() {
    if (loginForm) loginForm.classList.add('hidden');
    if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
    if (successView) successView.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
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

// Maneja el inicio de sesión de usuario
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        const loginBtn = document.getElementById('loginBtn');

        // Validaciones previas
        if (!validateEmail(email)) {
            showMessage('Por favor ingresa un email válido', 'error');
            if (emailGroup) emailGroup.classList.add('invalid');
            return;
        }
        if (!validatePassword(password)) {
            showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
            if (passwordGroup) passwordGroup.classList.add('invalid');
            return;
        }

        // Deshabilitar botón mientras se hace la petición
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="loading"></span> Iniciando sesión...';
        }

        try {
            const response = await fetch('https://localhost:7000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: email, password })
            });
            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, 'success');
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showDashboard(data.user);
            } else {
                showMessage(data.message || 'Credenciales incorrectas', 'error');
            }
        } catch (err) {
            showMessage('Error de conexión. Intenta nuevamente.', 'error');
            console.error('Login error:', err);
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Iniciar Sesión';
            }
        }
    });
}

// Manejo de vistas del formulario de recuperación de contraseña
if (showForgotPasswordLink) {
    showForgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        if (forgotPasswordForm) forgotPasswordForm.classList.remove('hidden');
        clearMessage();
    });
}
if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        if (loginForm) loginForm.classList.remove('hidden');
        clearMessage();
    });
}
if (backToLoginSuccessBtn) {
    backToLoginSuccessBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        if (loginForm) loginForm.classList.remove('hidden');
        clearMessage();
    });
}

// Envío de solicitud de recuperación
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = recoveryEmailInput ? recoveryEmailInput.value.trim() : '';
        const recoveryBtn = document.getElementById('recoveryBtn');

        // Validar email
        if (!validateEmail(email)) {
            showMessage('Por favor ingresa un email válido', 'error');
            if (recoveryEmailGroup) recoveryEmailGroup.classList.add('invalid');
            return;
        }

        // Deshabilitar botón durante petición
        if (recoveryBtn) {
            recoveryBtn.disabled = true;
            recoveryBtn.innerHTML = '<span class="loading"></span> Enviando...';
        }

        try {
            const response = await fetch('https://localhost:7000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (response.ok) {
                hideAllForms();
                if (successView) successView.style.display = 'block';
                if (sentEmailSpan) sentEmailSpan.textContent = email;
            } else {
                showMessage(data.message || 'Error al enviar el correo.', 'error');
            }
        } catch (err) {
            showMessage('Error de conexión. Intenta nuevamente.', 'error');
            console.error('Recovery error:', err);
        } finally {
            if (recoveryBtn) {
                recoveryBtn.disabled = false;
                recoveryBtn.textContent = 'Enviar Instrucciones';
            }
        }
    });
}

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

    // AGREGAR BOTÓN DE TOGGLE AL SIDEBAR EXISTENTE
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !document.querySelector('.toggle-sidebar-btn')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-sidebar-btn';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        toggleBtn.onclick = toggleSidebar;
        sidebar.appendChild(toggleBtn);
    }

    // Mostrar vista de bienvenida
    showWelcomeView();

    // Configurar event listeners para gestión
    setTimeout(setupManagementEventListeners, 100);
}

// Cierra sesión
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    if (loginForm) loginForm.reset();
    if (forgotPasswordForm) forgotPasswordForm.reset();
    hideAllForms();
    if (loginForm) loginForm.classList.remove('hidden');
    showMessage('Sesión cerrada correctamente', 'success');
}

// Obtener y mostrar lista de usuarios
async function viewUsers() {
    hideAllContentSections();
    currentSection = 'users';

    const viewContainer = document.getElementById('viewUsersContainer');
    if (viewContainer) viewContainer.style.display = 'block';

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/auth/users', {
            method: 'GET',
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            showMessage('Error al cargar los usuarios', 'error');
        }
    } catch (err) {
        console.error('viewUsers error:', err);
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
    }
}

// Limpiar formulario de registro de usuario
function clearRegistrationForm() {
    document.getElementById('adminRegNombre').value = '';
    document.getElementById('adminRegUsuario').value = '';
    document.getElementById('adminRegEmail').value = '';
    document.getElementById('adminRegRol').value = '';
    document.getElementById('adminRegPassword').value = '';
    document.getElementById('adminConfirmPassword').value = '';

    const strengthBar = document.getElementById('adminPasswordStrengthBar');
    if (strengthBar) {
        strengthBar.style.width = '0';
        strengthBar.style.backgroundColor = '#e74c3c';
    }

    const matchElement = document.getElementById('adminPasswordMatch');
    const matchSuccessElement = document.getElementById('adminPasswordMatchSuccess');
    if (matchElement) matchElement.style.display = 'none';
    if (matchSuccessElement) matchSuccessElement.style.display = 'none';
}

// Renderizar tabla de usuarios
function displayUsers(users) {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = '<p>No hay usuarios registrados.</p>';
        return;
    }

    let tableHTML = `
        <div class="table-responsive">
            <table class="db-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    users.forEach(u => {
        const id = u.id || u.Id;
        const nombre = u.nombre || u.Nombre;
        const usuario = u.usuario || u.Usuario;
        const email = u.email || u.Email;
        const rol = u.rol || u.Rol;
        const activo = u.activo ?? u.Activo ?? true;

        tableHTML += `
            <tr>
                <td>${id}</td>
                <td>${nombre}</td>
                <td>${usuario}</td>
                <td>${email}</td>
                <td>${rol}</td>
                <td><span class="badge ${activo ? 'badge-success' : 'badge-danger'}">${activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="db-btn db-view" onclick="editUser(${id})">Editar</button>
                    <button class="db-btn db-clear" onclick="deleteUser(${id})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;
}

// Botones de acciones de usuario
function editUser(id) { showMessage('Función de edición de usuario en desarrollo', 'info'); }
function deleteUser(id) { if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) showMessage('Función de eliminación de usuario en desarrollo', 'info'); }

// Registrar usuario por parte del administrador
async function registerUserByAdmin() {
    const nombre = document.getElementById('adminRegNombre')?.value || '';
    const usuario = document.getElementById('adminRegUsuario')?.value || '';
    const email = document.getElementById('adminRegEmail')?.value || '';
    const rol = document.getElementById('adminRegRol')?.value || '';
    const password = document.getElementById('adminRegPassword')?.value || '';
    const confirmPassword = document.getElementById('adminConfirmPassword')?.value || '';
    const registerBtn = document.getElementById('adminRegisterBtn');

    if (!registerBtn) return;

    if (!nombre || !usuario || !email || !rol || !password || !confirmPassword) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    if (!validateEmail(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }
    if (!validatePassword(password)) {
        showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="loading"></span> Registrando...';

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                Nombre: nombre,
                Usuario: usuario,
                Email: email,
                Password: password,
                Rol: rol
            })
        });

        if (response.ok) {
            const data = await response.json();
            showMessage('Usuario registrado correctamente', 'success');
            clearRegistrationForm();
            await viewUsers();
        } else {
            const errorText = await response.text();
            let errorMessage = 'Error al registrar el usuario';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            showMessage(errorMessage, 'error');
        }
    } catch (err) {
        console.error('registerUserByAdmin error:', err);
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Registrar Usuario';
    }
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
            }
        } else {
            console.error('No se encontró la pestaña:', `tab-${tabName}`);
        }
    } else {
        console.error('No se encontró el contenedor de pestañas de gestión');
    }
}

function closeManagementTabs() {
    const managementTabs = document.getElementById('managementTabs');
    if (managementTabs) managementTabs.style.display = 'none';
    showWelcomeView();
}

// Configurar event listeners para gestión
function setupManagementEventListeners() {
    console.log('Configurando event listeners de gestión...');

    // Formulario de proveedores
    const proveedorForm = document.getElementById('proveedorFormElement');
    if (proveedorForm) {
        proveedorForm.addEventListener('submit', handleProveedorSubmit);
        console.log('Event listener agregado para proveedorForm');
    } else {
        console.error('No se encontró proveedorFormElement');
    }

    // Formulario de productos
    const productoForm = document.getElementById('productoFormElement');
    if (productoForm) {
        productoForm.addEventListener('submit', handleProductoSubmit);
        console.log('Event listener agregado para productoForm');
    } else {
        console.error('No se encontró productoFormElement');
    }

    // Formulario de compras
    const compraForm = document.getElementById('compraFormElement');
    if (compraForm) {
        compraForm.addEventListener('submit', handleCompraSubmit);
        console.log('Event listener agregado para compraForm');
    } else {
        console.error('No se encontró compraFormElement');
    }

    // Eventos para detalles de compra
    const detalleCantidad = document.getElementById('detalleCantidad');
    const detallePrecio = document.getElementById('detallePrecio');
    const compraImpuestos = document.getElementById('compraImpuestos');

    if (detalleCantidad) {
        detalleCantidad.addEventListener('input', calcularTotalLinea);
        console.log('Event listener agregado para detalleCantidad');
    }
    if (detallePrecio) {
        detallePrecio.addEventListener('input', calcularTotalLinea);
        console.log('Event listener agregado para detallePrecio');
    }
    if (compraImpuestos) {
        compraImpuestos.addEventListener('input', calcularTotalesCompra);
        console.log('Event listener agregado para compraImpuestos');
    }
}

function showProveedorForm(proveedor = null) {
    console.log('Mostrando formulario de proveedor');
    openManagementTab('proveedores');
    const form = document.getElementById('proveedorForm');
    const title = document.getElementById('proveedorFormTitle');

    if (form) {
        if (proveedor) {
            title.textContent = 'Editar Proveedor';
            currentProveedorId = proveedor.id;
            fillProveedorForm(proveedor);
        } else {
            title.textContent = 'Nuevo Proveedor';
            currentProveedorId = null;
            const proveedorFormElement = document.getElementById('proveedorFormElement');
            if (proveedorFormElement) proveedorFormElement.reset();
        }
        form.style.display = 'block';
    } else {
        console.error('No se encontró el formulario de proveedor');
    }
}

function hideProveedorForm() {
    const form = document.getElementById('proveedorForm');
    if (form) form.style.display = 'none';
    currentProveedorId = null;
}

function fillProveedorForm(proveedor) {
    document.getElementById('proveedorId').value = proveedor.id;
    document.getElementById('proveedorNombre').value = proveedor.nombre;
    document.getElementById('proveedorRUC').value = proveedor.ruc;
    document.getElementById('proveedorTelefono').value = proveedor.telefono || '';
    document.getElementById('proveedorEmail').value = proveedor.email || '';
    document.getElementById('proveedorDireccion').value = proveedor.direccion || '';
    document.getElementById('proveedorContacto').value = proveedor.contacto || '';
}

async function handleProveedorSubmit(e) {
    e.preventDefault();
    console.log('Enviando formulario de proveedor');

    const proveedor = {
        nombre: document.getElementById('proveedorNombre').value,
        ruc: document.getElementById('proveedorRUC').value,
        telefono: document.getElementById('proveedorTelefono').value,
        email: document.getElementById('proveedorEmail').value,
        direccion: document.getElementById('proveedorDireccion').value,
        contacto: document.getElementById('proveedorContacto').value
    };

    try {
        let response;
        if (currentProveedorId) {
            proveedor.id = currentProveedorId;
            response = await fetch(`/api/proveedores/${currentProveedorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proveedor)
            });
        } else {
            response = await fetch('/api/productos/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proveedor)
            });
        }

        if (response.ok) {
            showMessage('Proveedor guardado exitosamente', 'success');
            hideProveedorForm();
            loadProveedores();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar el proveedor', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function loadProveedores() {
    try {
        console.log('Cargando proveedores...');
        // Simular datos de prueba
        proveedores = [
            { id: 1, nombre: 'Proveedor 1', ruc: '12345678901', telefono: '123-456-7890', email: 'proveedor1@ejemplo.com', direccion: 'Dirección 1', contacto: 'Contacto 1' },
            { id: 2, nombre: 'Proveedor 2', ruc: '12345678902', telefono: '123-456-7891', email: 'proveedor2@ejemplo.com', direccion: 'Dirección 2', contacto: 'Contacto 2' }
        ];
        renderProveedoresTable();
    } catch (error) {
        showMessage('Error al cargar proveedores', 'error');
    }
}

function renderProveedoresTable() {
    const tbody = document.getElementById('proveedoresTableBody');
    if (!tbody) {
        console.error('No se encontró proveedoresTableBody');
        return;
    }

    tbody.innerHTML = proveedores.map(proveedor => `
        <tr>
            <td>${proveedor.nombre}</td>
            <td>${proveedor.ruc}</td>
            <td>${proveedor.telefono || '-'}</td>
            <td>${proveedor.email || '-'}</td>
            <td>${proveedor.contacto || '-'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="showProveedorForm(${JSON.stringify(proveedor).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProveedor(${proveedor.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function deleteProveedor(id) {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;

    try {
        const response = await fetch(`/api/proveedores/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Proveedor eliminado exitosamente', 'success');
            loadProveedores();
        } else {
            showMessage('Error al eliminar el proveedor', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

function showProductoForm(producto = null) {
    console.log('Mostrando formulario de producto');
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
            const productoFormElement = document.getElementById('productoFormElement');
            if (productoFormElement) productoFormElement.reset();
        }
        form.style.display = 'block';
    } else {
        console.error('No se encontró el formulario de producto');
    }
}

function hideProductoForm() {
    const form = document.getElementById('productoForm');
    if (form) form.style.display = 'none';
    currentProductoId = null;
}

function fillProductoForm(producto) {
    document.getElementById('productoId').value = producto.id;
    document.getElementById('productoCodigo').value = producto.codigo;
    document.getElementById('productoNombre').value = producto.nombre;
    document.getElementById('productoDescripcion').value = producto.descripcion || '';
    document.getElementById('productoStockMinimo').value = producto.stockMinimo;
    document.getElementById('productoMargen').value = producto.margenGanancia;
}

async function handleProductoSubmit(e) {
    e.preventDefault();
    console.log('Enviando formulario de producto');

    const producto = {
        codigo: document.getElementById('productoCodigo').value,
        nombre: document.getElementById('productoNombre').value,
        descripcion: document.getElementById('productoDescripcion').value,
        categoriaId: document.getElementById('productoCategoria').value || null,
        unidadMedidaBaseId: parseInt(document.getElementById('productoUnidadBase').value),
        stockMinimo: parseFloat(document.getElementById('productoStockMinimo').value) || 0,
        margenGanancia: parseFloat(document.getElementById('productoMargen').value) || 30
    };

    try {
        let response;
        if (currentProductoId) {
            response = await fetch(`/api/productos/${currentProductoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });
        } else {
            response = await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });
        }

        if (response.ok) {
            showMessage('Producto guardado exitosamente', 'success');
            hideProductoForm();
            loadProductos();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar el producto', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function loadProductos() {
    try {
        console.log('Cargando productos...');
        // Simular datos de prueba
        productos = [
            { id: 1, codigo: 'PROD001', nombre: 'Producto 1', categoria: { nombre: 'Categoría 1' }, stockActual: 10, stockMinimo: 5, precioCostoPromedio: 10.50, precioVenta: 15.75 },
            { id: 2, codigo: 'PROD002', nombre: 'Producto 2', categoria: { nombre: 'Categoría 2' }, stockActual: 20, stockMinimo: 10, precioCostoPromedio: 20.00, precioVenta: 30.00 }
        ];
        renderProductosTable();
    } catch (error) {
        showMessage('Error al cargar productos', 'error');
    }
}

function renderProductosTable() {
    const tbody = document.getElementById('productosTableBody');
    if (!tbody) {
        console.error('No se encontró productosTableBody');
        return;
    }

    tbody.innerHTML = productos.map(producto => `
        <tr>
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>${producto.categoria ? producto.categoria.nombre : '-'}</td>
            <td>
                <span class="stock-badge ${getStockStatusClass(producto.stockActual, producto.stockMinimo)}">
                    ${producto.stockActual}
                </span>
            </td>
            <td>$${producto.precioCostoPromedio.toFixed(2)}</td>
            <td>$${producto.precioVenta.toFixed(2)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="showProductoForm(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProducto(${producto.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStockStatusClass(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'stock-critical';
    if (stockActual <= stockMinimo) return 'stock-low';
    return 'stock-normal';
}

function showCompraForm() {
    console.log('Mostrando formulario de compra');
    openManagementTab('compras');
    const form = document.getElementById('compraForm');
    if (form) {
        form.style.display = 'block';
        document.getElementById('compraFecha').value = new Date().toISOString().split('T')[0];
        detallesCompra = [];
        renderDetallesTable();
        calcularTotalesCompra();
    } else {
        console.error('No se encontró el formulario de compra');
    }
}

function hideCompraForm() {
    const form = document.getElementById('compraForm');
    if (form) form.style.display = 'none';
    const compraFormElement = document.getElementById('compraFormElement');
    if (compraFormElement) compraFormElement.reset();
    detallesCompra = [];
}

function agregarDetalle() {
    const productoId = document.getElementById('detalleProducto')?.value;
    const unidadId = document.getElementById('detalleUnidad')?.value;
    const cantidad = parseFloat(document.getElementById('detalleCantidad')?.value) || 0;
    const precio = parseFloat(document.getElementById('detallePrecio')?.value) || 0;

    if (!productoId || !unidadId || cantidad <= 0 || precio <= 0) {
        showMessage('Complete todos los campos del detalle', 'error');
        return;
    }

    const detalle = {
        productoId: parseInt(productoId),
        unidadMedidaId: parseInt(unidadId),
        cantidad: cantidad,
        precioUnitario: precio,
        totalLinea: cantidad * precio
    };

    detallesCompra.push(detalle);
    renderDetallesTable();
    calcularTotalesCompra();

    document.getElementById('detalleCantidad').value = '0';
    document.getElementById('detallePrecio').value = '0';
    document.getElementById('detalleTotal').value = '0';
}

function eliminarDetalle(index) {
    detallesCompra.splice(index, 1);
    renderDetallesTable();
    calcularTotalesCompra();
}

function renderDetallesTable() {
    const tbody = document.getElementById('detallesTableBody');
    if (!tbody) {
        console.error('No se encontró detallesTableBody');
        return;
    }

    tbody.innerHTML = detallesCompra.map((detalle, index) => `
        <tr>
            <td>Producto ${detalle.productoId}</td>
            <td>Unidad ${detalle.unidadMedidaId}</td>
            <td>${detalle.cantidad}</td>
            <td>$${detalle.precioUnitario.toFixed(2)}</td>
            <td>$${detalle.totalLinea.toFixed(2)}</td>
            <td>
                <button class="action-btn delete-btn" onclick="eliminarDetalle(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function calcularTotalLinea() {
    const cantidad = parseFloat(document.getElementById('detalleCantidad')?.value) || 0;
    const precio = parseFloat(document.getElementById('detallePrecio')?.value) || 0;
    const total = cantidad * precio;
    document.getElementById('detalleTotal').value = total.toFixed(2);
}

function calcularTotalesCompra() {
    const subtotal = detallesCompra.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const impuestos = parseFloat(document.getElementById('compraImpuestos')?.value) || 0;
    const total = subtotal + impuestos;

    document.getElementById('compraSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('compraImpuestosTotal').textContent = impuestos.toFixed(2);
    document.getElementById('compraTotal').textContent = total.toFixed(2);
}

async function handleCompraSubmit(e) {
    e.preventDefault();

    if (detallesCompra.length === 0) {
        showMessage('Debe agregar al menos un detalle a la compra', 'error');
        return;
    }

    const compra = {
        numeroFactura: document.getElementById('compraFactura').value,
        proveedorId: parseInt(document.getElementById('compraProveedor').value),
        fechaCompra: document.getElementById('compraFecha').value,
        impuestos: parseFloat(document.getElementById('compraImpuestos').value) || 0,
        observaciones: document.getElementById('compraObservaciones').value,
        usuarioCreacion: JSON.parse(localStorage.getItem('user')).id,
        detalles: detallesCompra.map(d => ({
            productoId: d.productoId,
            unidadMedidaId: d.unidadMedidaId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            totalLinea: d.totalLinea
        }))
    };

    try {
        const response = await fetch('/api/productos/compras', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(compra)
        });

        if (response.ok) {
            showMessage('Compra registrada exitosamente', 'success');
            hideCompraForm();
            loadCompras();
            loadProductos();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al registrar la compra', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

function loadInventario() {
    console.log('Cargando inventario...');
    // Simular datos de inventario
    const totalProductos = productos.length;
    const totalStock = productos.reduce((sum, p) => sum + (p.stockActual || 0), 0);
    const stockBajo = productos.filter(p => p.stockActual <= (p.stockMinimo || 0)).length;
    const valorInventario = productos.reduce((sum, p) => sum + ((p.stockActual || 0) * (p.precioCostoPromedio || 0)), 0);

    document.getElementById('totalProductos').textContent = totalProductos;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('stockBajo').textContent = stockBajo;
    document.getElementById('valorInventario').textContent = `$${valorInventario.toFixed(2)}`;
}

function loadCompras() {
    console.log('Cargando compras...');
}

function deleteProducto(id) {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;
    showMessage('Función de eliminación de producto en desarrollo', 'info');
}

// Funciones para Ventas
function showVentaForm() {
    console.log('Mostrando formulario de venta');
    openManagementTab('ventas');
    const form = document.getElementById('ventaForm');
    if (form) {
        form.style.display = 'block';
        document.getElementById('ventaFecha').value = new Date().toISOString().split('T')[0];
        detallesVenta = [];
        renderVentaDetallesTable();
        calcularTotalesVenta();
        cargarEstadisticasVentas();
        cargarProductosParaVenta();
        cargarUnidadesParaVenta();
    }
}

function hideVentaForm() {
    const form = document.getElementById('ventaForm');
    if (form) form.style.display = 'none';
    const ventaFormElement = document.getElementById('ventaFormElement');
    if (ventaFormElement) ventaFormElement.reset();
    detallesVenta = [];
}

function cargarProductosParaVenta() {
    const select = document.getElementById('ventaDetalleProducto');
    if (!select) return;

    // Simular carga de productos
    select.innerHTML = '<option value="">Seleccionar producto</option>' +
        productos.map(p =>
            `<option value="${p.id}" data-precio="${p.precioVenta}">${p.nombre} - Stock: ${p.stockActual}</option>`
        ).join('');
}

function cargarUnidadesParaVenta() {
    const select = document.getElementById('ventaDetalleUnidad');
    if (!select) return;

    // Simular carga de unidades
    select.innerHTML = '<option value="">Seleccionar unidad</option>' +
        unidadesMedida.map(u =>
            `<option value="${u.id}">${u.nombre} (${u.abreviatura})</option>`
        ).join('');
}

function cargarPrecioProducto() {
    const productoSelect = document.getElementById('ventaDetalleProducto');
    const precioInput = document.getElementById('ventaDetallePrecio');

    if (productoSelect && precioInput) {
        const selectedOption = productoSelect.options[productoSelect.selectedIndex];
        const precio = selectedOption.getAttribute('data-precio');
        if (precio) {
            precioInput.value = parseFloat(precio).toFixed(2);
            calcularTotalLineaVenta();
        }
    }
}

function calcularTotalLineaVenta() {
    const cantidad = parseFloat(document.getElementById('ventaDetalleCantidad')?.value) || 0;
    const precio = parseFloat(document.getElementById('ventaDetallePrecio')?.value) || 0;
    const total = cantidad * precio;
    document.getElementById('ventaDetalleTotal').value = total.toFixed(2);
}

function agregarDetalleVenta() {
    const productoId = document.getElementById('ventaDetalleProducto')?.value;
    const unidadId = document.getElementById('ventaDetalleUnidad')?.value;
    const cantidad = parseFloat(document.getElementById('ventaDetalleCantidad')?.value) || 0;
    const precio = parseFloat(document.getElementById('ventaDetallePrecio')?.value) || 0;

    if (!productoId || !unidadId || cantidad <= 0 || precio <= 0) {
        showMessage('Complete todos los campos del detalle', 'error');
        return;
    }

    const producto = productos.find(p => p.id == productoId);
    const unidad = unidadesMedida.find(u => u.id == unidadId);

    const detalle = {
        productoId: parseInt(productoId),
        unidadMedidaId: parseInt(unidadId),
        cantidad: cantidad,
        precioUnitario: precio,
        totalLinea: cantidad * precio,
        producto: producto,
        unidad: unidad
    };

    detallesVenta.push(detalle);
    renderVentaDetallesTable();
    calcularTotalesVenta();

    // Limpiar campos
    document.getElementById('ventaDetalleCantidad').value = '1';
    document.getElementById('ventaDetallePrecio').value = '0';
    document.getElementById('ventaDetalleTotal').value = '0';
    document.getElementById('ventaDetalleProducto').selectedIndex = 0;
}

function eliminarDetalleVenta(index) {
    detallesVenta.splice(index, 1);
    renderVentaDetallesTable();
    calcularTotalesVenta();
}

function renderVentaDetallesTable() {
    const tbody = document.getElementById('ventaDetallesTableBody');
    if (!tbody) return;

    tbody.innerHTML = detallesVenta.map((detalle, index) => `
        <tr>
            <td>${detalle.producto?.nombre || 'Producto ' + detalle.productoId}</td>
            <td>${detalle.unidad?.nombre || 'Unidad ' + detalle.unidadMedidaId}</td>
            <td>${detalle.cantidad}</td>
            <td>$${detalle.precioUnitario.toFixed(2)}</td>
            <td>$${detalle.totalLinea.toFixed(2)}</td>
            <td>
                <button class="action-btn delete-btn" onclick="eliminarDetalleVenta(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function calcularTotalesVenta() {
    const subtotal = detallesVenta.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const impuestos = parseFloat(document.getElementById('ventaImpuestos')?.value) || 0;
    const total = subtotal + impuestos;

    document.getElementById('ventaSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('ventaImpuestosTotal').textContent = impuestos.toFixed(2);
    document.getElementById('ventaTotal').textContent = total.toFixed(2);
}

async function handleVentaSubmit(e) {
    e.preventDefault();

    if (detallesVenta.length === 0) {
        showMessage('Debe agregar al menos un detalle a la venta', 'error');
        return;
    }

    const venta = {
        numeroFactura: document.getElementById('ventaFactura').value,
        fechaVenta: document.getElementById('ventaFecha').value,
        impuestos: parseFloat(document.getElementById('ventaImpuestos').value) || 0,
        observaciones: document.getElementById('ventaObservaciones').value,
        nombreCliente: document.getElementById('ventaCliente').value,
        usuarioCreacion: JSON.parse(localStorage.getItem('user')).id,
        detalles: detallesVenta.map(d => ({
            productoId: d.productoId,
            unidadMedidaId: d.unidadMedidaId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario
        }))
    };

    try {
        const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venta)
        });

        if (response.ok) {
            const result = await response.json();
            showMessage('Venta registrada exitosamente', 'success');

            // Opción para descargar factura
            if (confirm('¿Desea descargar la factura en PDF?')) {
                descargarFacturaPdf(result.ventaId);
            }

            hideVentaForm();
            cargarVentas();
            cargarEstadisticasVentas();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al registrar la venta', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function cargarVentas() {
    try {
        const response = await fetch('/api/ventas');
        if (response.ok) {
            ventas = await response.json();
            renderVentasTable();
        } else {
            showMessage('Error al cargar las ventas', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

function renderVentasTable() {
    const tbody = document.getElementById('ventasTableBody');
    if (!tbody) return;

    tbody.innerHTML = ventas.map(venta => `
        <tr>
            <td>${venta.numeroFactura}</td>
            <td>${venta.nombreCliente || 'Cliente General'}</td>
            <td>${new Date(venta.fechaVenta).toLocaleDateString()}</td>
            <td>$${venta.subtotal.toFixed(2)}</td>
            <td>$${venta.impuestos.toFixed(2)}</td>
            <td>$${venta.total.toFixed(2)}</td>
            <td>
                <span class="status-badge ${venta.estado === 'COMPLETADA' ? 'normal' : 'warning'}">
                    ${venta.estado}
                </span>
            </td>
            <td>
                <button class="action-btn view-btn" onclick="descargarFacturaPdf(${venta.id})" title="Descargar PDF">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn edit-btn" onclick="verDetalleVenta(${venta.id})" title="Ver Detalle">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function descargarFacturaPdf(ventaId) {
    try {
        const response = await fetch(`/api/ventas/${ventaId}/pdf`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `factura_${ventaId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showMessage('Factura descargada exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al descargar la factura', 'error');
    }
}

async function cargarEstadisticasVentas() {
    try {
        const response = await fetch('/api/ventas/estadisticas');
        if (response.ok) {
            const estadisticas = await response.json();
            document.getElementById('ventasHoy').textContent = estadisticas.ventasHoy || 0;
            document.getElementById('ingresosHoy').textContent = `$${(estadisticas.ingresosHoy || 0).toFixed(2)}`;
            document.getElementById('ventasMes').textContent = estadisticas.ventasMes || 0;
            document.getElementById('ingresosMes').textContent = `$${(estadisticas.ingresosMes || 0).toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Funciones para Reportes
function cambiarTipoReporte() {
    actualizarBotonesReporte();
    // Limpiar resultados al cambiar tipo
    document.getElementById('reporteTableHead').innerHTML = '';
    document.getElementById('reporteTableBody').innerHTML = '';
}

async function cargarReporte() {
    const tipo = document.getElementById('reporteTipo').value;
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;

    try {
        let url = `/api/reportes/${tipo}`;
        const params = new URLSearchParams();

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        if (tipo === 'productos-mas-vendidos') {
            params.append('top', '10');
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const reporte = await response.json();
            renderReporte(tipo, reporte);
        } else {
            showMessage('Error al cargar el reporte', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

// Función mejorada para procesar ventas
async function procesarVenta(ventaData) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(ventaData)
        });

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        } else {
            const error = await response.json();
            return { success: false, error: error.message };
        }
    } catch (error) {
        return { success: false, error: 'Error de conexión' };
    }
}

// Función para calcular totales en tiempo real
function calcularTotalesVentaEnTiempoReal() {
    const detalles = detallesVenta;
    const subtotal = detalles.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const impuestos = parseFloat(document.getElementById('ventaImpuestos')?.value) || 0;
    const total = subtotal + impuestos;

    // Actualizar UI
    if (document.getElementById('ventaSubtotal')) {
        document.getElementById('ventaSubtotal').textContent = subtotal.toFixed(2);
    }
    if (document.getElementById('ventaImpuestosTotal')) {
        document.getElementById('ventaImpuestosTotal').textContent = impuestos.toFixed(2);
    }
    if (document.getElementById('ventaTotal')) {
        document.getElementById('ventaTotal').textContent = total.toFixed(2);
    }

    return { subtotal, impuestos, total };
}
function renderReporte(tipo, datos) {
    const thead = document.getElementById('reporteTableHead');
    const tbody = document.getElementById('reporteTableBody');

    switch (tipo) {
        case 'ventas':
            renderReporteVentas(thead, tbody, datos);
            break;
        case 'inventario':
            renderReporteInventario(thead, tbody, datos);
            break;
        case 'productos-mas-vendidos':
            renderReporteProductosMasVendidos(thead, tbody, datos);
            break;
        case 'movimientos':
            renderReporteMovimientos(thead, tbody, datos);
            break;
        case 'compras':
            renderReporteCompras(thead, tbody, datos);
            break;
    }
}

function renderReporteVentas(thead, tbody, datos) {
    thead.innerHTML = `
        <tr>
            <th>Período</th>
            <th>Total Ventas</th>
            <th>Total Ingresos</th>
            <th>Promedio por Venta</th>
        </tr>
    `;

    tbody.innerHTML = `
        <tr>
            <td>Reporte General</td>
            <td>${datos.totalVentas}</td>
            <td>$${datos.totalIngresos.toFixed(2)}</td>
            <td>$${datos.promedioVenta.toFixed(2)}</td>
        </tr>
    `;
}

function renderReporteInventario(thead, tbody, datos) {
    thead.innerHTML = `
        <tr>
            <th>Métrica</th>
            <th>Valor</th>
        </tr>
    `;

    tbody.innerHTML = `
        <tr>
            <td>Total Productos</td>
            <td>${datos.totalProductos}</td>
        </tr>
        <tr>
            <td>Valor Total Inventario</td>
            <td>$${datos.valorTotalInventario.toFixed(2)}</td>
        </tr>
        <tr>
            <td>Productos con Stock Bajo</td>
            <td>${datos.productosStockBajo}</td>
        </tr>
        <tr>
            <td>Productos sin Stock</td>
            <td>${datos.productosStockCritico}</td>
        </tr>
    `;
}

function renderReporteProductosMasVendidos(thead, tbody, datos) {
    thead.innerHTML = `
        <tr>
            <th>Producto</th>
            <th>Cantidad Vendida</th>
            <th>Total Vendido</th>
        </tr>
    `;

    tbody.innerHTML = datos.map(item => `
        <tr>
            <td>${item.productoNombre}</td>
            <td>${item.cantidadVendida}</td>
            <td>$${item.totalVendido.toFixed(2)}</td>
        </tr>
    `).join('');
}

async function generarReporteVentas() {
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;

    try {
        let url = '/api/reportes/pdf/ventas';
        const params = new URLSearchParams();

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const blob = await response.blob();
            const urlPdf = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = urlPdf;
            a.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlPdf);
            showMessage('Reporte descargado exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al generar el reporte', 'error');
    }
}

// Funciones para descargar reportes adicionales
async function descargarReporteInventarioPdf() {
    try {
        const response = await fetch('/api/reportes/pdf/inventario');
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `reporte_inventario_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showMessage('Reporte de inventario descargado exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al descargar el reporte', 'error');
    }
}

async function descargarReporteComprasPdf() {
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;

    try {
        let url = '/api/reportes/pdf/compras';
        const params = new URLSearchParams();

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const blob = await response.blob();
            const urlPdf = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = urlPdf;
            a.download = `reporte_compras_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlPdf);
            showMessage('Reporte de compras descargado exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al generar el reporte', 'error');
    }
}

// Actualizar la interfaz para incluir botones adicionales
function actualizarBotonesReporte() {
    const tipoReporte = document.getElementById('reporteTipo').value;
    const botonesContainer = document.getElementById('botonesReporteContainer');

    if (!botonesContainer) return;

    let botonesHTML = '';

    if (tipoReporte === 'ventas') {
        botonesHTML = `
            <button class="btn btn-primary" onclick="generarReporteVentas()">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    } else if (tipoReporte === 'inventario') {
        botonesHTML = `
            <button class="btn btn-primary" onclick="descargarReporteInventarioPdf()">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    } else if (tipoReporte === 'compras') {
        botonesHTML = `
            <button class="btn btn-primary" onclick="descargarReporteComprasPdf()">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    } else {
        botonesHTML = `
            <button class="btn btn-primary" onclick="showMessage('Descarga de PDF no disponible para este reporte', 'info')">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    }

    botonesContainer.innerHTML = botonesHTML;
}

// Funciones para Movimientos
function showAjusteForm() {
    console.log('Mostrando formulario de ajuste');
    openManagementTab('movimientos');
    const form = document.getElementById('ajusteForm');
    if (form) {
        form.style.display = 'block';
        cargarProductosParaAjuste();
    }
}

function hideAjusteForm() {
    const form = document.getElementById('ajusteForm');
    if (form) form.style.display = 'none';
    const ajusteFormElement = document.getElementById('ajusteFormElement');
    if (ajusteFormElement) ajusteFormElement.reset();
}

function cargarProductosParaAjuste() {
    const select = document.getElementById('ajusteProducto');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar producto</option>' +
        productos.map(p =>
            `<option value="${p.id}">${p.nombre} - Stock: ${p.stockActual}</option>`
        ).join('');
}

async function handleAjusteSubmit(e) {
    e.preventDefault();

    const ajuste = {
        productoId: parseInt(document.getElementById('ajusteProducto').value),
        cantidad: parseFloat(document.getElementById('ajusteCantidad').value),
        observaciones: document.getElementById('ajusteObservaciones').value,
        usuarioId: JSON.parse(localStorage.getItem('user')).id
    };

    try {
        const response = await fetch('/api/movimientos/ajuste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ajuste)
        });

        if (response.ok) {
            showMessage('Ajuste aplicado exitosamente', 'success');
            hideAjusteForm();
            cargarMovimientos();
            loadProductos(); // Recargar productos para actualizar stock
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al aplicar el ajuste', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function cargarMovimientos() {
    const tipo = document.getElementById('movimientoTipo').value;
    const fechaInicio = document.getElementById('movimientoFechaInicio').value;
    const fechaFin = document.getElementById('movimientoFechaFin').value;

    try {
        let url = '/api/movimientos';
        const params = new URLSearchParams();

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);
        if (tipo) params.append('tipoMovimiento', tipo);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const movimientos = await response.json();
            renderMovimientosTable(movimientos);
        } else {
            showMessage('Error al cargar los movimientos', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

function renderMovimientosTable(movimientos) {
    const tbody = document.getElementById('movimientosTableBody');
    if (!tbody) return;

    tbody.innerHTML = movimientos.map(mov => `
        <tr>
            <td>${new Date(mov.fechaMovimiento).toLocaleString()}</td>
            <td>${mov.producto?.nombre}</td>
            <td>
                <span class="status-badge ${mov.tipoMovimiento === 'ENTRADA' ? 'normal' :
            mov.tipoMovimiento === 'SALIDA' ? 'warning' : 'critical'
        }">
                    ${mov.tipoMovimiento}
                </span>
            </td>
            <td>${mov.cantidad}</td>
            <td>${mov.cantidadAnterior}</td>
            <td>${mov.cantidadNueva}</td>
            <td>${mov.observaciones || '-'}</td>
        </tr>
    `).join('');
}

// Mostrar mensajes en pantalla
function showMessage(text, type) {
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(clearMessage, 5000);
}

// Limpiar mensajes
function clearMessage() {
    if (!messageDiv) return;
    messageDiv.style.display = 'none';
    messageDiv.className = 'message';
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const toggleButton = input.parentNode.querySelector('.toggle-password');
    if (!toggleButton) return;

    const icon = toggleButton.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function toggleRegistrationForm() {
    hideAllContentSections();
    const userForm = document.getElementById('userRegistrationForm');
    if (userForm) userForm.style.display = 'block';
}

function toggleProductRegistrationForm() {
    hideAllContentSections();
    const productForm = document.getElementById('productRegistrationForm');
    if (productForm) productForm.style.display = 'block';
}
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const dashboardContent = document.querySelector('.dashboard-content');
    const toggleBtn = document.getElementById('toggleSidebarBtn');

    if (sidebar && dashboardContent) {
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

// Configurar validación de contraseña
function setupPasswordValidation() {
    const adminPassword = document.getElementById('adminRegPassword');
    const adminConfirmPassword = document.getElementById('adminConfirmPassword');

    if (adminPassword) {
        adminPassword.addEventListener('input', checkAdminPasswordStrength);
        adminPassword.addEventListener('input', checkAdminPasswordMatch);
    }

    if (adminConfirmPassword) {
        adminConfirmPassword.addEventListener('input', checkAdminPasswordMatch);
    }
}

// Función para verificar fortaleza de contraseña
function checkAdminPasswordStrength() {
    const pwd = document.getElementById('adminRegPassword');
    const bar = document.getElementById('adminPasswordStrengthBar');
    if (!pwd || !bar) return;

    const v = pwd.value || '';
    let score = 0;

    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    const pct = Math.round((score / 5) * 100);
    bar.style.width = pct + '%';

    if (pct < 40) {
        bar.style.backgroundColor = '#e74c3c';
    } else if (pct < 80) {
        bar.style.backgroundColor = '#f39c12';
    } else {
        bar.style.backgroundColor = '#2ecc71';
    }
}

// Función para verificar coincidencia de contraseñas
function checkAdminPasswordMatch() {
    const pwd = document.getElementById('adminRegPassword')?.value || '';
    const conf = document.getElementById('adminConfirmPassword')?.value || '';
    const matchEl = document.getElementById('adminPasswordMatchSuccess');
    const noMatchEl = document.getElementById('adminPasswordMatch');

    if (!matchEl && !noMatchEl) return;

    if (pwd === '' && conf === '') {
        if (matchEl) matchEl.style.display = 'none';
        if (noMatchEl) noMatchEl.style.display = 'none';
        return;
    }

    if (pwd === conf && pwd.length >= 8) {
        if (matchEl) matchEl.style.display = 'block';
        if (noMatchEl) noMatchEl.style.display = 'none';
    } else {
        if (matchEl) matchEl.style.display = 'none';
        if (noMatchEl) noMatchEl.style.display = 'block';
    }
}
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

// Funciones para Unidades de Medida
function showUnidadForm(unidad = null) {
    console.log('Mostrando formulario de unidad de medida');
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
            const unidadFormElement = document.getElementById('unidadFormElement');
            if (unidadFormElement) unidadFormElement.reset();
        }
        form.style.display = 'block';
    }
}

function hideUnidadForm() {
    const form = document.getElementById('unidadForm');
    if (form) form.style.display = 'none';
    currentUnidadId = null;
}

function fillUnidadForm(unidad) {
    document.getElementById('unidadId').value = unidad.id;
    document.getElementById('unidadNombre').value = unidad.nombre;
    document.getElementById('unidadAbreviatura').value = unidad.abreviatura;
    document.getElementById('unidadEsBase').checked = unidad.esUnidadBase || false;
    document.getElementById('unidadFactor').value = unidad.factorConversion || 1;
}

async function handleUnidadSubmit(e) {
    e.preventDefault();
    console.log('Enviando formulario de unidad de medida');

    const unidad = {
        nombre: document.getElementById('unidadNombre').value,
        abreviatura: document.getElementById('unidadAbreviatura').value,
        esUnidadBase: document.getElementById('unidadEsBase').checked,
        factorConversion: parseFloat(document.getElementById('unidadFactor').value) || 1
    };

    try {
        let response;
        if (currentUnidadId) {
            unidad.id = currentUnidadId;
            response = await fetch(`/api/unidadesmedida/${currentUnidadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(unidad)
            });
        } else {
            response = await fetch('/api/unidadesmedida', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(unidad)
            });
        }

        if (response.ok) {
            showMessage('Unidad de medida guardada exitosamente', 'success');
            hideUnidadForm();
            loadUnidadesMedida();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar la unidad de medida', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function loadUnidadesMedida() {
    try {
        console.log('Cargando unidades de medida...');
        const response = await fetch('/api/productos/unidades-medida');
        if (response.ok) {
            unidadesMedida = await response.json();
            renderUnidadesTable();
            updateUnidadesSelect();
        } else {
            showMessage('Error al cargar las unidades de medida', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión al cargar unidades de medida', 'error');
    }
}

function renderUnidadesTable() {
    const tbody = document.getElementById('unidadesTableBody');
    if (!tbody) {
        console.error('No se encontró unidadesTableBody');
        return;
    }

    tbody.innerHTML = unidadesMedida.map(unidad => `
        <tr>
            <td>${unidad.nombre}</td>
            <td>${unidad.abreviatura}</td>
            <td>${unidad.esUnidadBase ? 'Sí' : 'No'}</td>
            <td>${unidad.factorConversion}</td>
            <td>
                <button class="action-btn edit-btn" onclick="showUnidadForm(${JSON.stringify(unidad).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteUnidad(${unidad.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateUnidadesSelect() {
    const selectProducto = document.getElementById('productoUnidadBase');
    const selectDetalle = document.getElementById('detalleUnidad');

    if (selectProducto) {
        selectProducto.innerHTML = '<option value="">Seleccionar unidad</option>' +
            unidadesMedida.map(unidad =>
                `<option value="${unidad.id}">${unidad.nombre} (${unidad.abreviatura})</option>`
            ).join('');
    }

    if (selectDetalle) {
        selectDetalle.innerHTML = '<option value="">Seleccionar unidad</option>' +
            unidadesMedida.map(unidad =>
                `<option value="${unidad.id}">${unidad.nombre} (${unidad.abreviatura})</option>`
            ).join('');
    }
}

async function deleteUnidad(id) {
    if (!confirm('¿Está seguro de eliminar esta unidad de medida?')) return;

    try {
        const response = await fetch(`/api/unidadesmedida/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Unidad de medida eliminada exitosamente', 'success');
            loadUnidadesMedida();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

// Actualizar la función setupManagementEventListeners
function setupManagementEventListeners() {
    console.log('Configurando event listeners de gestión...');

    // Formulario de proveedores
    const proveedorForm = document.getElementById('proveedorFormElement');
    if (proveedorForm) {
        proveedorForm.addEventListener('submit', handleProveedorSubmit);
        console.log('Event listener agregado para proveedorForm');
    }

    // Formulario de productos
    const productoForm = document.getElementById('productoFormElement');
    if (productoForm) {
        productoForm.addEventListener('submit', handleProductoSubmit);
        console.log('Event listener agregado para productoForm');
    }

    // Formulario de compras
    const compraForm = document.getElementById('compraFormElement');
    if (compraForm) {
        compraForm.addEventListener('submit', handleCompraSubmit);
        console.log('Event listener agregado para compraForm');
    }

    // Formulario de categorías
    const categoriaForm = document.getElementById('categoriaFormElement');
    if (categoriaForm) {
        categoriaForm.addEventListener('submit', handleCategoriaSubmit);
        console.log('Event listener agregado para categoriaForm');
    }

    // Formulario de unidades de medida
    const unidadForm = document.getElementById('unidadFormElement');
    if (unidadForm) {
        unidadForm.addEventListener('submit', handleUnidadSubmit);
        console.log('Event listener agregado para unidadForm');
    }

    // Formulario de ventas
    const ventaForm = document.getElementById('ventaFormElement');
    if (ventaForm) {
        ventaForm.addEventListener('submit', handleVentaSubmit);
    }

    // Formulario de ajuste
    const ajusteForm = document.getElementById('ajusteFormElement');
    if (ajusteForm) {
        ajusteForm.addEventListener('submit', handleAjusteSubmit);
    }

    // Eventos para detalles de compra
    const detalleCantidad = document.getElementById('detalleCantidad');
    const detallePrecio = document.getElementById('detallePrecio');
    const compraImpuestos = document.getElementById('compraImpuestos');

    if (detalleCantidad) detalleCantidad.addEventListener('input', calcularTotalLinea);
    if (detallePrecio) detallePrecio.addEventListener('input', calcularTotalLinea);
    if (compraImpuestos) compraImpuestos.addEventListener('input', calcularTotalesCompra);

    // Eventos para ventas
    const ventaImpuestos = document.getElementById('ventaImpuestos');
    if (ventaImpuestos) {
        ventaImpuestos.addEventListener('input', calcularTotalesVenta);
    }
}

// Actualizar la función openManagementTab
function openManagementTab(tabName) {
    console.log('Abriendo pestaña:', tabName);

    hideAllContentSections();
    const managementTabs = document.getElementById('managementTabs');

    if (managementTabs) {
        managementTabs.style.display = 'block';

        const tabs = document.querySelectorAll('.management-tab');
        tabs.forEach(tab => {
            tab.style.display = 'none';
        });

        const selectedTab = document.getElementById(`tab-${tabName}`);
        if (selectedTab) {
            selectedTab.style.display = 'block';
            console.log('Pestaña mostrada:', selectedTab.id);

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
                case 'categorias':
                    loadCategorias();
                    break;
                case 'unidades':
                    loadUnidadesMedida();
                    break;
                case 'inventario':
                    loadInventario();
                    break;
                case 'ventas':
                    cargarVentas();
                    cargarEstadisticasVentas();
                    break;
                case 'reportes':
                    // Configurar fecha por defecto para reportes
                    const hoy = new Date();
                    document.getElementById('reporteFechaFin').value = hoy.toISOString().split('T')[0];
                    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                    document.getElementById('reporteFechaInicio').value = inicioMes.toISOString().split('T')[0];
                    actualizarBotonesReporte();
                    break;
                case 'movimientos':
                    // Configurar fecha por defecto para movimientos
                    const hoyMov = new Date();
                    document.getElementById('movimientoFechaFin').value = hoyMov.toISOString().split('T')[0];
                    const inicioSemana = new Date(hoyMov);
                    inicioSemana.setDate(hoyMov.getDate() - 7);
                    document.getElementById('movimientoFechaInicio').value = inicioSemana.toISOString().split('T')[0];
                    cargarMovimientos();
                    break;
            }
        }
    }
}

window.registerUserByAdmin = registerUserByAdmin;
window.clearRegistrationForm = clearRegistrationForm;
window.togglePassword = togglePassword;
window.viewUsers = viewUsers;
window.toggleRegistrationForm = toggleRegistrationForm;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.showWelcomeView = showWelcomeView;
window.checkAdminPasswordStrength = checkAdminPasswordStrength;
window.checkAdminPasswordMatch = checkAdminPasswordMatch;
window.logout = logout;
window.openManagementTab = openManagementTab;
window.closeManagementTabs = closeManagementTabs;
window.showProveedorForm = showProveedorForm;
window.hideProveedorForm = hideProveedorForm;
window.showProductoForm = showProductoForm;
window.hideProductoForm = hideProductoForm;
window.showCompraForm = showCompraForm;
window.hideCompraForm = hideCompraForm;
window.agregarDetalle = agregarDetalle;
window.eliminarDetalle = eliminarDetalle;
window.calcularTotalLinea = calcularTotalLinea;
window.calcularTotalesCompra = calcularTotalesCompra;
window.deleteProveedor = deleteProveedor;
window.deleteProducto = deleteProducto;
window.loadCompras = loadCompras;
window.loadInventario = loadInventario;
window.showCategoriaForm = showCategoriaForm;
window.hideCategoriaForm = hideCategoriaForm;
window.showUnidadForm = showUnidadForm;
window.hideUnidadForm = hideUnidadForm;
window.deleteCategoria = deleteCategoria;
window.deleteUnidad = deleteUnidad;