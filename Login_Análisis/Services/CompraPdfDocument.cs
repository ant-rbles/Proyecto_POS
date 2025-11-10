using Login_Análisis.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;

namespace Login_Análisis.Services
{
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
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(11));

                // 🔷 Encabezado tipo SAT
                page.Header().Element(Encabezado);

                // 🔹 Contenido principal
                page.Content().Element(ContenidoPrincipal);

                // 📅 Pie de página
                page.Footer().AlignCenter().Text($"Documento generado automáticamente el {DateTime.Now:dd/MM/yyyy HH:mm}")
                    .FontSize(9).FontColor(Colors.Grey.Medium);
            });
        }

        private void Encabezado(IContainer container)
        {
            container.Row(row =>
            {
                // 🟦 Logo y datos de la empresa
                row.RelativeColumn(3).Column(col =>
                {
                    var logoPath = "wwwroot/images/logo.png";
                    if (System.IO.File.Exists(logoPath))
                    {
                        col.Item().Height(45).Width(120).Image(logoPath).FitArea();
                    }

                    col.Item().Text("Centro Plástico Leonor")
                        .Bold().FontSize(16).FontColor("#003399");
                    col.Item().Text("Distribuidora y Ventas Generales")
                        .FontSize(10).FontColor(Colors.Grey.Medium);
                    col.Item().Text("NIT: 548904-1").FontSize(10);
                    col.Item().Text("Tel: (502) 7872-2173 • 3ra. Avenida y 8a. Calle B Zona 1 Mazatenando, Suchitepéquez")
                        .FontSize(9).FontColor(Colors.Grey.Medium);
                });

                // 📄 Bloque de datos fiscales
                row.RelativeColumn(2)
                    .Background("#EAF2FF")
                    .Border(1)
                    .BorderColor("#003399")
                    .Padding(10)
                    .Column(col =>
                    {
                        col.Item().Text("FACTURA DE COMPRA")
                            .Bold().FontSize(13).AlignCenter().FontColor("#003399");
                        col.Item().PaddingVertical(4);
                        col.Item().Text($"No. {_compra.NumeroFactura}").FontSize(11).Bold();
                        col.Item().Text($"Fecha: {_compra.FechaCompra:dd/MM/yyyy}").FontSize(10);
                        col.Item().Text($"Estado: {_compra.Estado}").FontSize(10);
                    });
            });
        }

        private void ContenidoPrincipal(IContainer container)
        {
            container.PaddingVertical(10).Column(column =>
            {
                // 📋 Datos del proveedor
                column.Item().Element(DatosProveedor);

                // 🧾 Tabla de productos
                column.Item().PaddingTop(15).Element(TablaProductos);

                // 💰 Totales
                column.Item().PaddingTop(10).Element(ResumenTotales);

                // 🖋️ Observaciones
                if (!string.IsNullOrWhiteSpace(_compra.Observaciones))
                {
                    column.Item().PaddingTop(10).Element(Observaciones);
                }

            });
        }

        private void DatosProveedor(IContainer container)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(3);
                });

                table.Cell().Text("Proveedor:").Bold();
                table.Cell().Text(_compra.Proveedor?.Nombre ?? "N/A");

                table.Cell().Text("NIT:").Bold();
                table.Cell().Text(_compra.Proveedor?.RUC ?? "—");

                table.Cell().Text("Dirección:").Bold();
                table.Cell().Text(_compra.Proveedor?.Direccion ?? "—");

                table.Cell().Text("Correo:").Bold();
                table.Cell().Text(_compra.Proveedor?.Email ?? "—");
            });
        }

        private void TablaProductos(IContainer container)
        {
            container.Table(table =>
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
                    header.Cell().Element(CellStyleHeader).Text("Producto");
                    header.Cell().Element(CellStyleHeader).Text("Unidad");
                    header.Cell().Element(CellStyleHeader).Text("Cantidad");
                    header.Cell().Element(CellStyleHeader).Text("Precio Unit.");
                    header.Cell().Element(CellStyleHeader).Text("Total");
                });

                // Detalles
                foreach (var d in _compra.Detalles)
                {
                    table.Cell().Element(CellStyleBody).Text(d.Producto?.Nombre ?? "—");
                    table.Cell().Element(CellStyleBody).Text(d.UnidadMedida?.Nombre ?? "—");
                    table.Cell().Element(CellStyleBody).Text($"{d.Cantidad:N2}");
                    table.Cell().Element(CellStyleBody).Text($"Q{d.PrecioUnitario:N2}");
                    table.Cell().Element(CellStyleBody).Text($"Q{d.TotalLinea:N2}");
                }

                // Estilos internos
                static IContainer CellStyleHeader(IContainer container) =>
                    container.Background("#003399").PaddingVertical(4).PaddingHorizontal(6)
                        .DefaultTextStyle(x => x.FontColor(Colors.White).Bold().FontSize(10));

                static IContainer CellStyleBody(IContainer container) =>
                    container.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2)
                        .PaddingVertical(3).PaddingHorizontal(4);
            });
        }

        private void ResumenTotales(IContainer container)
        {
            container.AlignRight().Column(col =>
            {
                col.Spacing(4);

                col.Item().Row(row =>
                {
                    row.RelativeItem().Text("Subtotal:").Bold();
                    row.ConstantItem(90).AlignRight().Text($"Q{_compra.Subtotal:N2}");
                });

                col.Item().Row(row =>
                {
                    row.RelativeItem().Text("IVA (12%):").Bold();
                    row.ConstantItem(90).AlignRight().Text($"Q{_compra.Impuestos:N2}");
                });

                col.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2);

                col.Item().Row(row =>
                {
                    row.RelativeItem().Text("TOTAL GENERAL:").Bold().FontSize(12).FontColor("#003399");
                    row.ConstantItem(90).AlignRight().Text($"Q{_compra.Total:N2}").Bold().FontSize(12).FontColor("#003399");
                });
            });
        }

        private void Observaciones(IContainer container)
        {
            container.Background(Colors.Grey.Lighten4).Padding(8).Border(1).BorderColor(Colors.Grey.Lighten1).Column(col =>
            {
                col.Item().Text("Observaciones:").Bold().FontColor("#003399");
                col.Item().Text(_compra.Observaciones ?? "");
            });
        }

    }
}

