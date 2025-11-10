using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Login_Análisis.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; }

        [Required]
        [MaxLength(50)]
        public string Usuario { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; }

        [Required]
        public byte[] PasswordHash { get; set; }

        [Required]
        public byte[] PasswordSalt { get; set; }

        [Required]
        [MaxLength(20)]
        public string Rol { get; set; }

        [Required]
        public bool Estado { get; set; } = true;

        public ICollection<Venta> VentasCreadas { get; set; }

        [Required]
        public int IntentosFallidos { get; set; } = 0;

        public DateTime? FechaUltimoIntento { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaActualizacion { get; set; }
        public DateTime? FechaUltimoLogin { get; set; }
        public DateTime? FechaUltimoLogout { get; set; }
        public DateTime? LockedUntil { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
    }
}