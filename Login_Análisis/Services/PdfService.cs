using Login_Análisis.Data;
using Login_Análisis.Models;
using Microsoft.EntityFrameworkCore;
using QRCoder;
using QuestPDF.Fluent;
using System.Globalization;
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
        Task<byte[]> GenerarReporteComprasPdf(DateTime? fechaInicio, DateTime? fechaFin);
        Task<byte[]> GenerarReporteInventarioPdf();
        Task<byte[]> GenerarReporteMovimientosInventarioPdf(DateTime? fechaInicio, DateTime? fechaFin);

        Task<byte[]> GenerarFacturaCompra(int compraId);
    }

    public class PdfService : IPdfService
    {
        private readonly ApplicationDbContext _context;

        public PdfService(ApplicationDbContext context)
        {
            _context = context;
            QuestPDF.Settings.License = LicenseType.Community;
            CultureInfo.DefaultThreadCurrentCulture = new CultureInfo("es-GT");
            CultureInfo.DefaultThreadCurrentUICulture = new CultureInfo("es-GT");
        }

        public async Task<byte[]> GenerarFacturaVenta(int ventaId)
        {
            var venta = await _context.Venta
                .Include(v => v.Detalles).ThenInclude(d => d.Producto)
                .Include(v => v.Detalles).ThenInclude(d => d.UnidadMedida)
                .FirstOrDefaultAsync(v => v.Id == ventaId);

            if (venta == null)
                return null;

            // ✅ Generar QR con QRCoder
            using var qrGenerator = new QRCodeGenerator();
            using var qrData = qrGenerator.CreateQrCode($"FACTURA:{venta.NumeroFactura}", QRCodeGenerator.ECCLevel.Q);
            using var qr = new QRCode(qrData);
            using var qrBitmap = qr.GetGraphic(6);
            using var qrStream = new MemoryStream();
            qrBitmap.Save(qrStream, System.Drawing.Imaging.ImageFormat.Png);
            var qrBytes = qrStream.ToArray();

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);
                    page.DefaultTextStyle(t => t.FontSize(11));

                    // Encabezado
                    page.Header().Column(col =>
                    {
                        col.Item().Text("Centro Plástico Leonor")
                            .Bold().FontSize(20).FontColor("#003399");

                        col.Item().Text("Distribuidora y Ventas Generales")
                            .FontSize(11);

                        col.Item().Text("NIT: 548904-1")
                            .FontSize(10);

                        col.Item().Text("Tel: (502) 7872-2173 • 3ra. Avenida y 8a. Calle B Zona 1 Mazatenango, Suchitepéquez")
                            .FontSize(9).FontColor(Colors.Grey.Darken2);
                    });

                    page.Content().PaddingTop(10).Column(col =>
                    {
                        col.Spacing(15);

                        col.Item().Text("FACTURA DE VENTA")
                            .FontSize(15).Bold().FontColor("#003399");

                        col.Item().Border(1).Padding(10).Column(info =>
                        {
                            info.Item().Row(r =>
                            {
                                r.RelativeItem().Text($"Número de Factura:").Bold();
                                r.RelativeItem().Text(venta.NumeroFactura);
                            });

                            info.Item().Row(r =>
                            {
                                r.RelativeItem().Text($"Fecha:").Bold();
                                r.RelativeItem().Text(venta.FechaVenta.ToString("dd/MM/yyyy HH:mm"));
                            });

                            info.Item().Row(r =>
                            {
                                r.RelativeItem().Text($"Cliente:").Bold();
                                r.RelativeItem().Text(venta.NombreCliente ?? "Consumidor Final");
                            });

                            info.Item().Row(r =>
                            {
                                r.RelativeItem().Text("NIT Cliente:").Bold();
                                r.RelativeItem().Text(venta.NITCliente ?? "CF");
                            });

                            info.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Estado:").Bold();
                                r.RelativeItem().Text(venta.Estado);
                            });
                        });

                        col.Item().PaddingTop(10).Element(e =>
                        {
                            e.Text(t => t.Span("DETALLES DE LA VENTA").FontSize(14).Bold().FontColor("#003399"));
                        });

                        col.Item().Border(1).Padding(10).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(30); // #
                                columns.RelativeColumn(3);  // Producto
                                columns.ConstantColumn(60); // Cantidad
                                columns.ConstantColumn(60); // Unidad
                                columns.ConstantColumn(80); // Precio
                                columns.ConstantColumn(80); // Total
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#003399").Padding(5).Text("#").FontColor(Colors.White).Bold().AlignCenter();
                                header.Cell().Background("#003399").Padding(5).Text("PRODUCTO").FontColor(Colors.White).Bold();
                                header.Cell().Background("#003399").Padding(5).Text("CANT.").FontColor(Colors.White).Bold().AlignCenter();
                                header.Cell().Background("#003399").Padding(5).Text("UNIDAD").FontColor(Colors.White).Bold().AlignCenter();
                                header.Cell().Background("#003399").Padding(5).Text("PRECIO").FontColor(Colors.White).Bold().AlignRight();
                                header.Cell().Background("#003399").Padding(5).Text("TOTAL").FontColor(Colors.White).Bold().AlignRight();
                            });

                            int index = 1;
                            foreach (var d in venta.Detalles)
                            {
                                table.Cell().BorderBottom(1).Padding(5).Text(index++.ToString()).AlignCenter();
                                table.Cell().BorderBottom(1).Padding(5).Text(d.Producto?.Nombre ?? "N/A");
                                table.Cell().BorderBottom(1).Padding(5).Text(d.Cantidad.ToString("F2")).AlignCenter();
                                table.Cell().BorderBottom(1).Padding(5).Text(d.UnidadMedida?.Abreviatura ?? "UND").AlignCenter();
                                table.Cell().BorderBottom(1).Padding(5).Text(d.PrecioUnitario.ToString("C")).AlignRight();
                                table.Cell().BorderBottom(1).Padding(5).Text(d.TotalLinea.ToString("C")).AlignRight();
                            }
                        });

                        // totales 

                        col.Item().AlignRight().Width(250).Border(1).Padding(10).Column(tot =>
                        {
                            tot.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Subtotal:").Bold();
                                r.RelativeItem().AlignRight().Text(venta.Subtotal.ToString("C"));
                            });

                            tot.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Impuestos:").Bold();
                                r.RelativeItem().AlignRight().Text(venta.Impuestos.ToString("C"));
                            });

                            tot.Item().Row(r =>
                            {
                                r.RelativeItem().Text("TOTAL:").Bold().FontSize(13);
                                r.RelativeItem().AlignRight().Text(venta.Total.ToString("C")).Bold().FontSize(13);
                            });
                        });

                        //QR

                        col.Item().PaddingTop(30).AlignCenter().Column(q =>
                        {
                            q.Item().Text("VERIFICACIÓN").Bold().FontColor("#003399").FontSize(12).AlignCenter();
                            q.Item().Width(120).Height(120).Image(qrBytes);
                            q.Item().Text("Documento autenticado digitalmente").FontSize(9).FontColor(Colors.Grey.Darken2).AlignCenter();
                        });
                    });

                    page.Footer().AlignCenter().Text(txt =>
                    {
                        txt.Span("Página ");
                        txt.CurrentPageNumber();
                        txt.Span(" de ");
                        txt.TotalPages();
                    });
                });
            });

            return document.GeneratePdf();
        }

        public async Task<byte[]> GenerarReporteVentas(DateTime? fechaInicio, DateTime? fechaFin)
        {
            var ventas = await _context.Venta
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

        public async Task<byte[]> GenerarReporteInventarioPdf()
        {
            var productos = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.UnidadMedidaBase)
                .Where(p => p.Estado)
                .OrderBy(p => p.Nombre)
                .ToListAsync();

            var totalValorInventario = productos.Sum(p => p.StockActual * p.PrecioCostoPromedio);
            var productosBajoStock = productos.Count(p => p.StockActual <= p.StockMinimo && p.StockActual > 0);
            var productosSinStock = productos.Count(p => p.StockActual == 0);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(40);
                    page.DefaultTextStyle(t => t.FontSize(10));

                    // HEADER
                    page.Header().Column(header =>
                    {
                        header.Item().Text("CENTRO PLÁSTICO LEONOR").Bold().FontSize(16);
                        header.Item().Text("Reporte de Inventario").FontSize(13).FontColor("#444");
                        header.Item().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(9).FontColor("#888");
                    });

                    // CONTENT
                    page.Content().Column(content =>
                    {
                        content.Spacing(15);

                        // 🔹 Resumen general
                        content.Item().Row(row =>
                        {
                            row.RelativeItem().Background("#E3F2FD").Padding(10).Border(1).Column(c =>
                            {
                                c.Item().Text("TOTAL PRODUCTOS").Bold();
                                c.Item().Text(productos.Count.ToString("N0")).FontSize(14);
                            });
                            row.RelativeItem().Background("#E8F5E9").Padding(10).Border(1).Column(c =>
                            {
                                c.Item().Text("VALOR TOTAL INVENTARIO").Bold();
                                c.Item().Text($"Q {totalValorInventario:N2}").FontSize(14);
                            });
                            row.RelativeItem().Background("#FFF3E0").Padding(10).Border(1).Column(c =>
                            {
                                c.Item().Text("STOCK BAJO").Bold();
                                c.Item().Text(productosBajoStock.ToString()).FontSize(14);
                            });
                            row.RelativeItem().Background("#FFEBEE").Padding(10).Border(1).Column(c =>
                            {
                                c.Item().Text("SIN STOCK").Bold();
                                c.Item().Text(productosSinStock.ToString()).FontSize(14);
                            });
                        });

                        content.Item().Element(e =>
                        {
                            e.PaddingBottom(5).Text("DETALLE DE PRODUCTOS").Bold().FontSize(13).Underline();
                        });

                        content.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(30);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(1);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("#").Bold();
                                header.Cell().Text("Producto").Bold();
                                header.Cell().Text("Unidad").Bold();
                                header.Cell().Text("Stock").Bold();
                                header.Cell().Text("Costo Promedio").Bold();
                                header.Cell().Text("Valor Total").Bold();
                                header.Cell().Text("Categoría").Bold();
                            });

                            int index = 1;
                            foreach (var p in productos)
                            {
                                var valor = p.StockActual * p.PrecioCostoPromedio;
                                table.Cell().Text(index++.ToString());
                                table.Cell().Text(p.Nombre);
                                table.Cell().Text(p.UnidadMedidaBase?.Abreviatura ?? "-");
                                table.Cell().Text(p.StockActual.ToString("N2"));
                                table.Cell().Text($"Q {p.PrecioCostoPromedio:N2}");
                                table.Cell().Text($"Q {valor:N2}");
                                table.Cell().Text(p.Categoria?.Nombre ?? "-");
                            }
                        });
                    });

                    // FOOTER
                    page.Footer().AlignCenter().Text("Centro Plástico Leonor © " + DateTime.Now.Year);
                });
            });

            return document.GeneratePdf();
        }

        public async Task<byte[]> GenerarReporteMovimientosInventarioPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            var movimientos = await _context.MovimientosInventario
                .Include(m => m.Producto)
                .Where(m => (!fechaInicio.HasValue || m.FechaMovimiento >= fechaInicio)
                         && (!fechaFin.HasValue || m.FechaMovimiento <= fechaFin))
                .OrderByDescending(m => m.FechaMovimiento)
                .ToListAsync();

            // 📊 Cálculos de resumen
            int totalMovimientos = movimientos.Count;
            int totalEntradas = movimientos.Count(m =>
                m.TipoMovimiento != null && m.TipoMovimiento.Trim().ToUpper() == "ENTRADA");
            int totalSalidas = movimientos.Count(m =>
                m.TipoMovimiento != null && m.TipoMovimiento.Trim().ToUpper() == "SALIDA");
            int totalAjustes = movimientos.Count(m =>
                m.TipoMovimiento != null && m.TipoMovimiento.Trim().ToUpper() == "AJUSTE");

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    // 🟦 Encabezado principal
                    page.Header()
                        .Height(3, Unit.Centimetre)
                        .Background("#2563EB")
                        .AlignCenter()
                        .AlignMiddle()
                        .Text("REPORTE DE MOVIMIENTOS DE INVENTARIO - CENTRO PLÁSTICO LEONOR")
                        .Bold().FontSize(18).FontColor(Colors.White);

                    // 📑 Contenido principal
                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(15);

                            // 🔸 Período del reporte
                            column.Item().Background(Colors.Grey.Lighten3).Padding(10).Row(row =>
                            {
                                row.RelativeItem().Text($"Período: {fechaInicio?.ToString("dd/MM/yyyy") ?? "Inicio"} - {fechaFin?.ToString("dd/MM/yyyy") ?? "Fin"}");
                                row.RelativeItem().AlignRight().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}");
                            });

                            // 🔹 Resumen general
                            column.Item().Table(resumen =>
                            {
                                resumen.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                resumen.Cell().Background("#DBEAFE").Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("TOTAL MOVIMIENTOS").Bold();
                                    c.Item().Text(totalMovimientos.ToString()).FontSize(16).Bold();
                                });

                                resumen.Cell().Background("#D1FAE5").Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("ENTRADAS").Bold();
                                    c.Item().Text(totalEntradas.ToString()).FontSize(16).Bold();
                                });

                                resumen.Cell().Background("#FEF9C3").Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("SALIDAS").Bold();
                                    c.Item().Text(totalSalidas.ToString()).FontSize(16).Bold();
                                });

                                resumen.Cell().Background("#FECACA").Padding(10).AlignCenter().Column(c =>
                                {
                                    c.Item().Text("AJUSTES").Bold();
                                    c.Item().Text(totalAjustes.ToString()).FontSize(16).Bold();
                                });
                            });

                            // 📋 Tabla detallada de movimientos
                            column.Item().Text("DETALLE DE MOVIMIENTOS").Bold().FontSize(14).Underline();
                            column.Item().Table(tabla =>
                            {
                                tabla.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(30);  // #
                                    columns.ConstantColumn(90);  // Fecha
                                    columns.RelativeColumn(2);   // Producto
                                    columns.ConstantColumn(100); // Tipo
                                    columns.ConstantColumn(80);  // Cantidad
                                    columns.RelativeColumn(2);   // Observaciones
                                });

                                // Encabezado
                                tabla.Header(header =>
                                {
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(4).AlignCenter().Text("#").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(4).Text("FECHA").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(4).Text("PRODUCTO").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(4).Text("TIPO").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(4).AlignRight().Text("CANTIDAD").FontColor(Colors.White).Bold();
                                    header.Cell().Background(Colors.Grey.Darken1).Padding(4).Text("OBSERVACIONES").FontColor(Colors.White).Bold();
                                });

                                // Filas de datos
                                foreach (var (mov, index) in movimientos.Select((m, i) => (m, i + 1)))
                                {
                                    string tipoColor = mov.TipoMovimiento?.Trim().ToUpper() switch
                                    {
                                        "ENTRADA" => "#DCFCE7",
                                        "SALIDA" => "#FEF9C3",
                                        "AJUSTE" => "#FEE2E2",
                                        _ => Colors.White
                                    };

                                    tabla.Cell().Background(tipoColor).BorderBottom(1).Padding(4).AlignCenter().Text(index.ToString());
                                    tabla.Cell().Background(tipoColor).BorderBottom(1).Padding(4)
                                        .Text(mov.FechaMovimiento.HasValue
                                            ? mov.FechaMovimiento.Value.ToString("dd/MM/yyyy HH:mm")
                                            : "-");
                                    tabla.Cell().Background(tipoColor).BorderBottom(1).Padding(4)
                                        .Text(mov.Producto?.Nombre ?? "N/A");
                                    tabla.Cell().Background(tipoColor).BorderBottom(1).Padding(4)
                                        .Text(mov.TipoMovimiento ?? "-");
                                    tabla.Cell().Background(tipoColor).BorderBottom(1).Padding(4).AlignRight()
                                        .Text(mov.Cantidad.ToString("N2"));
                                    tabla.Cell().Background(tipoColor).BorderBottom(1).Padding(4)
                                        .Text(mov.Observaciones ?? "-");
                                }
                            });
                        });

                    // 🔻 Pie de página
                    page.Footer()
                        .AlignCenter()
                        .Text(txt =>
                        {
                            txt.Span("Página ");
                            txt.CurrentPageNumber();
                            txt.Span(" de ");
                            txt.TotalPages();
                            txt.Span(" | Generado el ");
                            txt.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
                        });
                });
            });

            return document.GeneratePdf();
        }




        public async Task<byte[]> GenerarFacturaCompra(int compraId)
        {
            var compra = await _context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.Detalles).ThenInclude(d => d.Producto)
                .Include(c => c.Detalles).ThenInclude(d => d.UnidadMedida)
                .FirstOrDefaultAsync(c => c.Id == compraId);

            if (compra == null)
                throw new Exception("Compra no encontrada");

            var documento = new CompraPdfDocument(compra);

            return documento.GeneratePdf();
        }

        public async Task<byte[]> GenerarReporteComprasPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            try
            {
                var compras = await _context.Compras
                    .Include(c => c.Proveedor)
                    .Include(c => c.Detalles)
                    .ThenInclude(d => d.Producto)
                    .Where(c => (!fechaInicio.HasValue || c.FechaCompra >= fechaInicio)
                             && (!fechaFin.HasValue || c.FechaCompra <= fechaFin))
                    .OrderByDescending(c => c.FechaCompra)
                    .ToListAsync();

                // 🧮 Datos generales
                var totalCompras = compras.Count;
                var totalInvertido = compras.Sum(c => c.Total);
                var promedioCompra = totalCompras > 0 ? totalInvertido / totalCompras : 0;

                // 🔷 Crear documento PDF con QuestPDF
                var document = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Margin(40);
                        page.Size(PageSizes.A4.Landscape());

                        // 🔹 Encabezado
                        page.Header().Element(header =>
                        {
                            header.Row(row =>
                            {
                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().Text("CENTRO PLÁSTICO LEONOR")
                                        .FontSize(18)
                                        .Bold()
                                        .FontColor("#1565C0");
                                    col.Item().Text("Reporte de Compras")
                                        .FontSize(14)
                                        .FontColor("#333333");
                                    col.Item().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}")
                                        .FontSize(10)
                                        .FontColor("#777777");
                                });
                            });
                        });

                        // 🔹 Contenido principal
                        page.Content().Column(content =>
                        {
                            content.Spacing(15);

                            // 🧾 Resumen general
                            content.Item().Row(row =>
                            {
                                row.RelativeItem(1).Background("#E3F2FD").Padding(10).Border(1).Column(c =>
                                {
                                    c.Item().Text("TOTAL DE COMPRAS").Bold();
                                    c.Item().Text($"{totalCompras}").FontSize(14);
                                });

                                row.RelativeItem(1).Background("#BBDEFB").Padding(10).Border(1).Column(c =>
                                {
                                    c.Item().Text("TOTAL INVERTIDO").Bold();
                                    c.Item().Text($"Q {totalInvertido:N2}").FontSize(14);
                                });

                                row.RelativeItem(1).Background("#90CAF9").Padding(10).Border(1).Column(c =>
                                {
                                    c.Item().Text("PROMEDIO POR COMPRA").Bold();
                                    c.Item().Text($"Q {promedioCompra:N2}").FontSize(14);
                                });
                            });

                            // 🧱 Espaciado visual
                            content.Item().Height(10);

                            // 📋 Título tabla
                            content.Item().Element(e =>
                            {
                                e.PaddingBottom(5)
                                 .Text("DETALLE DE COMPRAS")
                                 .Bold()
                                 .FontSize(13)
                                 .Underline();
                            });

                            // 📄 Tabla detallada
                            content.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(90);   // Fecha
                                    columns.RelativeColumn(2);    // Proveedor
                                    columns.RelativeColumn(2);    // Factura
                                    columns.ConstantColumn(100);  // Total
                                    columns.ConstantColumn(100);  // Estado
                                });

                                // Encabezado
                                table.Header(header =>
                                {
                                    header.Cell().Background("#1565C0").Padding(5)
                                        .Text("Fecha").FontColor("#FFFFFF").Bold();
                                    header.Cell().Background("#1565C0").Padding(5)
                                        .Text("Proveedor").FontColor("#FFFFFF").Bold();
                                    header.Cell().Background("#1565C0").Padding(5)
                                        .Text("Factura").FontColor("#FFFFFF").Bold();
                                    header.Cell().Background("#1565C0").Padding(5)
                                        .Text("Total").FontColor("#FFFFFF").Bold();
                                    header.Cell().Background("#1565C0").Padding(5)
                                        .Text("Estado").FontColor("#FFFFFF").Bold();
                                });

                                // Filas
                                foreach (var c in compras)
                                {
                                    table.Cell().Padding(4).Text(c.FechaCompra.ToString("dd/MM/yyyy"));
                                    table.Cell().Padding(4).Text(c.Proveedor?.Nombre ?? "N/A");
                                    table.Cell().Padding(4).Text(c.NumeroFactura ?? "-");
                                    table.Cell().Padding(4).Text($"Q {c.Total:N2}");
                                    table.Cell().Padding(4).Text(c.Estado ?? "-");
                                }
                            });
                        });

                        // 🔹 Pie de página
                        page.Footer().AlignCenter().Text(text =>
                        {
                            text.Span("Centro Plástico Leonor - Reporte de Compras ").FontSize(10);
                            text.Span($" | Página ").FontSize(10);
                            text.CurrentPageNumber().FontSize(10);
                            text.Span(" de ").FontSize(10);
                            text.TotalPages().FontSize(10);
                        });
                    });
                });

                return document.GeneratePdf();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error al generar PDF de compras: {ex.Message}");
                throw;
            }
        }

        public static byte[] GenerarQrPngBytes(string texto)
        {
            using (var qrGenerator = new QRCodeGenerator())
            {
                var qrData = qrGenerator.CreateQrCode(texto, QRCodeGenerator.ECCLevel.Q);
                var qrCode = new PngByteQRCode(qrData);
                return qrCode.GetGraphic(20);
            }
        }
    }
}