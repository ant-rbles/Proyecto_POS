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
let clientes = [];
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
let currentClienteId = null;
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
                        <th>Último Login</th>
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
        const estado = u.estado !== undefined ? u.estado : u.Estado;
        const fechaUltimoLogin = u.fechaUltimoLogin ? new Date(u.fechaUltimoLogin).toLocaleDateString() : 'Nunca';

        tableHTML += `
            <tr>
                <td>${id}</td>
                <td>${nombre}</td>
                <td>${usuario}</td>
                <td>${email}</td>
                <td>${rol}</td>
                <td><span class="badge ${estado ? 'badge-success' : 'badge-danger'}">${estado ? 'Activo' : 'Inactivo'}</span></td>
                <td>${fechaUltimoLogin}</td>
                <td>
                    <button class="db-btn db-view" onclick="editUser(${id})">Editar</button>
                    <button class="db-btn ${estado ? 'db-clear' : 'db-view'}" onclick="${estado ? 'deleteUser' : 'activateUser'}(${id})">
                        ${estado ? 'Desactivar' : 'Activar'}
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;
}

// Botones de acciones de usuario
async function editUser(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/auth/users/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            showUserEditForm(user);
        } else {
            showMessage('Error al cargar el usuario', 'error');
        }
    } catch (err) {
        showMessage('Error de conexión', 'error');
    }
}

// Mostrar formulario de edición de usuario
async function editUser(id) {
    console.log('Editando usuario ID:', id);

    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showMessage('No hay sesión activa', 'error');
            return;
        }

        const response = await fetch(`https://localhost:7000/api/auth/users/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const user = await response.json();
            console.log('Usuario cargado:', user);
            showUserEditForm(user);
        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            showMessage('Error al cargar el usuario: ' + (errorText || response.statusText), 'error');
        }
    } catch (err) {
        console.error('Error en editUser:', err);
        showMessage('Error de conexión: ' + err.message, 'error');
    }
}

// Función para mostrar formulario de edición de usuario
function showUserEditForm(user) {
    console.log('Mostrando formulario para usuario:', user);

    // Crear el modal
    const modalHTML = `
        <div id="editUserModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:30px; border-radius:10px; width:90%; max-width:500px; max-height:90vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="margin:0; color:#4e73df;">Editar Usuario</h3>
                    <button onclick="closeEditModal()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#6c757d;">×</button>
                </div>
                <form id="editUserForm">
                    <input type="hidden" id="editUserId" value="${user.id}">
                    <div class="form-group">
                        <label for="editUserNombre">Nombre:</label>
                        <input type="text" id="editUserNombre" class="form-control" value="${user.nombre}" required>
                    </div>
                    <div class="form-group">
                        <label for="editUserUsuario">Usuario:</label>
                        <input type="text" id="editUserUsuario" class="form-control" value="${user.usuario}" required>
                    </div>
                    <div class="form-group">
                        <label for="editUserEmail">Email:</label>
                        <input type="email" id="editUserEmail" class="form-control" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="editUserRol">Rol:</label>
                        <select id="editUserRol" class="form-control" required>
                            <option value="Administrador" ${user.rol === 'Administrador' ? 'selected' : ''}>Administrador</option>
                            <option value="Cajero" ${user.rol === 'Cajero' ? 'selected' : ''}>Cajero</option>
                            <option value="Vendedor" ${user.rol === 'Vendedor' ? 'selected' : ''}>Vendedor</option>
                        </select>
                    </div>
                    <div style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
                        <button type="button" onclick="closeEditModal()" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Remover modal existente si hay uno
    const existingModal = document.getElementById('editUserModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Agregar event listener al formulario
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateUser(user.id);
    });
}

// Función para actualizar usuario
async function updateUser(userId) {
    console.log('Actualizando usuario ID:', userId);

    const userData = {
        nombre: document.getElementById('editUserNombre').value,
        usuario: document.getElementById('editUserUsuario').value,
        email: document.getElementById('editUserEmail').value,
        rol: document.getElementById('editUserRol').value
    };

    console.log('Datos a enviar:', userData);

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/auth/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(userData)
        });

        console.log('Update response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            showMessage('Usuario actualizado exitosamente', 'success');
            closeEditModal();
            await viewUsers(); // Recargar la lista
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al actualizar usuario', 'error');
        }
    } catch (err) {
        console.error('Error en updateUser:', err);
        showMessage('Error de conexión: ' + err.message, 'error');
    }
}

// Cerrar modal
function closeEditModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.remove();
    }
}

async function deleteUser(id) {
    if (!confirm('¿Está seguro de que desea desactivar este usuario? El usuario no podrá iniciar sesión pero se mantendrán sus datos.')) {
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/auth/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Usuario desactivado exitosamente', 'success');
            await viewUsers(); // Recargar la lista
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (err) {
        showMessage('Error de conexión', 'error');
    }
}

async function activateUser(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/auth/users/${id}/activate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Usuario activado exitosamente', 'success');
            await viewUsers(); // Recargar la lista
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (err) {
        showMessage('Error de conexión', 'error');
    }
}

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

    // Validar RUC duplicado
    const proveedorExistente = await verificarRUCProveedorExistente(proveedor.ruc, currentProveedorId);
    if (proveedorExistente) {
        const estado = proveedorExistente.estado ? 'activo' : 'inactivo';
        showMessage(`Ya existe un proveedor ${estado} con este RUC. ${!proveedorExistente.estado ? 'Puede activarlo desde la lista.' : ''}`, 'error');
        document.getElementById('proveedorRUC').focus();
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        let response;

        if (currentProveedorId) {
            response = await fetch(`https://localhost:7000/api/proveedores/${currentProveedorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(proveedor)
            });
        } else {
            response = await fetch('https://localhost:7000/api/proveedores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(proveedor)
            });
        }

        if (response.ok) {
            showMessage('Proveedor guardado exitosamente', 'success');
            hideProveedorForm();
            loadProveedores();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar proveedor', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Función para verificar RUC duplicado
async function verificarRUCProveedorExistente(ruc, excludeId = null) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/proveedores', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const proveedores = await response.json();
            return proveedores.find(p =>
                p.ruc === ruc &&
                p.id !== excludeId
            );
        }
        return null;
    } catch (error) {
        console.error('Error verificando RUC:', error);
        return null;
    }
}

