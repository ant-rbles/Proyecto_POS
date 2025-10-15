using Login_Análisis.Models;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs
{
    public class VentaRequest
    {
        [Required]
        public string NumeroFactura { get; set; }

        [Required]
        public DateTime FechaVenta { get; set; }

        public decimal Impuestos { get; set; } = 0;

        public string Observaciones { get; set; }

        public int? ClienteId { get; set; }
        public string NombreCliente { get; set; }

        public int? UsuarioCreacion { get; set; }

        [Required]
        public List<DetalleVentaRequest> Detalles { get; set; }
    }

    public class DetalleVentaRequest
    {
        [Required]
        public int ProductoId { get; set; }

        [Required]
        public int UnidadMedidaId { get; set; }

        [Required]
        public decimal Cantidad { get; set; }

        [Required]
        public decimal PrecioUnitario { get; set; }
    }
}