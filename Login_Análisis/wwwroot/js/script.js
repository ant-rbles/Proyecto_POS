// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const successView = document.getElementById('successView');
const dashboard = document.getElementById('dashboard');
const databasePanel = document.getElementById('databasePanel');
const userRegistrationForm = document.getElementById('userRegistrationForm');
const showForgotPasswordLink = document.getElementById('showForgotPassword');
const backToLoginLink = document.getElementById('backToLogin');
const backToLoginSuccessBtn = document.getElementById('backToLoginSuccess');
const messageDiv = document.getElementById('message');
const dbTableContainer = document.getElementById('dbTableContainer');
const sentEmailSpan = document.getElementById('sentEmail');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const recoveryEmailInput = document.getElementById('recoveryEmail');
const emailGroup = document.getElementById('emailGroup');
const passwordGroup = document.getElementById('passwordGroup');
const recoveryEmailGroup = document.getElementById('recoveryEmailGroup');

// Configurar validación en tiempo real
function setupValidation() {
    // Validación para email en login
    emailInput.addEventListener('input', function () {
        validateEmailField(this, emailGroup);
    });

    emailInput.addEventListener('blur', function () {
        validateEmailField(this, emailGroup);
    });

    // Validación para password
    passwordInput.addEventListener('input', function () {
        validatePasswordField(this, passwordGroup);
    });

    passwordInput.addEventListener('blur', function () {
        validatePasswordField(this, passwordGroup);
    });

    // Validación para email en recuperación
    if (recoveryEmailInput) {
        recoveryEmailInput.addEventListener('input', function () {
            validateEmailField(this, recoveryEmailGroup);
        });

        recoveryEmailInput.addEventListener('blur', function () {
            validateEmailField(this, recoveryEmailGroup);
        });
    }
}

// Validar campo de email
function validateEmailField(input, group) {
    if (input.value === '') {
        group.classList.remove('valid');
        group.classList.remove('invalid');
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

// Validar campo de contraseña
function validatePasswordField(input, group) {
    if (input.value === '') {
        group.classList.remove('valid');
        group.classList.remove('invalid');
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

// Comprobar si ya hay una sesión activa al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (authToken && user) {
        showDashboard(user);
    }

    // Configurar validación en tiempo real
    setupValidation();
});

// Mostrar/ocultar formularios
showForgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideAllForms();
    forgotPasswordForm.classList.remove('hidden');
    clearMessage();
});

backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideAllForms();
    loginForm.classList.remove('hidden');
    clearMessage();
});

backToLoginSuccessBtn.addEventListener('click', (e) => {
    hideAllForms();
    loginForm.classList.remove('hidden');
    clearMessage();
});

function hideAllForms() {
    loginForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    successView.style.display = 'none';
    dashboard.style.display = 'none';
}

// Función para mostrar el dashboard
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
    } else {
        databasePanel.style.display = 'none';
    }
}

// Función para cerrar sesión
function logout() {
    // Eliminar datos de sesión
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Limpiar todos los campos de formulario
    document.getElementById('loginForm').reset();
    document.getElementById('forgotPasswordForm').reset();

    // Volver al formulario de login
    hideAllForms();
    loginForm.classList.remove('hidden');

    // Mostrar mensaje de confirmación
    showMessage('Sesión cerrada correctamente', 'success');
}

// Función para mostrar notificación
function showNotification() {
    showMessage('¡Función implementada correctamente!', 'success');
}

// Función para mostrar/ocultar contraseña
function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const icon = passwordInput.nextElementSibling.querySelector('i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Mostrar mensajes
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        clearMessage();
    }, 5000);
}

function clearMessage() {
    messageDiv.style.display = 'none';
    messageDiv.className = 'message';
}

// Validación de formularios
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(email) && email.includes('.');
}

