using Login_Análisis.Constants;
using Login_Análisis.DTOs.Requests;
using Login_Análisis.DTOs.Responses;
using Login_Análisis.Filters;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Net;
using LoginRequest = Login_Análisis.DTOs.Requests.LoginRequest;
using RegisterRequest = Login_Análisis.DTOs.Requests.RegisterRequest;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Validar manualmente el modelo para obtener errores detallados
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(new ErrorResponse
            {
                Message = "Datos de registro inválidos",
                Errors = errors
            });
        }

        // Validar que el rol sea válido
        if (!Roles.IsValidRole(request.Rol))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "Rol no válido",
                Errors = new List<string> { "Los roles válidos son: Administrador, Cajero, Vendedor" }
            });
        }

        var result = await _authService.Register(
            request.Nombre,
            request.Usuario,
            request.Email,
            request.Password,
            request.Rol);

        if (!result.success)
            return BadRequest(new ErrorResponse { Message = result.message });

        return Ok(new Responses
        {
            Success = true,
            Message = result.message,
            Token = result.token,
            User = new UserResponse
            {
                Id = result.user.Id,
                Nombre = result.user.Nombre,
                Usuario = result.user.Usuario,
                Email = result.user.Email,
                Rol = result.user.Rol,
                Estado = result.user.Estado,
                FechaCreacion = result.user.FechaCreacion,
                FechaUltimoLogin = result.user.FechaUltimoLogin
            }
        });
    }

    [HttpGet("users")]
    [AuthorizeRole(Roles.Administrador)]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _authService.GetAllUsers();
        return Ok(users);
    }

    [HttpPut("users/{id}")]
    [AuthorizeRole(Roles.Administrador)]
    public async Task<IActionResult> GetUser(int id)
    {
        try
        {
            var user = await _authService.GetUserById(id);
            if (user == null)
                return NotFound(new ErrorResponse { Message = "Usuario no encontrado" });

            var userResponse = new UserResponse
            {
                Id = user.Id,
                Nombre = user.Nombre,
                Usuario = user.Usuario,
                Email = user.Email,
                Rol = user.Rol,
                Estado = user.Estado,
                FechaCreacion = user.FechaCreacion,
                FechaUltimoLogin = user.FechaUltimoLogin
            };

            return Ok(userResponse);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ErrorResponse { Message = $"Error interno: {ex.Message}" });
        }
    }

    [HttpPut("users/{id}")]
    [AuthorizeRole(Roles.Administrador)]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ErrorResponse
            {
                Message = "Datos inválidos",
                Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()
            });
        }

        // Validar que el rol sea válido
        if (!Roles.IsValidRole(request.Rol))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "Rol no válido",
                Errors = new List<string> { "Los roles válidos son: Administrador, Cajero, Vendedor" }
            });
        }

        var result = await _authService.UpdateUser(id, request);
        if (!result.success)
            return BadRequest(new ErrorResponse { Message = result.message });

        return Ok(new { message = result.message });
    }

    [HttpDelete("users/{id}")]
    [AuthorizeRole(Roles.Administrador)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var result = await _authService.UpdateUserStatus(id, false);
        if (!result.success)
            return BadRequest(new ErrorResponse { Message = result.message });

        return Ok(new { message = result.message });
    }

    [HttpPut("users/{id}/activate")]
    [AuthorizeRole(Roles.Administrador)]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var result = await _authService.UpdateUserStatus(id, true);
        if (!result.success)
            return BadRequest(new ErrorResponse { Message = result.message });

        return Ok(new { message = result.message });
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(new ErrorResponse
            {
                Message = "Datos de login inválidos",
                Errors = errors
            });
        }

        var result = await _authService.Login(request.Login, request.Password);

        if (!result.success)
            return Unauthorized(new ErrorResponse { Message = result.message });

        return Ok(new Responses
        {
            Success = true,
            Message = result.message,
            Token = result.token,
            User = new UserResponse
            {
                Id = result.user.Id,
                Nombre = result.user.Nombre,
                Usuario = result.user.Usuario,
                Email = result.user.Email,
                Rol = result.user.Rol,
                Estado = result.user.Estado,
                FechaCreacion = result.user.FechaCreacion,
                FechaUltimoLogin = result.user.FechaUltimoLogin
            }
        });
    }

    [HttpGet("roles")]
    public IActionResult GetRoles()
    {
        return Ok(Roles.GetAllRoles());
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(new ErrorResponse
            {
                Message = "Datos inválidos",
                Errors = errors
            });
        }

        var result = await _authService.ForgotPassword(request.Email);

        if (!result.success)
            return BadRequest(new ErrorResponse { Message = result.message });

        return Ok(new { message = result.message });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(new ErrorResponse
            {
                Message = "Datos inválidos",
                Errors = errors
            });
        }

        var result = await _authService.ResetPassword(request.Token, request.NewPassword);

        if (!result.success)
            return BadRequest(new ErrorResponse { Message = result.message });

        return Ok(new { message = result.message });
    }

    [HttpGet("validate-reset-token")]
    public async Task<IActionResult> ValidateResetToken(string token)
    {
        var isValid = await _authService.ValidateResetToken(token);
        return Ok(new { valid = isValid });
    }

    // ACCIÓN PARA MOSTRAR FORMULARIO DE RESTABLECIMIENTO
    [HttpGet("/reset-password", Name = "ResetPasswordPage")]
    public IActionResult ResetPasswordPage(string token)
    {
        if (string.IsNullOrEmpty(token))
            return BadRequest("Token inválido");

        // Decodificar el token
        var decodedToken = WebUtility.UrlDecode(token);

        // HTML para restablecer contraseña
        var html = $@"
    <!DOCTYPE html>
    <html lang='es'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Restablecer contraseña - Centro Plástico Leonor</title>
        <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }}

            body {{ 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }}

            .container {{ 
                background: white; 
                border-radius: 15px;
                box-shadow: 0 15px 30px rgba(0,0,0,0.2);
                padding: 30px;
                width: 100%;
                max-width: 450px;
            }}

            .header {{
                text-align: center;
                margin-bottom: 25px;
            }}

            .logo {{
                font-size: 24px;
                font-weight: bold;
                color: #4e73df;
                margin-bottom: 10px;
            }}

            h2 {{ 
                color: #4e73df; 
                text-align: center;
                margin-bottom: 20px;
                font-size: 24px;
            }}

            .form-group {{ 
                margin-bottom: 20px; 
                position: relative;
            }}

            label {{ 
                display: block; 
                margin-bottom: 8px; 
                font-weight: 500;
                color: #5a5c69;
                font-size: 16px;
            }}

            input[type='password'] {{
                width: 100%;
                padding: 14px 15px;
                border: 1px solid #d1d3e2;
                border-radius: 8px;
                font-size: 16px;
                transition: all 0.3s;
            }}

            input[type='password']:focus {{
                border-color: #4e73df;
                outline: none;
                box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
            }}

            .toggle-password {{
                position: absolute;
                right: 15px;
                top: 45px;
                cursor: pointer;
                color: #b7b9cc;
                font-size: 18px;
            }}

            .toggle-password:hover {{
                color: #4e73df;
            }}

            button {{
                width: 100%;
                padding: 16px;
                background: #4e73df;
                background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                margin-top: 10px;
            }}

            button:hover {{
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }}

            button:disabled {{
                background: #b7b9cc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }}

            .message {{
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
                text-align: center;
                font-weight: 500;
                display: none;
                font-size: 16px;
            }}

            .success {{
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }}

            .error {{
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }}

            .password-match {{
                font-size: 14px;
                margin-top: 5px;
                display: none;
            }}

            .match {{
                color: #28a745;
            }}

            .no-match {{
                color: #dc3545;
            }}

            .password-strength {{
                height: 5px;
                margin-top: 5px;
                border-radius: 3px;
                background: #eee;
                overflow: hidden;
            }}

            .password-strength-bar {{
                height: 100%;
                width: 0;
                transition: width 0.3s, background 0.3s;
            }}

            .password-rules {{
                font-size: 13px;
                color: #6c757d;
                margin-top: 5px;
                line-height: 1.4;
            }}

            .requirement {{
                margin-bottom: 3px;
                display: flex;
                align-items: center;
            }}

            .requirement i {{
                margin-right: 5px;
                font-size: 12px;
            }}

            .valid {{
                color: #28a745;
            }}

            .invalid {{
                color: #dc3545;
            }}

            .loading {{
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255,255,255,.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
                margin-right: 10px;
                vertical-align: middle;
            }}

            @keyframes spin {{
                to {{ transform: rotate(360deg); }}
            }}
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <div class='logo'>Centro Plástico Leonor</div>
                <h2>Restablecer Contraseña</h2>
            </div>
            
            <div id='message' class='message'></div>
            
            <form id='resetForm'>
                <input type='hidden' id='token' value='{decodedToken}'>
                
                <div class='form-group'>
                    <label for='newPassword'>Nueva Contraseña:</label>
                    <input type='password' id='newPassword' name='newPassword' required 
                           placeholder='Mínimo 8 caracteres' 
                           oninput='checkPasswordStrength()'>
                    <span class='toggle-password' onclick='togglePassword(""newPassword"")'>
                        <i class='fas fa-eye'></i>
                    </span>
                    <div class='password-strength'>
                        <div class='password-strength-bar' id='passwordStrengthBar'></div>
                    </div>
                    <div class='password-rules'>
                        <div class='requirement' id='lengthReq'>
                            <i class='fas fa-circle'></i> Al menos 8 caracteres
                        </div>
                        <div class='requirement' id='upperReq'>
                            <i class='fas fa-circle'></i> Al menos una mayúscula
                        </div>
                        <div class='requirement' id='lowerReq'>
                            <i class='fas fa-circle'></i> Al menos una minúscula
                        </div>
                        <div class='requirement' id='numberReq'>
                            <i class='fas fa-circle'></i> Al menos un número
                        </div>
                        <div class='requirement' id='specialReq'>
                            <i class='fas fa-circle'></i> Al menos un carácter especial (!@#$%^&*)
                        </div>
                    </div>
                </div>
                
                <div class='form-group'>
                    <label for='confirmPassword'>Confirmar Contraseña:</label>
                    <input type='password' id='confirmPassword' name='confirmPassword' required 
                           placeholder='Repite tu contraseña' 
                           oninput='checkPasswordMatch()'>
                    <span class='toggle-password' onclick='togglePassword(""confirmPassword"")'>
                        <i class='fas fa-eye'></i>
                    </span>
                    <div class='password-match no-match' id='passwordMatch'>Las contraseñas no coinciden</div>
                    <div class='password-match match' id='passwordMatchSuccess'>Las contraseñas coinciden</div>
                </div>
                
                <button type='submit' id='submitBtn' disabled>Cambiar Contraseña</button>
            </form>
        </div>
        
        <script>
            function togglePassword(fieldId) {{
                const passwordInput = document.getElementById(fieldId);
                const icon = passwordInput.parentNode.querySelector('.toggle-password i');
                
                if (passwordInput.type === 'password') {{
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }} else {{
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }}
            }}
            
            function checkPasswordStrength() {{
                const password = document.getElementById('newPassword').value;
                const strengthBar = document.getElementById('passwordStrengthBar');
                const submitBtn = document.getElementById('submitBtn');
                
                // Reiniciar requisitos
                document.querySelectorAll('.requirement i').forEach(icon => {{
                    icon.className = 'fas fa-circle invalid';
                }});
                
                if (password.length === 0) {{
                    strengthBar.style.width = '0%';
                    strengthBar.style.background = '#dc3545';
                    updateSubmitButton();
                    return;
                }}
                
                // Verificar requisitos
                const hasMinLength = password.length >= 8;
                const hasUpperCase = /[A-Z]/.test(password);
                const hasLowerCase = /[a-z]/.test(password);
                const hasNumber = /[0-9]/.test(password);
                const hasSpecialChar = /[!@#$%^&*]/.test(password);
                
                // Actualizar iconos de requisitos
                document.getElementById('lengthReq').querySelector('i').className = 
                    hasMinLength ? 'fas fa-check-circle valid' : 'fas fa-times-circle invalid';
                document.getElementById('upperReq').querySelector('i').className = 
                    hasUpperCase ? 'fas fa-check-circle valid' : 'fas fa-times-circle invalid';
                document.getElementById('lowerReq').querySelector('i').className = 
                    hasLowerCase ? 'fas fa-check-circle valid' : 'fas fa-times-circle invalid';
                document.getElementById('numberReq').querySelector('i').className = 
                    hasNumber ? 'fas fa-check-circle valid' : 'fas fa-times-circle invalid';
                document.getElementById('specialReq').querySelector('i').className = 
                    hasSpecialChar ? 'fas fa-check-circle valid' : 'fas fa-times-circle invalid';
                
                // Calcular fortaleza (0-100)
                let strength = 0;
                
                // Longitud
                strength += Math.min(password.length * 3, 20);
                
                // Complejidad
                if (hasMinLength) strength += 10;
                if (hasUpperCase) strength += 15;
                if (hasLowerCase) strength += 15;
                if (hasNumber) strength += 15;
                if (hasSpecialChar) strength += 20;
                
                // Limitar a 100
                strength = Math.min(strength, 100);
                
                // Actualizar barra visual
                strengthBar.style.width = strength + '%';
                
                // Cambiar color según fortaleza
                if (strength < 40) {{
                    strengthBar.style.background = '#dc3545'; // Rojo
                }} else if (strength < 70) {{
                    strengthBar.style.background = '#ffc107'; // Amarillo
                }} else {{
                    strengthBar.style.background = '#28a745'; // Verde
                }}
                
                // También verificar coincidencia si el campo de confirmación tiene valor
                checkPasswordMatch();
            }}
            
            function checkPasswordMatch() {{
                const password = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const matchError = document.getElementById('passwordMatch');
                const matchSuccess = document.getElementById('passwordMatchSuccess');
                
                if (confirmPassword === '') {{
                    matchError.style.display = 'none';
                    matchSuccess.style.display = 'none';
                    updateSubmitButton();
                    return;
                }}
                
                if (password === confirmPassword) {{
                    matchError.style.display = 'none';
                    matchSuccess.style.display = 'block';
                }} else {{
                    matchError.style.display = 'block';
                    matchSuccess.style.display = 'none';
                }}
                
                updateSubmitButton();
            }}
            
            function updateSubmitButton() {{
                const password = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const submitBtn = document.getElementById('submitBtn');
                
                // Verificar requisitos
                const hasMinLength = password.length >= 8;
                const hasUpperCase = /[A-Z]/.test(password);
                const hasLowerCase = /[a-z]/.test(password);
                const hasNumber = /[0-9]/.test(password);
                const hasSpecialChar = /[!@#$%^&*]/.test(password);
                const passwordsMatch = password === confirmPassword && confirmPassword !== '';
                
                // Habilitar botón solo si todos los requisitos se cumplen y las contraseñas coinciden
                if (hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && passwordsMatch) {{
                    submitBtn.disabled = false;
                }} else {{
                    submitBtn.disabled = true;
                }}
            }}
            
            document.getElementById('resetForm').addEventListener('submit', async function(e) {{
                e.preventDefault();
                
                const token = document.getElementById('token').value;
                const newPassword = document.getElementById('newPassword').value;
                const messageDiv = document.getElementById('message');
                const submitBtn = document.getElementById('submitBtn');
                
                // Deshabilitar botón durante la solicitud
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class=\""loading\""></span> Procesando...';
                
                try {{
                    const response = await fetch('/api/auth/reset-password', {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json'
                        }},
                        body: JSON.stringify({{
                            Token: token,
                            NewPassword: newPassword
                        }})
                    }});
                    
                    const data = await response.json();
                    
                    if (response.ok) {{
                        messageDiv.textContent = 'Contraseña restablecida correctamente. Serás redirigido al inicio de sesión.';
                        messageDiv.className = 'message success';
                        document.getElementById('resetForm').reset();
                        
                        // Redirigir después de 3 segundos
                        setTimeout(() => {{
                            window.location.href = '/';
                        }}, 3000);
                    }} else {{
                        messageDiv.textContent = data.message || 'Error al restablecer la contraseña';
                        messageDiv.className = 'message error';
                    }}
                }} catch (error) {{
                    messageDiv.textContent = 'Error de conexión. Intenta nuevamente.';
                    messageDiv.className = 'message error';
                }} finally {{
                    // Restaurar botón
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Cambiar Contraseña';
                }}
                
                messageDiv.style.display = 'block';
            }});
        </script>
    </body>
    </html>";

        return Content(html, "text/html");
    }
}
