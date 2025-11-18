using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Login_Análisis.Models
{
    public class Presupuesto
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string NumeroPresupuesto { get; set; }

        [Required]
        public DateTime FechaPresupuesto { get; set; }

        [Required]
        public DateTime FechaVencimiento { get; set; }

        public int? ClienteId { get; set; }
        public Cliente Cliente { get; set; }

        [MaxLength(200)]
        public string NombreCliente { get; set; }

        [MaxLength(20)]
        public string NITCliente { get; set; }

        [MaxLength(500)]
        public string DireccionCliente { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Impuestos { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        [MaxLength(1000)]
        public string Observaciones { get; set; }

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = "PENDIENTE"; // PENDIENTE, APROBADO, RECHAZADO, VENCIDO

        public int UsuarioCreacion { get; set; }

        [ForeignKey(nameof(UsuarioCreacion))]
        public User Usuario { get; set; }

        [Required]
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime? FechaActualizacion { get; set; }
        public DateTime? FechaAprobacion { get; set; }

        public virtual ICollection<DetallePresupuesto> Detalles { get; set; } = new List<DetallePresupuesto>();
    }
}