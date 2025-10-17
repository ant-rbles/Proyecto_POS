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
    if (authToken && user) {
        showDashboard(user);
        // Asegurar que solo se muestre el welcome
        showOnly('welcome-card');

        // Marcar dashboard como activo
        const dashboardItem = document.querySelector('.sidebar-item[onclick="showWelcomeView()"]');
        if (dashboardItem) {
            dashboardItem.classList.add('active');
        }
    }
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

// Función centralizada para gestionar las vistas del dashboard
function showOnly(sectionId) {
    // Lista de todas las secciones que pueden mostrarse
    const allSections = [
        'welcome-card',
        'viewUsersContainer',
        'userRegistrationForm',
        'managementTabs',
        'viewProductsContainer'
    ];

    // Ocultar todas las secciones
    allSections.forEach(section => {
        const element = document.getElementById(section) || document.querySelector(`.${section}`);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Ocultar formularios de gestión específicos
    const managementForms = ['proveedorForm', 'productoForm', 'compraForm', 'ventaForm'];
    managementForms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.style.display = 'none';
        }
    });

    // Mostrar solo la sección solicitada
    if (sectionId) {
        const targetElement = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
        if (targetElement) {
            targetElement.style.display = 'block';
        }
    }

    // Actualizar estado activo del sidebar
    updateActiveSidebarItem(sectionId);
}