function updateProveedoresSelect() {
    console.log('Actualizando select de proveedores...');

    try {
        const selectProveedor = document.getElementById('compraProveedor');
        if (selectProveedor && proveedores) {
            selectProveedor.innerHTML = '<option value="">Seleccionar proveedor</option>' +
                proveedores.filter(p => p.estado).map(p =>
                    `<option value="${p.id}">${p.nombre}</option>`
                ).join('');
            console.log('Select de proveedores actualizado');
        }
    } catch (error) {
        console.error('Error en updateProveedoresSelect:', error);
    }
}

async function loadProveedores() {
    try {
        console.log('Cargando proveedores...');

        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/proveedores', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            proveedores = await response.json();
            console.log('Proveedores cargados:', proveedores);
            renderProveedoresTable();
            updateProveedoresSelect();
        } else {
            const error = await response.text();
            console.error('Error al cargar proveedores:', error);
            showMessage('Error al cargar proveedores', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Renderizar tabla de proveedores mostrando estado
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
                <span class="badge ${proveedor.estado ? 'badge-success' : 'badge-danger'}">
                    ${proveedor.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showProveedorForm(${JSON.stringify(proveedor).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${proveedor.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${proveedor.estado ? 'deleteProveedor' : 'activateProveedor'}(${proveedor.id})">
                    <i class="fas ${proveedor.estado ? 'fa-trash' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para activar proveedor
async function activateProveedor(id) {
    if (!confirm('¿Está seguro de que desea activar este proveedor?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/proveedores/${id}/activate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Proveedor activado exitosamente', 'success');
            loadProveedores();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function deleteProveedor(id) {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/proveedores/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Proveedor eliminado exitosamente', 'success');
            loadProveedores();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

//Funciones Productos   
function showProductoForm(producto = null) {
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
            showMessage('❌ Error al cargar el producto', 'error');
        }
    } catch (err) {
        showMessage('❌ Error de conexión', 'error');
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
            CategoriaId: document.getElementById('productoCategoria').value ?
                parseInt(document.getElementById('productoCategoria').value) : null,
            UnidadMedidaBaseId: parseInt(document.getElementById('productoUnidadBase').value),
            StockMinimo: parseFloat(document.getElementById('productoStockMinimo').value) || 0,
            MargenGanancia: parseFloat(document.getElementById('productoMargen').value) || 30
        };

        console.log('Datos para crear producto:', productData);

        let response;
        if (currentProductoId) {
            // ACTUALIZAR
            response = await fetch(`https://localhost:7000/api/productos/${currentProductoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(productData)
            });
        } else {
            // CREAR
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
            await loadProductos(); // Recargar la lista
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
        const response = await fetch('https://localhost:7000/api/productos', {
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

        console.log('Enviando solicitud DELETE para producto ID:', id);

        const response = await fetch(`https://localhost:7000/api/productos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Respuesta recibida - Status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Respuesta del servidor:', result);
            showMessage(result.message || 'Producto desactivado exitosamente', 'success');

            // Recargar la lista de productos después de un breve delay
            setTimeout(async () => {
                await loadProductos();
            }, 500);

        } else {
            let errorMessage = 'Error al desactivar el producto';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                console.error('Error del servidor:', errorData);
            } catch (e) {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
                console.error('Error parsing response:', e);
            }
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error en deleteProducto:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

async function loadProductos() {
    try {
        console.log('Cargando productos...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/productos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            productos = await response.json();
            console.log('Productos cargados:', productos);
            renderProductosTable();
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
}

function renderProductosTable() {
    const tbody = document.getElementById('productosTableBody');
    if (!tbody) {
        console.error('No se encontró el tbody de productos');
        return;
    }

    console.log('Renderizando tabla con', productos ? productos.length : 0, 'productos');

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay productos disponibles</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(producto => {
        // Debug: mostrar toda la información del producto
        console.log('Producto para renderizar:', producto);

        const id = producto.id || producto.Id;
        const codigo = producto.codigo || producto.Codigo || 'N/A';
        const nombre = producto.nombre || producto.Nombre || 'N/A';
        const estado = producto.estado !== undefined ? producto.estado :
            (producto.Estado !== undefined ? producto.Estado : true);

        // Categoría
        let categoriaNombre = 'Sin categoría';
        if (producto.categoria) {
            categoriaNombre = producto.categoria.nombre || producto.categoria.Nombre || 'Sin categoría';
        } else if (producto.Categoria) {
            categoriaNombre = producto.Categoria.nombre || producto.Categoria.Nombre || 'Sin categoría';
        }

        // Unidad de medida
        let unidadNombre = 'N/A';
        if (producto.unidadMedidaBase) {
            unidadNombre = producto.unidadMedidaBase.nombre || producto.unidadMedidaBase.Nombre || 'N/A';
        } else if (producto.UnidadMedidaBase) {
            unidadNombre = producto.UnidadMedidaBase.nombre || producto.UnidadMedidaBase.Nombre || 'N/A';
        }

        // Valores numéricos
        const stockActual = parseFloat(producto.stockActual || producto.StockActual || 0);
        const stockMinimo = parseFloat(producto.stockMinimo || producto.StockMinimo || 0);
        const precioCosto = parseFloat(producto.precioCostoPromedio || producto.PrecioCostoPromedio || 0);
        const precioVenta = parseFloat(producto.precioVenta || producto.PrecioVenta || 0);

        return `
        <tr data-producto-id="${id}" data-estado="${estado}">
            <td>${codigo}</td>
            <td>${nombre}</td>
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
            <td class="text-center">
                <button class="db-btn db-view" onclick="editProducto(${id})">Editar</button>
                <button class="db-btn ${estado ? 'db-clear' : 'db-view'}" 
                        onclick="${estado ? 'deleteProducto' : 'activateProducto'}(${id})"
                        id="btn-estado-${id}">
                    ${estado ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function getStockStatusClass(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'stock-critical';
    if (stockActual <= stockMinimo) return 'stock-low';
    return 'stock-normal';
}

async function activateProducto(id) {
    console.log('Intentando activar producto ID:', id);

    if (!confirm('¿Está seguro de que desea activar este producto?')) {
        return;
    }

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

        console.log('Respuesta activar producto - Status:', response.status);

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message || 'Producto activado exitosamente', 'success');

            setTimeout(async () => {
                await loadProductos();
            }, 500);

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

// Función para mostrar formulario de compra
function showCompraForm() {
    console.log('Mostrando formulario de compra');
    openManagementTab('compras');
    const form = document.getElementById('compraForm');
    if (form) {
        form.style.display = 'block';

        // Establecer fecha actual
        document.getElementById('compraFecha').value = new Date().toISOString().split('T')[0];

        // Generar número de factura automático (se generará en el backend)
        document.getElementById('compraFactura').value = '';
        document.getElementById('compraFactura').placeholder = 'Se generará automáticamente';

        // Reiniciar detalles
        detallesCompra = [];
        renderDetallesTable();
        calcularTotalesCompra();

        // Cargar datos necesarios
        updateProveedoresSelect();
        updateProductosSelects();
        cargarUnidadesParaCompra();
    } else {
        console.error('No se encontró el formulario de compra');
    }
}

// Función para cargar unidades de medida en compras
function cargarUnidadesParaCompra() {
    const select = document.getElementById('detalleUnidad');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar unidad</option>' +
        unidadesMedida.map(u =>
            `<option value="${u.id}" data-factor="${u.factorConversion}">${u.nombre} (${u.abreviatura})</option>`
        ).join('');
}

    function updateProductosSelects() {
        console.log('Actualizando selects de productos para COMPRAS...');

        try {
            // SOLO select en compras
            const selectCompra = document.getElementById('detalleProducto');
            if (selectCompra && productos) {
                selectCompra.innerHTML = '<option value="">Seleccionar producto</option>' +
                    productos.filter(p => p.estado).map(p =>
                        `<option value="${p.id}" data-stock="${p.stockActual}">${p.nombre} - Stock: ${p.stockActual}</option>`
                    ).join('');
                console.log('Select de COMPRAS actualizado');
            }
        } catch (error) {
            console.error('Error en updateProductosSelects:', error);
        }
    }

        function hideCompraForm() {
            const form = document.getElementById('compraForm');
            if (form) form.style.display = 'none';
            const compraFormElement = document.getElementById('compraFormElement');
            if (compraFormElement) compraFormElement.reset();
            detallesCompra = [];
        }

// Función mejorada para agregar detalle a compra
function agregarDetalle() {
    const productoId = parseInt(document.getElementById('detalleProducto')?.value);
    const unidadId = parseInt(document.getElementById('detalleUnidad')?.value);
    const cantidad = parseFloat(document.getElementById('detalleCantidad')?.value) || 0;
    const precio = parseFloat(document.getElementById('detallePrecio')?.value) || 0;

    // Validaciones
    if (!productoId || isNaN(productoId)) {
        showMessage('Seleccione un producto válido', 'error');
        return;
    }
    if (!unidadId || isNaN(unidadId)) {
        showMessage('Seleccione una unidad de medida válida', 'error');
        return;
    }
    if (cantidad <= 0) {
        showMessage('La cantidad debe ser mayor a 0', 'error');
        return;
    }
    if (precio <= 0) {
        showMessage('El precio unitario debe ser mayor a 0', 'error');
        return;
    }

    // Obtener información del producto y unidad
    const producto = productos.find(p => p.id === productoId);
    const unidad = unidadesMedida.find(u => u.id === unidadId);

    if (!producto || !unidad) {
        showMessage('Error al obtener información del producto o unidad', 'error');
        return;
    }

    const detalle = {
        productoId: productoId,
        unidadMedidaId: unidadId,
        cantidad: cantidad,
        precioUnitario: precio,
        totalLinea: cantidad * precio,
        producto: producto,
        unidad: unidad
    };

    detallesCompra.push(detalle);
    renderDetallesTable();
    calcularTotalesCompra();

    // Limpiar campos del detalle
    document.getElementById('detalleCantidad').value = '1';
    document.getElementById('detallePrecio').value = '0';
    document.getElementById('detalleTotal').value = '0';
    document.getElementById('detalleProducto').selectedIndex = 0;
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

// Función mejorada para enviar compra
async function handleCompraSubmit(e) {
    e.preventDefault();

    if (detallesCompra.length === 0) {
        showMessage('Debe agregar al menos un detalle a la compra', 'error');
        return;
    }

    const proveedorId = parseInt(document.getElementById('compraProveedor')?.value);
    if (!proveedorId || isNaN(proveedorId)) {
        showMessage('Seleccione un proveedor válido', 'error');
        return;
    }

    const compraData = {
        numeroFactura: document.getElementById('compraFactura')?.value || '', // Vacío para generación automática
        proveedorId: proveedorId,
        fechaCompra: document.getElementById('compraFecha').value,
        impuestos: parseFloat(document.getElementById('compraImpuestos')?.value) || 0,
        observaciones: document.getElementById('compraObservaciones')?.value,
        usuarioCreacion: JSON.parse(localStorage.getItem('user')).id,
        detalles: detallesCompra.map(d => ({
            productoId: d.productoId,
            unidadMedidaId: d.unidadMedidaId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario
        }))
    };

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/compras', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(compraData)
        });

        if (response.ok) {
            const result = await response.json();
            showMessage('Compra registrada exitosamente', 'success');
            hideCompraForm();
            await loadCompras();
            await loadProductos(); // Recargar productos para ver stock actualizado
            await loadInventario(); // Actualizar vista de inventario
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al registrar compra', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Función para cargar compras
async function loadCompras() {
    try {
        console.log('Cargando compras...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/compras', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            compras = await response.json();
            console.log('Compras cargadas:', compras);
            renderComprasTable();
        } else {
            showMessage('Error al cargar las compras', 'error');
        }
    } catch (error) {
        console.error('Error al cargar compras:', error);
        showMessage('Error de conexión al cargar compras', 'error');
    }
}

// Función para renderizar tabla de compras
function renderComprasTable() {
    const tbody = document.getElementById('comprasTableBody');
    if (!tbody) return;

    if (!compras || compras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay compras registradas</td></tr>';
        return;
    }

    tbody.innerHTML = compras.map(compra => `
        <tr>
            <td>${compra.numeroFactura}</td>
            <td>${compra.proveedor ? compra.proveedor.nombre : 'N/A'}</td>
            <td>${new Date(compra.fechaCompra).toLocaleDateString()}</td>
            <td>${compra.detalles ? compra.detalles.length : 0}</td>
            <td>$${compra.subtotal ? compra.subtotal.toFixed(2) : '0.00'}</td>
            <td>$${compra.impuestos ? compra.impuestos.toFixed(2) : '0.00'}</td>
            <td>$${compra.total ? compra.total.toFixed(2) : '0.00'}</td>
            <td>
                <span class="badge ${compra.estado === 'COMPLETADA' ? 'badge-success' : compra.estado === 'ANULADA' ? 'badge-danger' : 'badge-warning'}">
                    ${compra.estado}
                </span>
            </td>
            <td>
                <button class="action-btn view-btn" onclick="verDetalleCompra(${compra.id})" title="Ver Detalle">
                    <i class="fas fa-eye"></i>
                </button>
                ${compra.estado !== 'ANULADA' ? `
                    <button class="action-btn delete-btn" onclick="anularCompra(${compra.id})" title="Anular Compra">
                        <i class="fas fa-ban"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Función para anular compra
async function anularCompra(id) {
    if (!confirm('¿Está seguro de que desea anular esta compra? Se revertirá el stock de los productos.')) {
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/compras/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Compra anulada exitosamente', 'success');
            await loadCompras();
            await loadProductos();
            await loadInventario();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        console.error('Error al anular compra:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Función para ver detalle de compra
async function verDetalleCompra(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/compras/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const compra = await response.json();
            mostrarModalDetalleCompra(compra);
        } else {
            showMessage('Error al cargar el detalle de la compra', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Función para mostrar modal con detalle de compra
function mostrarModalDetalleCompra(compra) {
    const modalHTML = `
        <div id="detalleCompraModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:30px; border-radius:10px; width:90%; max-width:800px; max-height:80vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3>Detalle de Compra - ${compra.numeroFactura}</h3>
                    <button onclick="cerrarModalDetalleCompra()" style="background:none; border:none; font-size:20px; cursor:pointer;">×</button>
                </div>
                
                <div style="margin-bottom:20px;">
                    <p><strong>Proveedor:</strong> ${compra.proveedor ? compra.proveedor.nombre : 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${new Date(compra.fechaCompra).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> <span class="badge ${compra.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}">${compra.estado}</span></p>
                    <p><strong>Observaciones:</strong> ${compra.observaciones || 'Ninguna'}</p>
                </div>

                <h4>Productos Comprados</h4>
                <table class="data-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Unidad</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compra.detalles ? compra.detalles.map(detalle => `
                            <tr>
                                <td>${detalle.producto ? detalle.producto.nombre : 'N/A'}</td>
                                <td>${detalle.unidadMedida ? detalle.unidadMedida.nombre : 'N/A'}</td>
                                <td>${detalle.cantidad}</td>
                                <td>$${detalle.precioUnitario.toFixed(2)}</td>
                                <td>$${detalle.totalLinea.toFixed(2)}</td>
                            </tr>
                        `).join('') : ''}
                    </tbody>
                </table>

                <div style="margin-top:20px; text-align:right;">
                    <p><strong>Subtotal:</strong> $${compra.subtotal.toFixed(2)}</p>
                    <p><strong>Impuestos:</strong> $${compra.impuestos.toFixed(2)}</p>
                    <p><strong>Total:</strong> $${compra.total.toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function cerrarModalDetalleCompra() {
    const modal = document.getElementById('detalleCompraModal');
    if (modal) modal.remove();
}

// Funciones para Inventario
async function loadInventario() {
    try {
        console.log('Cargando inventario desde la base de datos...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/productos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            productos = await response.json();
            console.log('Inventario cargado:', productos);

            // Calcular estadísticas
            const totalProductos = productos.length;
            const totalStock = productos.reduce((sum, p) => sum + (p.stockActual || 0), 0);
            const stockBajo = productos.filter(p => p.stockActual <= (p.stockMinimo || 0) && p.stockActual > 0).length;
            const sinStock = productos.filter(p => p.stockActual <= 0).length;
            const valorInventario = productos.reduce((sum, p) => sum + ((p.stockActual || 0) * (p.precioCostoPromedio || 0)), 0);

            // Actualizar UI
            document.getElementById('totalProductos').textContent = totalProductos;
            document.getElementById('totalStock').textContent = totalStock.toFixed(2);
            document.getElementById('stockBajo').textContent = stockBajo;
            document.getElementById('valorInventario').textContent = `$${valorInventario.toFixed(2)}`;

            // Renderizar tabla de inventario
            renderInventarioTable();
        } else {
            showMessage('Error al cargar el inventario', 'error');
        }
    } catch (error) {
        console.error('Error al cargar inventario:', error);
        showMessage('Error de conexión al cargar inventario', 'error');
    }
}

function renderInventarioTable() {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) {
        console.error('No se encontró el tbody de inventario');
        return;
    }

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay productos en inventario</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(producto => {
        const id = producto.id || producto.Id;
        const codigo = producto.codigo || producto.Codigo || 'N/A';
        const nombre = producto.nombre || producto.Nombre || 'N/A';
        const estado = producto.estado !== undefined ? producto.estado : (producto.Estado !== undefined ? producto.Estado : true);

        // Categoría
        let categoriaNombre = 'Sin categoría';
        if (producto.categoria) {
            categoriaNombre = producto.categoria.nombre || producto.categoria.Nombre || 'Sin categoría';
        } else if (producto.Categoria) {
            categoriaNombre = producto.Categoria.nombre || producto.Categoria.Nombre || 'Sin categoría';
        }

        // Unidad de medida
        let unidadNombre = 'N/A';
        if (producto.unidadMedidaBase) {
            unidadNombre = producto.unidadMedidaBase.nombre || producto.unidadMedidaBase.Nombre || 'N/A';
        } else if (producto.UnidadMedidaBase) {
            unidadNombre = producto.UnidadMedidaBase.nombre || producto.UnidadMedidaBase.Nombre || 'N/A';
        }

        // Valores numéricos
        const stockActual = parseFloat(producto.stockActual || producto.StockActual || 0);
        const stockMinimo = parseFloat(producto.stockMinimo || producto.StockMinimo || 0);
        const precioCosto = parseFloat(producto.precioCostoPromedio || producto.PrecioCostoPromedio || 0);
        const precioVenta = parseFloat(producto.precioVenta || producto.PrecioVenta || 0);

        // Calcular valor total en inventario
        const valorTotal = stockActual * precioCosto;

        return `
        <tr>
            <td>${codigo}</td>
            <td>${nombre}</td>
            <td>${categoriaNombre}</td>
            <td>${unidadNombre}</td>
            <td class="text-center">
                <span class="stock-badge ${getStockStatusClass(stockActual, stockMinimo)}">
                    ${stockActual.toFixed(2)}
                </span>
            </td>
            <td class="text-center">${stockMinimo.toFixed(2)}</td>
            <td class="text-right">Q ${precioCosto.toFixed(2)}</td>
            <td class="text-right">Q ${precioVenta.toFixed(2)}</td>
            <td class="text-right">Q ${valorTotal.toFixed(2)}</td>
            <td class="text-center">
                <span class="badge ${estado ? 'badge-success' : 'badge-danger'}">
                    ${estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
        </tr>
        `;
    }).join('');
}

function getStockStatusClass(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'stock-critical';
    if (stockActual <= stockMinimo) return 'stock-low';
    return 'stock-normal';
}

function getStockStatusText(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'Sin Stock';
    if (stockActual <= stockMinimo) return 'Stock Bajo';
    return 'Normal';
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

        // Reiniciar formulario
        document.getElementById('ventaFormElement').reset();
        document.getElementById('ventaAplicarIVA').checked = true;
        document.getElementById('ventaDescuentoGlobal').value = '0';

        // Reiniciar detalles
        detallesVenta = [];
        renderDetallesVentaTable();
        calcularTotalesVenta();

        // Cargar datos necesarios
        updateProductosSelectVenta();
    }
}

function hideVentaForm() {
    const form = document.getElementById('ventaForm');
    if (form) form.style.display = 'none';
    detallesVenta = [];
}

function updateProductosSelectVenta() {
    const select = document.getElementById('ventaProducto');
    if (!select || !productos) return;

    select.innerHTML = '<option value="">Seleccionar producto...</option>' +
        productos.filter(p => p.estado).map(p => {
            const precio = p.precioVenta || 0;
            const stock = p.stockActual || 0;
            return `<option value="${p.id}" data-precio="${precio}" data-stock="${stock}">
                ${p.nombre} - Q${precio.toFixed(2)} (Stock: ${stock.toFixed(2)})
            </option>`;
        }).join('');
}

// Búsqueda de cliente por NIT
async function buscarClientePorNIT() {
    const nit = document.getElementById('ventaClienteNIT').value.trim();
    if (!nit) {
        showMessage('Ingrese un NIT para buscar', 'error');
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/clientes/buscar-por-nit/${nit}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const cliente = await response.json();
            document.getElementById('ventaClienteId').value = cliente.id;
            document.getElementById('ventaClienteNombre').value = cliente.nombre;
            showMessage('Cliente encontrado', 'success');
        } else {
            // Si no existe, permitir ingresar manualmente
            document.getElementById('ventaClienteId').value = '';
            document.getElementById('ventaClienteNombre').value = '';
            document.getElementById('ventaClienteNombre').focus();
            showMessage('Cliente no encontrado. Puede ingresar el nombre manualmente', 'warning');
        }
    } catch (error) {
        console.error('Error buscando cliente:', error);
        showMessage('Error al buscar cliente', 'error');
    }
}

// Cuando se selecciona un producto en ventas
function onProductoSelectChange() {
    const select = document.getElementById('ventaProducto');
    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption.value) {
        const precio = parseFloat(selectedOption.getAttribute('data-precio')) || 0;
        const stock = parseFloat(selectedOption.getAttribute('data-stock')) || 0;

        document.getElementById('ventaPrecioUnitario').value = precio.toFixed(2);

        // Mostrar información de stock
        if (stock <= 0) {
            showMessage('Producto sin stock disponible', 'warning');
        }
    }
}

function agregarDetalleVenta() {
    const productoSelect = document.getElementById('ventaProducto');
    const productoId = parseInt(productoSelect.value);
    const cantidad = parseFloat(document.getElementById('ventaCantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('ventaPrecioUnitario').value) || 0;
    const descuento = parseFloat(document.getElementById('ventaDescuentoProducto').value) || 0;

    // Validaciones
    if (!productoId) {
        showMessage('Seleccione un producto', 'error');
        return;
    }
    if (cantidad <= 0) {
        showMessage('La cantidad debe ser mayor a 0', 'error');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        showMessage('Producto no encontrado', 'error');
        return;
    }

    // Verificar stock
    if (producto.stockActual < cantidad) {
        showMessage(`Stock insuficiente. Stock disponible: ${producto.stockActual}`, 'error');
        return;
    }

    // Calcular precios con descuento
    const precioConDescuento = precioUnitario * (1 - descuento / 100);
    const totalLinea = cantidad * precioConDescuento;

    const detalle = {
        productoId: productoId,
        productoNombre: producto.nombre,
        unidadMedidaId: producto.unidadMedidaBaseId,
        cantidad: cantidad,
        precioUnitario: precioConDescuento,
        descuentoAplicado: descuento,
        totalLinea: totalLinea
    };

    detallesVenta.push(detalle);
    renderDetallesVentaTable();
    calcularTotalesVenta();

    // Limpiar campos del detalle
    document.getElementById('ventaCantidad').value = '1';
    document.getElementById('ventaDescuentoProducto').value = '0';
    document.getElementById('ventaProducto').selectedIndex = 0;
    document.getElementById('ventaPrecioUnitario').value = '0';
}

function renderDetallesVentaTable() {
    const tbody = document.getElementById('detallesVentaTableBody');
    if (!tbody) return;

    if (detallesVenta.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay productos agregados</td></tr>';
        return;
    }

    tbody.innerHTML = detallesVenta.map((detalle, index) => `
        <tr>
            <td>${detalle.productoNombre}</td>
            <td>${detalle.cantidad}</td>
            <td>Q ${detalle.precioUnitario.toFixed(2)}</td>
            <td>${detalle.descuentoAplicado}%</td>
            <td>Q ${detalle.totalLinea.toFixed(2)}</td>
            <td>
                <button class="action-btn delete-btn" onclick="eliminarDetalleVenta(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function eliminarDetalleVenta(index) {
    detallesVenta.splice(index, 1);
    renderDetallesVentaTable();
    calcularTotalesVenta();
}

function calcularTotalesVenta() {
    const subtotal = detallesVenta.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const descuentoGlobal = parseFloat(document.getElementById('ventaDescuentoGlobal').value) || 0;
    const aplicarIVA = document.getElementById('ventaAplicarIVA').checked;

    const subtotalConDescuento = Math.max(0, subtotal - descuentoGlobal);
    const impuestos = aplicarIVA ? subtotalConDescuento * 0.12 : 0; // 12% IVA Guatemala
    const total = subtotalConDescuento + impuestos;

    document.getElementById('ventaSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('ventaDescuentoGlobalTotal').textContent = descuentoGlobal.toFixed(2);
    document.getElementById('ventaImpuestos').textContent = impuestos.toFixed(2);
    document.getElementById('ventaTotal').textContent = total.toFixed(2);
}

async function handleVentaSubmit(e) {
    e.preventDefault();

    if (detallesVenta.length === 0) {
        showMessage('Debe agregar al menos un producto a la venta', 'error');
        return;
    }

    const clienteId = document.getElementById('ventaClienteId').value;
    const clienteNombre = document.getElementById('ventaClienteNombre').value;
    const clienteNIT = document.getElementById('ventaClienteNIT').value || 'CF';

    if (!clienteNombre) {
        showMessage('El nombre del cliente es requerido', 'error');
        return;
    }

    const ventaData = {
        fechaVenta: new Date().toISOString(),
        clienteId: clienteId ? parseInt(clienteId) : null,
        nombreCliente: clienteNombre,
        nitCliente: clienteNIT,
        descuentoGlobal: parseFloat(document.getElementById('ventaDescuentoGlobal').value) || 0,
        aplicarIVA: document.getElementById('ventaAplicarIVA').checked,
        observaciones: document.getElementById('ventaObservaciones').value,
        usuarioCreacion: JSON.parse(localStorage.getItem('user')).id,
        detalles: detallesVenta.map(detalle => ({
            productoId: detalle.productoId,
            unidadMedidaId: detalle.unidadMedidaId,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuentoAplicado: detalle.descuentoAplicado
        }))
    };

    console.log('Datos de venta:', ventaData);

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(ventaData)
        });

        if (response.ok) {
            const result = await response.json();
            showMessage('Venta registrada exitosamente. N° Factura: ' + result.venta.numeroFactura, 'success');

            // Limpiar formulario
            document.getElementById('ventaFormElement').reset();
            detallesVenta = [];
            renderDetallesVentaTable();
            calcularTotalesVenta();

            // Recargar productos para actualizar stock
            await loadProductos();

        } else {
            const error = await response.json();
            showMessage(' ' + (error.message || 'Error al registrar la venta'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }
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

// Funciones para Descuentos
function showDescuentoForm() {
    openManagementTab('descuentos');
    const form = document.getElementById('descuentoForm');
    if (form) {
        form.style.display = 'block';
        document.getElementById('descuentoFormElement').reset();
        updateProductosSelectDescuento();
    }
}

function hideDescuentoForm() {
    const form = document.getElementById('descuentoForm');
    if (form) form.style.display = 'none';
}

function updateProductosSelectDescuento() {
    const select = document.getElementById('descuentoProducto');
    if (!select || !productos) return;

    select.innerHTML = '<option value="">Seleccionar producto...</option>' +
        productos.filter(p => p.estado).map(p =>
            `<option value="${p.id}">${p.nombre}</option>`
        ).join('');
}

// Funciones para Unidades de Medida
function showUnidadForm(unidad = null) {
    openManagementTab('unidades');

    const form = document.getElementById('unidadForm');
    const title = document.getElementById('unidadFormTitle');

    if (unidad) {
        title.textContent = 'Editar Unidad de Medida';
        currentUnidadId = unidad.id;
        // LLENAR FORMULARIO - igual que en categorías
        document.getElementById('unidadNombre').value = unidad.nombre;
        document.getElementById('unidadAbreviatura').value = unidad.abreviatura;
        document.getElementById('unidadEsBase').checked = unidad.esUnidadBase;
        document.getElementById('unidadFactor').value = unidad.factorConversion;
    } else {
        title.textContent = 'Nueva Unidad de Medida';
        currentUnidadId = null;
        // LIMPIAR FORMULARIO - igual que en categorías
        document.getElementById('unidadFormElement').reset();
    }

    form.style.display = 'block';
}

function hideUnidadForm() {
    document.getElementById('unidadForm').style.display = 'none';
    currentUnidadId = null;
}

function fillUnidadForm(unidad) {
    document.getElementById('unidadId').value = unidad.id;
    document.getElementById('unidadNombre').value = unidad.nombre;
    document.getElementById('unidadAbreviatura').value = unidad.abreviatura;
    document.getElementById('unidadEsBase').checked = unidad.esUnidadBase;
    document.getElementById('unidadFactor').value = unidad.factorConversion;
}

async function handleUnidadSubmit(e) {
    e.preventDefault();

    // Validaciones
    const nombre = document.getElementById('unidadNombre').value.trim();
    const abreviatura = document.getElementById('unidadAbreviatura').value.trim();
    const factor = parseFloat(document.getElementById('unidadFactor').value);

    if (!nombre) {
        showMessage('El nombre es obligatorio', 'error');
        return;
    }
    if (!abreviatura) {
        showMessage('La abreviatura es obligatoria', 'error');
        return;
    }
    if (!factor || factor <= 0) {
        showMessage('El factor de conversión debe ser mayor a 0', 'error');
        return;
    }

    // Construir objeto como lo espera el modelo C#
    const unidadData = {
        id: currentUnidadId || 0, // Para PUT, debe coincidir con el ID de la URL
        nombre: nombre,
        abreviatura: abreviatura,
        esUnidadBase: document.getElementById('unidadEsBase').checked,
        factorConversion: factor,
        estado: true
    };

    console.log('Datos a enviar:', unidadData);

    try {
        const authToken = localStorage.getItem('authToken');
        const url = currentUnidadId
            ? `https://localhost:7000/api/unidadesmedida/${currentUnidadId}`
            : 'https://localhost:7000/api/unidadesmedida';

        const method = currentUnidadId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(unidadData)
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message, 'success');
            hideUnidadForm();
            await loadUnidadesMedida();
        } else {
            const errorData = await response.json();
            console.error('Error del servidor:', errorData);
            showMessage(errorData.message || `Error ${response.status}: ${response.statusText}`, 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

async function loadUnidadesMedida() {
    try {
        console.log('Cargando unidades de medida...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/unidadesmedida', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            unidadesMedida = await response.json();
            console.log('Unidades cargadas:', unidadesMedida);
            updateUnidadesMedidaSelect();
            renderUnidadesTable();
        } else {
            showMessage('Error al cargar unidades de medida', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

function renderUnidadesTable() {
    const tbody = document.getElementById('unidadesTableBody');
    if (!tbody) return;

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

async function deleteUnidad(id) {
    if (!confirm('¿Está seguro de eliminar esta unidad de medida?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/unidadesmedida/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message || 'Unidad de medida eliminada exitosamente', 'success');
            await loadUnidadesMedida();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

function updateUnidadesMedidaSelect() {
    console.log('Actualizando select de unidades de medida para productos...');

    const selectUnidad = document.getElementById('productoUnidadBase');
    if (!selectUnidad) {
        console.error('No se encontró el select de unidad de medida');
        return;
    }

    if (!unidadesMedida || unidadesMedida.length === 0) {
        console.warn('No hay unidades de medida cargadas');
        return;
    }

    // Guardar el valor actual si existe
    const currentValue = selectUnidad.value;

    // Limpiar y llenar el select
    selectUnidad.innerHTML = '<option value="">Seleccionar unidad de medida</option>';

    unidadesMedida.forEach(unidad => {
        if (unidad.estado) {
            const option = document.createElement('option');
            option.value = unidad.id;
            option.textContent = `${unidad.nombre} (${unidad.abreviatura})`;
            selectUnidad.appendChild(option);
        }
    });

    // Restaurar el valor anterior si existe
    if (currentValue) {
        selectUnidad.value = currentValue;
    }

    console.log('Select de unidades de medida actualizado');
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
                const selectAjuste = document.getElementById('ajusteProducto');
                if (selectAjuste) {
                    selectAjuste.innerHTML = '<option value="">Seleccionar producto</option>' +
                        productos.filter(p => p.estado).map(p =>
                            `<option value="${p.id}">${p.nombre} - Stock actual: ${p.stockActual}</option>`
                        ).join('');
                }
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

async function loadClientes() {
    try {
        console.log('Cargando clientes...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/clientes', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            clientes = await response.json();
            console.log('Clientes cargados:', clientes);
            renderClientesTable();
        } else {
            console.error('Error al cargar clientes');
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

function renderClientesTable() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay clientes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = clientes.map(cliente => `
        <tr>
            <td>${cliente.nombre}</td>
            <td>${cliente.nit || 'N/A'}</td>
            <td>${cliente.telefono || '-'}</td>
            <td>${cliente.email || '-'}</td>
            <td>${cliente.direccion || '-'}</td>
            <td>
                <span class="badge ${cliente.estado ? 'badge-success' : 'badge-danger'}">
                    ${cliente.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editCliente(${cliente.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${cliente.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${cliente.estado ? 'deleteCliente' : 'activateCliente'}(${cliente.id})">
                    <i class="fas ${cliente.estado ? 'fa-trash' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showClienteForm(cliente = null) {
    openManagementTab('clientes');
    const form = document.getElementById('clienteForm');
    const title = document.getElementById('clienteFormTitle');

    if (form) {
        if (cliente) {
            title.textContent = 'Editar Cliente';
            currentClienteId = cliente.id;
            fillClienteForm(cliente);
        } else {
            title.textContent = 'Nuevo Cliente';
            currentClienteId = null;
            document.getElementById('clienteFormElement').reset();
        }
        form.style.display = 'block';
    }
}

function hideClienteForm() {
    const form = document.getElementById('clienteForm');
    if (form) form.style.display = 'none';
    currentClienteId = null;
}

function fillClienteForm(cliente) {
    document.getElementById('clienteNombre').value = cliente.nombre;
    document.getElementById('clienteNIT').value = cliente.nit || '';
    document.getElementById('clienteTelefono').value = cliente.telefono || '';
    document.getElementById('clienteEmail').value = cliente.email || '';
    document.getElementById('clienteDireccion').value = cliente.direccion || '';
}

async function handleClienteSubmit(e) {
    e.preventDefault();

    const clienteData = {
        nombre: document.getElementById('clienteNombre').value.trim(),
        nit: document.getElementById('clienteNIT').value.trim(),
        telefono: document.getElementById('clienteTelefono').value.trim(),
        email: document.getElementById('clienteEmail').value.trim(),
        direccion: document.getElementById('clienteDireccion').value.trim()
    };

    try {
        const authToken = localStorage.getItem('authToken');
        let response;

        if (currentClienteId) {
            response = await fetch(`https://localhost:7000/api/clientes/${currentClienteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(clienteData)
            });
        } else {
            response = await fetch('https://localhost:7000/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(clienteData)
            });
        }

        if (response.ok) {
            showMessage('Cliente guardado exitosamente', 'success');
            hideClienteForm();
            await loadClientes();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar cliente', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

async function deleteCliente(id) {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/clientes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Cliente eliminado exitosamente', 'success');
            await loadClientes();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function activateCliente(id) {
    // Para implementar cuando tengas el endpoint de activar cliente
    showMessage('Función de activar cliente no implementada', 'error');
}

async function editCliente(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/clientes/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const cliente = await response.json();
            showClienteForm(cliente);
        } else {
            showMessage('Error al cargar el cliente', 'error');
        }
    } catch (err) {
        showMessage('Error de conexión', 'error');
    }
}

// Ventas con precios fijos y descuentos
function agregarProductoVenta() {
    const productoSelect = document.getElementById('ventaProducto');
    const productoId = parseInt(productoSelect.value);
    const cantidad = parseFloat(document.getElementById('ventaCantidad').value) || 1;

    if (!productoId) {
        showMessage('Seleccione un producto', 'error');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    // Usar precio fijo del producto
    const precioUnitario = producto.precioVenta;

    // Aquí se aplicaría el descuento por cantidad (implementar lógica similar a backend)
    const descuento = calcularDescuentoPorCantidad(productoId, cantidad);
    const precioConDescuento = precioUnitario * (1 - descuento / 100);
    const totalLinea = cantidad * precioConDescuento;

    const detalle = {
        productoId: productoId,
        productoNombre: producto.nombre,
        unidadMedidaId: producto.unidadMedidaBaseId,
        cantidad: cantidad,
        precioUnitario: precioConDescuento,
        descuentoAplicado: descuento,
        totalLinea: totalLinea
    };

    detallesVenta.push(detalle);
    renderDetallesVenta();
    calcularTotalesVenta();
}

// Configuración de descuentos
function configurarDescuentos() {
    openManagementTab('descuentos');
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
                    console.log('Event listener agregado para ventaForm');
                }
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
                const ventaDetalleProducto = document.getElementById('ventaDetalleProducto');
                const ventaDetalleCantidad = document.getElementById('ventaDetalleCantidad');
                const ventaDetallePrecio = document.getElementById('ventaDetallePrecio');
                const ventaImpuestos = document.getElementById('ventaImpuestos');

                if (ventaDetalleProducto) {
                    ventaDetalleProducto.addEventListener('change', cargarPrecioProductoVenta);
                }
                if (ventaDetalleCantidad) {
                    ventaDetalleCantidad.addEventListener('input', calcularTotalLineaVenta);
                }
                if (ventaDetallePrecio) {
                    ventaDetallePrecio.addEventListener('input', calcularTotalLineaVenta);
                }
                if (ventaImpuestos) {
                    ventaImpuestos.addEventListener('input', calcularTotalesVenta);
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
                    updateProductosSelects(); // Solo compras
                    break;
                case 'ventas':
                    cargarVentas();
                    cargarEstadisticasVentas();
                    updateProductosSelectsVentas(); // Solo ventas
                    cargarUnidadesParaVenta();
                    break;
                case 'inventario':
                    loadInventario();
                    break;
                case 'categorias':
                    loadCategorias();
                    break;
                case 'unidades':
                    loadUnidadesMedida();
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
window.agregarDetalleVenta = agregarDetalleVenta;
window.eliminarDetalle = eliminarDetalle;
window.eliminarDetalleVenta = eliminarDetalleVenta;
window.calcularTotalLinea = calcularTotalLinea;
window.calcularTotalLineaVenta = calcularTotalLineaVenta;
window.calcularTotalesCompra = calcularTotalesCompra;
window.calcularTotalesVenta = calcularTotalesVenta;
window.deleteProveedor = deleteProveedor;
window.deleteProducto = deleteProducto;
window.loadCompras = loadCompras;
window.cargarPrecioProductoVenta = cargarPrecioProductoVenta;
window.loadInventario = loadInventario;
window.showCategoriaForm = showCategoriaForm;
window.hideCategoriaForm = hideCategoriaForm;
window.showUnidadForm = showUnidadForm;
window.hideUnidadForm = hideUnidadForm;
window.deleteCategoria = deleteCategoria;
window.deleteUnidad = deleteUnidad;
window.updateProductosSelectsVentas = updateProductosSelectsVentas;
window.updateProductosSelects = updateProductosSelects;
window.handleProveedorSubmit = handleProveedorSubmit;
window.handleProductoSubmit = handleProductoSubmit;
window.handleCompraSubmit = handleCompraSubmit;
window.handleVentaSubmit = handleVentaSubmit;
window.handleCategoriaSubmit = handleCategoriaSubmit;
window.handleUnidadSubmit = handleUnidadSubmit;
window.cargarPrecioProductoVenta = cargarPrecioProductoVenta;