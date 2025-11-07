using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Login_Análisis.Models
{
    public class DescuentoProducto
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ProductoId { get; set; }
        public Producto Producto { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CantidadMinima { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal PorcentajeDescuento { get; set; }

        [Required]
        public bool Estado { get; set; } = true;

        [Required]
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime? FechaActualizacion { get; set; }
    }
}
