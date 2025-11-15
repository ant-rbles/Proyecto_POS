using Login_Análisis.Constants;
using Login_Análisis.Models;
using Login_Análisis.Data;
using Login_Análisis.DTOs;
using Login_Análisis.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

public class AuthService
{
    private readonly ApplicationDbContext _context;
    private readonly TokenService _tokenService;
    private readonly EmailService _emailService;
    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 3;

    public AuthService(ApplicationDbContext context, TokenService tokenService, EmailService emailService)
    {
        _context = context;
        _tokenService = tokenService;
        _emailService = emailService;
    }

    public async Task<(bool success, string message, string token, User user)> Register(
        string nombre, string usuario, string email, string password, string rol)
    {
        try
        {
            // Validar que el rol sea válido
            if (!Roles.IsValidRole(rol))
                return (false, "Rol no válido", null, null);

            // Verificar si el usuario ya existe
            if (await _context.Users.AnyAsync(u => u.Email == email))
                return (false, "El email ya está registrado", null, null);

            if (await _context.Users.AnyAsync(u => u.Usuario == usuario))
                return (false, "El nombre de usuario ya existe", null, null);

            CreatePasswordHash(password, out byte[] passwordHash, out byte[] passwordSalt);

            var user = new User
            {
                Nombre = nombre,
                Usuario = usuario,
                Email = email,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                Rol = rol,
                Estado = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = _tokenService.GenerateToken(user);
            return (true, "Usuario registrado correctamente", token, user);
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}", null, null);
        }
    }

    public async Task<(bool success, string message, string token, User user)> Login(string login, string password)
    {
        try
        {
            // Buscar por usuario o email
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Usuario == login || u.Email == login);

            if (user == null)
                return (false, "Credenciales inválidas", null, null);

            // Verificar si la cuenta está activa
            if (!user.Estado)
                return (false, "La cuenta está desactivada", null, null);

            // Verificar si la cuenta está bloqueada
            if (user.LockedUntil.HasValue && user.LockedUntil > DateTime.UtcNow)
                return (false, "Cuenta bloqueada temporalmente", null, null);

            if (user.LockedUntil.HasValue && user.LockedUntil <= DateTime.UtcNow)
            {
                user.Estado = true;
                user.IntentosFallidos = 0;
                user.LockedUntil = null;
            }

            if (!VerifyPasswordHash(password, user.PasswordHash, user.PasswordSalt))
            {
                user.IntentosFallidos++;
                user.FechaUltimoIntento = DateTime.UtcNow;

                if (user.IntentosFallidos >= MaxFailedAttempts)
                {
                    user.LockedUntil = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                    await _context.SaveChangesAsync();
                    return (false, "Demasiados intentos fallidos. Cuenta bloqueada temporalmente", null, null);
                }

                await _context.SaveChangesAsync();
                return (false, "Credenciales inválidas", null, null);
            }

            // Login exitoso
            user.IntentosFallidos = 0;
            user.LockedUntil = null;
            user.FechaUltimoLogin = DateTime.UtcNow;
            user.FechaUltimoIntento = null;
            await _context.SaveChangesAsync();

            var token = _tokenService.GenerateToken(user);
            return (true, "Login exitoso", token, user);
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}", null, null);
        }
    }

    public async Task<(bool success, string message)> UpdateUser(int userId, UpdateUserRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return (false, "Usuario no encontrado");

            // Verificar si el nuevo usuario o email ya existen en otros usuarios
            if (await _context.Users.AnyAsync(u => u.Usuario == request.Usuario && u.Id != userId))
                return (false, "El nombre de usuario ya está en uso");

            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != userId))
                return (false, "El email ya está registrado");

            // Actualizar propiedades
            user.Nombre = request.Nombre;
            user.Usuario = request.Usuario;
            user.Email = request.Email;
            user.Rol = request.Rol;
            user.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Usuario actualizado exitosamente");
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool success, string message)> ChangePassword(int userId, string currentPassword, string newPassword)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return (false, "Usuario no encontrado");

            if (!VerifyPasswordHash(currentPassword, user.PasswordHash, user.PasswordSalt))
                return (false, "Contraseña actual incorrecta");

            CreatePasswordHash(newPassword, out byte[] newPasswordHash, out byte[] newPasswordSalt);

            user.PasswordHash = newPasswordHash;
            user.PasswordSalt = newPasswordSalt;
            user.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Contraseña cambiada exitosamente");
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    // Método actualizado para recuperación de contraseña
    public async Task<(bool success, string message)> ForgotPassword(string email)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return (true, "Si el email existe, se enviarán instrucciones");

            // Generar token de recuperación
            var resetToken = GenerateResetToken();

            // Guardar token en la base de datos
            user.PasswordResetToken = resetToken;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
            await _context.SaveChangesAsync();

            // Enviar email
            var emailSent = await _emailService.SendPasswordResetEmail(user.Email, resetToken);

            if (!emailSent)
                return (false, "Error al enviar el correo de recuperación");

            return (true, "Si el email existe, se enviarán instrucciones");
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    // Nuevo método para restablecer contraseña con token
    public async Task<(bool success, string message)> ResetPassword(string token, string newPassword)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.PasswordResetToken == token &&
                u.PasswordResetTokenExpiry > DateTime.UtcNow);

            if (user == null)
                return (false, "Token inválido o expirado");

            // Actualizar contraseña
            CreatePasswordHash(newPassword, out byte[] passwordHash, out byte[] passwordSalt);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;

            await _context.SaveChangesAsync();
            return (true, "Contraseña restablecida correctamente");
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    // Nuevo método para validar token de recuperación
    public async Task<bool> ValidateResetToken(string token)
    {
        return await _context.Users.AnyAsync(u =>
            u.PasswordResetToken == token &&
            u.PasswordResetTokenExpiry > DateTime.UtcNow);
    }

    public async Task<(bool success, string message)> UpdateUserStatus(int userId, bool status)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return (false, "Usuario no encontrado");

            user.Estado = status;
            user.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, $"Usuario {(status ? "activado" : "desactivado")} exitosamente");
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    public async Task<User> GetUserById(int userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    public async Task<List<User>> GetAllUsers()
    {
        return await _context.Users.ToListAsync();
    }

    public async Task<List<User>> GetUsersByRole(string role)
    {
        return await _context.Users
            .Where(u => u.Rol == role)
            .ToListAsync();
    }

    private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512())
        {
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
    }

    private bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512(passwordSalt))
        {
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(passwordHash);
        }
    }

    // Nuevo método para generar token de recuperación
    private string GenerateResetToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray()).TrimEnd('=');
    }

    // Mantener este método por si se necesita en otro contexto
    private string GenerateTemporaryPassword()
    {
        const string validChars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*?_-";
        var random = new Random();
        var length = 12;

        var chars = new char[length];
        for (int i = 0; i < length; i++)
        {
            chars[i] = validChars[random.Next(validChars.Length)];
        }

        return new string(chars);
    }
}