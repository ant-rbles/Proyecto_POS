// users.js - Gestión de usuarios (solo para administradores)

// Variables globales para usuarios
let currentUserId = null;

// Inicializar módulo de usuarios
document.addEventListener('DOMContentLoaded', () => {
    setupUsersEventListeners();
});

function setupUsersEventListeners() {
    const userForm = document.getElementById('adminUserForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }

    // Configurar validación de contraseña en tiempo real
    const passwordInput = document.getElementById('adminRegPassword');
    const confirmPasswordInput = document.getElementById('adminConfirmPassword');

    if (passwordInput) {
        passwordInput.addEventListener('input', validateAdminPassword);
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validateAdminPassword);
    }
}

// Mostrar vista de usuarios
async function viewUsers() {
    if (!isAdmin()) {
        showMessage('No tienes permisos para acceder a esta sección', 'error');
        return;
    }

    hideAllContentSections();
    currentSection = 'users';

    const viewContainer = document.getElementById('viewUsersContainer');
    if (viewContainer) viewContainer.style.display = 'block';

    await loadUsers();
}

// Cargar usuarios
async function loadUsers() {
    try {
        const users = await apiCall('https://localhost:7000/api/auth/users');
        displayUsers(users);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showMessage('Error al cargar usuarios', 'error');
    }
}

// Mostrar formulario de usuario
function showUserForm(user = null) {
    const form = document.getElementById('userForm');
    const title = document.getElementById('userFormTitle');

    if (form) {
        if (user) {
            title.textContent = 'Editar Usuario';
            currentUserId = user.id;
            fillUserForm(user);
        } else {
            title.textContent = 'Nuevo Usuario';
            currentUserId = null;
            resetUserForm();
        }
        form.style.display = 'block';
    }
}

