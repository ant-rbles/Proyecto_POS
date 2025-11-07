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
            headers: authToken ? {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            } : {}
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

// Limpiar formulario de registro de usuario
function clearRegistrationForm() {
    const nombreInput = document.getElementById('adminRegNombre');
    const usuarioInput = document.getElementById('adminRegUsuario');
    const emailInput = document.getElementById('adminRegEmail');
    const rolInput = document.getElementById('adminRegRol');
    const passwordInput = document.getElementById('adminRegPassword');
    const confirmPasswordInput = document.getElementById('adminConfirmPassword');

    if (nombreInput) nombreInput.value = '';
    if (usuarioInput) usuarioInput.value = '';
    if (emailInput) emailInput.value = '';
    if (rolInput) rolInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';

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

// Registrar usuario por parte del administrador - FUNCIÓN CORREGIDA
async function registerUserByAdmin() {
    console.log('Iniciando registro de usuario...');

    const nombre = document.getElementById('adminRegNombre')?.value || '';
    const usuario = document.getElementById('adminRegUsuario')?.value || '';
    const email = document.getElementById('adminRegEmail')?.value || '';
    const rol = document.getElementById('adminRegRol')?.value || '';
    const password = document.getElementById('adminRegPassword')?.value || '';
    const confirmPassword = document.getElementById('adminConfirmPassword')?.value || '';
    const registerBtn = document.getElementById('adminRegisterBtn');

    console.log('Datos del formulario:', { nombre, usuario, email, rol, password, confirmPassword });

    if (!registerBtn) {
        console.error('No se encontró el botón de registro');
        showMessage('Error: No se puede encontrar el botón de registro', 'error');
        return;
    }

    // Validaciones
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
        showMessage('La contraseña debe tener al menos 12 caracteres', 'error');
        return;
    }

    // Deshabilitar botón durante el registro
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="loading"></span> Registrando...';

    try {
        const authToken = localStorage.getItem('authToken');
        console.log('Token de autenticación:', authToken ? 'Presente' : 'No encontrado');

        if (!authToken) {
            showMessage('No hay sesión activa. Por favor, inicie sesión nuevamente.', 'error');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Registrar Usuario';
            return;
        }

        const userData = {
            Nombre: nombre,
            Usuario: usuario,
            Email: email,
            Password: password,
            Rol: rol
        };

        console.log('Enviando datos al servidor:', userData);

        const response = await fetch('https://localhost:7000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(userData)
        });

        console.log('Respuesta del servidor - Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Usuario registrado exitosamente:', data);
            showMessage('Usuario registrado correctamente', 'success');
            clearRegistrationForm();
            await viewUsers(); // Recargar la lista de usuarios
        } else {
            let errorMessage = 'Error al registrar el usuario';
            try {
                const errorText = await response.text();
                console.error('Error del servidor:', errorText);

                if (errorText) {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.title || errorMessage;

                    // Mostrar errores de validación específicos
                    if (errorData.errors) {
                        const validationErrors = Object.values(errorData.errors).flat().join(', ');
                        errorMessage += ': ' + validationErrors;
                    }
                } else {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
            } catch (e) {
                console.error('Error parseando respuesta de error:', e);
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            showMessage(errorMessage, 'error');
        }
    } catch (err) {
        console.error('Error en registerUserByAdmin:', err);
        showMessage('Error de conexión. Intenta nuevamente.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Registrar Usuario';
    }
}

// Botones de acciones de usuario
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
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
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
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
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

function toggleRegistrationForm() {
    hideAllContentSections();
    const userForm = document.getElementById('userRegistrationForm');
    if (userForm) userForm.style.display = 'block';
}