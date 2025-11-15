// =============================================
// ELEMENTOS DEL DOM
// =============================================

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const showForgotPasswordLink = document.getElementById('showForgotPassword');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const recoveryEmailInput = document.getElementById('recoveryEmail');
const backToLoginLink = document.getElementById('backToLogin');
const backToLoginSuccessBtn = document.getElementById('backToLoginSuccess');
const successView = document.getElementById('successView');
const sentEmailSpan = document.getElementById('sentEmail');
const messageDiv = document.getElementById('message');
const emailGroup = document.querySelector('.input-group.email');
const passwordGroup = document.querySelector('.input-group.password');
const recoveryEmailGroup = document.querySelector('.input-group.recovery-email');

// =============================================
// FUNCIONES DE VALIDACIÓN Y UTILIDAD
// =============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showMessage(message, type) {
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

function hideAllForms() {
    const forms = document.querySelectorAll('.form-container');
    forms.forEach(form => {
        form.classList.add('hidden');
    });
    if (successView) {
        successView.style.display = 'none';
    }
}

function clearMessage() {
    if (messageDiv) {
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';
    }
}

function clearValidationStates() {
    const invalidElements = document.querySelectorAll('.invalid');
    invalidElements.forEach(el => {
        el.classList.remove('invalid');
    });
}

function setupInputValidation() {
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const inputGroup = input.closest('.input-group');
            if (inputGroup && inputGroup.classList.contains('invalid')) {
                inputGroup.classList.remove('invalid');
            }
        });
    });
}

// =============================================
// SISTEMA DE ROLES Y AUTORIZACIÓN
// =============================================

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    return null;
}

function getCurrentUserRole() {
    const user = getCurrentUser();
    return user ? user.rol : null;
}

function hasRole(allowedRoles) {
    const userRole = getCurrentUserRole();
    if (!userRole) return false;

    const rolesArray = typeof allowedRoles === 'string' ?
        allowedRoles.split(',').map(role => role.trim()) :
        allowedRoles;

    return rolesArray.includes(userRole);
}

function applyRoleRestrictions() {
    const userRole = getCurrentUserRole();
    if (!userRole) return;

    console.log('Aplicando restricciones para rol:', userRole);

    // Ocultar elementos que no tienen el rol adecuado
    const restrictedElements = document.querySelectorAll('[data-role]');
    restrictedElements.forEach(element => {
        const allowedRoles = element.getAttribute('data-role');
        if (!hasRole(allowedRoles)) {
            element.style.display = 'none';
        } else {
            element.style.display = '';
        }
    });

    // También ocultar secciones completas si todos sus items están ocultos
    hideEmptySections();
}

function hideEmptySections() {
    const sections = document.querySelectorAll('.sidebar-section');
    sections.forEach(section => {
        let hasVisibleItems = false;
        let nextElement = section.nextElementSibling;

        // Verificar los items siguientes hasta la próxima sección
        while (nextElement && !nextElement.classList.contains('sidebar-section')) {
            if (nextElement.classList.contains('sidebar-item') &&
                nextElement.style.display !== 'none') {
                hasVisibleItems = true;
                break;
            }
            nextElement = nextElement.nextElementSibling;
        }

        // Ocultar sección si no tiene items visibles
        if (!hasVisibleItems) {
            section.style.display = 'none';
        }
    });
}

function updateUserUI(user) {
    // Actualizar nombre en la barra de navegación
    const userNameNav = document.getElementById('userNameNav');
    if (userNameNav) {
        userNameNav.textContent = user.nombre;
    }

    // Actualizar nombre en el menú
    const userNameMenu = document.getElementById('userNameMenu');
    if (userNameMenu) {
        userNameMenu.textContent = user.nombre;
    }

    // Actualizar email en el menú
    const userEmailMenu = document.getElementById('userEmailMenu');
    if (userEmailMenu) {
        userEmailMenu.textContent = user.email;
    }

    // Actualizar avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.textContent = user.nombre.charAt(0).toUpperCase();
    }
}

function initializeAuthSystem() {
    const user = getCurrentUser();

    if (user) {
        console.log(`Usuario autenticado: ${user.nombre} (${user.rol})`);

        // Actualizar UI con información del usuario
        updateUserUI(user);

        // Aplicar restricciones de roles
        applyRoleRestrictions();
    }
}

// =============================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================

function showDashboard(user) {
    console.log('Usuario logueado:', user);

    // Inicializar sistema de autorización
    initializeAuthSystem();

    // Tu lógica de redirección existente
    let redirectUrl = '';
    switch (user.rol) {
        case 'Administrador':
            redirectUrl = '/admin/dashboard.html';
            break;
        case 'Cajero':
            redirectUrl = '/cajero/dashboard.html';
            break;
        case 'Vendedor':
            redirectUrl = '/vendedor/dashboard.html';
            break;
        default:
            redirectUrl = '/dashboard.html';
    }

    // Redirigir después de un breve delay
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 1000);
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            const userData = JSON.parse(user);
            showDashboard(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
        }
    }
}

// =============================================
// MANEJO DE EVENTOS DE FORMULARIOS
// =============================================

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        const loginBtn = document.getElementById('loginBtn');

        // Limpiar estados previos
        clearValidationStates();
        clearMessage();

        // Validaciones previas
        if (!validateEmail(email)) {
            showMessage('Por favor ingresa un email válido', 'error');
            if (emailGroup) emailGroup.classList.add('invalid');
            return;
        }
        if (!validatePassword(password)) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
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
                localStorage.setItem('usuarioId', data.user.id);

                // Mostrar dashboard después de un breve delay
                setTimeout(() => {
                    showDashboard(data.user);
                }, 1500);

            } else {
                showMessage(data.message || 'Credenciales incorrectas', 'error');

                if (data.message && data.message.includes('bloqueada')) {
                    showMessage('Cuenta temporalmente bloqueada. Intenta más tarde.', 'error');
                }
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
        clearValidationStates();
    });
}

if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        if (loginForm) loginForm.classList.remove('hidden');
        clearMessage();
        clearValidationStates();
    });
}

if (backToLoginSuccessBtn) {
    backToLoginSuccessBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        if (loginForm) loginForm.classList.remove('hidden');
        clearMessage();
        clearValidationStates();
    });
}

// Envío de solicitud de recuperación
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = recoveryEmailInput ? recoveryEmailInput.value.trim() : '';
        const recoveryBtn = document.getElementById('recoveryBtn');

        // Limpiar estados previos
        clearValidationStates();
        clearMessage();

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
                showMessage('Instrucciones enviadas correctamente', 'success');
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

// =============================================
// FUNCIONES DE GESTIÓN DE SESIÓN
// =============================================

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('usuarioId');

    // Limpiar formularios
    if (loginForm) loginForm.reset();
    if (forgotPasswordForm) forgotPasswordForm.reset();

    hideAllForms();
    if (loginForm) loginForm.classList.remove('hidden');
    showMessage('Sesión cerrada correctamente', 'success');

    // Limpiar estados de validación
    clearValidationStates();
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

// =============================================
// INICIALIZACIÓN Y CONFIGURACIÓN GLOBAL
// =============================================

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    setupInputValidation();

    // Inicializar sistema de autorización si el usuario está logueado
    if (getCurrentUser()) {
        initializeAuthSystem();
    }

    // Mostrar formulario de login por defecto
    hideAllForms();
    if (loginForm) loginForm.classList.remove('hidden');
});

// Manejo de tecla Enter en formularios
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const activeForm = document.querySelector('.form-container:not(.hidden)');
        if (activeForm) {
            const submitBtn = activeForm.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.click();
            }
        }
    }
});