using Login_Análisis.Models;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs
{
    public class VentaRequest
    {
        [Required]
        public DateTime FechaVenta { get; set; } = DateTime.UtcNow;

        public int? ClienteId { get; set; }
        public string NombreCliente { get; set; }
        public string NITCliente { get; set; }

        public decimal DescuentoGlobal { get; set; } = 0;
        public bool AplicarIVA { get; set; } = true;

        public string Observaciones { get; set; }
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

        public decimal PrecioUnitario { get; set; }

        public decimal DescuentoAplicado { get; set; } = 0;
    }
}