using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using Login_Análisis.DTOs;

public class ReporteInventarioPdf : IDocument
{
    public List<InventarioDetalladoDto> Items { get; }

    public ReporteInventarioPdf(List<InventarioDetalladoDto> items)
    {
        Items = items;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(30);

            page.Header()
                .Text("Reporte de Inventario")
                .FontSize(18)
                .Bold()
                .AlignCenter();

            page.Content().Table(table =>
            {
                table.ColumnsDefinition(c =>
                {
                    c.ConstantColumn(60); // Código
                    c.RelativeColumn();   // Producto
                    c.RelativeColumn();   // Categoría
                    c.ConstantColumn(60); // Stock Actual
                    c.ConstantColumn(60); // Stock Mínimo
                    c.ConstantColumn(70); // Costo
                    c.ConstantColumn(70); // Precio Venta
                    c.ConstantColumn(80); // Valor Stock
                    c.ConstantColumn(70); // Estado
                });

                table.Header(h =>
                {
                    h.Cell().Element(CellStyle).Text("Código");
                    h.Cell().Element(CellStyle).Text("Producto");
                    h.Cell().Element(CellStyle).Text("Stock");
                    h.Cell().Element(CellStyle).Text("Costo");
                    h.Cell().Element(CellStyle).Text("Valor");
                });

                foreach (var p in Items)
                {
                    table.Cell().Element(CellStyle).Text(p.Codigo);
                    table.Cell().Element(CellStyle).Text(p.Producto);
                    table.Cell().Element(CellStyle).Text(p.Categoria);
                    table.Cell().Element(CellStyle).Text(p.StockActual.ToString());
                    table.Cell().Element(CellStyle).Text(p.StockMinimo.ToString());
                    table.Cell().Element(CellStyle).Text($"Q {p.PrecioCosto:F2}");
                    table.Cell().Element(CellStyle).Text($"Q {p.PrecioVenta:F2}");
                    table.Cell().Element(CellStyle).Text($"Q {p.ValorStock:F2}");
                    table.Cell().Element(CellStyle).Text(p.Estado);

                }
            });
        });
    }

    private static IContainer CellStyle(IContainer container)
        => container.Padding(4).BorderBottom(1).BorderColor("#DDD");
}

