using Login_Análisis.Models;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs
{
    public class CompraRequest
    {
        [Required]
        public string NumeroFactura { get; set; }

        [Required]
        public int ProveedorId { get; set; }

        [Required]
        public DateTime FechaCompra { get; set; }

        public decimal Impuestos { get; set; } = 0;

        public string Observaciones { get; set; }

        public int? UsuarioCreacion { get; set; }

        [Required]
        public List<DetalleCompra> Detalles { get; set; }
    }
}