// Función para actualizar el item activo del sidebar
function updateActiveSidebarItem(sectionId) {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.classList.remove('active');
    });

    // Mapear secciones a funciones del sidebar
    const sectionMap = {
        'welcome-card': 'showWelcomeView()',
        'viewUsersContainer': 'viewUsers()',
        'userRegistrationForm': 'toggleRegistrationForm()',
        'managementTabs': null // Se maneja por separado
    };

    // Buscar y activar el item correspondiente
    for (const [section, functionName] of Object.entries(sectionMap)) {
        if (section === sectionId && functionName) {
            const activeItem = document.querySelector(`.sidebar-item[onclick="${functionName}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }
}

// Oculta secciones de contenido (tablas, formularios, inicio)
function hideAllContentSections() {
    const sections = document.querySelectorAll('.content-section, .welcome-card, .user-registration-form');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// Muestra la vista de inicio (tarjeta de bienvenida)
function showWelcomeView() {
    hideAllContentSections();
    showOnly('welcome-card');
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

// Obtener y mostrar lista de usuarios
async function viewUsers() {
    showOnly('viewUsersContainer');

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

    // Resetear la barra de fortaleza
    const strengthBar = document.getElementById('adminPasswordStrengthBar');
    if (strengthBar) {
        strengthBar.style.width = '0';
        strengthBar.style.backgroundColor = '#e74c3c';
    }

    // Ocultar mensajes de coincidencia
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

// Botones de acciones de usuario (aún en desarrollo)
function editUser(id) { showMessage('Función de edición de usuario en desarrollo', 'info'); }
function deleteUser(id) { if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) showMessage('Función de eliminación de usuario en desarrollo', 'info'); }

// Registrar usuario por parte del administrador
async function registerUserByAdmin() {
    console.log('Función registerUserByAdmin ejecutándose');

    const nombre = document.getElementById('adminRegNombre')?.value || '';
    const usuario = document.getElementById('adminRegUsuario')?.value || '';
    const email = document.getElementById('adminRegEmail')?.value || '';
    const rol = document.getElementById('adminRegRol')?.value || '';
    const password = document.getElementById('adminRegPassword')?.value || '';
    const confirmPassword = document.getElementById('adminConfirmPassword')?.value || '';
    const registerBtn = document.getElementById('adminRegisterBtn');

    if (!registerBtn) {
        console.error('Botón de registro no encontrado');
        return;
    }

    // Validaciones de campos
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

        // Verificar si la respuesta es OK antes de intentar parsear JSON
        if (response.ok) {
            const data = await response.json();
            showMessage('Usuario registrado correctamente', 'success');

            // Limpiar el formulario
            clearRegistrationForm();

            // Refrescar la lista de usuarios
            await viewUsers();
        } else {
            // Manejar errores del servidor
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

// Obtener lista de productos
async function viewProducts() {
    showOnly('viewProductsContainer');

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/products', {
            method: 'GET',
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
        if (response.ok) {
            const products = await response.json();
            displayProducts(products);
        } else {
            showMessage('Error al cargar los productos', 'error');
        }
    } catch (err) {
        console.error('viewProducts error:', err);
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
    }
}

// Renderizar tabla de productos
function displayProducts(products) {
    const container = document.getElementById('productsTableContainer');
    if (!container) return;
    if (!products || products.length === 0) {
        container.innerHTML = '<p>No hay productos registrados.</p>';
        return;
    }

    let tableHTML = `<div class="table-responsive"><table class="db-table"><thead>
        <tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Código</th><th>Proveedor</th><th>Acciones</th></tr>
    </thead><tbody>`;

    products.forEach(p => {
        const id = p.id || p.Id;
        const nombre = p.nombre || p.Nombre;
        const categoria = p.categoria || p.Categoria;
        const precio = p.precio || p.Precio;
        const stock = p.stock || p.Stock;
        const codigo = p.codigo || p.Codigo;
        const proveedorId = p.proveedorId || p.ProveedorId || 'N/A';
        const activo = p.activo ?? p.Activo ?? true;

        tableHTML += `<tr>
            <td>${id}</td>
            <td>${nombre}</td>
            <td>${categoria}</td>
            <td>${precio}</td>
            <td>${stock}</td>
            <td>${codigo}</td>
            <td>${proveedorId}</td>
            <td>
                <button class="db-btn db-view" onclick="editProduct(${id})">Editar</button>
                <button class="db-btn db-clear" onclick="deleteProduct(${id})">Eliminar</button>
            </td>
        </tr>`;
    });

    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;
}

// Botones de acciones de producto (aún en desarrollo)
function editProduct(id) { showMessage('Función de edición de producto en desarrollo', 'info'); }
function deleteProduct(id) { if (confirm('¿Estás seguro de que quieres eliminar este producto?')) showMessage('Función de eliminación de producto en desarrollo', 'info'); }

// Registrar producto
async function registerProduct() {
    const nombre = document.getElementById('productNombre')?.value;
    const categoria = document.getElementById('productCategoria')?.value;
    const precio = parseFloat(document.getElementById('productPrecio')?.value);
    const stock = parseInt(document.getElementById('productStock')?.value);
    const codigo = document.getElementById('productCodigo')?.value;
    const idProveedor = parseInt(document.getElementById('productProveedor')?.value);
    const descripcion = document.getElementById('productDescripcion')?.value;
    const registerBtn = document.getElementById('registerProductBtn');

    if (!registerBtn) return;

    // Validaciones
    if (!nombre || !categoria || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0 || !codigo || isNaN(idProveedor)) {
        showMessage('Por favor completa todos los campos obligatorios con valores válidos.', 'error');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="loading"></span> Registrando...';

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                Nombre: nombre,
                Categoria: categoria,
                Precio: precio,
                Stock: stock,
                Codigo: codigo,
                IdProveedor: idProveedor,
                Descripcion: descripcion
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Producto registrado correctamente', 'success');
            document.getElementById('productForm').reset();
            await viewProducts();
        } else {
            showMessage(data.message || 'Error al registrar el producto', 'error');
        }
    } catch (err) {
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
        console.error('registerProduct error:', err);
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Registrar Producto';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    const toggleButton = formGroup.querySelector('.toggle-password');
    if (!toggleButton) return;

    const icon = toggleButton.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }
}

function toggleRegistrationForm() {
    const userForm = document.getElementById('userRegistrationForm');
    if (userForm && userForm.style.display === 'block') {
        showOnly('welcome-card');
    } else {
        showOnly('userRegistrationForm');
    }
}

function toggleProductRegistrationForm() {
    hideAllContentSections();
    const userForm = document.getElementById('userRegistrationForm');
    const productForm = document.getElementById('productRegistrationForm');
    if (productForm) productForm.style.display = (productForm.style.display === 'block') ? 'none' : 'block';
    if (userForm) userForm.style.display = 'none';
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

    // Cambiar color según la fortaleza
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

// Exponer funciones globalmente
window.registerUserByAdmin = registerUserByAdmin;
window.clearRegistrationForm = clearRegistrationForm;
window.togglePassword = togglePassword;
window.viewUsers = viewUsers;
window.viewProducts = viewProducts;
window.toggleRegistrationForm = toggleRegistrationForm;
window.toggleProductRegistrationForm = toggleProductRegistrationForm;
window.registerProduct = registerProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.showWelcomeView = showWelcomeView;
window.checkAdminPasswordStrength = checkAdminPasswordStrength;
window.checkAdminPasswordMatch = checkAdminPasswordMatch;
window.logout = logout;

// Cargar el script de gestión
function loadManagementScript() {
    const script = document.createElement('script');
    script.src = 'js/management.js';
    document.head.appendChild(script);
}

function showDashboard(user) {
    hideAllForms();
    dashboard.style.display = 'block';

    // Mostrar información del usuario
    document.getElementById('welcomeName').textContent = user.nombre || user.name || 'Usuario';
    document.getElementById('userNameNav').textContent = user.nombre || user.name || 'Usuario';
    document.getElementById('userNameMenu').textContent = user.nombre || user.name || 'Usuario';
    document.getElementById('userEmailMenu').textContent = user.email;

    // Generar avatar con iniciales
    const userName = user.nombre || user.name || 'Usuario';
    const initials = userName.split(' ').map(name => name[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;

    // Mostrar panel de administración solo para administradores
    if (user.rol === 'Administrador' || user.role === 'Administrador') {
        databasePanel.style.display = 'block';
        // Cargar el script de gestión
        loadManagementScript();
    } else {
        databasePanel.style.display = 'none';
    }
}