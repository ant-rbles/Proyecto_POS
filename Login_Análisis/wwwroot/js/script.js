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
let productos = [];
let compras = [];
let unidadesMedida = [];
let detallesCompra = [];
let currentProveedorId = null;
let currentProductoId = null;

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