function validatePassword(password) {
    return password.length >= 8;
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    // Validación básica
    if (!validateEmail(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        emailGroup.classList.add('invalid');
        return;
    }

    if (!validatePassword(password)) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        passwordGroup.classList.add('invalid');
        return;
    }

    // Deshabilitar botón durante la solicitud
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading"></span> Iniciando sesión...';

    try {
        const response = await fetch('https://localhost:7000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message, 'success');
            // Guardar token en localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Mostrar dashboard
            showDashboard(data.user);
        } else {
            showMessage(data.message || 'Credenciales incorrectas', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
        console.error('Login error:', error);
    } finally {
        // Restaurar botón
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
    }
});

// Olvidé mi contraseña
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('recoveryEmail').value;
    const recoveryBtn = document.getElementById('recoveryBtn');

    // Validación básica
    if (!validateEmail(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        recoveryEmailGroup.classList.add('invalid');
        return;
    }

    // Deshabilitar botón durante la solicitud
    recoveryBtn.disabled = true;
    recoveryBtn.innerHTML = '<span class="loading"></span> Enviando...';

    try {
        const response = await fetch('https://localhost:7000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Mostrar vista de éxito
            hideAllForms();
            successView.style.display = 'block';
            sentEmailSpan.textContent = email;
        } else {
            // Manejo específico de errores del servidor
            if (data.message && data.message.includes("no está registrado")) {
                showMessage('No se pudo enviar el correo. Verifica la dirección de correo electrónico.', 'error');
            } else {
                showMessage(data.message || 'Error al enviar el correo. Intenta nuevamente.', 'error');
            }
        }
    } catch (error) {
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
        console.error('Recovery error:', error);
    } finally {
        // Restaurar botón
        recoveryBtn.disabled = false;
        recoveryBtn.textContent = 'Enviar Instrucciones';
    }
});

// Funciones para el panel de administración (sin cambios)
function toggleRegistrationForm() {
    if (userRegistrationForm.style.display === 'block') {
        userRegistrationForm.style.display = 'none';
    } else {
        userRegistrationForm.style.display = 'block';
    }
}

function viewUsers() {
    // Esta función necesitaría conectarse a una API para obtener los datos reales
    showMessage('Esta función requiere conexión con una API de administración', 'info');
}

async function registerUserByAdmin() {
    const nombre = document.getElementById('adminRegNombre').value;
    const usuario = document.getElementById('adminRegUsuario').value;
    const email = document.getElementById('adminRegEmail').value;
    const rol = document.getElementById('adminRegRol').value;
    const password = document.getElementById('adminRegPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    const registerBtn = document.getElementById('adminRegisterBtn');

    // Validaciones
    if (nombre.trim() === '') {
        showMessage('Por favor ingresa el nombre completo', 'error');
        return;
    }

    if (usuario.trim() === '') {
        showMessage('Por favor ingresa un nombre de usuario', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }

    if (rol === '') {
        showMessage('Por favor selecciona un rol', 'error');
        return;
    }

    if (!validatePassword(password)) {
        showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }

    // Deshabilitar botón durante la solicitud
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="loading"></span> Registrando...';

    try {
        // Obtener el token de autenticación del administrador
        const authToken = localStorage.getItem('authToken');

        // Realizar la solicitud a la API para registrar el usuario
        const response = await fetch('https://localhost:7000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                nombre,
                usuario,
                email,
                password,
                rol
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Usuario registrado correctamente', 'success');

            // Limpiar formulario
            document.getElementById('adminRegNombre').value = '';
            document.getElementById('adminRegUsuario').value = '';
            document.getElementById('adminRegEmail').value = '';
            document.getElementById('adminRegRol').value = '';
            document.getElementById('adminRegPassword').value = '';
            document.getElementById('adminConfirmPassword').value = '';

            // Ocultar indicadores de validación
            document.getElementById('adminPasswordMatch').style.display = 'none';
            document.getElementById('adminPasswordMatchSuccess').style.display = 'none';
            document.getElementById('adminPasswordStrengthBar').style.width = '0';
        } else {
            // Mostrar errores específicos del servidor
            if (data.errors) {
                showMessage(data.errors.join(', '), 'error');
            } else {
                showMessage(data.message || 'Error al registrar el usuario', 'error');
            }
        }
    } catch (error) {
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
        console.error('Registration error:', error);
    } finally {
        // Restaurar botón
        registerBtn.disabled = false;
        registerBtn.textContent = 'Registrar Usuario';
    }
}