using System;
using System.Collections.Generic;

namespace Login_Análisis.DTOs
{
    public class MembresiaResponse
    {
        public int Id { get; set; }
        public string Codigo { get; set; }
        public string NombreCliente { get; set; }
        public int? ClienteId { get; set; }
        public string Tipo { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public string Estado { get; set; }
        public decimal MontoPagado { get; set; }
        public string MetodoPago { get; set; }
        public string TelefonoContacto { get; set; }
        public int UsuarioCreacionId { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int? UsuarioUltimaAccionId { get; set; }
        public DateTime? FechaUltimaAccion { get; set; }
        public List<object> Operaciones { get; set; } 
    }
}
