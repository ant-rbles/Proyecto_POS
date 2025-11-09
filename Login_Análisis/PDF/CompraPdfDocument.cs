using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using Login_Análisis.Models;

public class CompraPdfDocument : IDocument
{
    private readonly Compra _compra; // ✅ guardamos la compra dentro de la clase

    public CompraPdfDocument(Compra compra)
    {
        _compra = compra; // ✅ asignamos la compra recibida
    }

    public DocumentMetadata GetMetadata() => new DocumentMetadata();

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(20);

            page.Header().Height(80).Background("#EEEEEE").AlignCenter().Text(text =>
            {
                text.Line("NOMBRE DEL NEGOCIO AQUÍ").FontSize(18).Bold();
                text.Line("Dirección | Teléfono | Email").FontSize(10);
            });

            page.Content().Column(col =>
            {
                col.Item().Text($"Factura: {_compra.NumeroFactura}");
                col.Item().Text($"Fecha: {_compra.FechaCompra:dd/MM/yyyy}");
                col.Item().Text($"Proveedor: {_compra.Proveedor?.Nombre}");
                col.Item().Text($"Comprador: {_compra.UsuarioCreacionNavigation?.Nombre ?? "N/A"}");

                col.Item().LineHorizontal(1);

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                    });

                    // Encabezado
                    table.Header(header =>
                    {
                        header.Cell().Text("Producto").Bold();
                        header.Cell().Text("Unidad").Bold();
                        header.Cell().Text("Cantidad").Bold();
                        header.Cell().Text("Precio U.").Bold();
                        header.Cell().Text("Total").Bold();
                    });

                    // ✅ Aquí usamos _compra.Detalles
                    foreach (var d in _compra.Detalles)
                    {
                        table.Cell().Text(d.Producto?.Nombre);
                        table.Cell().Text(d.UnidadMedida?.Nombre);
                        table.Cell().Text(d.Cantidad.ToString("0.##"));
                        table.Cell().Text($"Q {d.PrecioUnitario:0.00}");
                        table.Cell().Text($"Q {d.TotalLinea:0.00}");
                    }
                });

                col.Item().AlignRight().Text($"Subtotal: Q {_compra.Subtotal:0.00}");
                col.Item().AlignRight().Text($"IVA (12%): Q {_compra.Impuestos:0.00}");
                col.Item().AlignRight().Text($"Total: Q {_compra.Total:0.00}").Bold();
            });
        });
    }
}