function resetUserForm() {
    const form = document.getElementById('userFormElement');
    if (form) form.reset();
    document.getElementById('userRol').value = 'Vendedor';

    // Limpiar indicadores de contraseña
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

// Llenar formulario de usuario
function fillUserForm(user) {
    document.getElementById('userId').value = user.id;
    document.getElementById('userNombre').value = user.nombre || '';
    document.getElementById('userUsuario').value = user.usuario || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userRol').value = user.rol || 'Vendedor';

    // Ocultar campos de contraseña en edición
    const passwordSection = document.getElementById('userPasswordSection');
    if (passwordSection) {
        passwordSection.style.display = 'none';
    }
}

// Ocultar formulario de usuario
function hideUserForm() {
    const form = document.getElementById('userForm');
    if (form) form.style.display = 'none';
    currentUserId = null;
}

// Manejar envío del formulario de usuario
async function handleUserSubmit(e) {
    e.preventDefault();

    const userData = {
        nombre: document.getElementById('userNombre').value.trim(),
        usuario: document.getElementById('userUsuario').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        rol: document.getElementById('userRol').value
    };

    // Para nuevos usuarios, incluir la contraseña
    if (!currentUserId) {
        userData.password = document.getElementById('userPassword').value;
    }

    // Validaciones
    if (!userData.nombre || !userData.usuario || !userData.email || !userData.rol) {
        showMessage('Todos los campos son obligatorios', 'error');
        return;
    }

    if (!currentUserId && !userData.password) {
        showMessage('La contraseña es obligatoria para nuevos usuarios', 'error');
        return;
    }

    if (!isValidEmail(userData.email)) {
        showMessage('El email no tiene un formato válido', 'error');
        return;
    }

    try {
        const submitBtn = document.querySelector('#userFormElement button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Guardando...';

        let response;
        if (currentUserId) {
            // Actualizar usuario existente
            response = await apiCall(`https://localhost:7000/api/auth/users/${currentUserId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } else {
            // Crear nuevo usuario
            response = await apiCall('https://localhost:7000/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }

        showMessage('Usuario guardado exitosamente', 'success');
        hideUserForm();
        await loadUsers();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar usuario', 'error');
    } finally {
        const submitBtn = document.querySelector('#userFormElement button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = currentUserId ? 'Actualizar Usuario' : 'Guardar Usuario';
        }
    }
}

// Renderizar tabla de usuarios
function displayUsers(users) {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users" style="font-size: 48px; margin-bottom: 20px; display: block; color: #6c757d;"></i>
                <p>No hay usuarios registrados</p>
            </div>
        `;
        return;
    }

    let tableHTML = `
        <div class="table-responsive">
            <table class="data-table">
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

    users.forEach(user => {
        const lastLogin = user.fechaUltimoLogin
            ? new Date(user.fechaUltimoLogin).toLocaleDateString()
            : 'Nunca';

        tableHTML += `
            <tr>
                <td>${user.id}</td>
                <td>${user.nombre}</td>
                <td>${user.usuario}</td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${getRoleBadgeClass(user.rol)}">
                        ${user.rol}
                    </span>
                </td>
                <td>
                    <span class="badge ${user.estado ? 'badge-success' : 'badge-danger'}">
                        ${user.estado ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${lastLogin}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editUser(${user.id})" title="Editar usuario">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn ${user.estado ? 'delete-btn' : 'activate-btn'}" 
                            onclick="${user.estado ? 'deactivateUser' : 'activateUser'}(${user.id})"
                            title="${user.estado ? 'Desactivar usuario' : 'Activar usuario'}">
                        <i class="fas ${user.estado ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;
}

// Obtener clase CSS para el rol
function getRoleBadgeClass(rol) {
    switch (rol) {
        case 'Administrador':
            return 'badge-primary';
        case 'Cajero':
            return 'badge-info';
        case 'Vendedor':
            return 'badge-success';
        default:
            return 'badge-secondary';
    }
}

// Editar usuario
async function editUser(id) {
    try {
        const user = await apiCall(`https://localhost:7000/api/auth/users/${id}`);
        showUserForm(user);
    } catch (error) {
        showMessage('Error al cargar el usuario', 'error');
    }
}

// Desactivar usuario
async function deactivateUser(id) {
    if (!confirm('¿Está seguro de desactivar este usuario? El usuario no podrá iniciar sesión.')) {
        return;
    }

    try {
        await apiCall(`https://localhost:7000/api/auth/users/${id}`, {
            method: 'DELETE'
        });

        showMessage('Usuario desactivado exitosamente', 'success');
        await loadUsers();
    } catch (error) {
        showMessage(error.message || 'Error al desactivar usuario', 'error');
    }
}

// Activar usuario
async function activateUser(id) {
    try {
        await apiCall(`https://localhost:7000/api/auth/users/${id}/activate`, {
            method: 'PUT'
        });

        showMessage('Usuario activado exitosamente', 'success');
        await loadUsers();
    } catch (error) {
        showMessage(error.message || 'Error al activar usuario', 'error');
    }
}

// Validar contraseña en formulario de administrador
function validateAdminPassword() {
    const password = document.getElementById('adminRegPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    const strengthBar = document.getElementById('adminPasswordStrengthBar');
    const matchElement = document.getElementById('adminPasswordMatch');
    const matchSuccessElement = document.getElementById('adminPasswordMatchSuccess');

    // Validar fortaleza de contraseña
    if (strengthBar) {
        const strength = calculatePasswordStrength(password);
        strengthBar.style.width = strength + '%';

        if (strength < 40) {
            strengthBar.style.backgroundColor = '#dc3545';
        } else if (strength < 70) {
            strengthBar.style.backgroundColor = '#ffc107';
        } else {
            strengthBar.style.backgroundColor = '#28a745';
        }
    }

    // Validar coincidencia de contraseñas
    if (confirmPassword === '') {
        if (matchElement) matchElement.style.display = 'none';
        if (matchSuccessElement) matchSuccessElement.style.display = 'none';
    } else if (password === confirmPassword) {
        if (matchElement) matchElement.style.display = 'none';
        if (matchSuccessElement) matchSuccessElement.style.display = 'block';
    } else {
        if (matchElement) matchElement.style.display = 'block';
        if (matchSuccessElement) matchSuccessElement.style.display = 'none';
    }
}

// Calcular fortaleza de contraseña
function calculatePasswordStrength(password) {
    if (!password) return 0;

    let strength = 0;

    // Longitud
    strength += Math.min(password.length * 3, 20);

    // Complejidad
    if (password.length >= 8) strength += 10;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*]/.test(password)) strength += 20;

    return Math.min(strength, 100);
}

// Obtener roles disponibles
async function getRoles() {
    try {
        const roles = await apiCall('https://localhost:7000/api/auth/roles');
        return roles;
    } catch (error) {
        return ['Administrador', 'Cajero', 'Vendedor'];
    }
}

// Cambiar contraseña de usuario
async function changeUserPassword(userId, newPassword) {
    try {
        await apiCall(`https://localhost:7000/api/auth/users/${userId}/password`, {
            method: 'PUT',
            body: JSON.stringify({ newPassword })
        });

        showMessage('Contraseña cambiada exitosamente', 'success');
        return true;
    } catch (error) {
        showMessage(error.message || 'Error al cambiar contraseña', 'error');
        return false;
    }
}

// Verificar permisos de usuario actual
function checkUserPermissions() {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!currentUser) return false;

    // Solo administradores pueden gestionar usuarios
    return currentUser.rol === 'Administrador';
}