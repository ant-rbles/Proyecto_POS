using Login_Análisis.Models;

namespace Login_Análisis.DTOs
{
    public class CompraResponse
    {
        public int Id { get; set; }
        public string NumeroFactura { get; set; }
        public ProveedorResponse Proveedor { get; set; }
        public DateTime FechaCompra { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuestos { get; set; }
        public decimal Total { get; set; }
        public string Estado { get; set; }
        public string Observaciones { get; set; }
        public User UsuarioCreacionNavigation { get; set; }

        public List<DetalleCompraResponse> Detalles { get; set; } = new List<DetalleCompraResponse>();
    }
}
