namespace Login_Análisis.Models
{
    public class CompraReporteModel
    {
        public string ProveedorNombre { get; set; }
        public string NoDocumento { get; set; }
        public DateTime FechaCompra { get; set; }
        public double TotalGeneral { get; set; }
        public List<CompraDetalleModel> Detalles { get; set; } = new();
    }

}
