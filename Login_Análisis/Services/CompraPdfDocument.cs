using Login_Análisis.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Linq;
using Login_Análisis.Models; 

public class CompraPdfDocument : IDocument
{
    private readonly Compra _compra;

    public CompraPdfDocument(Compra compra)
    {
        _compra = compra;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

            // Encabezado azul moderno
            page.Header().Background("#2E64FE").Padding(15).Row(row =>
            {
                row.RelativeColumn().Stack(stack =>
                {
                    stack.Item().Text("Centro Plástico Leonor")
                        .FontSize(18)
                        .Bold()
                        .FontColor("#FFFFFF");

                    stack.Item().Text("Factura de Compra")
                        .FontSize(12)
                        .FontColor("#E6E6E6");

                    stack.Item().Text($"Fecha de emisión: {DateTime.Now:dd/MM/yyyy}")
                        .FontSize(10)
                        .FontColor("#E6E6E6");
                });

                row.ConstantColumn(150).AlignRight().Text($"#{_compra.NumeroFactura}")
                    .FontSize(16)
                    .Bold()
                    .FontColor("#FFFFFF");
            });

            // Contenido principal
            page.Content().PaddingVertical(20).Column(column =>
            {
                column.Spacing(15);

                // Datos del proveedor
                column.Item().Border(1).BorderColor("#d1d3e2").Padding(10).Background("#f9f9f9")
                    .Stack(stack =>
                    {
                        stack.Spacing(4);
                        stack.Item().Text($"Proveedor: {_compra.Proveedor?.Nombre ?? "N/A"}")
                            .Bold().FontSize(11);
                        stack.Item().Text($"Teléfono: {_compra.Proveedor?.Telefono ?? "N/A"}");
                        stack.Item().Text($"Dirección: {_compra.Proveedor?.Direccion ?? "N/A"}");
                        stack.Item().Text($"Fecha de compra: {_compra.FechaCompra:dd/MM/yyyy}");
                        stack.Item().Text($"Estado: {_compra.Estado}");
                    });

                // Tabla de detalles de compra
                column.Item().PaddingVertical(10).Element(DetallesTabla);

                // Totales
                var subtotal = _compra.Detalles.Sum(d => d.TotalLinea);
                var impuestos = _compra.Impuestos;
                var totalGeneral = subtotal + impuestos;

                column.Item().AlignRight().PaddingTop(10).Stack(stack =>
                {
                    stack.Spacing(3);
                    stack.Item().Text($"Subtotal: Q{subtotal:N2}");
                    stack.Item().Text($"Impuestos: Q{impuestos:N2}");
                    stack.Item().Text($"Total General: Q{totalGeneral:N2}")
                        .Bold().FontColor("#2E64FE").FontSize(12);
                });
            });

            // Pie de página
            page.Footer().AlignCenter().PaddingTop(5).Text(txt =>
            {
                txt.Span("Centro Plástico Leonor © ").FontSize(9);
                txt.Span($"{DateTime.Now.Year} - Documento generado automáticamente").Italic();
            });
        });
    }

    // 🧾 Tabla de detalles
    private void DetallesTabla(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(3); // Producto
                columns.RelativeColumn(1.5f); // Unidad
                columns.RelativeColumn(1); // Cantidad
                columns.RelativeColumn(1); // Precio
                columns.RelativeColumn(1); // Total
            });

            // Encabezado con color corporativo
            table.Header(header =>
            {
                header.Cell().Element(CellHeader).Text("Producto");
                header.Cell().Element(CellHeader).Text("Unidad");
                header.Cell().Element(CellHeader).AlignRight().Text("Cantidad");
                header.Cell().Element(CellHeader).AlignRight().Text("Precio (Q)");
                header.Cell().Element(CellHeader).AlignRight().Text("Total (Q)");
            });

            // Filas del detalle
            foreach (var d in _compra.Detalles)
            {
                table.Cell().Element(CellBody).Text(d.Producto?.Nombre ?? "-");
                table.Cell().Element(CellBody).Text(d.UnidadMedida?.Nombre ?? "-");
                table.Cell().Element(CellBody).AlignRight().Text($"{d.Cantidad:N2}");
                table.Cell().Element(CellBody).AlignRight().Text($"{d.PrecioUnitario:N2}");
                table.Cell().Element(CellBody).AlignRight().Text($"{d.TotalLinea:N2}");
            }
        });
    }

    // 🎨 Estilos de las celdas
    private static IContainer CellHeader(IContainer container)
    {
        return container
            .Background("#2E64FE")
            .PaddingVertical(6)
            .PaddingHorizontal(4)
            .BorderBottom(1)
            .BorderColor("#2E64FE")
            .DefaultTextStyle(x => x.SemiBold().FontColor("#FFFFFF"));
    }

    private static IContainer CellBody(IContainer container)
    {
        return container
            .PaddingVertical(5)
            .PaddingHorizontal(4)
            .BorderBottom(0.5f)
            .BorderColor("#d9d9d9");
    }
}
