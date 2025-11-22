using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Models
{
    public class Membresia
    {
        public int Id { get; set; }

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

        [Required]
        public string Estado { get; set; } 

        [Range(0, double.MaxValue)]
        public decimal MontoPagado { get; set; }

        public string MetodoPago { get; set; }

        public string TelefonoContacto { get; set; }

        // Auditoría
        public int UsuarioCreacionId { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int? UsuarioUltimaAccionId { get; set; }
        public DateTime? FechaUltimaAccion { get; set; }

        public ICollection<MembresiaOperacion> Operaciones { get; set; }
    }
}
