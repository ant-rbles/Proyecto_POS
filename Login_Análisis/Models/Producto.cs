using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Login_Análisis.Models
{
    public class Producto
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Codigo { get; set; }

        [Required]
        [MaxLength(200)]
        public string Nombre { get; set; }

        [MaxLength(500)]
        public string Descripcion { get; set; }

        public int? CategoriaId { get; set; }
        public Categoria Categoria { get; set; }

        [Required]
        public int UnidadMedidaBaseId { get; set; }
        public UnidadMedida UnidadMedidaBase { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal StockMinimo { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal StockActual { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecioCostoPromedio { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecioVenta { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal MargenGanancia { get; set; } = 30;

        [Required]
        public bool Estado { get; set; } = true;

        [Required]
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime? FechaActualizacion { get; set; }
    }
}