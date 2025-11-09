    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    namespace Login_Análisis.Models
    {
        public class Proveedor
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int Id { get; set; }

            [Required]
            [MaxLength(200)]
            public string Nombre { get; set; }

            [Required]
            [MaxLength(20)]
            public string RUC { get; set; }

            [MaxLength(500)]
            public string Direccion { get; set; }

            [MaxLength(20)]
            public string Telefono { get; set; }

            [EmailAddress]
            [MaxLength(100)]
            public string Email { get; set; }

            [MaxLength(100)]
            public string Contacto { get; set; }

            [Required]
            public bool Estado { get; set; } = true;

            [Required]
            public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

            public DateTime? FechaActualizacion { get; set; }

            public ICollection<Producto>? Productos { get; set; }
        }
    }