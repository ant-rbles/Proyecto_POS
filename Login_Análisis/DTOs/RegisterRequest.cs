using Login_Análisis.Constants;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs.Requests
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "El nombre es obligatorio")]
        [MaxLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
        public required string Nombre { get; set; }

        [Required(ErrorMessage = "El usuario es obligatorio")]
        [MaxLength(50, ErrorMessage = "El usuario no puede exceder 50 caracteres")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Solo se permiten letras, números y guiones bajos")]
        public required  string Usuario { get; set; }

        [Required(ErrorMessage = "El email es obligatorio")]
        [EmailAddress(ErrorMessage = "Formato de email inválido")]
        [MaxLength(256, ErrorMessage = "El email no puede exceder 256 caracteres")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$",
            ErrorMessage = "La contraseña debe contener al menos una mayúscula, una minúscula y un número")]
        public required string Password { get; set; }

        [Required(ErrorMessage = "El rol es obligatorio")]
        public string Rol { get; set; } = Roles.Vendedor;
    }
}