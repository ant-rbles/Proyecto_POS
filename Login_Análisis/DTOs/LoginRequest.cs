using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs.Requests
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "El usuario o email es obligatorio")]
        public string Login { get; set; }

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        public string Password { get; set; }
    }
}