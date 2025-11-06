using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs.Requests
{
    public class ProductRequest
    {
        [Required(ErrorMessage = "El código es obligatorio")]
        [MaxLength(50, ErrorMessage = "El código no puede exceder 50 caracteres")]
        public string Codigo { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio")]
        [MaxLength(200, ErrorMessage = "El nombre no puede exceder 200 caracteres")]
        public string Nombre { get; set; }

        [MaxLength(500, ErrorMessage = "La descripción no puede exceder 500 caracteres")]
        public string Descripcion { get; set; }

        public int? CategoriaId { get; set; }

        [Required(ErrorMessage = "La unidad de medida es obligatoria")]
        public int UnidadMedidaBaseId { get; set; }

        [Required(ErrorMessage = "El stock mínimo es obligatorio")]
        [Range(0, double.MaxValue, ErrorMessage = "El stock mínimo no puede ser negativo")]
        public decimal StockMinimo { get; set; }

        [Required(ErrorMessage = "El margen de ganancia es obligatorio")]
        [Range(0, 100, ErrorMessage = "El margen de ganancia debe estar entre 0 y 100")]
        public decimal MargenGanancia { get; set; } = 30;

    }
}