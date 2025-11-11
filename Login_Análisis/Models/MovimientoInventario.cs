using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Login_Análisis.Models
{
    public class MovimientoInventario
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ProductoId { get; set; }
        public Producto Producto { get; set; }

        [Required]
        [MaxLength(20)]
        public string TipoMovimiento { get; set; } // ENTRADA, SALIDA, AJUSTE

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Cantidad { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CantidadAnterior { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CantidadNueva { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? PrecioCosto { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? PrecioVenta { get; set; }

        public int? ReferenciaId { get; set; }

        [MaxLength(50)]
        public string? ReferenciaTipo { get; set; }

        [MaxLength(500)]
        public string? Observaciones { get; set; }

        public int? UsuarioId { get; set; }

        public DateTime? FechaMovimiento { get; set; } = DateTime.UtcNow;
    }
}