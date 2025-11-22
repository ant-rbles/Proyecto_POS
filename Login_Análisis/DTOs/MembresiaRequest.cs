using System;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs
{
    public class MembresiaRequest
    {
        [Required]
        public string Codigo { get; set; }

        [Required]
        public string NombreCliente { get; set; }

        public int? ClienteId { get; set; }

        [Required]
        public string Tipo { get; set; } 

        [Required]
        public DateTime FechaInicio { get; set; }

        [Required]
        public DateTime FechaVencimiento { get; set; }

        [Range(0, double.MaxValue)]
        public decimal MontoPagado { get; set; }

        public string MetodoPago { get; set; }

        public string TelefonoContacto { get; set; }
    }
}
