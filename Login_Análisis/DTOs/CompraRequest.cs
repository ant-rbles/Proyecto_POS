using Login_Análisis.Models;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs
{
    public class CompraRequest
    {
        public string NumeroFactura { get; set; }

        [Required(ErrorMessage = "El proveedor es requerido")]
        public int ProveedorId { get; set; }

        [Required(ErrorMessage = "La fecha de compra es requerida")]
        public DateTime FechaCompra { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Los impuestos no pueden ser negativos")]
        public decimal Impuestos { get; set; } = 0;

        public string Observaciones { get; set; }

        public int? UsuarioCreacion { get; set; }

        [Required(ErrorMessage = "Debe agregar al menos un detalle")]
        [MinLength(1, ErrorMessage = "Debe agregar al menos un producto")]
        public List<DetalleCompraRequest> Detalles { get; set; }
    }

    public class DetalleCompraRequest
    {
        [Required(ErrorMessage = "El producto es requerido")]
        public int ProductoId { get; set; }

        [Required(ErrorMessage = "La unidad de medida es requerida")]
        public int UnidadMedidaId { get; set; }

        [Required(ErrorMessage = "La cantidad es requerida")]
        [Range(0.01, double.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public decimal Cantidad { get; set; }

        [Required(ErrorMessage = "El precio unitario es requerido")]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio unitario debe ser mayor a 0")]
        public decimal PrecioUnitario { get; set; }
    }
}