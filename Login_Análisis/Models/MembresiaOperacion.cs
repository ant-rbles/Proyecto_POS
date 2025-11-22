using System;

namespace Login_Análisis.Models
{
    public class MembresiaOperacion
    {
        public int Id { get; set; }
        public int MembresiaId { get; set; }
        public Membresia Membresia { get; set; }

        public string Accion { get; set; } 
        public int UsuarioId { get; set; }
        public DateTime Fecha { get; set; }
        public string Detalle { get; set; } 
    }
}
