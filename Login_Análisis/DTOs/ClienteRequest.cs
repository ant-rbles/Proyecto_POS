using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs
{
    public class ClienteRequest
    {
        [Required(ErrorMessage = "El nombre es obligatorio")]
        [MaxLength(200, ErrorMessage = "El nombre no puede exceder 200 caracteres")]
        public string Nombre { get; set; }

        [MaxLength(20, ErrorMessage = "El NIT no puede exceder 20 caracteres")]
        public string NIT { get; set; }

        [MaxLength(500, ErrorMessage = "La dirección no puede exceder 500 caracteres")]
        public string Direccion { get; set; }

        [MaxLength(20, ErrorMessage = "El teléfono no puede exceder 20 caracteres")]
        public string Telefono { get; set; }

        [EmailAddress(ErrorMessage = "Formato de email inválido")]
        [MaxLength(100, ErrorMessage = "El email no puede exceder 100 caracteres")]
        public string Email { get; set; }
    }
}