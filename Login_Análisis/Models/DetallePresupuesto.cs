using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Login_Análisis.Models
{
    public class DetallePresupuesto
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int PresupuestoId { get; set; }
        public Presupuesto Presupuesto { get; set; }

        [Required]
        public int ProductoId { get; set; }
        public Producto Producto { get; set; }

        [Required]
        public int UnidadMedidaId { get; set; }
        public UnidadMedida UnidadMedida { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Cantidad { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecioUnitario { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal DescuentoAplicado { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalLinea { get; set; }

        [MaxLength(500)]
        public string Observaciones { get; set; }
    }
}