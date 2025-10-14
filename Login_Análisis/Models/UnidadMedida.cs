using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Login_Análisis.Models
{
    public class UnidadMedida
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; }

        [Required]
        [MaxLength(10)]
        public string Abreviatura { get; set; }

        [Required]
        public bool EsUnidadBase { get; set; } = false;

        [Required]
        [Column(TypeName = "decimal(18,6)")]
        public decimal FactorConversion { get; set; } = 1;

        [Required]
        public bool Estado { get; set; } = true;
    }
}