using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs
{
    public class PresupuestoRequest
    {
        [Required]
        public DateTime FechaPresupuesto { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime FechaVencimiento { get; set; } = DateTime.UtcNow.AddDays(15);

        public int? ClienteId { get; set; }

        [MaxLength(200)]
        public string NombreCliente { get; set; }

        [MaxLength(20)]
        public string NITCliente { get; set; }

        [MaxLength(500)]
        public string DireccionCliente { get; set; }

        public bool AplicarIVA { get; set; } = true;

        [MaxLength(1000)]
        public string Observaciones { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Debe agregar al menos un producto")]
        public List<DetallePresupuestoRequest> Detalles { get; set; }
    }

    public class DetallePresupuestoRequest
    {
        [Required]
        public int ProductoId { get; set; }

        [Required]
        public int UnidadMedidaId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public decimal Cantidad { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio unitario debe ser mayor a 0")]
        public decimal PrecioUnitario { get; set; }

        [Range(0, 100, ErrorMessage = "El descuento debe estar entre 0 y 100")]
        public decimal DescuentoAplicado { get; set; } = 0;

        [MaxLength(500)]
        public string Observaciones { get; set; }
    }
}