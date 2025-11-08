using Login_Análisis.Data;
using Login_Análisis.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Reflection.Metadata;
using Document = QuestPDF.Fluent.Document;

namespace Login_Análisis.Services
{
    public interface IPdfService
    {
        Task<byte[]> GenerarFacturaVenta(int ventaId);
        Task<byte[]> GenerarReporteVentas(DateTime? fechaInicio, DateTime? fechaFin);
        Task<byte[]> GenerarReporteInventario();
        Task<byte[]> GenerarReporteCompras(DateTime? fechaInicio, DateTime? fechaFin);
        Task<byte[]> GenerarFacturaCompra(int compraId);
    }

    public class PdfService : IPdfService
    {
        private readonly ApplicationDbContext _context;

        public PdfService(ApplicationDbContext context)
        {
            _context = context;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> GenerarFacturaVenta(int ventaId)
        {
            var venta = await _context.Ventas
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .FirstOrDefaultAsync(v => v.Id == ventaId);

            if (venta == null)
                return null;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header()
                        .Height(3, Unit.Centimetre)
                        .Background(Colors.Blue.Medium)
                        .AlignCenter()
                        .AlignMiddle()
                        .Text("CENTRO PLÁSTICO LEONOR")
                        .Bold().FontSize(20).FontColor(Colors.White);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(20);

                            // Información de la empresa
                            column.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(infoColumn =>
                            {
                                infoColumn.Item().Text("Sistema POS - Centro Plástico Leonor").Bold();
                                infoColumn.Item().Text("Tel: (123) 456-7890 | Email: info@centroplasticoleonor.com");
                                infoColumn.Item().Text("Dirección: Av. Principal #123, Ciudad");
                            });

                            // Información de la factura
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("NÚMERO DE FACTURA").Bold();
                                table.Cell().Border(1).Padding(5).Text(venta.NumeroFactura);

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("FECHA DE VENTA").Bold();
                                table.Cell().Border(1).Padding(5).Text(venta.FechaVenta.ToString("dd/MM/yyyy HH:mm"));

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("CLIENTE").Bold();
                                table.Cell().Border(1).Padding(5).Text(venta.NombreCliente ?? "CLIENTE GENERAL");

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("ESTADO").Bold();
                                table.Cell().Border(1).Padding(5).Text(venta.Estado);
                            });

                            // Detalles de la venta
                            column.Item().Text("DETALLES DE LA VENTA").Bold().FontSize(16);
                            column.Item().Table(detallesTable =>
                            {
                                detallesTable.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(50);
                                    columns.RelativeColumn(3);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                });

                                // Encabezado
                                detallesTable.Header(header =>
                                {
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignCenter().Text("#").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).Text("PRODUCTO").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignCenter().Text("CANTIDAD").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignCenter().Text("UNIDAD").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignRight().Text("PRECIO UNIT.").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignRight().Text("TOTAL").FontColor(Colors.White).Bold();
                                });

