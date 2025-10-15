    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    namespace Login_Análisis.Models
    {
        public class Venta
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int Id { get; set; }

            [Required]
            [MaxLength(100)]
            public string NumeroFactura { get; set; }

            [Required]
            public DateTime FechaVenta { get; set; }

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
            public string Estado { get; set; } = "COMPLETADA";

            public int? ClienteId { get; set; }
            public string NombreCliente { get; set; }

            public int? UsuarioCreacion { get; set; }

            [Required]
            public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

            // Navigation property
            public ICollection<DetalleVenta> Detalles { get; set; } = new List<DetalleVenta>();
        }
    }