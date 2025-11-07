// auth.js - Todo lo relacionado con autenticación

// Elementos del DOM para auth
const loginForm = document.getElementById('loginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const successView = document.getElementById('successView');
const showForgotPasswordLink = document.getElementById('showForgotPassword');
const backToLoginLink = document.getElementById('backToLogin');
const backToLoginSuccessBtn = document.getElementById('backToLoginSuccess');

// Configurar validaciones cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    setupAuthValidation();
    checkExistingAuth();
});

function setupAuthValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const recoveryEmailInput = document.getElementById('recoveryEmail');

    if (emailInput) {
        setupFieldValidation(emailInput, isValidEmail, 'Email inválido');
    }
    if (passwordInput) {
        setupFieldValidation(passwordInput, isValidPassword, 'Mínimo 8 caracteres');
    }
    if (recoveryEmailInput) {
        setupFieldValidation(recoveryEmailInput, isValidEmail, 'Email inválido');
    }
}

function checkExistingAuth() {
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (authToken && user) {
        showDashboard(user);
    } else {
        showLoginForm();
    }
}

// Manejar login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
}

async function handleLogin() {
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    const loginBtn = document.getElementById('loginBtn');

    // Validaciones
    if (!isValidEmail(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }
    if (!isValidPassword(password)) {
        showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    // Deshabilitar botón durante la petición
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> Iniciando sesión...';
    }

    try {
        const response = await apiCall('https://localhost:7000/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ login: email, password })
        });

        showMessage(response.message, 'success');
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        showDashboard(response.user);

    } catch (error) {
        showMessage('Credenciales incorrectas o error de conexión', 'error');
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Iniciar Sesión';
        }
    }
}

// Manejar recuperación de contraseña
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handlePasswordRecovery();
    });
}

async function handlePasswordRecovery() {
    const email = document.getElementById('recoveryEmail')?.value.trim() || '';
    const recoveryBtn = document.getElementById('recoveryBtn');

    if (!isValidEmail(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }

    if (recoveryBtn) {
        recoveryBtn.disabled = true;
        recoveryBtn.innerHTML = '<span class="loading"></span> Enviando...';
    }

    try {
        const response = await apiCall('https://localhost:7000/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });

        hideAllAuthForms();
        if (successView) successView.style.display = 'block';
        const sentEmailSpan = document.getElementById('sentEmail');
        if (sentEmailSpan) sentEmailSpan.textContent = email;

    } catch (error) {
        showMessage('Error al enviar el correo de recuperación', 'error');
    } finally {
        if (recoveryBtn) {
            recoveryBtn.disabled = false;
            recoveryBtn.textContent = 'Enviar Instrucciones';
        }
    }
}

// Navegación entre formularios de auth
if (showForgotPasswordLink) {
    showForgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordForm();
    });
}

if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
}

if (backToLoginSuccessBtn) {
    backToLoginSuccessBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
}

// Funciones de navegación de auth
function showLoginForm() {
    hideAllAuthForms();
    if (loginForm) {
        loginForm.classList.remove('hidden');
        // Enfocar el primer campo
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.focus();
    }
}

function showForgotPasswordForm() {
    hideAllAuthForms();
    if (forgotPasswordForm) {
        forgotPasswordForm.classList.remove('hidden');
        const recoveryEmailInput = document.getElementById('recoveryEmail');
        if (recoveryEmailInput) recoveryEmailInput.focus();
    }
    clearMessage();
}

function hideAllAuthForms() {
    if (loginForm) loginForm.classList.add('hidden');
    if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
    if (successView) successView.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
}

// Cerrar sesión
function logout() {
    // Mostrar confirmación
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        return;
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Limpiar formularios
    if (loginForm) loginForm.reset();
    if (forgotPasswordForm) forgotPasswordForm.reset();

    hideAllAuthForms();
    showLoginForm();
    showMessage('Sesión cerrada correctamente', 'success');

    // Limpiar cualquier estado de la aplicación
    clearAppState();
}

function clearAppState() {
    // Limpiar variables globales si es necesario
    if (window.ventaDetalles) window.ventaDetalles = [];
    if (window.currentVentaId) window.currentVentaId = null;
    // Agregar más limpiezas según sea necesario
}

// Verificar permisos de usuario
function hasRole(requiredRole) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user && user.rol === requiredRole;
}

function isAdmin() {
    return hasRole('Administrador');
}

function isCajero() {
    return hasRole('Cajero');
}

function isVendedor() {
    return hasRole('Vendedor');
}