                                // Detalles
                                foreach (var (detalle, index) in venta.Detalles.Select((d, i) => (d, i + 1)))
                                {
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignCenter().Text(index.ToString());
                                    detallesTable.Cell().BorderBottom(1).Padding(5).Text(detalle.Producto?.Nombre ?? "N/A");
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignCenter().Text(detalle.Cantidad.ToString("F2"));
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignCenter().Text(detalle.UnidadMedida?.Abreviatura ?? "N/A");
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignRight().Text(detalle.PrecioUnitario.ToString("C"));
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignRight().Text(detalle.TotalLinea.ToString("C"));
                                }
                            });

                            // Totales
                            column.Item().AlignRight().Width(300).Table(totalesTable =>
                            {
                                totalesTable.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.ConstantColumn(150);
                                });

                                totalesTable.Cell().BorderBottom(1).Padding(5).Text("SUBTOTAL:").Bold();
                                totalesTable.Cell().BorderBottom(1).Padding(5).AlignRight().Text(venta.Subtotal.ToString("C")).Bold();

                                totalesTable.Cell().BorderBottom(1).Padding(5).Text("IMPUESTOS:").Bold();
                                totalesTable.Cell().BorderBottom(1).Padding(5).AlignRight().Text(venta.Impuestos.ToString("C")).Bold();

                                totalesTable.Cell().BorderBottom(1).Padding(5).Background(Colors.Grey.Lighten3).Text("TOTAL:").Bold().FontSize(14);
                                totalesTable.Cell().BorderBottom(1).Padding(5).Background(Colors.Grey.Lighten3).AlignRight().Text(venta.Total.ToString("C")).Bold().FontSize(14);
                            });

                            // Observaciones
                            if (!string.IsNullOrEmpty(venta.Observaciones))
                            {
                                column.Item().PaddingTop(10).Column(obsColumn =>
                                {
                                    obsColumn.Item().Text("OBSERVACIONES").Bold().FontSize(14);
                                    obsColumn.Item().Padding(5).Background(Colors.Grey.Lighten3).Text(venta.Observaciones);
                                });
                            }

                            // Pie de página
                            column.Item().PaddingTop(20).AlignCenter().Text("¡Gracias por su compra!").Italic().FontColor(Colors.Grey.Medium);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Página ");
                            text.CurrentPageNumber();
                            text.Span(" de ");
                            text.TotalPages();
                            text.Span(" | Generado el ");
                            text.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
                        });
                });
            });

            return document.GeneratePdf();
        }

        public async Task<byte[]> GenerarReporteVentas(DateTime? fechaInicio, DateTime? fechaFin)
        {
            var ventas = await _context.Ventas
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                .Where(v => (!fechaInicio.HasValue || v.FechaVenta >= fechaInicio) &&
                            (!fechaFin.HasValue || v.FechaVenta <= fechaFin))
                .OrderByDescending(v => v.FechaVenta)
                .ToListAsync();

            var totalVentas = ventas.Count;
            var totalIngresos = ventas.Sum(v => v.Total);
            var promedioVenta = totalVentas > 0 ? totalIngresos / totalVentas : 0;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header()
                        .Height(3, Unit.Centimetre)
                        .Background(Colors.Green.Medium)
                        .AlignCenter()
                        .AlignMiddle()
                        .Text("REPORTE DE VENTAS - CENTRO PLÁSTICO LEONOR")
                        .Bold().FontSize(18).FontColor(Colors.White);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(15);

                            // Período del reporte
                            column.Item().Background(Colors.Grey.Lighten3).Padding(10).Row(row =>
                            {
                                row.RelativeItem().Text($"Período: {fechaInicio?.ToString("dd/MM/yyyy") ?? "Inicio"} - {fechaFin?.ToString("dd/MM/yyyy") ?? "Fin"}");
                                row.RelativeItem().AlignRight().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}");
                            });

                            // Resumen ejecutivo
                            column.Item().Table(resumenTable =>
                            {
                                resumenTable.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                resumenTable.Cell().Background(Colors.Blue.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("TOTAL VENTAS").Bold();
                                    c.Item().Text(totalVentas.ToString()).Bold().FontSize(16);
                                });

                                resumenTable.Cell().Background(Colors.Green.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("INGRESOS TOTALES").Bold();
                                    c.Item().Text(totalIngresos.ToString("C")).Bold().FontSize(16);
                                });

                                resumenTable.Cell().Background(Colors.Orange.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("PROMEDIO POR VENTA").Bold();
                                    c.Item().Text(promedioVenta.ToString("C")).Bold().FontSize(16);
                                });

                                resumenTable.Cell().Background(Colors.Purple.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("VENTAS POR DÍA").Bold();
                                    c.Item().Text((totalVentas / Math.Max(1, (fechaFin - fechaInicio)?.Days ?? 1)).ToString("F1")).Bold().FontSize(16);
                                });
                            });

                            // Tabla detallada de ventas
                            column.Item().Text("DETALLE DE VENTAS").Bold().FontSize(14);
                            column.Item().Table(detalleTable =>
                            {
                                detalleTable.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(30);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(80);
                                    columns.RelativeColumn(2);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(80);
                                });

                                // Encabezado
                                detalleTable.Header(header =>
                                {
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("#").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("FACTURA").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("FECHA").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("CLIENTE").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("ITEMS").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("SUBTOTAL").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("IMPUESTOS").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("TOTAL").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("ESTADO").FontColor(Colors.White).Bold();
                                });

                                // Datos
                                foreach (var (venta, index) in ventas.Select((v, i) => (v, i + 1)))
                                {
                                    detalleTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(index.ToString());
                                    detalleTable.Cell().BorderBottom(1).Padding(3).Text(venta.NumeroFactura);
                                    detalleTable.Cell().BorderBottom(1).Padding(3).Text(venta.FechaVenta.ToString("dd/MM/yy"));
                                    detalleTable.Cell().BorderBottom(1).Padding(3).Text(venta.NombreCliente ?? "GENERAL");
                                    detalleTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(venta.Detalles.Count.ToString());
                                    detalleTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(venta.Subtotal.ToString("C"));
                                    detalleTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(venta.Impuestos.ToString("C"));
                                    detalleTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(venta.Total.ToString("C"));
                                    detalleTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(venta.Estado);
                                }

                                // Total
                                detalleTable.Cell().ColumnSpan(7).BorderBottom(1).Padding(3).AlignRight().Text("TOTAL:").Bold();
                                detalleTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(totalIngresos.ToString("C")).Bold();
                                detalleTable.Cell().BorderBottom(1).Padding(3);
                            });
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Página ");
                            text.CurrentPageNumber();
                            text.Span(" de ");
                            text.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }

        public async Task<byte[]> GenerarReporteInventario()
        {
            var productos = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.UnidadMedidaBase)
                .Where(p => p.Estado)
                .OrderBy(p => p.Nombre)
                .ToListAsync();

            var totalValorInventario = productos.Sum(p => p.StockActual * p.PrecioCostoPromedio);
            var productosStockBajo = productos.Count(p => p.StockActual <= p.StockMinimo && p.StockActual > 0);
            var productosSinStock = productos.Count(p => p.StockActual == 0);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(9));

                    page.Header()
                        .Height(3, Unit.Centimetre)
                        .Background(Colors.Orange.Medium)
                        .AlignCenter()
                        .AlignMiddle()
                        .Text("REPORTE DE INVENTARIO - CENTRO PLÁSTICO LEONOR")
                        .Bold().FontSize(18).FontColor(Colors.White);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(15);

                            // Resumen ejecutivo
                            column.Item().Table(resumenTable =>
                            {
                                resumenTable.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                resumenTable.Cell().Background(Colors.Blue.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("TOTAL PRODUCTOS").Bold();
                                    c.Item().Text(productos.Count.ToString()).Bold().FontSize(16);
                                });

                                resumenTable.Cell().Background(Colors.Green.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("VALOR INVENTARIO").Bold();
                                    c.Item().Text(totalValorInventario.ToString("C")).Bold().FontSize(16);
                                });

                                resumenTable.Cell().Background(Colors.Yellow.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("STOCK BAJO").Bold();
                                    c.Item().Text(productosStockBajo.ToString()).Bold().FontSize(16);
                                });

                                resumenTable.Cell().Background(Colors.Red.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("SIN STOCK").Bold();
                                    c.Item().Text(productosSinStock.ToString()).Bold().FontSize(16);
                                });
                            });

                            // Tabla de inventario
                            column.Item().Table(inventarioTable =>
                            {
                                inventarioTable.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(30);
                                    columns.ConstantColumn(100);
                                    columns.RelativeColumn(2);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(80);
                                });

                                // Encabezado
                                inventarioTable.Header(header =>
                                {
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("#").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("CÓDIGO").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("PRODUCTO").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("CATEGORÍA").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("UNIDAD").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("STOCK").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("MÍNIMO").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("P. COSTO").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("P. VENTA").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("VALOR").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("ESTADO").FontColor(Colors.White).Bold();
                                });

                                // Datos
                                foreach (var (producto, index) in productos.Select((p, i) => (p, i + 1)))
                                {
                                    var valorStock = producto.StockActual * producto.PrecioCostoPromedio;
                                    var estadoStock = producto.StockActual == 0 ? "SIN STOCK" :
                                                     producto.StockActual <= producto.StockMinimo ? "BAJO" : "NORMAL";

                                    var estadoColor = estadoStock == "SIN STOCK" ? Colors.Red.Lighten2 :
                                                     estadoStock == "BAJO" ? Colors.Yellow.Lighten2 : Colors.Green.Lighten2;

                                    inventarioTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(index.ToString());
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).Text(producto.Codigo);
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).Text(producto.Nombre);
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).Text(producto.Categoria?.Nombre ?? "SIN CAT.");
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).Text(producto.UnidadMedidaBase?.Abreviatura ?? "N/A");
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(producto.StockActual.ToString("F2"));
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(producto.StockMinimo.ToString("F2"));
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(producto.PrecioCostoPromedio.ToString("C"));
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(producto.PrecioVenta.ToString("C"));
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(valorStock.ToString("C"));
                                    inventarioTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Background(estadoColor).Text(estadoStock);
                                }

                                // Total
                                inventarioTable.Cell().ColumnSpan(9).BorderBottom(1).Padding(3).AlignRight().Text("VALOR TOTAL INVENTARIO:").Bold();
                                inventarioTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(totalValorInventario.ToString("C")).Bold();
                                inventarioTable.Cell().BorderBottom(1).Padding(3);
                            });
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Página ");
                            text.CurrentPageNumber();
                            text.Span(" de ");
                            text.TotalPages();
                            text.Span(" | Generado el ");
                            text.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
                        });
                });
            });

            return document.GeneratePdf();
        }

        public async Task<byte[]> GenerarReporteCompras(DateTime? fechaInicio, DateTime? fechaFin)
        {
            var compras = await _context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.Detalles)
                .Where(c => (!fechaInicio.HasValue || c.FechaCompra >= fechaInicio) &&
                            (!fechaFin.HasValue || c.FechaCompra <= fechaFin))
                .OrderByDescending(c => c.FechaCompra)
                .ToListAsync();

            var totalCompras = compras.Count;
            var totalInvertido = compras.Sum(c => c.Total);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header()
                        .Height(3, Unit.Centimetre)
                        .Background(Colors.Purple.Medium)
                        .AlignCenter()
                        .AlignMiddle()
                        .Text("REPORTE DE COMPRAS - CENTRO PLÁSTICO LEONOR")
                        .Bold().FontSize(18).FontColor(Colors.White);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(15);

                            // Resumen ejecutivo
                            column.Item().Table(resumenTable =>
                            {
                                resumenTable.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                resumenTable.Cell().Background(Colors.Blue.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("TOTAL COMPRAS").Bold();
                                    c.Item().Text(totalCompras.ToString()).Bold().FontSize(16);
                                });

                                resumenTable.Cell().Background(Colors.Green.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("TOTAL INVERTIDO").Bold();
                                    c.Item().Text(totalInvertido.ToString("C")).Bold().FontSize(16);
                                });

                                resumenTable.Cell().Background(Colors.Orange.Lighten3).Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("PROMEDIO POR COMPRA").Bold();
                                    c.Item().Text((totalInvertido / Math.Max(1, totalCompras)).ToString("C")).Bold().FontSize(16);
                                });
                            });

                            // Tabla de compras
                            column.Item().Table(comprasTable =>
                            {
                                comprasTable.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(30);
                                    columns.ConstantColumn(120);
                                    columns.RelativeColumn(2);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                });

                                // Encabezado
                                comprasTable.Header(header =>
                                {
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("#").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("FACTURA").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("PROVEEDOR").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).Text("FECHA").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("ITEMS").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("SUBTOTAL").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("IMPUESTOS").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignRight().Text("TOTAL").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(3).AlignCenter().Text("ESTADO").FontColor(Colors.White).Bold();
                                });

                                // Datos
                                foreach (var (compra, index) in compras.Select((c, i) => (c, i + 1)))
                                {
                                    comprasTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(index.ToString());
                                    comprasTable.Cell().BorderBottom(1).Padding(3).Text(compra.NumeroFactura);
                                    comprasTable.Cell().BorderBottom(1).Padding(3).Text(compra.Proveedor?.Nombre ?? "N/A");
                                    comprasTable.Cell().BorderBottom(1).Padding(3).Text(compra.FechaCompra.ToString("dd/MM/yy"));
                                    comprasTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(compra.Detalles.Count.ToString());
                                    comprasTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(compra.Subtotal.ToString("C"));
                                    comprasTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(compra.Impuestos.ToString("C"));
                                    comprasTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(compra.Total.ToString("C"));
                                    comprasTable.Cell().BorderBottom(1).Padding(3).AlignCenter().Text(compra.Estado);
                                }

                                // Total
                                comprasTable.Cell().ColumnSpan(7).BorderBottom(1).Padding(3).AlignRight().Text("TOTAL INVERTIDO:").Bold();
                                comprasTable.Cell().BorderBottom(1).Padding(3).AlignRight().Text(totalInvertido.ToString("C")).Bold();
                                comprasTable.Cell().BorderBottom(1).Padding(3);
                            });
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Página ");
                            text.CurrentPageNumber();
                            text.Span(" de ");
                            text.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }

    public async Task<byte[]> GenerarFacturaCompra(int compraId)
        {
            var compra = await _context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .FirstOrDefaultAsync(c => c.Id == compraId);

            if (compra == null)
                return null;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header()
                        .Height(3, Unit.Centimetre)
                        .Background(Colors.Blue.Medium)
                        .AlignCenter()
                        .AlignMiddle()
                        .Text("FACTURA DE COMPRA - CENTRO PLÁSTICO LEONOR")
                        .Bold().FontSize(20).FontColor(Colors.White);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(20);

                            // Información de la empresa
                            column.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(infoColumn =>
                            {
                                infoColumn.Item().Text("Centro Plástico Leonor").Bold().FontSize(16);
                                infoColumn.Item().Text("Tel: (502) 1234-5678 | Email: info@centroplasticoleonor.com");
                                infoColumn.Item().Text("Dirección: Av. Principal #123, Ciudad de Guatemala");
                                infoColumn.Item().Text("NIT: 1234567-8");
                            });

                            // Información de la factura
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("NÚMERO DE FACTURA").Bold();
                                table.Cell().Border(1).Padding(5).Text(compra.NumeroFactura);

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("FECHA DE COMPRA").Bold();
                                table.Cell().Border(1).Padding(5).Text(compra.FechaCompra.ToString("dd/MM/yyyy HH:mm"));

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("PROVEEDOR").Bold();
                                table.Cell().Border(1).Padding(5).Text(compra.Proveedor?.Nombre ?? "N/A");

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("RUC PROVEEDOR").Bold();
                                table.Cell().Border(1).Padding(5).Text(compra.Proveedor?.RUC ?? "N/A");

                                table.Cell().Border(1).Padding(5).Background(Colors.Grey.Lighten3).Text("ESTADO").Bold();
                                table.Cell().Border(1).Padding(5).Text(compra.Estado);
                            });

                            // Detalles de la compra
                            column.Item().Text("DETALLES DE LA COMPRA").Bold().FontSize(16);
                            column.Item().Table(detallesTable =>
                            {
                                detallesTable.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(50);
                                    columns.RelativeColumn(3);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(80);
                                    columns.ConstantColumn(100);
                                    columns.ConstantColumn(100);
                                });

                                // Encabezado
                                detallesTable.Header(header =>
                                {
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignCenter().Text("#").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).Text("PRODUCTO").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignCenter().Text("CANTIDAD").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignCenter().Text("UNIDAD").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignRight().Text("PRECIO UNIT.").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Blue.Medium).Padding(5).AlignRight().Text("TOTAL").FontColor(Colors.White).Bold();
                                });

                                // Detalles
                                foreach (var (detalle, index) in compra.Detalles.Select((d, i) => (d, i + 1)))
                                {
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignCenter().Text(index.ToString());
                                    detallesTable.Cell().BorderBottom(1).Padding(5).Text(detalle.Producto?.Nombre ?? "N/A");
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignCenter().Text(detalle.Cantidad.ToString("F2"));
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignCenter().Text(detalle.UnidadMedida?.Abreviatura ?? "N/A");
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignRight().Text(detalle.PrecioUnitario.ToString("C"));
                                    detallesTable.Cell().BorderBottom(1).Padding(5).AlignRight().Text(detalle.TotalLinea.ToString("C"));
                                }
                            });

                            // Totales
                            column.Item().AlignRight().Width(300).Table(totalesTable =>
                            {
                                totalesTable.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.ConstantColumn(150);
                                });

                                totalesTable.Cell().BorderBottom(1).Padding(5).Text("SUBTOTAL:").Bold();
                                totalesTable.Cell().BorderBottom(1).Padding(5).AlignRight().Text(compra.Subtotal.ToString("C")).Bold();

                                totalesTable.Cell().BorderBottom(1).Padding(5).Text("IVA (12%):").Bold();
                                totalesTable.Cell().BorderBottom(1).Padding(5).AlignRight().Text(compra.Impuestos.ToString("C")).Bold();

                                totalesTable.Cell().BorderBottom(1).Padding(5).Background(Colors.Grey.Lighten3).Text("TOTAL:").Bold().FontSize(14);
                                totalesTable.Cell().BorderBottom(1).Padding(5).Background(Colors.Grey.Lighten3).AlignRight().Text(compra.Total.ToString("C")).Bold().FontSize(14);
                            });

                            // Observaciones
                            if (!string.IsNullOrEmpty(compra.Observaciones))
                            {
                                column.Item().PaddingTop(10).Column(obsColumn =>
                                {
                                    obsColumn.Item().Text("OBSERVACIONES").Bold().FontSize(14);
                                    obsColumn.Item().Padding(5).Background(Colors.Grey.Lighten3).Text(compra.Observaciones);
                                });
                            }

                            // Pie de página
                            column.Item().PaddingTop(20).AlignCenter().Text("¡Gracias por su servicio!").Italic().FontColor(Colors.Grey.Medium);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Página ");
                            text.CurrentPageNumber();
                            text.Span(" de ");
                            text.TotalPages();
                            text.Span(" | Generado el ");
                            text.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
                        });
                });
            });

            return document.GeneratePdf();
        }
    }
}